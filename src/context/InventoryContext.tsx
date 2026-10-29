import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PhoneItem, FilterOptions, ProductCategory, ApiProduct } from '../types';
import { api } from '../api/client';
import { SEED_PHONES } from '../data/seedPhones';

interface InventoryContextType {
  phones: PhoneItem[];
  availablePhones: PhoneItem[];
  soldPhones: PhoneItem[];
  featuredPhones: PhoneItem[];
  selectedPhone: PhoneItem | null;
  setSelectedPhone: (phone: PhoneItem | null) => void;
  activeView: string;
  setActiveView: (view: string, phoneId?: string) => void;
  activeDetailId: string | null;
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  resetFilters: () => void;
  setCategoryFilter: (category: string) => void;
  addPhone: (phone: Omit<PhoneItem, 'id' | 'dateAdded'>) => Promise<void>;
  updatePhone: (phone: PhoneItem) => Promise<void>;
  deletePhone: (id: string) => Promise<void>;
  deleteInventoryUnit: (id: string) => Promise<void>;
  reservePhone: (inventoryUnitId: string, customerName: string, customerPhone: string, durationMinutes?: number) => Promise<void>;
  releasePhoneReservation: (inventoryUnitId: string) => Promise<void>;
  sellPhone: (inventoryUnitId: string, customerName: string, customerPhone: string, salePriceInr: number, discountInr?: number, reservationId?: string) => Promise<void>;
  retirePhone: (inventoryUnitId: string) => Promise<void>;
  restorePhone: (inventoryUnitId: string) => Promise<void>;
  resetToDefaultStock: () => void;
  getPhoneById: (id: string) => PhoneItem | undefined;
  refreshPhones: () => Promise<void>;
  loading: boolean;
  apiError: string | null;
}

const DEFAULT_FILTERS: FilterOptions = {
  searchQuery: '',
  category: 'All',
  brand: 'All',
  minPrice: 0,
  maxPrice: 250000,
  storage: [],
  condition: [],
  minBatteryHealth: 0,
  onlyAvailable: false,
  onlyPriceDrop: false,
  sortBy: 'featured',
};

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const emptyInventoryContext: InventoryContextType = {
  phones: [],
  availablePhones: [],
  soldPhones: [],
  featuredPhones: [],
  selectedPhone: null,
  setSelectedPhone: () => undefined,
  activeView: 'home',
  setActiveView: () => undefined,
  activeDetailId: null,
  filters: DEFAULT_FILTERS,
  setFilters: () => undefined,
  resetFilters: () => undefined,
  setCategoryFilter: () => undefined,
  addPhone: async () => undefined,
  updatePhone: async () => undefined,
  deletePhone: async () => undefined,
  deleteInventoryUnit: async () => undefined,
  reservePhone: async () => undefined,
  releasePhoneReservation: async () => undefined,
  sellPhone: async () => undefined,
  retirePhone: async () => undefined,
  restorePhone: async () => undefined,
  resetToDefaultStock: () => undefined,
  getPhoneById: () => undefined,
  refreshPhones: async () => undefined,
  loading: false,
  apiError: null,
};

function mapApiProductToPhoneItem(apiProduct: ApiProduct): PhoneItem {
  const images = apiProduct.images?.map(img => img.url).filter(Boolean) || [];
  const unit = apiProduct.units?.find(candidate => candidate.status === 'available') || apiProduct.units?.[0];
  const statusMap: Record<string, PhoneItem['status']> = {
    available: 'Available',
    reserved: 'Booked',
    sold: 'Sold Out',
    retired: 'Retired',
  };
  const inBox = apiProduct.inBox || {};
  return {
    id: apiProduct.id,
    inventoryUnitId: unit?.id,
    category: (apiProduct.category || 'Phones') as ProductCategory,
    brand: apiProduct.brand,
    model: apiProduct.model,
    storage: apiProduct.storage,
    colour: apiProduct.colour,
    colorHex: apiProduct.colorHex || undefined,
    condition: apiProduct.conditionGrade as PhoneItem['condition'],
    conditionDescription: apiProduct.conditionDescription,
    batteryHealth: apiProduct.batteryHealth ?? undefined,
    price: apiProduct.priceInr,
    originalMsp: apiProduct.originalMsp ?? undefined,
    billAvailable: apiProduct.billAvailable,
    billAmount: apiProduct.billAmount ?? undefined,
    priceDrop: apiProduct.priceDrop,
    featured: apiProduct.featured,
    status: statusMap[unit?.status || 'available'] || 'Available',
    availableQuantity: apiProduct.units?.filter(candidate => candidate.status === 'available').length || 0,
    dateAdded: apiProduct.dateAdded || new Date().toISOString().split('T')[0],
    images: images.length > 0 ? images : ['/placeholder-phone.png'],
    inBox: {
      chargerIncluded: inBox.charger_included ?? inBox.chargerIncluded ?? true,
      originalBox: inBox.original_box ?? inBox.originalBox ?? true,
      taxInvoiceProvided: inBox.tax_invoice_provided ?? inBox.taxInvoiceProvided ?? true,
      cableIncluded: inBox.cable_included ?? inBox.cableIncluded ?? true,
      originalBillIncluded: inBox.original_bill_included ?? inBox.originalBillIncluded,
      warrantyApplicable: inBox.warranty_applicable ?? inBox.warrantyApplicable ?? false,
    },
    keyFeatures: apiProduct.keyFeatures || [],
    inspectionPassed: [],
    stockTag: apiProduct.stockTag,
    screenSize: apiProduct.screenSize || undefined,
    ram: apiProduct.ram,
    processor: apiProduct.processor,
  };
}

