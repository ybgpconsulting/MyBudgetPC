export type ConditionGrade = 'A+' | 'A' | 'B' | 'C' | 'Like New (Flawless)' | 'Excellent (9.5/10)' | 'Very Good (8.5/10)' | 'Good (Minor Marks)';

export type StockStatus = 'Available' | 'Booked' | 'Sold Out' | 'Retired';

export type ProductCategory = string;

export type UserRole = 'customer' | 'sales' | 'admin';

export interface PhoneItem {
  id: string;
  inventoryUnitId?: string;
  category?: ProductCategory;
  brand: string;
  model: string;
  storage: string;
  colour: string;
  colorHex?: string;
  condition: ConditionGrade;
  conditionDescription: string;
  batteryHealth?: number;
  price: number;
  originalMsp?: number;
  billAvailable?: boolean;
  billAmount?: number;
  priceDrop?: boolean;
  featured?: boolean;
  status: StockStatus;
  availableQuantity?: number;
  bookingCustomer?: {
    name: string;
    phone: string;
    note?: string;
    bookedAt?: string;
  } | null;
  dateAdded: string;
  images: string[];
  inBox: {
    chargerIncluded: boolean;
    originalBox: boolean;
    taxInvoiceProvided: boolean;
    cableIncluded: boolean;
    originalBillIncluded?: boolean;
    warrantyApplicable?: boolean;
  };
  keyFeatures: string[];
  inspectionPassed: string[];
  stockTag?: string;
  screenSize?: string;
  ram?: string;
  processor?: string;
}

export interface AccessoryItem {
  id: string;
  name: string;
  category: 'Chargers & Adapters' | 'Cables' | 'Cases & Covers' | 'Screen Protectors' | 'Audio & Earphones' | 'Power Banks & Mounts';
  type: 'Brand New' | 'Pre-Owned Original';
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  description: string;
  compatibleWith: string;
  inStock: boolean;
}

export interface EducationalVideo {
  id: string;
  title: string;
  duration: string;
  topic: string;
  description: string;
  youtubeUrl: string;
  thumbnailGradient: string;
  viewsCount?: string;
}

export interface Testimonial {
  id: string;
  customerName: string;
  city: string;
  devicePurchased: string;
  rating: number;
  comment: string;
  date: string;
  verifiedPurchase: boolean;
  isGoogleReview?: boolean;
  reviewerBadge?: string;
  likesCount?: number;
}

export interface FilterOptions {
  searchQuery: string;
  category: string;
  brand: string;
  minPrice: number;
  maxPrice: number;
  storage: string[];
  condition: string[];
  minBatteryHealth: number;
  onlyAvailable: boolean;
  onlyPriceDrop: boolean;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'battery-desc' | 'newest';
}

// API response types
export interface ApiProduct {
  id: string;
  category: string;
  brand: string;
  model: string;
  storage: string;
  colour: string;
  colorHex: string | null;
  priceInr: number;
  originalMsp: number | null;
  billAvailable: boolean;
  billAmount: number | null;
  conditionGrade: string;
  conditionDescription: string;
  batteryHealth: number | null;
  screenSize: string | null;
  ram: string | null;
  processor: string | null;
  stockTag: string;
  priceDrop: boolean;
  featured: boolean;
  inBox: {
    charger_included?: boolean;
    original_box?: boolean;
    tax_invoice_provided?: boolean;
    cable_included?: boolean;
    original_bill_included?: boolean;
    chargerIncluded?: boolean;
    originalBox?: boolean;
    taxInvoiceProvided?: boolean;
    cableIncluded?: boolean;
    originalBillIncluded?: boolean;
    warrantyApplicable?: boolean;
    warranty_applicable?: boolean;
  };
  keyFeatures: string[];
  inspection_passed?: string[];
  images: Array<{ url: string; altText: string; sortOrder: number; isPrimary: boolean }>;
  units: ApiInventoryUnit[];
  dateAdded: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiInventoryUnit {
  id: string;
  productId: string;
  stockTag: string;
  imei?: string | null;
  status: 'available' | 'reserved' | 'sold' | 'retired';
  salePriceInr: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiReservation {
  id: string;
  inventoryUnitId: string;
  customerId: string;
  status: 'pending' | 'active' | 'cancelled' | 'expired' | 'converted';
  customerName: string;
  customerPhone: string;
  stockTag: string;
  brand: string;
  model: string;
  storage: string;
  notes: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface ApiSale {
  id: string;
  inventoryUnitId: string;
  customerName: string;
  customerPhone: string;
  sellerName: string;
  brand: string;
  model: string;
  storage: string;
  colour: string;
  stockTag: string;
  salePriceInr: number;
  discountInr: number;
  notes: string | null;
  soldAt: string;
}

export interface ApiInspection {
  id: string;
  inventoryUnitId: string;
  stockTag: string;
  brand: string;
  model: string;
  inspectorName: string;
  displayOk: boolean;
  touchOk: boolean;
  batteryOk: boolean;
  camerasOk: boolean;
  speakersOk: boolean;
  microphoneOk: boolean;
  chargingOk: boolean;
  biometricOk: boolean;
  trueToneOk: boolean | null;
  sensorsOk: boolean;
  buttonsOk: boolean;
  networkOk: boolean;
  wifiOk: boolean;
  bluetoothOk: boolean;
  physicalCondition: string;
  replacedParts: string;
  technicianNotes: string;
  overallPass: boolean;
  createdAt: string;
}

export interface ApiCustomer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  createdAt: string;
}
