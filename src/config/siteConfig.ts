export const SITE_CONFIG = {
  storeName: 'My Budget PC',
  tagline: 'Computer essentials, thoughtfully chosen.',
  siteUrl: import.meta.env?.VITE_SITE_URL?.replace(/\/+$/, '') || '',
  whatsappNumber: import.meta.env?.VITE_STORE_WHATSAPP_NUMBER?.replace(/\D/g, '') || '',
  currency: 'INR',
  callingNumber: '',
  displayPhone: '',
  alternatePhone: '',
  supportPhone2: '',
  email: '',
  whatsappCommunityUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  facebookUrl: '',
  googleUrl: '',
  googleReviewsUrl: '',
  location: {
    name: '',
    addressLine1: '',
    area: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    metroDistance: '',
    timings: '',
    googleMapsSearchUrl: '',
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
