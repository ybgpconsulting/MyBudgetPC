export interface StoreRoute {
  view: string;
  productId?: string;
  categorySlug?: string;
}

const routeAliases: Record<string, string> = {
  '': 'home',
  home: 'home',
  shop: 'stock',
  catalog: 'stock',
  stock: 'stock',
  accessories: 'stock',
  enquiry: 'checkout',
  checkout: 'checkout',
  cart: 'checkout',
  login: 'login',
  admin: 'login',
  sales: 'login',
  about: 'home',
  policies: 'home',
  contact: 'home',
};

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function slugifyCategory(category: string): string {
  return category
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function categoryFromSlug(slug: string): string {
  const knownCategories: Record<string, string> = {
    'desktop-computers': 'Desktop Computers',
    'custom-pc-builds': 'Custom PC Builds',
    'graphics-cards': 'Graphics Cards',
    gpu: 'GPU',
    gpus: 'GPUs',
    cpu: 'CPU',
    cpus: 'CPUs',
    ram: 'RAM',
    'power-supplies': 'Power Supplies',
    psu: 'PSU',
    psus: 'PSUs',
    ssds: 'SSDs',
    'hard-drives': 'Hard Drives',
  };
  return knownCategories[slug] || slug.split('-').filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function parseStoreRoute(pathname: string): StoreRoute {
  const path = pathname.split(/[?#]/, 1)[0].replace(/^\/+|\/+$/g, '');
  const segments = path.split('/').filter(Boolean);

  if ((segments[0] === 'product' || segments[0] === 'stock') && segments[1]) {
    return { view: 'detail', productId: decodeSegment(segments.slice(1).join('/')) };
  }
  if ((segments[0] === 'shop' || segments[0] === 'catalog') && segments[1]) {
    return { view: 'stock', categorySlug: slugifyCategory(decodeSegment(segments.slice(1).join('/'))) };
  }
  if (segments.length === 1 && segments[0] === 'accessories') {
    return { view: 'stock', categorySlug: 'accessories' };
  }

  return { view: routeAliases[segments[0] || ''] || 'home' };
}

export function buildStorePath(view: string, productId?: string, category?: string): string {
  if (view === 'detail' && productId) return `/product/${encodeURIComponent(productId)}`;
  if (view === 'stock' || view === 'accessories') {
    const categorySlug = category && category !== 'All'
      ? slugifyCategory(category)
      : view === 'accessories' ? 'accessories' : '';
    return categorySlug ? `/shop/${categorySlug}` : '/shop';
  }

  const routes: Record<string, string> = {
    home: '/',
    checkout: '/enquiry',
    cart: '/enquiry',
    login: '/login',
    admin: '/admin',
    sales: '/sales',
    education: '/about',
    safety: '/policies',
    contact: '/contact',
  };
  return routes[view] || `/${view}`;
}
