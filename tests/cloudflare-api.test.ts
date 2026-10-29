import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequest } from '../functions/api/[[path]]';

class MemoryD1 {
  private row: { revision: number; value: string } | null = null;

  constructor(private readonly queryError?: (query: string) => Error | undefined) {}

  prepare(query: string) {
    const createStatement = (values: unknown[] = []) => ({
      bind: (...bound: unknown[]) => createStatement(bound),
      first: async <T,>() => {
        const error = this.queryError?.(query);
        if (error) throw error;
        if (query.includes('SELECT 1')) return { ok: 1 } as T;
        return this.row as T | null;
      },
      run: async <T,>() => {
        const error = this.queryError?.(query);
        if (error) throw error;
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

const makeUploadRequest = (token: string | undefined, bytes: Uint8Array, contentType: string, filename: string) => {
  const form = new FormData();
  form.append('image', new Blob([bytes], { type: contentType }), filename);
  const headers = new Headers();
  if (token) headers.set('authorization', `Bearer ${token}`);
  return new Request('https://store.example/api/uploads/image', {
    method: 'POST',
    headers,
    body: form,
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

test('Pages API rejects invalid optional tokens and protects inventory-unit details', async () => {
  const db = new MemoryD1();
  const loginResponse = await call(db, '/api/auth/login', 'POST', {
    email: authConfig.MBPC_ADMIN_EMAIL,
    password: authConfig.MBPC_ADMIN_PASSWORD,
  }, undefined, authConfig);
  const login = await loginResponse.json() as { token: string };

  const createResponse = await call(db, '/api/products', 'POST', {
    category: 'Laptops',
    brand: 'Example',
    model: 'Private-unit-test',
    storage: '512GB SSD',
    colour: 'Black',
    priceInr: 50000,
    conditionGrade: 'A',
    conditionDescription: 'Test listing',
    images: [],
    units: [],
  }, login.token, authConfig);
  assert.equal(createResponse.status, 201);
  const created = await createResponse.json() as { id: string };

  const publicList = await call(db, '/api/products?page=1&limit=1');
  assert.equal(publicList.status, 200);
  const publicCatalog = await publicList.json() as {
    products: Array<{ units: Array<Record<string, unknown>> }>;
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  assert.equal(publicCatalog.total, 1);
  assert.equal(publicCatalog.page, 1);
  assert.equal(publicCatalog.limit, 1);
  assert.equal(publicCatalog.pages, 1);
  assert.deepEqual(publicCatalog.products[0].units, [{ status: 'available', salePriceInr: 50000 }]);
  assert.equal('id' in publicCatalog.products[0].units[0], false);
  assert.equal('stockTag' in publicCatalog.products[0].units[0], false);

  const publicDetail = await call(db, `/api/products/${created.id}`);
  const publicProduct = await publicDetail.json() as { units: Array<Record<string, unknown>> };
  assert.deepEqual(publicProduct.units[0], { status: 'available', salePriceInr: 50000 });

  const publicInventory = await call(db, `/api/products/${created.id}/inventory`);
  assert.equal(publicInventory.status, 401);
  const invalidOptionalToken = await call(db, '/api/products', 'GET', undefined, 'invalid-token', authConfig);
  assert.equal(invalidOptionalToken.status, 401);
  const invalidHealthToken = await call(db, '/api/health', 'GET', undefined, 'invalid-token', authConfig);
  assert.equal(invalidHealthToken.status, 401);
  for (const staffPath of ['/api/inventory', '/api/customers', '/api/reservations', '/api/sales', '/api/inspections']) {
    const response = await call(db, staffPath);
    assert.equal(response.status, 401, `${staffPath} should require staff authentication`);
  }

  const staffInventory = await call(db, `/api/products/${created.id}/inventory`, 'GET', undefined, login.token, authConfig);
  assert.equal(staffInventory.status, 200);
  const staffUnits = await staffInventory.json() as Array<{ id: string; stockTag: string }>;
  assert.ok(staffUnits[0]?.id);
  assert.ok(staffUnits[0]?.stockTag);
});

test('Cloudflare image uploads fail closed for unauthorized and unprocessable files', async () => {
  const db = new MemoryD1();
  const loginResponse = await call(db, '/api/auth/login', 'POST', {
    email: authConfig.MBPC_ADMIN_EMAIL,
    password: authConfig.MBPC_ADMIN_PASSWORD,
  }, undefined, authConfig);
  const login = await loginResponse.json() as { token: string };
  let storedObjects = 0;
  const r2 = {
    get: async () => null,
    put: async () => { storedObjects += 1; },
    delete: async () => undefined,
  };
  const unauthenticated = await onRequest({
    request: makeUploadRequest(undefined, new Uint8Array(), 'image/png', 'image.png'),
    env: { DB: db, R2: r2, ...authConfig },
  });
  assert.equal(unauthenticated.status, 401);

  const files = [
    { bytes: new TextEncoder().encode('<script>alert(1)</script>'), type: 'image/png', name: 'spoofed.png' },
    { bytes: new Uint8Array(5 * 1024 * 1024 + 1), type: 'image/jpeg', name: 'oversized.jpg' },
    { bytes: new Uint8Array([0xff, 0xd8, 0xff, 0x00]), type: 'image/jpeg', name: 'corrupt.jpg' },
    { bytes: new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>'), type: 'image/svg+xml', name: 'active.svg' },
  ];

  for (const file of files) {
    const response = await onRequest({
      request: makeUploadRequest(login.token, file.bytes, file.type, file.name),
      env: { DB: db, R2: r2, ...authConfig },
    });
    assert.equal(response.status, 503);
  }
  assert.equal(storedObjects, 0);
});

test('Pages API starts with an empty My Budget PC catalogue', async () => {
  const db = new MemoryD1();
  const response = await call(db, '/api/products?page=1&limit=1');
  assert.equal(response.status, 200);
  const catalog = await response.json() as {
    products: unknown[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  assert.deepEqual(catalog.products, []);
  assert.equal(catalog.total, 0);
  assert.equal(catalog.page, 1);
  assert.equal(catalog.limit, 1);
  assert.equal(catalog.pages, 0);
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
  assert.match(response.headers.get('content-type') || '', /^application\/json/);
  assert.equal(response.status, 503);
  const body = await response.json() as { error: string };
  assert.match(body.error, /D1 database is not configured/);
});

test('Pages API health verifies connectivity through a configured D1 binding', async () => {
  const response = await call(new MemoryD1(), '/api/health');

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: 'ok',
    mode: 'd1',
    database: 'connected',
    imageStorage: 'disabled',
  });
});

test('Pages API reports missing D1 tables without exposing database errors', async () => {
  const privateError = 'D1_ERROR: no such table: my_budget_pc_state; secret=must-not-leak';
  const db = new MemoryD1((query) => query.includes('my_budget_pc_state')
    ? new Error(privateError)
    : undefined);

  const response = await call(db, '/api/products');
  const body = await response.json() as { error: string };

  assert.equal(response.status, 503);
  assert.match(body.error, /schema is not initialized/);
  assert.match(body.error, /my_budget_pc_state/);
  assert.equal(JSON.stringify(body).includes('must-not-leak'), false);
  assert.equal(JSON.stringify(body).includes(privateError), false);
});

test('Pages API reports D1 SQL failures without exposing database errors', async () => {
  const privateError = 'D1_ERROR: SELECT failed; secret=must-not-leak';
  const db = new MemoryD1((query) => query.includes('SELECT revision')
    ? new Error(privateError)
    : undefined);

  const response = await call(db, '/api/products');
  const body = await response.json() as { error: string };

  assert.equal(response.status, 503);
  assert.match(body.error, /D1 is unavailable/);
  assert.equal(JSON.stringify(body).includes('must-not-leak'), false);
  assert.equal(JSON.stringify(body).includes(privateError), false);
});
