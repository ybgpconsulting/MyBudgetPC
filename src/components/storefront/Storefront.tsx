import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownUp, ArrowLeft, ArrowRight, BadgeCheck, Check, ChevronDown, Cpu, HardDrive,
  Laptop, MapPin, Monitor, Mouse, PackageCheck, Phone, Plus, Search, ShieldCheck,
  ShoppingBag, SlidersHorizontal, Sparkles, Trash2, Truck, X, Zap,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { resolveImageUrl } from '../../api/client';
import { PhoneItem } from '../../types';
import { SITE_CONFIG, formatINR } from '../../config/siteConfig';
import {
  calculateCartSubtotal, CartLine, filterProducts, getAvailabilityLabel, getConditionGradeLabel,
  getProductVariant, isValidEnquiryPhone, isValidIndianPinCode, loadCart,
} from '../../utils/storefront';
import { buildCartEnquiryMessage, buildProductEnquiryMessage, createWhatsAppUrl } from '../../utils/whatsapp';
import { buildStorePath } from '../../utils/storeRoutes';

const CATEGORY_TILES = [
  { name: 'Laptops', icon: Laptop, hint: 'Portable computers' },
  { name: 'Desktop Computers', icon: Monitor, hint: 'Complete desktop systems' },
  { name: 'Custom PC Builds', icon: Cpu, hint: 'Configured to your needs' },
  { name: 'Components', icon: HardDrive, hint: 'Parts for your next build' },
  { name: 'Monitors', icon: Monitor, hint: 'Displays and accessories' },
  { name: 'Accessories', icon: Mouse, hint: 'Keyboards, mice and more' },
];

const emptyCustomer = {
  name: '',
  phone: '',
  deliveryPreference: 'delivery' as const,
  address: '',
  pinCode: '',
  notes: '',
};

function availableQuantity(product: PhoneItem): number {
  return product.availableQuantity ?? (product.status === 'Available' ? 1 : 0);
}

