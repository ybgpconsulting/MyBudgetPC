import assert from 'node:assert/strict';
import test from 'node:test';
import type { PhoneItem } from '../src/types';
import {
  calculateCartSubtotal, CART_STORAGE_KEY, filterProducts, getProductVariant, loadCart,
} from '../src/utils/storefront';
import {
  buildCartEnquiryMessage, buildProductEnquiryMessage, createWhatsAppUrl,
} from '../src/utils/whatsapp';

function makeProduct(overrides: Partial<PhoneItem> = {}): PhoneItem {
  return {
    id: 'laptop-1',
    category: 'Laptops',
    brand: 'Example',
    model: 'Office laptop',
    storage: '1TB SSD',
    colour: 'Black',
    condition: 'A',
    conditionDescription: 'Verified store listing.',
    price: 50000,
    status: 'Available',
    availableQuantity: 3,
    dateAdded: '2026-10-10',
    images: ['/laptop.jpg'],
    inBox: {
      chargerIncluded: false,
      originalBox: false,
      taxInvoiceProvided: false,
      cableIncluded: false,
    },
    keyFeatures: ['16GB RAM'],
    inspectionPassed: [],
    stockTag: 'MBPC-LAP-001',
    ram: '16GB',
    processor: 'Intel Core i5',
    ...overrides,
  };
}

test('catalogue search, component category, availability, and price sorting work', () => {
  const laptop = makeProduct();
  const premiumDesktop = makeProduct({
    id: 'desktop-1',
    brand: 'Second',
    category: 'Desktop Computers',
    model: 'Tower workstation',
    price: 325000,
    stockTag: 'MBPC-DES-001',
  });
  const graphicsCard = makeProduct({
    id: 'gpu-1',
    category: 'Graphics Cards',
    model: 'RTX model',
    price: 70000,
    stockTag: 'MBPC-GPU-001',
    featured: true,
  });
  const unpriced = makeProduct({ id: 'memory-1', category: 'Memory', price: 0 });

  assert.deepEqual(filterProducts([laptop, graphicsCard, unpriced], {
    query: 'mbpc-gpu',
    category: 'All',
    brand: 'All',
    minPrice: 0,
    maxPrice: Number.MAX_SAFE_INTEGER,
    sortBy: 'featured',
    onlyAvailable: false,
  }).map((product) => product.id), ['gpu-1']);
  assert.deepEqual(filterProducts([laptop, graphicsCard, unpriced], {
    query: '',
    category: 'Components',
    brand: 'All',
    minPrice: 0,
    maxPrice: Number.MAX_SAFE_INTEGER,
    sortBy: 'featured',
    onlyAvailable: false,
  }).map((product) => product.id), ['gpu-1', 'memory-1']);
  assert.deepEqual(filterProducts([unpriced, graphicsCard, laptop], {
    query: '',
    category: 'All',
    brand: 'All',
    minPrice: 0,
    maxPrice: Number.MAX_SAFE_INTEGER,
    sortBy: 'price-asc',
    onlyAvailable: true,
  }).map((product) => product.id), ['laptop-1', 'gpu-1', 'memory-1']);
  assert.deepEqual(filterProducts([laptop, graphicsCard, premiumDesktop], {
    query: '',
    category: 'All',
    brand: 'Second',
    minPrice: 300000,
    maxPrice: Number.MAX_SAFE_INTEGER,
    sortBy: 'price-asc',
    onlyAvailable: false,
  }).map((product) => product.id), ['desktop-1']);
  assert.deepEqual(filterProducts([laptop, premiumDesktop], {
    query: 'workstation',
    category: 'All',
    brand: 'All',
    minPrice: 0,
    maxPrice: Number.MAX_SAFE_INTEGER,
    sortBy: 'newest',
    onlyAvailable: false,
  }).map((product) => product.id), ['desktop-1']);
});

test('cart totals follow current product prices and report pending amounts', () => {
  const priced = makeProduct();
  const unpriced = makeProduct({ id: 'unpriced', price: 0 });
  assert.equal(calculateCartSubtotal([{ productId: priced.id, quantity: 2 }], [priced]), 100000);
  assert.equal(calculateCartSubtotal([{ productId: unpriced.id, quantity: 1 }], [unpriced]), null);
  assert.equal(calculateCartSubtotal([{ productId: 'missing', quantity: 1 }], [priced]), null);
});

test('persisted cart data is namespaced and malformed entries are ignored', () => {
  const storage = {
    getItem: (key: string) => key === CART_STORAGE_KEY
      ? JSON.stringify([{ productId: 'laptop-1', quantity: 2 }, { productId: '', quantity: 0 }, null])
      : null,
  };
  assert.deepEqual(loadCart(storage), [{ productId: 'laptop-1', quantity: 2 }]);
  assert.throws(() => loadCart({ getItem: () => '{invalid' }), SyntaxError);
});

test('product and cart messages include the selected listing and require availability confirmation', () => {
  const product = makeProduct();
  const productMessage = buildProductEnquiryMessage(product, 2, 'https://store.example/product/laptop-1');
  assert.match(productMessage, /Office laptop/);
  assert.match(productMessage, /MBPC-LAP-001/);
  assert.match(productMessage, /16GB RAM/);
  assert.match(productMessage, /Quantity: 2/);
  assert.match(productMessage, /₹50,000/);
  assert.match(productMessage, /https:\/\/store\.example\/product\/laptop-1/);

  const cartMessage = buildCartEnquiryMessage(
    [{ productId: product.id, quantity: 2 }],
    [product],
    {
      name: 'Asha',
      phone: '+91 98765 43210',
      deliveryPreference: 'delivery',
      address: '12 Sample Road',
      pinCode: '110001',
      notes: 'Call before delivery',
    },
    'https://store.example',
  );
  assert.match(cartMessage, /Customer name: Asha/);
  assert.match(cartMessage, /Customer phone: \+91 98765 43210/);
  assert.match(cartMessage, /Cart subtotal: ₹1,00,000/);
  assert.match(cartMessage, /Preference: Delivery/);
  assert.match(cartMessage, /PIN code: 110001/);
  assert.match(cartMessage, /Delivery charges: Pending confirmation/);
  assert.match(cartMessage, /Additional notes: Call before delivery/);
  assert.match(cartMessage, /not a confirmed order/);
});

test('WhatsApp URLs encode text and remain unavailable without valid contact configuration', () => {
  const url = createWhatsAppUrl('My Budget PC: laptop & RAM\nPrice? ₹50000', '+91 98765 43210');
  assert.ok(url);
  const parsed = new URL(url);
  assert.equal(parsed.origin, 'https://wa.me');
  assert.equal(parsed.pathname, '/919876543210');
  assert.equal(parsed.searchParams.get('text'), 'My Budget PC: laptop & RAM\nPrice? ₹50000');
  assert.equal(createWhatsAppUrl('Enquiry', ''), null);
  assert.equal(createWhatsAppUrl('Enquiry', '123'), null);
  assert.equal(createWhatsAppUrl('Enquiry', '1234567890123456'), null);
});

test('product configuration falls back to a safe standard label', () => {
  assert.equal(getProductVariant(makeProduct({ storage: 'N/A', colour: '' })), '16GB RAM · Intel Core i5');
});
