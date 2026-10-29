import { SEED_PHONES } from '../../src/data/seedPhones';
import type { ApiInventoryUnit, ApiProduct, ApiReservation, ApiSale } from '../../src/types';
import type { PhoneItem } from '../../src/types';

interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta: { changes?: number };
}

interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = unknown>(): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
}

interface StoreDatabase {
  prepare(query: string): D1Statement;
}

interface StoreBucket {
  get(key: string): Promise<{ body: ReadableStream; httpMetadata?: { contentType?: string } } | null>;
  delete(key: string): Promise<void>;
}

interface Env {
  DB?: StoreDatabase;
  R2?: StoreBucket;
  MBPC_AUTH_SECRET?: string;
  MBPC_ADMIN_EMAIL?: string;
  MBPC_ADMIN_PASSWORD?: string;
  MBPC_SALES_EMAIL?: string;
  MBPC_SALES_PASSWORD?: string;
}

interface StoreState {
  products: ApiProduct[];
  reservations: ApiReservation[];
  sales: ApiSale[];
  customers: Array<{ id: string; name: string; phone: string; email: string | null; notes: string; createdAt: string }>;
}

interface StoredState {
  revision: number;
  value: string;
}

const uuid = () => crypto.randomUUID();
const isoNow = () => new Date().toISOString();
const json = (data: unknown, status = 200) => Response.json(data, { status });
const encoder = new TextEncoder();

interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'sales';
  name: string;
  exp: number;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), character => character.charCodeAt(0));
}

async function getSigningKey(secret: string, usages: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, usages);
}

async function issueToken(user: Omit<AuthUser, 'exp'>, secret: string): Promise<string> {
  const payload = base64UrlEncode(encoder.encode(JSON.stringify({ ...user, exp: Date.now() + 8 * 60 * 60 * 1000 })));
  const signature = await crypto.subtle.sign('HMAC', await getSigningKey(secret, ['sign']), encoder.encode(payload));
  return `${payload}.${base64UrlEncode(new Uint8Array(signature))}`;
}

async function authUser(request: Request, secret: string): Promise<AuthUser | null> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token || secret.length < 32) return null;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;
  try {
    const valid = await crypto.subtle.verify(
      'HMAC',
      await getSigningKey(secret, ['verify']),
      base64UrlDecode(signature),
      encoder.encode(payload),
    );
    if (!valid) return null;
    const user = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload))) as AuthUser;
    if (!user.id || !user.email || !['admin', 'sales'].includes(user.role) || user.exp <= Date.now()) return null;
    return user;
  } catch {
    return null;
  }
}

