export const SITE_CONFIG = {
  storeName: 'My Budget PC',
  tagline: 'Refurbished computers, components and peripherals.',
  siteUrl: import.meta.env?.VITE_SITE_URL?.replace(/\/+$/, '') || '',
  whatsappNumber: import.meta.env?.VITE_STORE_WHATSAPP_NUMBER?.replace(/\D/g, '') || '',
  currency: 'INR',
  callingNumber: '+919013266337',
  displayPhone: '+91 90132-66337',
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
    area: 'Preet Vihar',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '',
    landmark: '',
    metroDistance: '',
    timings: '',
    googleMapsSearchUrl: 'https://www.google.com/maps/search/?api=1&query=Preet+Vihar%2C+Delhi',
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
