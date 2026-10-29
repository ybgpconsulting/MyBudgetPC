import { z } from 'zod';

// ============================================================
// AUTH
// ============================================================

export const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// ============================================================
// PRODUCTS
// ============================================================

export const createProductSchema = z.object({
  category: z.string().trim().min(1, 'Category is required').default('Laptops'),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  storage: z.string().default('N/A'),
  colour: z.string().default(''),
  colorHex: z.string().optional(),
  priceInr: z.number().int().min(0, 'Price must be non-negative'),
  originalMsp: z.number().int().min(0).optional(),
  billAvailable: z.boolean().default(false),
  billAmount: z.number().int().min(0).optional(),
  conditionGrade: z.enum(['A+', 'A', 'B', 'C']).default('A+'),
  conditionDescription: z.string().default(''),
  batteryHealth: z.number().int().min(0).max(100).optional(),
  screenSize: z.string().optional(),
  ram: z.string().optional(),
  processor: z.string().optional(),
  stockTag: z.string().optional(),
  priceDrop: z.boolean().default(false),
  featured: z.boolean().default(false),
  inBox: z.object({
    chargerIncluded: z.boolean().default(false),
    originalBox: z.boolean().default(false),
    taxInvoiceProvided: z.boolean().default(false),
    cableIncluded: z.boolean().default(false),
    warrantyApplicable: z.boolean().default(false),
  }).default(() => ({
    chargerIncluded: false,
    originalBox: false,
    taxInvoiceProvided: false,
    cableIncluded: false,
    warrantyApplicable: false,
  })),
  keyFeatures: z.array(z.string()).default([]),
  images: z.array(z.object({
    url: z.string().min(1, 'Image URL is required'),
    altText: z.string().default(''),
    sortOrder: z.number().int().min(0).default(0),
    isPrimary: z.boolean().default(false),
  })).default([]),
});

export const updateProductSchema = createProductSchema.partial();

// ============================================================
// INVENTORY UNITS
// ============================================================

export const createInventoryUnitSchema = z.object({
  productId: z.string().uuid(),
  stockTag: z.string().min(1, 'Stock tag is required'),
  imei: z.string().length(15, 'IMEI must be exactly 15 digits').optional(),
  salePriceInr: z.number().int().min(0).optional(),
});

export const updateInventoryUnitSchema = z.object({
  stockTag: z.string().min(1).optional(),
  imei: z.string().length(15).nullable().optional(),
  salePriceInr: z.number().int().min(0).nullable().optional(),
});

export const updateInventoryStatusSchema = z.object({
  status: z.enum(['available', 'reserved', 'sold', 'retired']),
});

// ============================================================
// CUSTOMERS
// ============================================================

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  phone: z.string().min(10, 'Valid phone number required').max(15),
  email: z.string().email().optional().nullable(),
  notes: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// ============================================================
// RESERVATIONS
// ============================================================

export const createReservationSchema = z.object({
  inventoryUnitId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  customerName: z.string().min(1).optional(),
  customerPhone: z.string().length(10).optional(),
  customerEmail: z.string().email().optional(),
  durationMinutes: z.number().int().min(15).max(1440).default(120),
  notes: z.string().optional(),
});

export const cancelReservationSchema = z.object({
  reservationId: z.string().uuid(),
  reason: z.string().optional(),
});

// ============================================================
// SALES
// ============================================================

export const createSaleSchema = z.object({
  inventoryUnitId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  customerName: z.string().min(1).optional(),
  customerPhone: z.string().length(10).optional(),
  customerEmail: z.string().email().optional(),
  salePriceInr: z.number().int().min(0),
  discountInr: z.number().int().min(0).default(0),
  reservationId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

// ============================================================
// INSPECTIONS
// ============================================================

export const createInspectionSchema = z.object({
  inventoryUnitId: z.string().uuid(),
  displayOk: z.boolean().default(false),
  touchOk: z.boolean().default(false),
  batteryOk: z.boolean().default(false),
  camerasOk: z.boolean().default(false),
  speakersOk: z.boolean().default(false),
  microphoneOk: z.boolean().default(false),
  chargingOk: z.boolean().default(false),
  biometricOk: z.boolean().default(false),
  trueToneOk: z.boolean().nullable().optional(),
  sensorsOk: z.boolean().default(false),
  buttonsOk: z.boolean().default(false),
  networkOk: z.boolean().default(false),
  wifiOk: z.boolean().default(false),
  bluetoothOk: z.boolean().default(false),
  physicalCondition: z.string().default(''),
  replacedParts: z.string().default(''),
  technicianNotes: z.string().default(''),
});

// ============================================================
// QUERY PARAMS
// ============================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const productFilterSchema = paginationSchema.extend({
  category: z.string().optional(),
  brand: z.string().optional(),
  storage: z.string().optional(),
  condition: z.string().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().optional(),
  minBatteryHealth: z.coerce.number().int().min(0).max(100).optional(),
  search: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  priceDrop: z.coerce.boolean().optional(),
  availableOnly: z.coerce.boolean().optional(),
});
