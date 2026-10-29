import { PhoneItem } from '../types';
import { SITE_CONFIG } from '../config/siteConfig';

interface SeoConfig {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  product?: PhoneItem | null;
}

export function updateMetaTags(config: SeoConfig) {
  const title = config.title || `${SITE_CONFIG.storeName} | Refurbished Computers & Components`;
  const description = config.description
    || 'Explore refurbished computers, laptops, PC components and peripherals from My Budget PC. Enquire directly to confirm availability and pricing.';
  const canonical = new URL(config.canonicalUrl || '/', SITE_CONFIG.siteUrl || window.location.origin).toString();

  document.title = title;

  const setMeta = (selector: string, attrName: string, attrValue: string, content: string) => {
    let element = document.querySelector(selector) as HTMLMetaElement | null;
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attrName, attrValue);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  setMeta('meta[name="description"]', 'name', 'description', description);
  setMeta('meta[property="og:title"]', 'property', 'og:title', title);
  setMeta('meta[property="og:description"]', 'property', 'og:description', description);
  setMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
  setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
  setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);

  let canonicalElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalElement) {
    canonicalElement = document.createElement('link');
    canonicalElement.rel = 'canonical';
    document.head.appendChild(canonicalElement);
  }
  canonicalElement.href = canonical;

  const existingSchema = document.getElementById('dynamic-product-schema');
  if (!config.product) {
    existingSchema?.remove();
    return;
  }

  const product = config.product;
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${product.brand} ${product.model}`,
    image: product.images.length > 0 ? product.images : ['/product-placeholder.svg'],
    description: product.conditionDescription || `${product.brand} ${product.model} product listing.`,
    sku: product.stockTag || product.id,
    brand: { '@type': 'Brand', name: product.brand },
    category: product.category || 'Computer equipment',
  };

  if (product.price > 0) {
    schema.offers = {
      '@type': 'Offer',
      url: canonical,
      priceCurrency: SITE_CONFIG.currency,
      price: product.price,
      availability: product.status === 'Available'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    };
  }

  if (existingSchema) {
    existingSchema.textContent = JSON.stringify(schema);
  } else {
    const script = document.createElement('script');
    script.id = 'dynamic-product-schema';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }
}
