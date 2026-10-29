import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequest } from '../functions/api/[[path]]';

class MemoryD1 {
  private row: { revision: number; value: string } | null = null;

  prepare(query: string) {
    const createStatement = (values: unknown[] = []) => ({
      bind: (...bound: unknown[]) => createStatement(bound),
      first: async <T,>() => {
        if (query.includes('SELECT 1')) return { ok: 1 } as T;
        return this.row as T | null;
      },
      run: async <T,>() => {
        if (query.startsWith('INSERT OR IGNORE') && !this.row) {
          this.row = { revision: 0, value: String(values[0]) };
          return { success: true, meta: { changes: 1 } };
        }
        if (query.startsWith('UPDATE my_budget_pc_state') && this.row?.revision === Number(values[1])) {
          this.row = { revision: this.row.revision + 1, value: String(values[0]) };
          return { success: true, meta: { changes: 1 } };
        }
        return { success: true, meta: { changes: 0 } };
      },
    });
    return createStatement();
  }
}

const authConfig = {
  MBPC_AUTH_SECRET: 'test-secret-with-more-than-thirty-two-characters',
  MBPC_ADMIN_EMAIL: 'admin@example.test',
  MBPC_ADMIN_PASSWORD: 'local-test-admin-password',
  MBPC_SALES_EMAIL: 'sales@example.test',
  MBPC_SALES_PASSWORD: 'local-test-sales-password',
};