function mapPhoneItemToApiPayload(phone: Omit<PhoneItem, 'id' | 'dateAdded'>) {
  const payload: Record<string, unknown> = {
    category: phone.category || 'Phones',
    brand: phone.brand,
    model: phone.model,
    storage: phone.storage,
    colour: phone.colour,
    colorHex: phone.colorHex || undefined,
    priceInr: phone.price,
    originalMsp: phone.originalMsp || undefined,
    billAvailable: phone.billAvailable ?? true,
    billAmount: phone.billAmount || undefined,
    conditionGrade: phone.condition,
    conditionDescription: phone.conditionDescription,
    batteryHealth: phone.batteryHealth || undefined,
    screenSize: phone.screenSize || undefined,
    stockTag: phone.stockTag || `MBPC-${Date.now().toString().slice(-6)}`,
    priceDrop: phone.priceDrop ?? false,
    featured: phone.featured ?? false,
    inBox: phone.inBox,
    keyFeatures: phone.keyFeatures || [],
    images: phone.images.map((url, index) => ({ url, altText: `${phone.brand} ${phone.model}`, sortOrder: index, isPrimary: index === 0 })),
  };

  // Only include optional string fields if they have truthy values (avoid sending null for optional strings)
  if (phone.ram) payload.ram = phone.ram;
  if (phone.processor) payload.processor = phone.processor;
  if (phone.ram === '') payload.ram = undefined;
  if (phone.processor === '') payload.processor = undefined;

  return payload;
}

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [phones, setPhones] = useState<PhoneItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedPhone, setSelectedPhone] = useState<PhoneItem | null>(null);
  const [activeView, setActiveViewState] = useState<string>('home');
  const [activeDetailId, setActiveDetailId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);

  const refreshPhones = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const token = api.getToken();
      const data = await api.get<{ products: ApiProduct[] }>('/api/products', !!token);
      const mapped = data.products.map(mapApiProductToPhoneItem);
      setPhones(mapped);
      setApiError(null);
    } catch (err: any) {
      setPhones([]);
      setApiError('Live product listings are unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPhones();
  }, [refreshPhones]);

  useEffect(() => {
    const syncRoute = () => {
      const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
      const hash = window.location.hash.replace(/^#\/?/, '');
      const route = path || hash;
      const detailId = route.startsWith('product/')
        ? route.slice('product/'.length)
        : route.startsWith('stock/')
          ? route.slice('stock/'.length)
          : null;

      if (detailId) {
        setActiveViewState('detail');
        setActiveDetailId(decodeURIComponent(detailId));
        return;
      }

      const routeViews: Record<string, string> = {
        '': 'home',
        home: 'home',
        catalog: 'stock',
        stock: 'stock',
        accessories: 'stock',
        checkout: 'checkout',
        cart: 'checkout',
        login: 'login',
        admin: 'login',
        sales: 'login',
        about: 'home',
        policies: 'home',
        contact: 'home',
      };
      setActiveViewState(routeViews[route] || 'home');
      setActiveDetailId(null);
      if (route === 'accessories') setFilters(previous => ({ ...previous, category: 'Accessories' }));
      if (route === 'about' || route === 'policies' || route === 'contact') {
        setActiveViewState('home');
      }
    };

    syncRoute();
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);

  const setActiveView = (view: string, phoneId?: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (view === 'detail' && phoneId) {
      setActiveViewState('detail');
      setActiveDetailId(phoneId);
      const match = phones.find(p => p.id === phoneId);
      if (match) setSelectedPhone(match);
      window.history.pushState(null, '', `/product/${encodeURIComponent(phoneId)}`);
    } else {
      setActiveViewState(view);
      setActiveDetailId(null);
      const routes: Record<string, string> = {
        home: '/',
        stock: '/catalog',
        accessories: '/catalog',
        checkout: '/checkout',
        cart: '/checkout',
        login: '/login',
        education: '/about',
        safety: '/policies',
        contact: '/contact',
      };
      window.history.pushState(null, '', routes[view] || `/${view}`);
    }
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const setCategoryFilter = (category: string) => {
    setFilters(prev => ({ ...prev, category }));
  };

  const addPhone = useCallback(async (newPhoneData: Omit<PhoneItem, 'id' | 'dateAdded'>) => {
    const payload = mapPhoneItemToApiPayload(newPhoneData);
    await api.post('/api/products', payload);
    await refreshPhones();
  }, [refreshPhones]);

  const updatePhone = useCallback(async (updatedPhone: PhoneItem) => {
    const payload = mapPhoneItemToApiPayload(updatedPhone);
    await api.patch(`/api/products/${updatedPhone.id}`, payload);
    await refreshPhones();
  }, [refreshPhones]);

  const deletePhone = useCallback(async (id: string) => {
    await api.del(`/api/products/${id}`);
    await refreshPhones();
  }, [refreshPhones]);

  const deleteInventoryUnit = useCallback(async (id: string) => {
    await api.del(`/api/inventory/${id}`);
    await refreshPhones();
  }, [refreshPhones]);

  const reservePhone = useCallback(async (inventoryUnitId: string, customerName: string, customerPhone: string, durationMinutes = 120) => {
    const normalizedName = customerName.trim();
    const normalizedPhone = customerPhone.replace(/\D/g, '');
    await api.post('/api/reservations', {
      inventoryUnitId,
      durationMinutes,
      ...(normalizedName ? { customerName: normalizedName } : {}),
      ...(normalizedPhone ? { customerPhone: normalizedPhone } : {}),
    });
    await refreshPhones();
  }, [refreshPhones]);

  const releasePhoneReservation = useCallback(async (inventoryUnitId: string) => {
    const reservations = await api.get<{ id: string; inventoryUnitId: string; status: string }[]>('/api/reservations');
    const reservation = reservations.find(candidate =>
      candidate.inventoryUnitId === inventoryUnitId && ['pending', 'active'].includes(candidate.status)
    );
    if (!reservation) throw new Error('No active reservation found for this unit.');
    await api.post('/api/reservations/cancel', {
      reservationId: reservation.id,
      reason: 'Released from sales counter',
    });
    await refreshPhones();
  }, [refreshPhones]);

  const sellPhone = useCallback(async (
    inventoryUnitId: string,
    customerName: string,
    customerPhone: string,
    salePriceInr: number,
    discountInr = 0,
    reservationId?: string
  ) => {
    const normalizedName = customerName.trim();
    const normalizedPhone = customerPhone.replace(/\D/g, '');
    await api.post('/api/sales', {
      inventoryUnitId,
      salePriceInr,
      discountInr,
      reservationId,
      ...(normalizedName ? { customerName: normalizedName } : {}),
      ...(normalizedPhone ? { customerPhone: normalizedPhone } : {}),
    });
    await refreshPhones();
  }, [refreshPhones]);

  const retirePhone = useCallback(async (inventoryUnitId: string) => {
    await api.del(`/api/inventory/${inventoryUnitId}`);
    await refreshPhones();
  }, [refreshPhones]);

  const restorePhone = useCallback(async (inventoryUnitId: string) => {
    await api.patch(`/api/inventory/${inventoryUnitId}/status`, { status: 'available' });
    await refreshPhones();
  }, [refreshPhones]);

  const resetToDefaultStock = () => {
    refreshPhones();
  };

  const getPhoneById = (id: string) => {
    return phones.find(p => p.id === id);
  };

  const availablePhones = phones.filter(p => p.status === 'Available');
  const soldPhones = phones.filter(p => p.status === 'Sold Out');
  const featuredPhones = phones.filter(p => p.featured && p.status === 'Available');

  return (
    <InventoryContext.Provider
      value={{
        phones,
        availablePhones,
        soldPhones,
        featuredPhones,
        selectedPhone,
        setSelectedPhone,
        activeView,
        setActiveView,
        activeDetailId,
        filters,
        setFilters,
        resetFilters,
        setCategoryFilter,
        addPhone,
        updatePhone,
        deletePhone,
        deleteInventoryUnit,
        reservePhone,
        releasePhoneReservation,
        sellPhone,
        retirePhone,
        restorePhone,
        resetToDefaultStock,
        getPhoneById,
        refreshPhones,
        loading,
        apiError,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  return context ?? emptyInventoryContext;
};