function ProductImage({ product, className = '' }: { product: PhoneItem; className?: string }) {
  const [failed, setFailed] = useState(false);
  const image = !failed ? resolveImageUrl(product.images[0] || '') : '/product-placeholder.svg';

  return (
    <img
      src={image || '/product-placeholder.svg'}
      alt={`${product.brand} ${product.model}`}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function Logo({ onClick }: { onClick: () => void }) {
  return (
    <a className="mbpc-brand" href="/" onClick={(event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      onClick();
    }} aria-label="My Budget PC home">
      <span className="mbpc-brand-mark" aria-hidden="true"><Cpu size={21} strokeWidth={2.2} /></span>
      <span className="mbpc-brand-type">
        <strong>my budget pc</strong>
        <small>COMPUTERS · COMPONENTS · MORE</small>
      </span>
    </a>
  );
}

function QuantityControl({
  value,
  max,
  onChange,
  label,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
}) {
  return (
    <div className="mbpc-quantity" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label={`Decrease ${label}`}>
        <span aria-hidden="true">−</span>
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Increase ${label}`}>
        <Plus size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

export const Storefront: React.FC = () => {
  const {
    phones, filters, setFilters, activeView, activeDetailId, setActiveView,
    loading, apiError, refreshPhones, isDemoCatalog,
  } = useInventory();
  const publicStoreLocation = [
    SITE_CONFIG.location.addressLine1,
    SITE_CONFIG.location.area,
    SITE_CONFIG.location.city,
    SITE_CONFIG.location.state,
    SITE_CONFIG.location.pincode,
  ].filter(Boolean).join(', ');
  const [cart, setCart] = useState<CartLine[]>(() => {
    try {
      return loadCart();
    } catch {
      return [];
    }
  });
  const [cartStorageWarning, setCartStorageWarning] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [customer, setCustomer] = useState(emptyCustomer);
  const [notice, setNotice] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let previousY = window.scrollY;
    let direction = 0;
    let directionStartY = previousY;

    const handleScroll = () => {
      const currentY = Math.max(0, window.scrollY);
      const delta = currentY - previousY;
      previousY = currentY;

      if (currentY <= 40) {
        direction = 0;
        directionStartY = currentY;
        setHeaderHidden(false);
        return;
      }

      if (delta === 0) return;
      const nextDirection = delta > 0 ? 1 : -1;
      if (nextDirection !== direction) {
        direction = nextDirection;
        directionStartY = currentY;
      }
      if (Math.abs(currentY - directionStartY) < 10) return;

      directionStartY = currentY;
      if (nextDirection < 0 || headerRef.current?.contains(document.activeElement)) {
        setHeaderHidden(false);
      } else {
        setHeaderHidden(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('my-budget-pc-cart-v1', JSON.stringify(cart));
      setCartStorageWarning(false);
    } catch {
      setCartStorageWarning(true);
    }
  }, [cart]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const categories = useMemo(() => {
    const availableCategories = new Set<string>(
      phones.map((product) => product.category).filter((category): category is string => Boolean(category)),
    );
    const preferred = CATEGORY_TILES.map((tile) => tile.name);
    return [
      ...preferred.filter((category) => category === 'Components'
        ? Array.from(availableCategories).some((item) => /component|processor|cpu|graphics|motherboard|memory|ram|storage|power supply|psu|cooling/i.test(item))
        : category === 'Desktop Computers'
          ? Array.from(availableCategories).some((item) => /desktop/i.test(item))
          : availableCategories.has(category)),
      ...Array.from(availableCategories).filter((category): category is string =>
        Boolean(category) && !preferred.includes(category),
      ).sort((a, b) => a.localeCompare(b)),
    ];
  }, [phones]);
  const brands = useMemo(() => Array.from(new Set<string>(phones
    .map((product) => product.brand)
    .filter((brand): brand is string => typeof brand === 'string' && brand.length > 0)))
    .sort((a, b) => a.localeCompare(b)), [phones]);

  const visibleProducts = useMemo(() => filterProducts(phones, {
    query: filters.searchQuery,
    category: filters.category,
    brand: filters.brand,
    condition: filters.condition,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sortBy: filters.sortBy,
    onlyAvailable: filters.onlyAvailable,
  }), [phones, filters]);

  const subtotal = calculateCartSubtotal(cart, phones);
  const cartCount = cart.reduce((total, line) => total + line.quantity, 0);
  const displayedCartCount = isDemoCatalog ? 0 : cartCount;
  const selectedProduct = phones.find((product) => product.id === activeDetailId);
  const isCatalog = activeView === 'stock' || activeView === 'accessories';
  const isCheckout = activeView === 'checkout';
  const isDetail = activeView === 'detail';

  const navigateHome = () => {
    setActiveView('home');
  };

  const setCatalogCategory = (category: string) => {
    setFilters((previous) => ({ ...previous, category }));
    setActiveView('stock', undefined, category);
  };

  const navigateCatalog = (category = 'All') => {
    setCatalogCategory(category);
    setCartOpen(false);
  };

  const navigateFromLink = (
    event: React.MouseEvent<HTMLAnchorElement>,
    view: string,
    phoneId?: string,
    category?: string,
  ) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setCartOpen(false);
    if (view === 'stock') setFilters(previous => ({ ...previous, category: category || 'All' }));
    setActiveView(view, phoneId, category);
  };

  const addToCart = (product: PhoneItem) => {
    if (isDemoCatalog) {
      setNotice('Demo products cannot be added to an enquiry.');
      return;
    }
    const stock = availableQuantity(product);
    if (product.status !== 'Available' || stock < 1) {
      setNotice('This product is not currently available to add.');
      return;
    }
    const existing = cart.find((line) => line.productId === product.id);
    if (existing?.quantity >= stock) {
      setNotice(`Only ${stock} available for this configuration.`);
      return;
    }
    setCart((previous) => {
      const line = previous.find((item) => item.productId === product.id);
      if (line) {
        return previous.map((item) => item.productId === product.id
          ? { ...item, quantity: Math.min(item.quantity + 1, stock) }
          : item);
      }
      return [...previous, { productId: product.id, quantity: 1 }];
    });
    setNotice('Added to your enquiry cart.');
  };

  const setQuantity = (productId: string, quantity: number) => {
    const product = phones.find((item) => item.id === productId);
    if (!product || quantity < 1) {
      setCart((previous) => previous.filter((line) => line.productId !== productId));
      return;
    }
    setCart((previous) => previous.map((line) => line.productId === productId
      ? { ...line, quantity: Math.min(quantity, availableQuantity(product)) }
      : line));
  };

  const updateFilter = (key: 'searchQuery' | 'category' | 'brand' | 'minPrice' | 'maxPrice' | 'sortBy' | 'onlyAvailable', value: string | number | boolean) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
  };
  const updateConditionFilter = (value: string) => {
    setFilters((previous) => ({ ...previous, condition: value ? [value] : [] }));
  };
  const clearCatalogFilters = () => setFilters((previous) => ({
    ...previous,
    searchQuery: '',
    category: 'All',
    brand: 'All',
    condition: [],
    minPrice: 0,
    maxPrice: Number.MAX_SAFE_INTEGER,
    onlyAvailable: false,
  }));
  const activeFilterCount = Number(filters.category !== 'All')
    + Number(filters.brand !== 'All')
    + Number(filters.condition.length > 0)
    + Number(filters.minPrice > 0)
    + Number(filters.maxPrice < Number.MAX_SAFE_INTEGER)
    + Number(filters.onlyAvailable);

  const productWhatsAppUrl = (product: PhoneItem, quantity = 1) => isDemoCatalog
    ? null
    : createWhatsAppUrl(
      buildProductEnquiryMessage(
        product,
        quantity,
        `${SITE_CONFIG.siteUrl || window.location.origin}/product/${encodeURIComponent(product.id)}`,
      ),
    );

  const cartWhatsAppUrl = isDemoCatalog ? null : createWhatsAppUrl(
    buildCartEnquiryMessage(cart, phones, customer, SITE_CONFIG.siteUrl || window.location.origin),
  );

  const canSubmitCustomer = customer.name.trim().length > 0
    && isValidEnquiryPhone(customer.phone)
    && (customer.deliveryPreference === 'pickup'
      || (customer.address.trim().length > 0 && isValidIndianPinCode(customer.pinCode)));
  const unavailableCartLine = cart.some((line) => {
    const product = phones.find((item) => item.id === line.productId);
    return !product || product.status !== 'Available' || line.quantity > availableQuantity(product);
  });

  const productCards = (products: PhoneItem[]) => products.map((product) => {
    const stock = availableQuantity(product);
    const line = cart.find((item) => item.productId === product.id);
    const whatsappUrl = productWhatsAppUrl(product);
    return (
      <article key={product.id} className="mbpc-product-card">
        <a
          className="mbpc-product-image"
          href={buildStorePath('detail', product.id)}
          onClick={(event) => navigateFromLink(event, 'detail', product.id)}
          aria-label={`View ${product.brand} ${product.model}`}
        >
          <ProductImage product={product} className="h-full w-full object-contain" />
          <div className="mbpc-badge-stack">
            {isDemoCatalog ? (
              <span className="mbpc-product-badge mbpc-demo-product-badge">Demo sample</span>
            ) : (
              <>
                {product.featured && <span className="mbpc-product-badge mbpc-badge-featured">Featured</span>}
                {product.priceDrop && <span className="mbpc-product-badge mbpc-badge-pricedrop">Price drop</span>}
              </>
            )}
          </div>
        </a>
        <div className="mbpc-product-body">
          <div className="mbpc-product-meta-row">
            <p className="mbpc-product-category">{product.category || 'Computer equipment'}</p>
            <span className="mbpc-condition-chip">{getConditionGradeLabel(product.condition)}</span>
          </div>
          <a className="mbpc-product-name" href={buildStorePath('detail', product.id)} onClick={(event) => navigateFromLink(event, 'detail', product.id)}>
            {product.brand} {product.model}
          </a>
          <p className="mbpc-product-variant">{getProductVariant(product)}</p>
          {(product.processor || product.ram || (product.storage && product.storage !== 'N/A')) && (
            <div className="mbpc-spec-chips" aria-label="Key specifications">
              {product.processor && <span className="mbpc-spec-chip" title={product.processor}>{product.processor}</span>}
              {product.ram && <span className="mbpc-spec-chip">{product.ram}</span>}
              {product.storage && product.storage !== 'N/A' && <span className="mbpc-spec-chip">{product.storage}</span>}
            </div>
          )}
          <div className="mbpc-product-price-row">
            <div className="mbpc-product-price">
              {isDemoCatalog ? (
                <><span className="mbpc-demo-price-label">Demo estimate</span> {formatINR(product.price)}</>
              ) : product.price > 0 ? (
                <>
                  <span>{formatINR(product.price)}</span>
                  {product.originalMsp && product.originalMsp > product.price && (
                    <del className="mbpc-price-msp">{formatINR(product.originalMsp)}</del>
                  )}
                </>
              ) : (
                <span className="mbpc-price-pending">Price on request</span>
              )}
            </div>
            <p className={`mbpc-stock ${stock > 0 ? 'is-available' : 'is-unavailable'}`}>
              <span className="mbpc-stock-dot" aria-hidden="true" />
              {isDemoCatalog ? 'Sample quantity only · no live stock' : getAvailabilityLabel(product)}
            </p>
          </div>
          <div className="mbpc-product-actions">
            <button type="button" className="mbpc-button mbpc-button-primary" onClick={() => addToCart(product)} disabled={isDemoCatalog || stock < 1}>
              <ShoppingBag size={15} aria-hidden="true" /> {isDemoCatalog ? 'Demo only' : 'Add to enquiry'}
            </button>
            {whatsappUrl
              ? <a className="mbpc-button mbpc-button-secondary" href={whatsappUrl} target="_blank" rel="noopener noreferrer">Ask on WhatsApp</a>
              : <button type="button" className="mbpc-button mbpc-button-secondary" disabled title={isDemoCatalog ? 'Demo products cannot be enquired about' : 'WhatsApp contact has not been configured'}>{isDemoCatalog ? 'Demo only' : 'WhatsApp unavailable'}</button>}
          </div>
          {line && <span className="sr-only">{line.quantity} in enquiry cart</span>}
        </div>
      </article>
    );
  });

  const renderCatalog = () => (
    <>
      <section className="mbpc-page-heading">
        <div>
          <p className="mbpc-eyebrow">MY BUDGET PC CATALOGUE</p>
          <h1>Find the right fit for your setup.</h1>
          <p>Browse current listings. Product availability and final pricing are confirmed by the store.</p>
        </div>
        <button type="button" className="mbpc-button mbpc-button-secondary mbpc-mobile-filter-trigger" onClick={() => setFilterOpen(true)}>
          <SlidersHorizontal size={17} aria-hidden="true" /> Filters
        </button>
      </section>
      <section className="mbpc-catalog-toolbar" aria-label="Catalogue controls">
        <label className="mbpc-search mbpc-catalog-search">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Search products</span>
          <input ref={searchRef} value={filters.searchQuery} onChange={(event) => updateFilter('searchQuery', event.target.value)} placeholder="Search laptops, components, models…" />
          {filters.searchQuery && <button type="button" onClick={() => updateFilter('searchQuery', '')} aria-label="Clear search"><X size={16} /></button>}
        </label>
        <label className="mbpc-sort">
          <ArrowDownUp size={16} aria-hidden="true" />
          <span className="sr-only">Sort products</span>
          <select value={filters.sortBy} onChange={(event) => updateFilter('sortBy', event.target.value)}>
            <option value="featured">Featured first</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="newest">Recently added</option>
          </select>
          <ChevronDown size={15} aria-hidden="true" />
        </label>
      </section>
      <section className="mbpc-catalog-filter-row" aria-label="Additional catalogue filters">
        <label className="mbpc-filter-label">
          Brand
          <select value={filters.brand} onChange={(event) => updateFilter('brand', event.target.value)}>
            <option value="All">All brands</option>
            {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
          </select>
        </label>
        <label className="mbpc-filter-label">
          Condition grade
          <select value={filters.condition[0] || ''} onChange={(event) => updateConditionFilter(event.target.value)}>
            <option value="">All grades</option>
            <option value="A+">Grade A+</option>
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
          </select>
        </label>
        <label className="mbpc-filter-label">
          Minimum price
          <input type="number" min="0" step="1" value={filters.minPrice || ''} onChange={(event) => updateFilter('minPrice', Number(event.target.value) || 0)} />
        </label>
        <label className="mbpc-filter-label">
          Maximum price
          <input type="number" min="0" step="1" value={filters.maxPrice === Number.MAX_SAFE_INTEGER ? '' : filters.maxPrice} placeholder="No limit" onChange={(event) => updateFilter('maxPrice', Number(event.target.value) || Number.MAX_SAFE_INTEGER)} />
        </label>
        <label className="mbpc-checkbox mbpc-desktop-availability"><input type="checkbox" checked={filters.onlyAvailable} onChange={(event) => updateFilter('onlyAvailable', event.target.checked)} />Available only</label>
        {activeFilterCount > 0 && <button type="button" className="mbpc-text-link mbpc-clear-filters" onClick={clearCatalogFilters}>Clear filters ({activeFilterCount})</button>}
      </section>
      <p className="mbpc-result-count" aria-live="polite">
        {loading ? 'Loading products…' : `${visibleProducts.length} ${visibleProducts.length === 1 ? 'product' : 'products'}${filters.searchQuery ? ` matching “${filters.searchQuery}”` : ''}`}
      </p>
      <div className="mbpc-category-pills" aria-label="Filter by category">
        <button type="button" className={filters.category === 'All' ? 'is-selected' : ''} onClick={() => navigateCatalog()}>All products</button>
        {categories.map((category) => (
          <button key={category} type="button" className={filters.category === category ? 'is-selected' : ''} onClick={() => setCatalogCategory(category)}>{category}</button>
        ))}
      </div>
      {visibleProducts.length > 0
        ? <section className="mbpc-product-grid" aria-live="polite">{productCards(visibleProducts)}</section>
        : apiError || loading || phones.length === 0
          ? <EmptyState loading={loading} apiError={apiError} onRetry={refreshPhones} onClear={() => navigateCatalog()} />
          : <section className="mbpc-empty-state" aria-live="polite">
            <Search size={38} aria-hidden="true" />
            <h2>No matching products</h2>
            <p>Try changing your search or filters to see more listings.</p>
            <button type="button" className="mbpc-button mbpc-button-secondary" onClick={clearCatalogFilters}>Clear search and filters</button>
          </section>}
    </>
  );

  const renderProductDetail = () => {
    if (!selectedProduct) {
      return (
        <section className="mbpc-empty-state">
          <PackageCheck size={38} aria-hidden="true" />
          <h1>Product listing unavailable</h1>
          <p>This listing may have been removed or is not available right now.</p>
          <button type="button" className="mbpc-button mbpc-button-primary" onClick={() => navigateCatalog()}>Back to catalogue</button>
        </section>
      );
    }
    const variants = phones.filter((product) => product.brand === selectedProduct.brand && product.model === selectedProduct.model);
    const whatsappUrl = productWhatsAppUrl(selectedProduct);
    const stock = availableQuantity(selectedProduct);
    const details = [
      ['SKU / model', selectedProduct.stockTag || selectedProduct.id],
      ['Category', selectedProduct.category || 'Computer equipment'],
      ['Configuration', getProductVariant(selectedProduct)],
      ['Display', selectedProduct.screenSize],
      ['Condition grade', getConditionGradeLabel(selectedProduct.condition)],
    ].filter((entry): entry is [string, string] => Boolean(entry[1]));
    return (
      <>
        <nav className="mbpc-breadcrumb" aria-label="Breadcrumb">
          <button type="button" onClick={navigateHome}>Home</button><span>/</span>
          <button type="button" onClick={() => navigateCatalog(selectedProduct.category || 'All')}>Catalogue</button><span>/</span>
          <span aria-current="page">{selectedProduct.brand} {selectedProduct.model}</span>
        </nav>
        <section className="mbpc-detail-layout">
          <div className="mbpc-detail-image"><ProductImage product={selectedProduct} className="h-full w-full object-contain" /></div>
          <div className="mbpc-detail-copy">
            <p className="mbpc-eyebrow">{selectedProduct.category || 'COMPUTER EQUIPMENT'}</p>
            <h1>{selectedProduct.brand} {selectedProduct.model}</h1>
            <p className="mbpc-detail-variant">{getProductVariant(selectedProduct)}</p>
            <span className="mbpc-condition-chip mbpc-detail-condition">{getConditionGradeLabel(selectedProduct.condition)}</span>
            <p className="mbpc-detail-price">{isDemoCatalog ? `Demo estimate · ${formatINR(selectedProduct.price)}` : selectedProduct.price > 0 ? formatINR(selectedProduct.price) : 'Price on request'}</p>
            <p className={`mbpc-stock ${stock > 0 ? 'is-available' : 'is-unavailable'}`}>
              {isDemoCatalog ? 'Sample listing only · no live inventory' : stock > 0 ? `${getAvailabilityLabel(selectedProduct)} to enquire` : getAvailabilityLabel(selectedProduct)}
            </p>
            {variants.length > 1 && (
              <label className="mbpc-variant-select">
                Available configurations
                <select value={selectedProduct.id} onChange={(event) => setActiveView('detail', event.target.value)}>
                  {variants.map((variant) => <option key={variant.id} value={variant.id}>{getProductVariant(variant)} — {variant.price > 0 ? formatINR(variant.price) : 'Price on request'}</option>)}
                </select>
              </label>
            )}
            {selectedProduct.conditionDescription && <p className="mbpc-description">{selectedProduct.conditionDescription}</p>}
            <dl className="mbpc-spec-list">
              {details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
            {selectedProduct.keyFeatures.length > 0 && (
              <div className="mbpc-highlights">
                <h2>Product highlights</h2>
                <ul>{selectedProduct.keyFeatures.map((feature) => <li key={feature}><Check size={15} aria-hidden="true" />{feature}</li>)}</ul>
              </div>
            )}
            {(Object.entries({
              'Charger included': selectedProduct.inBox.chargerIncluded,
              'Original box included': selectedProduct.inBox.originalBox,
              'Tax invoice provided': selectedProduct.inBox.taxInvoiceProvided,
              'Cable included': selectedProduct.inBox.cableIncluded,
              'Warranty applicable': selectedProduct.inBox.warrantyApplicable,
            }).some(([, included]) => included) || isDemoCatalog) && (
              <div className="mbpc-highlights">
                <h2>Included with this listing</h2>
                <ul>
                  {Object.entries({
                    'Charger included': selectedProduct.inBox.chargerIncluded,
                    'Original box included': selectedProduct.inBox.originalBox,
                    'Tax invoice provided': selectedProduct.inBox.taxInvoiceProvided,
                    'Cable included': selectedProduct.inBox.cableIncluded,
                    'Warranty applicable': selectedProduct.inBox.warrantyApplicable,
                  }).filter(([, included]) => included).map(([label]) => (
                    <li key={label}><Check size={15} aria-hidden="true" />{label}</li>
                  ))}
                  {isDemoCatalog && !Object.values(selectedProduct.inBox).some(Boolean)
                    && <li>No included items are specified in this sample.</li>}
                </ul>
              </div>
            )}
            <div className="mbpc-detail-actions">
              <button type="button" className="mbpc-button mbpc-button-primary" disabled={isDemoCatalog || stock < 1} onClick={() => addToCart(selectedProduct)}>
                <ShoppingBag size={17} aria-hidden="true" /> {isDemoCatalog ? 'Demo only' : 'Add to enquiry cart'}
              </button>
              {whatsappUrl
                ? <a className="mbpc-button mbpc-button-secondary" href={whatsappUrl} target="_blank" rel="noopener noreferrer">Enquire on WhatsApp</a>
                : <p className="mbpc-contact-missing">{isDemoCatalog ? 'Demo products cannot be enquired about.' : 'WhatsApp enquiries are unavailable until the store contact number is configured.'}</p>}
            </div>
            <p className="mbpc-disclaimer"><ShieldCheck size={16} aria-hidden="true" />{isDemoCatalog ? 'All sample names, descriptions, specifications, prices and quantities are fictional and not for sale.' : 'Availability and final pricing are confirmed by the store before purchase.'}</p>
          </div>
        </section>
        {!isDemoCatalog && <div className="mbpc-mobile-purchase-bar">
          <strong>{selectedProduct.price > 0 ? formatINR(selectedProduct.price) : 'Price on request'}</strong>
          <button type="button" className="mbpc-button mbpc-button-primary" disabled={stock < 1} onClick={() => addToCart(selectedProduct)}>Add to enquiry</button>
        </div>}
      </>
    );
  };

  const renderCartLine = (line: CartLine, compact = false) => {
    const product = phones.find((item) => item.id === line.productId);
    const stock = product ? availableQuantity(product) : 0;
    if (!product) {
      return (
        <div key={line.productId} className="mbpc-cart-line is-unavailable">
          <div><strong>Product no longer listed</strong><small>SKU / model: {line.productId}</small><span className="mbpc-stock is-unavailable">Remove this item to continue.</span></div>
          <button type="button" className="mbpc-icon-button" aria-label="Remove unavailable product" onClick={() => setQuantity(line.productId, 0)}><Trash2 size={17} /></button>
        </div>
      );
    }
    const available = product.status === 'Available' && line.quantity <= stock;
    return (
      <div key={line.productId} className={`mbpc-cart-line ${!available ? 'is-unavailable' : ''}`}>
        {!compact && <ProductImage product={product} className="mbpc-cart-thumb" />}
        <div className="mbpc-cart-line-copy">
          <strong>{product.brand} {product.model}</strong>
          <small>{getProductVariant(product)}</small>
          <small>SKU / model: {product.stockTag || product.id}</small>
          <span className="mbpc-cart-price">{product.price > 0 ? formatINR(product.price * line.quantity) : 'Price pending confirmation'}</span>
          {!available && <span className="mbpc-stock is-unavailable">Availability or quantity needs confirmation.</span>}
          <div className="mbpc-cart-line-controls">
            <QuantityControl
              value={line.quantity}
              max={Math.max(stock, 1)}
              label={`quantity for ${product.model}`}
              onChange={(quantity) => setQuantity(product.id, quantity)}
            />
            <button type="button" className="mbpc-remove-button" onClick={() => setQuantity(product.id, 0)}>Remove</button>
          </div>
        </div>
      </div>
    );
  };

  const renderCheckout = () => (
    <section className="mbpc-checkout">
      <div className="mbpc-checkout-header">
        <button type="button" className="mbpc-back-link" onClick={() => setActiveView('stock')}><ArrowLeft size={16} /> Back to catalogue</button>
        <p className="mbpc-eyebrow">{isDemoCatalog ? 'DEMO MODE' : 'REVIEW BEFORE WHATSAPP'}</p>
        <h1>{isDemoCatalog ? 'Sample catalogue' : 'Review your enquiry'}</h1>
        <p>{isDemoCatalog ? 'This read-only catalogue is for demonstration. Sample items cannot be purchased or enquired about.' : 'Check your items and details. WhatsApp will open with a pre-filled message; you must send it yourself.'}</p>
      </div>
      {isDemoCatalog ? (
        <section className="mbpc-empty-state mbpc-demo-notice" role="status">
          <PackageCheck size={36} aria-hidden="true" />
          <h2>Demo catalogue is read-only</h2>
          <p>These example products, prices and quantities are fictional. Cart and WhatsApp enquiries are disabled in demo mode.</p>
          <button type="button" className="mbpc-button mbpc-button-primary" onClick={() => navigateCatalog()}>Browse demo products</button>
        </section>
      ) : cart.length === 0 ? (
        <section className="mbpc-empty-state">
          <ShoppingBag size={36} aria-hidden="true" />
          <h2>Your enquiry cart is empty</h2>
          <p>Add products to review them here.</p>
          <button type="button" className="mbpc-button mbpc-button-primary" onClick={() => navigateCatalog()}>Browse products</button>
        </section>
      ) : (
        <div className="mbpc-checkout-grid">
          <section className="mbpc-checkout-panel" aria-labelledby="items-heading">
            <div className="mbpc-panel-heading"><h2 id="items-heading">Items <span>({cartCount})</span></h2></div>
            <div className="mbpc-cart-lines">{cart.map((line) => renderCartLine(line))}</div>
            <div className="mbpc-subtotal">
              <span>Cart subtotal</span>
              <strong>{subtotal === null ? 'Pending price confirmation' : formatINR(subtotal)}</strong>
            </div>
            <p className="mbpc-price-note">Delivery charges are not included and will be confirmed by the store.</p>
          </section>
          <form className="mbpc-checkout-panel mbpc-customer-form" onSubmit={(event) => event.preventDefault()}>
            <div className="mbpc-panel-heading"><h2>Your details</h2><span>Required for the enquiry</span></div>
            <label>Full name<input autoComplete="name" required value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} /></label>
            <label>Phone number<input type="tel" autoComplete="tel" required minLength={7} maxLength={20} pattern="[+()0-9 -]{7,20}" value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} />
              {customer.phone && !isValidEnquiryPhone(customer.phone) && <small className="mbpc-field-hint" role="alert">Enter a phone number containing 7–15 digits.</small>}
            </label>
            <fieldset>
              <legend>Delivery or pickup</legend>
              <label className="mbpc-radio"><input type="radio" name="delivery" checked={customer.deliveryPreference === 'delivery'} onChange={() => setCustomer({ ...customer, deliveryPreference: 'delivery' })} /><Truck size={16} /> Delivery</label>
              <label className="mbpc-radio"><input type="radio" name="delivery" checked={customer.deliveryPreference === 'pickup'} onChange={() => setCustomer({ ...customer, deliveryPreference: 'pickup' })} /><PackageCheck size={16} /> Pickup</label>
            </fieldset>
            {customer.deliveryPreference === 'delivery' && (
              <div className="mbpc-address-fields">
                <label>Delivery address<input autoComplete="street-address" required value={customer.address} onChange={(event) => setCustomer({ ...customer, address: event.target.value })} /></label>
                <label>PIN code<input autoComplete="postal-code" inputMode="numeric" required minLength={6} maxLength={6} pattern="[0-9]{6}" value={customer.pinCode} onChange={(event) => setCustomer({ ...customer, pinCode: event.target.value })} />
                  {customer.pinCode && !isValidIndianPinCode(customer.pinCode) && <small className="mbpc-field-hint" role="alert">Enter a valid six-digit PIN code.</small>}
                </label>
                <small>Delivery charges will be confirmed by the store.</small>
              </div>
            )}
            <label>Additional notes <span className="mbpc-optional">(optional)</span><textarea rows={3} value={customer.notes} onChange={(event) => setCustomer({ ...customer, notes: event.target.value })} /></label>
            {unavailableCartLine && <p className="mbpc-form-warning" role="alert">One or more items are unavailable or have changed quantity. Remove or update them before continuing.</p>}
            {cartWhatsAppUrl && canSubmitCustomer && !unavailableCartLine
              ? <a className="mbpc-button mbpc-button-whatsapp mbpc-submit-enquiry" href={cartWhatsAppUrl} target="_blank" rel="noopener noreferrer">Continue to WhatsApp <ArrowRight size={17} aria-hidden="true" /></a>
              : <button type="button" className="mbpc-button mbpc-button-whatsapp mbpc-submit-enquiry" disabled>
                {cartWhatsAppUrl ? 'Complete details to continue' : 'WhatsApp contact not configured'}
              </button>}
            <p className="mbpc-whatsapp-note">Opening WhatsApp does not send a message or confirm an order. Review the message and tap Send in WhatsApp.</p>
          </form>
        </div>
      )}
    </section>
  );

  return (
    <div className="mbpc-app">
      <a className="mbpc-skip-link" href="#main-content">Skip to content</a>
      <div className="mbpc-topbar">
        <div className="mbpc-topbar-inner">
          <span>✦ Refurbished computers & components</span>
          <span className="mbpc-topbar-sep">•</span>
          <span>Direct WhatsApp enquiries</span>
          <span className="mbpc-topbar-sep">•</span>
          <span>No online payment required</span>
        </div>
      </div>
      <header ref={headerRef} className={`mbpc-header${headerHidden ? ' is-scroll-hidden' : ''}`}>
        <div className="mbpc-header-inner">
          <Logo onClick={navigateHome} />
          <nav className="mbpc-desktop-nav" aria-label="Main navigation">
            <a href="/" className={activeView === 'home' ? 'is-active' : ''} aria-current={activeView === 'home' ? 'page' : undefined} onClick={(event) => navigateFromLink(event, 'home')}>Home</a>
            <a href="/shop" className={isCatalog && filters.category === 'All' ? 'is-active' : ''} aria-current={isCatalog && filters.category === 'All' ? 'page' : undefined} onClick={(event) => navigateFromLink(event, 'stock')}>Shop all</a>
            <a href={buildStorePath('stock', undefined, 'Laptops')} className={isCatalog && filters.category === 'Laptops' ? 'is-active' : ''} aria-current={isCatalog && filters.category === 'Laptops' ? 'page' : undefined} onClick={(event) => navigateFromLink(event, 'stock', undefined, 'Laptops')}>Laptops</a>
            <a href={buildStorePath('stock', undefined, 'Desktop Computers')} className={isCatalog && filters.category === 'Desktop Computers' ? 'is-active' : ''} aria-current={isCatalog && filters.category === 'Desktop Computers' ? 'page' : undefined} onClick={(event) => navigateFromLink(event, 'stock', undefined, 'Desktop Computers')}>Desktops</a>
            <a href={buildStorePath('stock', undefined, 'Components')} className={isCatalog && filters.category === 'Components' ? 'is-active' : ''} aria-current={isCatalog && filters.category === 'Components' ? 'page' : undefined} onClick={(event) => navigateFromLink(event, 'stock', undefined, 'Components')}>Components</a>
            <a href="/enquiry" className={isCheckout ? 'is-active' : ''} aria-current={isCheckout ? 'page' : undefined} onClick={(event) => navigateFromLink(event, 'checkout')}>Enquiry</a>
          </nav>
          <div className="mbpc-header-actions">
            <button type="button" className="mbpc-header-search" onClick={() => {
              if (!isCatalog) navigateCatalog();
              window.setTimeout(() => searchRef.current?.focus(), 0);
            }} aria-label="Search products"><Search size={19} /></button>
            <button type="button" className="mbpc-cart-trigger" onClick={() => setCartOpen(true)} aria-label={`Open enquiry cart, ${displayedCartCount} items`}>
              <ShoppingBag size={18} /><span className="mbpc-cart-trigger-text">Enquiry cart</span>
              <span className="mbpc-cart-count">{displayedCartCount}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mbpc-main" id="main-content">
        {isDemoCatalog && (
          <aside className="mbpc-demo-banner" role="status">
            <strong>DEMO CATALOGUE</strong>
            <span>Sample products, specifications, prices and quantities are fictional; images are representative. Nothing shown is real stock or for sale.</span>
          </aside>
        )}
        {isCheckout ? renderCheckout() : isDetail ? renderProductDetail() : isCatalog ? renderCatalog() : (
          <>
            <section className="mbpc-hero">
              <div className="mbpc-hero-copy">
                <span className="mbpc-hero-kicker">
                  <Sparkles size={13} aria-hidden="true" />
                  <span>Refurbished computers & components</span>
                </span>
                <h1>Refurbished tech.<br /><span>Engineered for performance.</span></h1>
                <p>Browse rigorously inspected laptops, desktops, components and peripherals. Compare transparent condition grades and verified specs, then enquire directly with our store team on WhatsApp.</p>
                <div className="mbpc-hero-actions">
                  <button type="button" className="mbpc-button mbpc-button-light" onClick={() => navigateCatalog()}>
                    Explore the catalogue <ArrowRight size={17} />
                  </button>
                  <span className="mbpc-hero-guarantee"><ShieldCheck size={16} /> No online payment required</span>
                </div>
                <div className="mbpc-hero-trust-pills">
                  <span><BadgeCheck size={13} /> 40-Point Diagnostics</span>
                  <span><Zap size={13} /> Verified Thermals & Battery</span>
                  <span><Check size={13} /> Honest Grading</span>
                </div>
              </div>
              <div className="mbpc-hero-art" aria-label="Laptop computer on a desk">
                <img src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1400&q=85" alt="Laptop computer on a desk" />
                <div className="mbpc-hero-floating-badge">
                  <span className="mbpc-pulse-dot" />
                  <div>
                    <strong>Verified Hardware</strong>
                    <small>Tested & ready for dispatch</small>
                  </div>
                </div>
                <div className="mbpc-hero-art-caption"><span>MY BUDGET PC</span><strong>Build around what matters.</strong></div>
              </div>
              <div className="mbpc-hero-footnote">Product information and pricing are confirmed directly with the store.</div>
            </section>

            <section className="mbpc-trust-row" aria-label="Shopping information">
              <div className="mbpc-trust-item">
                <span className="mbpc-trust-icon"><ShieldCheck size={20} aria-hidden="true" /></span>
                <div><strong>Know the condition</strong><small>Every listing includes an honest condition grade.</small></div>
              </div>
              <div className="mbpc-trust-item">
                <span className="mbpc-trust-icon"><PackageCheck size={20} aria-hidden="true" /></span>
                <div><strong>Check current availability</strong><small>Confirm live stock and specs directly with the store.</small></div>
              </div>
              <div className="mbpc-trust-item">
                <span className="mbpc-trust-icon"><Phone size={20} aria-hidden="true" /></span>
                <div><strong>Enquire with confidence</strong><small>Get answers on WhatsApp before you decide.</small></div>
              </div>
            </section>

            <section className="mbpc-section mbpc-categories">
              <div className="mbpc-section-heading">
                <div><p className="mbpc-eyebrow">EXPLORE BY CATEGORY</p><h2>Make your setup yours.</h2></div>
                <button type="button" className="mbpc-text-link" onClick={() => navigateCatalog()}>View all products <ArrowRight size={16} /></button>
              </div>
              <div className="mbpc-category-grid">
                {CATEGORY_TILES.map(({ name, icon: Icon, hint }, index) => (
                  <button key={name} type="button" className="mbpc-category-card" onClick={() => navigateCatalog(name)}>
                    <span className={`mbpc-category-icon category-${index}`}><Icon size={22} strokeWidth={1.8} /></span>
                    <span className="mbpc-category-card-text"><strong>{name}</strong><small>{hint}</small></span>
                    <ArrowRight className="mbpc-category-arrow" size={17} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </section>

            <section className="mbpc-section mbpc-featured">
              <div className="mbpc-section-heading">
                <div><p className="mbpc-eyebrow">CURRENT LISTINGS</p><h2>Products to explore.</h2></div>
                {phones.length > 0 && <button type="button" className="mbpc-text-link" onClick={() => navigateCatalog()}>Browse all {phones.length} <ArrowRight size={16} /></button>}
              </div>
              {loading && phones.length === 0
                ? <div className="mbpc-loading" role="status"><span className="mbpc-spinner" />Loading current listings…</div>
                : phones.length > 0
                  ? <div className="mbpc-product-grid">{productCards(phones.filter((item) => item.featured || item.status === 'Available').slice(0, 4))}</div>
                  : <EmptyState loading={loading} apiError={apiError} onRetry={refreshPhones} onClear={() => navigateCatalog()} />}
            </section>

            <section className="mbpc-service-strip">
              <div className="mbpc-service-mark"><PackageCheck size={23} /></div>
              <div><h2>Need help choosing?</h2><p>Share what you need in your enquiry and the store can help confirm availability and pricing.</p></div>
              <button type="button" className="mbpc-button mbpc-button-secondary" onClick={() => navigateCatalog()}>Start browsing <ArrowRight size={16} /></button>
            </section>
          </>
        )}
      </main>

      <footer className="mbpc-footer">
        <div className="mbpc-footer-main">
          <div><Logo onClick={navigateHome} /><p>{SITE_CONFIG.tagline}</p></div>
          <div className="mbpc-footer-links"><strong>Explore</strong><button type="button" onClick={navigateHome}>Home</button><button type="button" onClick={() => navigateCatalog()}>All products</button><button type="button" onClick={() => setActiveView('login')}>Staff sign in</button></div>
          <div className="mbpc-footer-contact">
            <strong>Contact & visit</strong>
            {SITE_CONFIG.callingNumber && (
              <a href={`tel:${SITE_CONFIG.callingNumber}`}><Phone size={15} aria-hidden="true" />{SITE_CONFIG.displayPhone}</a>
            )}
            {publicStoreLocation && (
              <span><MapPin size={15} aria-hidden="true" />{publicStoreLocation}</span>
            )}
            {SITE_CONFIG.location.googleMapsSearchUrl && (
              <a href={SITE_CONFIG.location.googleMapsSearchUrl} target="_blank" rel="noopener noreferrer">
                View location in Google Maps <ArrowRight size={14} aria-hidden="true" />
              </a>
            )}
            {!SITE_CONFIG.callingNumber && !publicStoreLocation && !SITE_CONFIG.location.googleMapsSearchUrl && (
              <span>Contact details will be published after the store confirms them.</span>
            )}
          </div>
          <div className="mbpc-footer-note"><strong>Before you enquire</strong><p>Availability, delivery options, charges and final pricing are confirmed by the store. A WhatsApp message is not an order confirmation.</p></div>
        </div>
        <div className="mbpc-footer-bottom">
          <small className="mbpc-footer-legal">© {new Date().getFullYear()} {SITE_CONFIG.storeName}. All rights reserved.</small>
          <div className="mbpc-footer-ybgp">
            <div className="mbpc-footer-credit-copy">
              <strong>Looking to grow your business?</strong>
              <span>Designed and developed by YBGP</span>
            </div>
            <a className="mbpc-footer-credit" href="https://ybgp.in/" target="_blank" rel="noopener noreferrer" aria-label="Visit YBGP, the team behind this website, opens in a new tab">
              <img src="/YBGP_logo.png" alt="YBGP" loading="lazy" />
            </a>
          </div>
        </div>
      </footer>

      <nav className="mbpc-bottom-nav" aria-label="Quick navigation">
        <button type="button" className={!isCatalog && !isDetail && !isCheckout ? 'is-active' : ''} onClick={navigateHome}><Cpu size={19} /><span>Home</span></button>
        <button type="button" className={isCatalog ? 'is-active' : ''} onClick={() => navigateCatalog()}><Search size={19} /><span>Explore</span></button>
        <button type="button" className={isCheckout ? 'is-active' : ''} onClick={() => { setCartOpen(false); setActiveView('checkout'); }}><ShoppingBag size={19} /><span>Enquiry</span><i>{displayedCartCount}</i></button>
      </nav>

      {notice && <div className="mbpc-toast" role="status">{notice}</div>}
      {cartStorageWarning && <div className="mbpc-storage-warning" role="status">Cart changes may not persist in this browser session.</div>}

      {cartOpen && (
        <div className="mbpc-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}>
          <aside className="mbpc-cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
            <div className="mbpc-drawer-header"><div><p className="mbpc-eyebrow">YOUR SELECTION</p><h2 id="cart-title">Enquiry cart <span>({displayedCartCount})</span></h2></div><button type="button" className="mbpc-icon-button" onClick={() => setCartOpen(false)} aria-label="Close cart"><X size={20} /></button></div>
            {isDemoCatalog
              ? <div className="mbpc-drawer-empty"><PackageCheck size={30} /><p>Demo mode is read-only. Sample products cannot be added to an enquiry.</p></div>
              : cart.length > 0
              ? <div className="mbpc-drawer-lines">{cart.map((line) => renderCartLine(line, true))}</div>
              : <div className="mbpc-drawer-empty"><ShoppingBag size={30} /><p>Your cart is ready for its first product.</p><button type="button" className="mbpc-text-link" onClick={() => { setCartOpen(false); navigateCatalog(); }}>Explore products <ArrowRight size={15} /></button></div>}
            <div className="mbpc-drawer-bottom">
              {!isDemoCatalog && <div className="mbpc-subtotal"><span>Subtotal</span><strong>{subtotal === null ? 'Pending confirmation' : formatINR(subtotal)}</strong></div>}
              <p>{isDemoCatalog ? 'Switch off demo mode to use the live catalogue and enquiry flow.' : 'Final prices and availability are confirmed by the store.'}</p>
              <button type="button" className="mbpc-button mbpc-button-primary mbpc-review-button" disabled={isDemoCatalog || cart.length === 0} onClick={() => { setCartOpen(false); setActiveView('checkout'); }}>Review enquiry <ArrowRight size={17} /></button>
            </div>
          </aside>
        </div>
      )}

      {filterOpen && (
        <div className="mbpc-overlay mbpc-filter-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setFilterOpen(false); }}>
          <section className="mbpc-filter-sheet" role="dialog" aria-modal="true" aria-labelledby="filter-title">
            <div className="mbpc-drawer-header"><h2 id="filter-title">Filters</h2><button type="button" className="mbpc-icon-button" onClick={() => setFilterOpen(false)} aria-label="Close filters"><X size={20} /></button></div>
            <label className="mbpc-filter-label">Category<select value={filters.category} onChange={(event) => setCatalogCategory(event.target.value)}><option value="All">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label className="mbpc-filter-label">Brand<select value={filters.brand} onChange={(event) => updateFilter('brand', event.target.value)}><option value="All">All brands</option>{brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}</select></label>
            <label className="mbpc-filter-label">Condition grade<select value={filters.condition[0] || ''} onChange={(event) => updateConditionFilter(event.target.value)}><option value="">All grades</option><option value="A+">Grade A+</option><option value="A">Grade A</option><option value="B">Grade B</option><option value="C">Grade C</option></select></label>
            <div className="mbpc-price-filters"><label className="mbpc-filter-label">Minimum price<input type="number" min="0" step="1" value={filters.minPrice || ''} onChange={(event) => updateFilter('minPrice', Number(event.target.value) || 0)} /></label><label className="mbpc-filter-label">Maximum price<input type="number" min="0" step="1" value={filters.maxPrice === Number.MAX_SAFE_INTEGER ? '' : filters.maxPrice} placeholder="No limit" onChange={(event) => updateFilter('maxPrice', Number(event.target.value) || Number.MAX_SAFE_INTEGER)} /></label></div>
            <label className="mbpc-checkbox"><input type="checkbox" checked={filters.onlyAvailable} onChange={(event) => updateFilter('onlyAvailable', event.target.checked)} />Show currently available only</label>
            {activeFilterCount > 0 && <button type="button" className="mbpc-text-link" onClick={clearCatalogFilters}>Clear filters ({activeFilterCount})</button>}
            <button type="button" className="mbpc-button mbpc-button-primary mbpc-review-button" onClick={() => setFilterOpen(false)}>Show products <ArrowRight size={16} /></button>
          </section>
        </div>
      )}
    </div>
  );
};

function EmptyState({
  loading,
  apiError,
  onRetry,
  onClear,
}: {
  loading: boolean;
  apiError: string | null;
  onRetry: () => void;
  onClear: () => void;
}) {
  if (loading) {
    return <div className="mbpc-loading" role="status"><span className="mbpc-spinner" />Loading current listings…</div>;
  }
  return (
    <section className="mbpc-empty-state" aria-live="polite">
      <PackageCheck size={38} aria-hidden="true" />
      <h2>{apiError ? 'Catalogue temporarily unavailable' : 'The catalogue is being prepared'}</h2>
      <p>{apiError
        ? 'We could not load current products. Please try again in a moment.'
        : 'There are no current product listings. Please check back soon.'}</p>
      <div className="mbpc-empty-actions">
        {apiError && <button type="button" className="mbpc-button mbpc-button-primary" onClick={onRetry}>Try again</button>}
        <button type="button" className="mbpc-button mbpc-button-secondary" onClick={onClear}>Browse all categories</button>
      </div>
    </section>
  );
}