const makeRequest = (path: string, method = 'GET', body?: unknown, token?: string) => {
  const headers = new Headers();
  if (body !== undefined) headers.set('content-type', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);
  return new Request(`https://store.example${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
};

async function call(
  db: MemoryD1,
  path: string,
  method = 'GET',
  body?: unknown,
  token?: string,
  config: typeof authConfig | Record<string, never> = {},
) {
  return onRequest({
    request: makeRequest(path, method, body, token),
    env: { DB: db, ...config },
  });
}

test('Pages API starts with an empty My Budget PC catalogue', async () => {
  const db = new MemoryD1();
  const response = await call(db, '/api/products');
  assert.equal(response.status, 200);
  const catalog = await response.json() as { products: unknown[]; total: number };
  assert.equal(catalog.total, 0);
  assert.deepEqual(catalog.products, []);
});

test('Pages API does not expose default or Cortek demo staff credentials', async () => {
  const db = new MemoryD1();
  const noConfiguration = await call(db, '/api/auth/login', 'POST', {
    email: 'admin@example.test',
    password: 'anything-at-all',
  });
  assert.equal(noConfiguration.status, 503);

  const legacyDemo = await call(db, '/api/auth/login', 'POST', {
    email: 'admin@demo.cortek.in',
    password: 'Demo1234!',
  }, undefined, authConfig);
  assert.equal(legacyDemo.status, 401);
});

test('Pages API signs staff tokens and enforces admin-only deletion', async () => {
  const db = new MemoryD1();
  const loginResponse = await call(db, '/api/auth/login', 'POST', {
    email: authConfig.MBPC_ADMIN_EMAIL,
    password: authConfig.MBPC_ADMIN_PASSWORD,
  }, undefined, authConfig);
  assert.equal(loginResponse.status, 200);
  const login = await loginResponse.json() as { token: string; user: { role: string } };
  assert.equal(login.user.role, 'admin');

  const meResponse = await call(db, '/api/auth/me', 'GET', undefined, login.token, authConfig);
  assert.equal(meResponse.status, 200);
  const me = await meResponse.json() as { email: string; role: string; exp?: number };
  assert.equal(me.email, authConfig.MBPC_ADMIN_EMAIL);
  assert.equal(me.role, 'admin');
  assert.equal(me.exp, undefined);

  const productResponse = await call(db, '/api/products', 'POST', {
    category: 'Laptops',
    brand: 'Example',
    model: 'Workstation',
    storage: '1TB SSD',
    colour: '',
    priceInr: 100000,
    conditionGrade: 'A+',
    conditionDescription: '',
    images: [],
    units: [],
  }, login.token, authConfig);
  assert.equal(productResponse.status, 201);
  const product = await productResponse.json() as { id: string; units: Array<{ id: string }> };
  assert.ok(product.units[0]?.id);

  const salesLoginResponse = await call(db, '/api/auth/login', 'POST', {
    email: authConfig.MBPC_SALES_EMAIL,
    password: authConfig.MBPC_SALES_PASSWORD,
  }, undefined, authConfig);
  const salesLogin = await salesLoginResponse.json() as { token: string; user: { role: string } };
  assert.equal(salesLogin.user.role, 'sales');

  const deniedDelete = await call(db, `/api/products/${product.id}`, 'DELETE', undefined, salesLogin.token, authConfig);
  assert.equal(deniedDelete.status, 403);
  const adminDelete = await call(db, `/api/products/${product.id}`, 'DELETE', undefined, login.token, authConfig);
  assert.equal(adminDelete.status, 200);

  const [payload, signature] = login.token.split('.');
  assert.ok(payload && signature);
  const changedSignature = `${signature[0] === 'A' ? 'B' : 'A'}${signature.slice(1)}`;
  const tamperedToken = `${payload}.${changedSignature}`;
  const invalidSession = await call(db, '/api/auth/me', 'GET', undefined, tamperedToken, authConfig);
  assert.equal(invalidSession.status, 401);
});

test('Pages API preserves inventory reservation and sale workflows', async () => {
  const db = new MemoryD1();
  const loginResponse = await call(db, '/api/auth/login', 'POST', {
    email: authConfig.MBPC_SALES_EMAIL,
    password: authConfig.MBPC_SALES_PASSWORD,
  }, undefined, authConfig);
  const login = await loginResponse.json() as { token: string };

  const createResponse = await call(db, '/api/products', 'POST', {
    category: 'Desktop Computers',
    brand: 'Example',
    model: 'Workstation',
    storage: '2TB SSD',
    colour: '',
    priceInr: 100000,
    conditionGrade: 'A+',
    conditionDescription: '',
    images: [],
    units: [],
  }, login.token, authConfig);
  const product = await createResponse.json() as { units: Array<{ id: string }> };
  const inventoryUnitId = product.units[0]?.id;
  assert.ok(inventoryUnitId);

  const reserveResponse = await call(db, '/api/reservations', 'POST', {
    inventoryUnitId,
    customerName: 'Asha',
    customerPhone: '9876543210',
    durationMinutes: 120,
  }, login.token, authConfig);
  assert.equal(reserveResponse.status, 201);
  const reservation = await reserveResponse.json() as { id: string; status: string };
  assert.equal(reservation.status, 'active');

  const missingReservation = await call(db, '/api/sales', 'POST', {
    inventoryUnitId,
    customerName: 'Asha',
    customerPhone: '9876543210',
    salePriceInr: 95000,
  }, login.token, authConfig);
  assert.equal(missingReservation.status, 400);

  const saleResponse = await call(db, '/api/sales', 'POST', {
    inventoryUnitId,
    customerName: 'Asha',
    customerPhone: '9876543210',
    salePriceInr: 95000,
    discountInr: 5000,
    reservationId: reservation.id,
  }, login.token, authConfig);
  assert.equal(saleResponse.status, 201);
  const sale = await saleResponse.json() as { inventoryUnitId: string; salePriceInr: number };
  assert.equal(sale.inventoryUnitId, inventoryUnitId);
  assert.equal(sale.salePriceInr, 95000);

  const duplicateSale = await call(db, '/api/sales', 'POST', {
    inventoryUnitId,
    salePriceInr: 95000,
  }, login.token, authConfig);
  assert.equal(duplicateSale.status, 409);
});

test('Pages API reports when its independent D1 binding is missing', async () => {
  const response = await onRequest({
    request: makeRequest('/api/health'),
    env: {},
  });
  assert.equal(response.status, 503);
});
