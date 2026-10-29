import { PhoneItem } from '../types';
import { formatINR } from '../config/siteConfig';

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface EnquiryCustomer {
  name: string;
  phone: string;
  deliveryPreference: 'delivery' | 'pickup';
  address: string;
  pinCode: string;
  notes: string;
}

export const CART_STORAGE_KEY = 'my-budget-pc-cart-v1';

export function getProductVariant(product: PhoneItem): string {
  return [
    product.storage && product.storage !== 'N/A' ? product.storage : '',
    product.ram ? `${product.ram} RAM` : '',
    product.processor || '',
    product.colour && product.colour !== 'N/A' ? product.colour : '',
  ].filter(Boolean).join(' · ') || 'Standard configuration';
}

export function filterProducts(
  products: PhoneItem[],
  options: {
    query: string;
    category: string;
    brand: string;
    minPrice: number;
    maxPrice: number;
    sortBy: string;
    onlyAvailable: boolean;
  },
): PhoneItem[] {
  const query = options.query.trim().toLocaleLowerCase();
  return products
    .filter((product) => {
      if (options.category !== 'All') {
        const category = product.category?.toLocaleLowerCase() || '';
        const selected = options.category.toLocaleLowerCase();
        const isDesktop = (selected === 'desktop computers' || selected === 'desktops') && /desktop/.test(category);
        const isComponent = selected === 'components'
          && /component|processor|cpu|graphics|motherboard|memory|ram|storage|power supply|psu|cooling/.test(category);
        if (!isDesktop && !isComponent && category !== selected) return false;
      }
      if (options.brand !== 'All' && product.brand !== options.brand) return false;
      if (options.onlyAvailable && product.status !== 'Available') return false;
      const hasPriceLimit = options.minPrice > 0 || options.maxPrice < Number.MAX_SAFE_INTEGER;
      if (hasPriceLimit && (product.price <= 0 || product.price < options.minPrice || product.price > options.maxPrice)) return false;
      if (query) {
        const searchable = [
          product.brand,
          product.model,
          product.category,
          product.storage,
          product.ram,
          product.processor,
          product.screenSize,
          product.condition,
          product.conditionDescription,
          product.colour,
          product.stockTag,
          product.keyFeatures.join(' '),
        ].filter(Boolean).join(' ').toLocaleLowerCase();
        if (!searchable.includes(query)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (options.sortBy === 'price-asc' || options.sortBy === 'price-desc') {
        if (a.price <= 0) return b.price <= 0 ? 0 : 1;
        if (b.price <= 0) return -1;
        return options.sortBy === 'price-asc' ? a.price - b.price : b.price - a.price;
      }
      if (options.sortBy === 'newest') return b.dateAdded.localeCompare(a.dateAdded);
      if (a.featured !== b.featured) return Number(b.featured) - Number(a.featured);
      if (a.status !== b.status) return a.status === 'Available' ? -1 : 1;
      return a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model);
    });
}

export function loadCart(storage: Pick<Storage, 'getItem'> = localStorage): CartLine[] {
  const saved = storage.getItem(CART_STORAGE_KEY);
  if (!saved) return [];
  const parsed: unknown = JSON.parse(saved);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((line): line is CartLine =>
    typeof line === 'object'
    && line !== null
    && typeof (line as CartLine).productId === 'string'
    && Number.isInteger((line as CartLine).quantity)
    && (line as CartLine).quantity > 0,
  );
}

export function calculateCartSubtotal(lines: CartLine[], products: PhoneItem[]): number | null {
  if (lines.length === 0) return 0;
  const byId = new Map(products.map((product) => [product.id, product]));
  let total = 0;
  for (const line of lines) {
    const product = byId.get(line.productId);
    if (!product || product.price <= 0) return null;
    total += product.price * line.quantity;
  }
  return total;
}
