function configuredText(value?: string): string {
  return value?.trim() || '';
}

function configuredPhone(value?: string): string {
  const phone = configuredText(value);
  if (!phone || !/^[+()\d\s.-]+$/.test(phone)) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15 ? digits : '';
}

function configuredEmail(value?: string): string {
  const email = configuredText(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function configuredPincode(value?: string): string {
  const pincode = configuredText(value);
  return /^[1-9]\d{5}$/.test(pincode) ? pincode : '';
}

function configuredHttpsUrl(value?: string): string {
  const configured = configuredText(value);
  if (!configured) return '';

  try {
    const url = new URL(configured);
    if (url.protocol !== 'https:' || url.username || url.password) return '';
    return url.toString();
  } catch {
    return '';
  }
}

function configuredSiteUrl(value?: string): string {
  const configured = configuredText(value);
  if (!configured) return '';

  try {
    const url = new URL(configured);
    const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if ((!isLocalhost && url.protocol !== 'https:')
      || (isLocalhost && !['http:', 'https:'].includes(url.protocol))
      || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
      return '';
    }
    return url.origin;
  } catch {
    return '';
  }
}

const callingNumber = configuredPhone(import.meta.env?.VITE_STORE_CALLING_NUMBER);
const displayPhone = callingNumber ? configuredText(import.meta.env?.VITE_STORE_CALLING_NUMBER) : '';

export const SITE_CONFIG = {
  storeName: 'My Budget PC',
  tagline: 'Refurbished computers, components and peripherals.',
  siteUrl: configuredSiteUrl(import.meta.env?.VITE_SITE_URL),
  whatsappNumber: configuredPhone(import.meta.env?.VITE_STORE_WHATSAPP_NUMBER),
  currency: 'INR',
  callingNumber,
  displayPhone,
  alternatePhone: '',
  supportPhone2: '',
  email: configuredEmail(import.meta.env?.VITE_STORE_EMAIL),
  whatsappCommunityUrl: configuredHttpsUrl(import.meta.env?.VITE_STORE_WHATSAPP_COMMUNITY_URL),
  instagramUrl: configuredHttpsUrl(import.meta.env?.VITE_STORE_INSTAGRAM_URL),
  youtubeUrl: configuredHttpsUrl(import.meta.env?.VITE_STORE_YOUTUBE_URL),
  facebookUrl: configuredHttpsUrl(import.meta.env?.VITE_STORE_FACEBOOK_URL),
  googleUrl: configuredHttpsUrl(import.meta.env?.VITE_STORE_GOOGLE_URL),
  googleReviewsUrl: configuredHttpsUrl(import.meta.env?.VITE_STORE_GOOGLE_REVIEWS_URL),
  location: {
    name: configuredText(import.meta.env?.VITE_STORE_LOCATION_NAME),
    addressLine1: configuredText(import.meta.env?.VITE_STORE_ADDRESS_LINE1),
    area: configuredText(import.meta.env?.VITE_STORE_AREA),
    city: configuredText(import.meta.env?.VITE_STORE_CITY),
    state: configuredText(import.meta.env?.VITE_STORE_STATE),
    pincode: configuredPincode(import.meta.env?.VITE_STORE_PINCODE),
    landmark: configuredText(import.meta.env?.VITE_STORE_LANDMARK),
    metroDistance: '',
    timings: '',
    googleMapsSearchUrl: configuredHttpsUrl(import.meta.env?.VITE_STORE_MAPS_URL),
  },
  googleRating: { score: 0, reviewsCount: 0, ratingUrl: '' },
  brandPillars: [] as Array<{ title: string; description: string }>,
};

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: SITE_CONFIG.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