function safePasswordEqual(provided: string, expected: string): boolean {
  const left = encoder.encode(provided);
  const right = encoder.encode(expected);
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

function statusToApi(status: PhoneItem['status']): ApiInventoryUnit['status'] {
  if (status === 'Booked') return 'reserved';
  if (status === 'Sold Out') return 'sold';
  if (status === 'Retired') return 'retired';
  return 'available';
}

function makeInitialState(): StoreState {
  const now = isoNow();
  return {
    products: SEED_PHONES.map((phone) => {
      const unitId = uuid();
      const grade = {
        'Like New (Flawless)': 'A+',
        'Excellent (9.5/10)': 'A',
        'Very Good (8.5/10)': 'B',
        'Good (Minor Marks)': 'C',
      }[phone.condition] || phone.condition;
      return {
        id: phone.id,
        category: phone.category,
        brand: phone.brand,
        model: phone.model,
        storage: phone.storage,
        colour: phone.colour,
        colorHex: phone.colorHex || null,
        conditionGrade: grade,
        conditionDescription: phone.conditionDescription,
        batteryHealth: phone.batteryHealth ?? null,
        priceInr: phone.price,
        originalMsp: phone.originalMsp ?? null,
        billAvailable: phone.billAvailable ?? false,
        billAmount: phone.billAmount ?? null,
        priceDrop: phone.priceDrop ?? false,
        featured: phone.featured ?? false,
        stockTag: phone.stockTag || `MBPC-${phone.id}`,
        screenSize: phone.screenSize || null,
        ram: phone.ram || null,
        processor: phone.processor || null,
        inBox: phone.inBox,
        keyFeatures: phone.keyFeatures || [],
        images: phone.images.map((url, index) => ({
          url,
          altText: `${phone.brand} ${phone.model}`,
          sortOrder: index,
          isPrimary: index === 0,
        })),
        units: [{
          id: unitId,
          productId: phone.id,
          stockTag: phone.stockTag || `MBPC-${phone.id}`,
          status: statusToApi(phone.status),
          salePriceInr: phone.price,
          createdAt: now,
          updatedAt: now,
        }],
        dateAdded: phone.dateAdded,
        createdAt: now,
        updatedAt: now,
      };
    }),
    reservations: [],
    sales: [],
    customers: [],
  };
}

async function readState(db: StoreDatabase): Promise<StoredState> {
  const stored = await db.prepare('SELECT revision, value FROM my_budget_pc_state WHERE id = 1').first<StoredState>();
  if (stored) return stored;
  const initial = JSON.stringify(makeInitialState());
  await db.prepare('INSERT OR IGNORE INTO my_budget_pc_state (id, revision, value) VALUES (1, 0, ?)').bind(initial).run();
  const created = await db.prepare('SELECT revision, value FROM my_budget_pc_state WHERE id = 1').first<StoredState>();
  if (!created) throw new Error('Unable to initialize the My Budget PC database.');
  return created;
}

async function saveState(db: StoreDatabase, current: StoredState, state: StoreState): Promise<boolean> {
  const result = await db.prepare(
    'UPDATE my_budget_pc_state SET revision = revision + 1, value = ? WHERE id = 1 AND revision = ?',
  ).bind(JSON.stringify(state), current.revision).run();
  return (result.meta.changes || 0) === 1;
}

function normalizeProduct(input: Record<string, unknown>, old?: ApiProduct): ApiProduct {
  const now = isoNow();
  const id = old?.id || uuid();
  const stockTag = String(input.stockTag || old?.stockTag || `MBPC-${Date.now().toString(36).toUpperCase()}`);
  const unit: ApiInventoryUnit = old?.units?.[0] || {
    id: uuid(), productId: id, stockTag: `${stockTag}-U1`, status: 'available',
    salePriceInr: Number(input.priceInr || 0), createdAt: now, updatedAt: now,
  };
  const images = Array.isArray(input.images) ? input.images as ApiProduct['images'] : old?.images || [];
  return {
    id,
    category: String(input.category || old?.category || 'Laptops'),
    brand: String(input.brand ?? old?.brand ?? ''),
    model: String(input.model ?? old?.model ?? ''),
    storage: String(input.storage ?? old?.storage ?? 'N/A'),
    colour: String(input.colour ?? old?.colour ?? ''),
    colorHex: input.colorHex === undefined ? old?.colorHex || null : String(input.colorHex || '') || null,
    conditionGrade: String(input.conditionGrade ?? old?.conditionGrade ?? 'A+'),
    conditionDescription: String(input.conditionDescription ?? old?.conditionDescription ?? ''),
    batteryHealth: input.batteryHealth == null ? old?.batteryHealth ?? null : Number(input.batteryHealth),
    priceInr: Number(input.priceInr ?? old?.priceInr ?? 0),
    originalMsp: input.originalMsp == null ? old?.originalMsp ?? null : Number(input.originalMsp),
    billAvailable: Boolean(input.billAvailable ?? old?.billAvailable ?? false),
    billAmount: input.billAmount == null ? old?.billAmount ?? null : Number(input.billAmount),
    priceDrop: Boolean(input.priceDrop ?? old?.priceDrop ?? false),
    featured: Boolean(input.featured ?? old?.featured ?? false),
    stockTag,
    screenSize: input.screenSize == null ? old?.screenSize ?? null : String(input.screenSize),
    ram: input.ram == null ? old?.ram ?? null : String(input.ram),
    processor: input.processor == null ? old?.processor ?? null : String(input.processor),
    inBox: (input.inBox as ApiProduct['inBox']) || old?.inBox || {},
    keyFeatures: Array.isArray(input.keyFeatures) ? input.keyFeatures as string[] : old?.keyFeatures || [],
    images,
    units: [{ ...unit, salePriceInr: Number(input.priceInr ?? old?.priceInr ?? unit.salePriceInr ?? 0), updatedAt: now }],
    dateAdded: old?.dateAdded || now.slice(0, 10),
    createdAt: old?.createdAt || now,
    updatedAt: now,
  };
}

function productMatches(product: ApiProduct, query: URLSearchParams) {
  const unit = product.units[0];
  const search = query.get('search')?.toLowerCase();
  return (!query.has('category') || product.category === query.get('category'))
    && (!query.has('brand') || product.brand === query.get('brand'))
    && (!query.has('storage') || product.storage === query.get('storage'))
    && (!query.has('condition') || product.conditionGrade === query.get('condition'))
    && (!query.has('minPrice') || product.priceInr >= Number(query.get('minPrice')))
    && (!query.has('maxPrice') || product.priceInr <= Number(query.get('maxPrice')))
    && (!query.has('minBatteryHealth') || (product.batteryHealth || 0) >= Number(query.get('minBatteryHealth')))
    && (!query.has('featured') || product.featured === (query.get('featured') === 'true'))
    && (!query.has('priceDrop') || product.priceDrop === (query.get('priceDrop') === 'true'))
    && (query.get('availableOnly') !== 'true' || unit?.status === 'available')
    && (!search || [product.brand, product.model, product.stockTag, product.colour].some(value => value.toLowerCase().includes(search)));
}

function serializePublicProduct(product: ApiProduct) {
  return {
    id: product.id,
    category: product.category,
    brand: product.brand,
    model: product.model,
    storage: product.storage,
    colour: product.colour,
    colorHex: product.colorHex,
    priceInr: product.priceInr,
    originalMsp: product.originalMsp,
    billAvailable: product.billAvailable,
    billAmount: product.billAmount,
    conditionGrade: product.conditionGrade,
    conditionDescription: product.conditionDescription,
    batteryHealth: product.batteryHealth,
    screenSize: product.screenSize,
    ram: product.ram,
    processor: product.processor,
    stockTag: product.stockTag,
    priceDrop: product.priceDrop,
    featured: product.featured,
    inBox: product.inBox,
    keyFeatures: product.keyFeatures,
    images: product.images.map(({ url, altText, sortOrder, isPrimary }) => ({
      url, altText, sortOrder, isPrimary,
    })),
    units: product.units.map(({ status, salePriceInr }) => ({ status, salePriceInr })),
    dateAdded: product.dateAdded,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  if (!env.DB) return json({ error: 'Cloudflare D1 database is not configured. Bind a new store database as DB.' }, 503);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, '').replace(/\/+$/, '') || '/';
  const method = request.method.toUpperCase();

  try {
    if (path === '/auth/login' && method === 'POST') {
      const body = await request.json() as { email?: string; password?: string };
      const email = body.email?.trim().toLowerCase() || '';
      const adminEmail = env.MBPC_ADMIN_EMAIL?.trim().toLowerCase();
      const salesEmail = env.MBPC_SALES_EMAIL?.trim().toLowerCase();
      const adminPassword = env.MBPC_ADMIN_PASSWORD;
      const salesPassword = env.MBPC_SALES_PASSWORD;
      const secret = env.MBPC_AUTH_SECRET || '';
      if (secret.length < 32 || !adminEmail || !adminPassword || adminPassword.length < 12) {
        return json({ error: 'Staff authentication is not configured. Set secure My Budget PC auth secrets before enabling staff access.' }, 503);
      }
      const credentials = email === adminEmail
        ? { id: 'mbpc-admin', email: adminEmail, password: adminPassword, role: 'admin' as const, name: 'My Budget PC Admin' }
        : email === salesEmail && salesEmail && salesPassword && salesPassword.length >= 12
          ? { id: 'mbpc-sales', email: salesEmail, password: salesPassword, role: 'sales' as const, name: 'My Budget PC Sales' }
          : null;
      if (!credentials || !body.password || !safePasswordEqual(body.password, credentials.password)) {
        return json({ error: 'Invalid email or password.' }, 401);
      }
      return json({
        token: await issueToken({
          id: credentials.id,
          email: credentials.email,
          role: credentials.role,
          name: credentials.name,
        }, secret),
        user: { id: credentials.id, email: credentials.email, role: credentials.role, name: credentials.name },
      });
    }

    const user = await authUser(request, env.MBPC_AUTH_SECRET || '');
    if (request.headers.has('authorization') && !user) {
      return json({ error: 'Invalid or expired session.' }, 401);
    }
    if (path === '/health' && method === 'GET') {
      await env.DB.prepare('SELECT 1').first();
      return json({ status: 'ok', mode: 'd1', database: 'connected', imageStorage: env.R2 ? 'R2' : 'disabled' });
    }
    if (path === '/auth/me' && method === 'GET') {
      if (!user) return json({ error: 'Authentication required.' }, 401);
      const { exp: _exp, ...publicUser } = user;
      return json(publicUser);
    }
    if (path.startsWith('/auth/') && method !== 'GET') {
      if (!user) return json({ error: 'Authentication required.' }, 401);
      return json({ error: 'User management is unavailable in this deployment.' }, 403);
    }

    let stateRow: StoredState | undefined;
    let state: StoreState | undefined;
    const load = async () => {
      if (!stateRow || !state) {
        stateRow = await readState(env.DB!);
        state = JSON.parse(stateRow.value) as StoreState;
      }
      return state;
    };
    const persist = async () => {
      if (!stateRow || !state) {
        return json({ error: 'Store data is unavailable. Please retry.' }, 500);
      }
      if (new TextEncoder().encode(JSON.stringify(state)).byteLength > 900 * 1024) {
        return json({ error: 'Catalogue state is near its safe size limit. Remove embedded image data and migrate to a relational store.' }, 413);
      }
      if (!(await saveState(env.DB!, stateRow, state))) {
        return json({ error: 'Store data changed in another request. Please retry.' }, 409);
      }
      return null;
    };
    const requireStaff = () => user ? null : json({ error: 'Authentication required.' }, 401);
    const requireAdmin = () => !user ? json({ error: 'Authentication required.' }, 401)
      : user.role !== 'admin' ? json({ error: 'Admin access required.' }, 403) : null;

    if (path === '/products' && method === 'GET') {
      const data = await load();
      const products = data.products.filter(product => productMatches(product, url.searchParams));
      const page = Math.max(1, Number(url.searchParams.get('page') || 1));
      const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 100)));
      const sort = url.searchParams.get('sort');
      if (sort === 'price-asc') products.sort((a, b) => a.priceInr - b.priceInr);
      if (sort === 'price-desc') products.sort((a, b) => b.priceInr - a.priceInr);
      if (sort === 'battery-desc') products.sort((a, b) => (b.batteryHealth || 0) - (a.batteryHealth || 0));
      if (!sort || sort === 'featured') products.sort((a, b) => Number(b.featured) - Number(a.featured));
      const total = products.length;
      const pageProducts = products.slice((page - 1) * limit, page * limit);
      return json({
        products: user ? pageProducts : pageProducts.map(serializePublicProduct),
        total, page, limit, pages: Math.ceil(total / limit),
      });
    }

    const productDetail = path.match(/^\/products\/([^/]+)$/);
    if (productDetail && method === 'GET') {
      const product = (await load()).products.find(item => item.id === productDetail[1]);
      return product ? json(user ? product : serializePublicProduct(product)) : json({ error: 'Product not found.' }, 404);
    }
    const productInventory = path.match(/^\/products\/([^/]+)\/inventory$/);
    if (productInventory && method === 'GET') {
      const denied = requireStaff();
      if (denied) return denied;
      const product = (await load()).products.find(item => item.id === productInventory[1]);
      return product ? json(product.units) : json({ error: 'Product not found.' }, 404);
    }

    if (path === '/products' && method === 'POST') {
      const denied = requireStaff();
      if (denied) return denied;
      const body = await request.json() as Record<string, unknown>;
      const data = await load();
      const product = normalizeProduct(body);
      data.products.unshift(product);
      const conflict = await persist();
      return conflict || json(product, 201);
    }

    if (productDetail && method === 'PATCH') {
      const denied = requireStaff();
      if (denied) return denied;
      const data = await load();
      const index = data.products.findIndex(item => item.id === productDetail[1]);
      if (index < 0) return json({ error: 'Product not found.' }, 404);
      data.products[index] = normalizeProduct(await request.json() as Record<string, unknown>, data.products[index]);
      const conflict = await persist();
      return conflict || json({ message: 'Product updated.' });
    }

    if (productDetail && method === 'DELETE') {
      const denied = requireAdmin();
      if (denied) return denied;
      const data = await load();
      const product = data.products.find(item => item.id === productDetail[1]);
      if (product?.units.some(unit => data.sales.some(sale => sale.inventoryUnitId === unit.id))) {
        return json({ error: 'Sold products cannot be deleted.' }, 409);
      }
      data.products = data.products.filter(item => item.id !== productDetail[1]);
      const conflict = await persist();
      return conflict || json({ message: 'Product deleted.' });
    }

    if (path === '/inventory' && method === 'GET') {
      const denied = requireStaff();
      if (denied) return denied;
      const data = await load();
      const status = url.searchParams.get('status');
      const productId = url.searchParams.get('productId');
      return json(data.products.flatMap(product => product.units
        .filter(unit => (!status || unit.status === status) && (!productId || product.id === productId))
        .map(unit => ({
          ...unit, brand: product.brand, model: product.model, storage: product.storage,
          colour: product.colour, priceInr: product.priceInr, productStockTag: product.stockTag,
        }))));
    }

    const inventoryStatus = path.match(/^\/inventory\/([^/]+)\/status$/);
    if (inventoryStatus && method === 'PATCH') {
      const denied = requireAdmin();
      if (denied) return denied;
      const body = await request.json() as { status?: ApiInventoryUnit['status'] };
      if (!['available', 'reserved', 'sold', 'retired'].includes(body.status || '')) {
        return json({ error: 'Invalid inventory status.' }, 400);
      }
      const data = await load();
      const unit = data.products.flatMap(product => product.units).find(item => item.id === inventoryStatus[1]);
      if (!unit) return json({ error: 'Inventory unit not found.' }, 404);
      const validTransitions: Record<ApiInventoryUnit['status'], ApiInventoryUnit['status'][]> = {
        available: ['reserved', 'sold', 'retired'],
        reserved: ['available', 'sold'],
        sold: ['available'],
        retired: ['available'],
      };
      if (unit.status !== body.status && !validTransitions[unit.status].includes(body.status!)) {
        return json({ error: `Invalid inventory transition: ${unit.status} -> ${body.status}.` }, 400);
      }
      if (unit.status === 'sold' && body.status === 'available') {
        data.sales = data.sales.filter(sale => sale.inventoryUnitId !== unit.id);
        data.reservations = data.reservations.map(reservation =>
          reservation.inventoryUnitId === unit.id && reservation.status === 'converted'
            ? { ...reservation, status: 'cancelled' }
            : reservation,
        );
      }
      unit.status = body.status!;
      const conflict = await persist();
      return conflict || json({ id: unit.id, status: unit.status });
    }

    const inventoryUnit = path.match(/^\/inventory\/([^/]+)$/);
    if (inventoryUnit && method === 'DELETE') {
      const denied = requireAdmin();
      if (denied) return denied;
      const data = await load();
      const product = data.products.find(item => item.units.some(unit => unit.id === inventoryUnit[1]));
      if (!product) return json({ error: 'Inventory unit not found.' }, 404);
      if (data.sales.some(sale => sale.inventoryUnitId === inventoryUnit[1])) {
        return json({ error: 'Sold stock cannot be deleted.' }, 409);
      }
      product.units = product.units.filter(unit => unit.id !== inventoryUnit[1]);
      if (product.units.length === 0) data.products = data.products.filter(item => item.id !== product.id);
      const conflict = await persist();
      return conflict || json({ message: 'Inventory unit deleted.', id: inventoryUnit[1] });
    }

    if (path === '/reservations' && method === 'GET') {
      const denied = requireStaff();
      if (denied) return denied;
      const data = await load();
      const status = url.searchParams.get('status');
      return json(data.reservations.filter(item => !status || item.status === status));
    }

    if (path === '/reservations' && method === 'POST') {
      const denied = requireStaff();
      if (denied) return denied;
      const body = await request.json() as { inventoryUnitId: string; customerName?: string; customerPhone?: string; durationMinutes?: number };
      const data = await load();
      const product = data.products.find(item => item.units.some(unit => unit.id === body.inventoryUnitId));
      const unit = product?.units.find(item => item.id === body.inventoryUnitId);
      if (!product || !unit) return json({ error: 'Inventory unit not found.' }, 404);
      if (unit.status !== 'available') return json({ error: 'Unit is not available for reservation.' }, 409);
      const now = isoNow();
      const customerId = uuid();
      const expiresAt = new Date(Date.now() + (body.durationMinutes || 120) * 60_000).toISOString();
      unit.status = 'reserved';
      data.customers.push({ id: customerId, name: body.customerName || 'Walk-in', phone: body.customerPhone || '0000000000', email: null, notes: '', createdAt: now });
      const reservation: ApiReservation = {
        id: uuid(), inventoryUnitId: unit.id, customerId, customerName: body.customerName || 'Walk-in',
        customerPhone: body.customerPhone || '', stockTag: unit.stockTag, brand: product.brand, model: product.model,
        storage: product.storage, status: 'active', expiresAt, notes: null, createdAt: now,
      };
      data.reservations.unshift(reservation);
      const conflict = await persist();
      return conflict || json(reservation, 201);
    }

    if (path === '/reservations/cancel' && method === 'POST') {
      const denied = requireStaff();
      if (denied) return denied;
      const body = await request.json() as { reservationId: string };
      const data = await load();
      const reservation = data.reservations.find(item => item.id === body.reservationId);
      if (!reservation) return json({ error: 'Reservation not found.' }, 404);
      if (reservation.status !== 'active' && reservation.status !== 'pending') return json({ error: 'Reservation already closed.' }, 400);
      reservation.status = 'cancelled';
      for (const product of data.products) {
        const unit = product.units.find(item => item.id === reservation.inventoryUnitId);
        if (unit) unit.status = 'available';
      }
      const conflict = await persist();
      return conflict || json({ message: 'Reservation cancelled.' });
    }

    if (path === '/sales' && method === 'GET') {
      const denied = requireStaff();
      if (denied) return denied;
      return json((await load()).sales);
    }

    if (path === '/sales' && method === 'POST') {
      const denied = requireStaff();
      if (denied) return denied;
      const body = await request.json() as { inventoryUnitId: string; customerName?: string; customerPhone?: string; salePriceInr: number; discountInr?: number; reservationId?: string };
      const data = await load();
      const product = data.products.find(item => item.units.some(unit => unit.id === body.inventoryUnitId));
      const unit = product?.units.find(item => item.id === body.inventoryUnitId);
      if (!product || !unit) return json({ error: 'Inventory unit not found.' }, 404);
      if (unit.status === 'sold') return json({ error: 'This unit has already been sold.' }, 409);
      if (unit.status === 'reserved') {
        const reservation = data.reservations.find(item =>
          item.id === body.reservationId && item.inventoryUnitId === unit.id && ['pending', 'active'].includes(item.status),
        );
        if (!reservation) return json({ error: 'Reservation ID required for reserved units.' }, 400);
        reservation.status = 'converted';
      }
      if (unit.status === 'retired') return json({ error: 'This unit is no longer available.' }, 400);
      const now = isoNow();
      unit.status = 'sold';
      unit.salePriceInr = body.salePriceInr;
      const customerPhone = body.customerPhone || '';
      if (customerPhone && !data.customers.some(customer => customer.phone === customerPhone)) {
        data.customers.push({
          id: uuid(), name: body.customerName || 'Walk-in', phone: customerPhone,
          email: null, notes: '', createdAt: now,
        });
      }
      const sale: ApiSale = {
        id: uuid(), inventoryUnitId: unit.id, customerName: body.customerName || 'Walk-in',
        customerPhone, sellerName: user.name, brand: product.brand,
        model: product.model, storage: product.storage, colour: product.colour, stockTag: unit.stockTag,
        salePriceInr: body.salePriceInr, discountInr: body.discountInr || 0, notes: null, soldAt: now,
      };
      data.sales.unshift(sale);
      const conflict = await persist();
      return conflict || json({ id: sale.id, inventoryUnitId: sale.inventoryUnitId, salePriceInr: sale.salePriceInr, soldAt: sale.soldAt }, 201);
    }

    if (path === '/sales/metrics' && method === 'GET') {
      const denied = requireAdmin();
      if (denied) return denied;
      const data = await load();
      const units = data.products.flatMap(product => product.units);
      const available = units.filter(unit => unit.status === 'available');
      const sold = units.filter(unit => unit.status === 'sold');
      return json({
        totalProducts: data.products.length, availableUnits: available.length,
        reservedUnits: units.filter(unit => unit.status === 'reserved').length, soldUnits: sold.length,
        totalStockValue: available.reduce((sum, unit) => sum + (unit.salePriceInr || 0), 0),
        totalRevenue: sold.reduce((sum, unit) => sum + (unit.salePriceInr || 0), 0),
        avgUnitPrice: available.length ? Math.round(available.reduce((sum, unit) => sum + (unit.salePriceInr || 0), 0) / available.length) : 0,
      });
    }

    if (path === '/uploads/image' && method === 'POST') {
      const denied = requireStaff();
      if (denied) return denied;
      return json({ error: 'Cloudflare image uploads are disabled until image decoding and WebP normalization are supported.' }, 503);
    }

    const uploadedFile = path.match(/^\/uploads\/file\/([a-zA-Z0-9-]+\.(?:jpg|png|webp|gif))$/);
    if (uploadedFile && method === 'GET') {
      if (!env.R2) return json({ error: 'Image is not available without the R2 binding.' }, 404);
      const object = await env.R2.get(uploadedFile[1]);
      if (!object) return json({ error: 'File not found.' }, 404);
      const extension = uploadedFile[1].split('.').pop();
      const contentType = extension === 'jpg' ? 'image/jpeg'
        : extension === 'png' ? 'image/png'
          : extension === 'webp' ? 'image/webp'
            : 'image/gif';
      return new Response(object.body, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    if (path === '/customers' && method === 'GET') {
      const denied = requireStaff();
      if (denied) return denied;
      return json((await load()).customers);
    }

    if (path === '/inspections' && method === 'GET') {
      const denied = requireStaff();
      if (denied) return denied;
      return json([]);
    }

    if (path === '/inspections' && method === 'POST') {
      const denied = requireStaff();
      if (denied) return denied;
      return json({ error: 'Inspection entry is not enabled for this Cloudflare backend.' }, 501);
    }

    const uploadedFileToDelete = path.match(/^\/uploads\/([a-zA-Z0-9-]+(?:\.(?:jpg|png|webp|gif))?)$/);
    if (uploadedFileToDelete && method === 'DELETE') {
      const denied = requireAdmin();
      if (denied) return denied;
      if (env.R2) await env.R2.delete(uploadedFileToDelete[1]);
      return json({ message: 'Image deleted.' });
    }

    return json({ error: 'Not found.' }, 404);
  } catch (error) {
    console.error('Cloudflare API error:', error);
    return json({ error: 'Store API request failed. Please retry.' }, 500);
  }
}
