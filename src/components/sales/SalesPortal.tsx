import React, { useState } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  Search, 
  X, 
  Save, 
  Smartphone, 
  Tag, 
  Camera, 
  UserCheck, 
  ArrowRight,
  ShoppingBag,
  Send,
  Eye,
  FileText,
  Receipt,
  ShieldCheck,
  Upload
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { PhoneItem, ConditionGrade, StockStatus, ProductCategory, ApiReservation } from '../../types';
import { formatINR, SITE_CONFIG } from '../../config/siteConfig';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { CustomerDetailsModal } from '../common/CustomerDetailsModal';
import { parseKeyFeatures } from '../../utils/storefront';
import { buildProductEnquiryMessage, createWhatsAppUrl } from '../../utils/whatsapp';

function buildSalesProductMessage(item: PhoneItem, customerName: string, customerPhone: string): string {
  const baseUrl = SITE_CONFIG.siteUrl || window.location.origin;
  const productUrl = new URL(`/product/${encodeURIComponent(item.id)}`, baseUrl).toString();
  const customerDetails = [
    customerName.trim() ? `Customer name: ${customerName.trim()}` : '',
    customerPhone.trim() ? `Customer phone: ${customerPhone.trim()}` : '',
  ].filter(Boolean);
  return [
    buildProductEnquiryMessage(item, 1, productUrl),
    ...(customerDetails.length ? ['', ...customerDetails] : []),
  ].join('\n');
}

export const SalesPortal: React.FC = () => {
  const { logout } = useAuth();
  const { 
    phones, 
    addPhone, 
    updatePhone, 
    setActiveView,
    refreshPhones,
    reservePhone,
    releasePhoneReservation,
    sellPhone,
  } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Available' | 'Booked' | 'Sold Out'>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PhoneItem | null>(null);
  const [customerAction, setCustomerAction] = useState<{ item: PhoneItem; action: 'reserve' | 'sell' } | null>(null);
  
  // Product enquiry preview
  const [quotationItem, setQuotationItem] = useState<PhoneItem | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [workflowBusy, setWorkflowBusy] = useState(false);

  // Form State with optional MRP and Bill Amount
  const [formData, setFormData] = useState({
    category: 'Laptops' as ProductCategory,
    brand: '',
    model: '',
    storage: '',
    colour: '',
    colorHex: '#1e293b',
    condition: '' as '' | ConditionGrade,
    conditionDescription: '',
    keyFeatures: '',
    batteryHealth: '' as string | number,
    price: 0,
    originalMsp: '' as string | number, // Optional
    billAvailable: false,
    billAmount: '' as string | number, // Optional original invoice amount
    priceDrop: false,
    featured: false,
    status: 'Available' as StockStatus,
    bookingCustomerName: '',
    bookingCustomerPhone: '',
    bookingCustomerNote: '',
    imageUrl: '',
    additionalImageUrl: '',
    originalBox: false,
    chargerIncluded: false,
    taxInvoiceProvided: false,
    cableIncluded: false,
    stockTag: '',
    screenSize: '',
    ram: '',
    processor: '',
    customBrand: '',
    warrantyApplicable: false,
  });

  const [notification, setNotification] = useState<string | null>(null);
  const normalizeCondition = (condition: ConditionGrade): ConditionGrade => ({
    'Like New (Flawless)': 'A+',
    'Excellent (9.5/10)': 'A',
    'Very Good (8.5/10)': 'B',
    'Good (Minor Marks)': 'C',
  }[condition] || condition) as ConditionGrade;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Operational metrics ONLY (No stock value as required)
  const totalUnits = phones.length;
  const availableUnits = phones.filter(p => p.status === 'Available').length;
  const bookedUnits = phones.filter(p => p.status === 'Booked').length;
  const soldUnits = phones.filter(p => p.status === 'Sold Out').length;

  const categories = ['All', ...Array.from(new Set<string>(phones.map((item) => item.category).filter((category): category is string => Boolean(category))))
    .sort((a, b) => a.localeCompare(b))];

  const filteredItems = phones.filter(p => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchText = (
        p.brand.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        p.storage.toLowerCase().includes(q) ||
        p.colour.toLowerCase().includes(q) ||
        p.stockTag?.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
      if (!matchText) return false;
    }

    if (categoryFilter !== 'All') {
      const itemCat = p.category || 'Products';
      if (itemCat !== categoryFilter) return false;
    }

    if (statusFilter !== 'All') {
      if (p.status !== statusFilter) return false;
    }

    return true;
  });

  const handleOpenAdd = () => {
    setFormData({
      category: 'Laptops',
      brand: '',
      model: '',
      storage: '',
      colour: '',
      colorHex: '#1e293b',
      condition: '',
      conditionDescription: '',
      keyFeatures: '',
      batteryHealth: '',
      price: 0,
      originalMsp: '',
      billAvailable: false,
      billAmount: '',
      priceDrop: false,
      featured: false,
      status: 'Available',
      imageUrl: '',
      additionalImageUrl: '',
      originalBox: false,
      chargerIncluded: false,
      taxInvoiceProvided: false,
      cableIncluded: false,
      stockTag: `MBPC-SLS-${Date.now().toString().slice(-4)}`,
      screenSize: '',
      ram: '',
      processor: '',
      customBrand: '',
      warrantyApplicable: false,
    });
    setEditingItem(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: PhoneItem) => {
    setEditingItem(item);
    setFormData({
      category: item.category || 'Laptops',
      brand: item.brand,
      customBrand: '',
      model: item.model,
      storage: item.storage,
      colour: item.colour,
      colorHex: item.colorHex || '#3b82f6',
      condition: normalizeCondition(item.condition),
      conditionDescription: item.conditionDescription,
      keyFeatures: item.keyFeatures.join('\n'),
      batteryHealth: item.batteryHealth ?? '',
      price: item.price,
      originalMsp: item.originalMsp || '',
      billAvailable: item.billAvailable ?? true,
      billAmount: item.billAmount || '',
      priceDrop: !!item.priceDrop,
      featured: !!item.featured,
      status: item.status,
      bookingCustomerName: item.bookingCustomer?.name || '',
      bookingCustomerPhone: item.bookingCustomer?.phone || '',
      bookingCustomerNote: item.bookingCustomer?.note || '',
      imageUrl: item.images[0] || '',
      additionalImageUrl: item.images[1] || '',
      originalBox: item.inBox.originalBox,
      chargerIncluded: item.inBox.chargerIncluded,
      taxInvoiceProvided: item.inBox.taxInvoiceProvided,
      cableIncluded: item.inBox.cableIncluded,
      stockTag: item.stockTag || '',
      screenSize: item.screenSize || '',
      ram: item.ram || '',
      processor: item.processor || '',
      warrantyApplicable: !!item.inBox.warrantyApplicable,
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.model.trim()) {
      showToast('Please enter a product model name.');
      return;
    }
    if (!formData.brand.trim()) {
      showToast('Please enter a product brand.');
      return;
    }
    if (!formData.condition) {
      showToast('Please select the product condition grade.');
      return;
    }

    const imagesArray = [formData.imageUrl];
    if (formData.additionalImageUrl.trim()) {
      imagesArray.push(formData.additionalImageUrl.trim());
    }

    const parsedMsp = formData.originalMsp ? Number(formData.originalMsp) : undefined;
    const parsedBatteryHealth = formData.batteryHealth === '' ? undefined : Number(formData.batteryHealth);
    const parsedBillAmount = (formData.billAvailable && formData.billAmount) ? Number(formData.billAmount) : undefined;
    const bookingCustomer = formData.status === 'Booked' && (formData.bookingCustomerName || formData.bookingCustomerPhone)
      ? {
          name: formData.bookingCustomerName || 'Booked Customer',
          phone: formData.bookingCustomerPhone || 'N/A',
          note: formData.bookingCustomerNote || '',
          bookedAt: new Date().toISOString(),
        }
      : null;

    try {
    if (editingItem) {
      const updated: PhoneItem = {
        ...editingItem,
        category: formData.category,
        brand: formData.brand.trim(),
        model: formData.model,
        storage: formData.storage,
        colour: formData.colour,
        colorHex: formData.colorHex,
        condition: formData.condition,
        conditionDescription: formData.conditionDescription,
        keyFeatures: parseKeyFeatures(formData.keyFeatures),
        batteryHealth: parsedBatteryHealth,
        price: Number(formData.price),
        originalMsp: parsedMsp,
        billAvailable: formData.billAvailable,
        billAmount: parsedBillAmount,
        priceDrop: formData.priceDrop,
        featured: formData.featured,
        status: formData.status,
        bookingCustomer,
        images: imagesArray.length > 0 ? imagesArray : editingItem.images,
        stockTag: formData.stockTag,
        screenSize: formData.screenSize,
        ram: formData.ram,
        processor: formData.processor,
        inBox: {
          originalBox: formData.originalBox,
          chargerIncluded: formData.chargerIncluded,
          taxInvoiceProvided: formData.taxInvoiceProvided,
          cableIncluded: formData.cableIncluded,
          originalBillIncluded: formData.billAvailable
          , warrantyApplicable: formData.warrantyApplicable
        }
      };
      await updatePhone(updated);
      showToast(`Updated ${formData.model} successfully`);
    } else {
      await addPhone({
        category: formData.category,
        brand: formData.brand.trim(),
        model: formData.model,
        storage: formData.storage,
        colour: formData.colour,
        colorHex: formData.colorHex,
        condition: formData.condition,
        conditionDescription: formData.conditionDescription,
        keyFeatures: parseKeyFeatures(formData.keyFeatures),
        batteryHealth: parsedBatteryHealth,
        price: Number(formData.price),
        originalMsp: parsedMsp,
        billAvailable: formData.billAvailable,
        billAmount: parsedBillAmount,
        priceDrop: formData.priceDrop,
        featured: formData.featured,
        status: formData.status,
        bookingCustomer,
        images: imagesArray,
        stockTag: formData.stockTag || `MBPC-${Date.now().toString().slice(-4)}`,
        screenSize: formData.screenSize,
        ram: formData.ram,
        processor: formData.processor,
        inBox: {
          originalBox: formData.originalBox,
          chargerIncluded: formData.chargerIncluded,
          taxInvoiceProvided: formData.taxInvoiceProvided,
          cableIncluded: formData.cableIncluded,
          originalBillIncluded: formData.billAvailable
          , warrantyApplicable: formData.warrantyApplicable
        },
        inspectionPassed: [],
      });
      showToast(`Added ${formData.brand} ${formData.model} to stock!`);
    }

    setShowAddModal(false);
    } catch (err: any) {
      showToast(`Error: ${err?.message || 'Operation failed'}`);
    }
  };

  const handleSendWhatsAppQuotation = (item: PhoneItem) => {
    const message = buildSalesProductMessage(item, customerName, customerPhone);
    const url = createWhatsAppUrl(message);
    if (!url) {
      showToast('WhatsApp contact is not configured. Set VITE_STORE_WHATSAPP_NUMBER first.');
      return;
    }
    window.open(url, '_blank');
    setQuotationItem(null);
    showToast('WhatsApp opened. Review the enquiry and send it yourself to contact the store.');
  };

  const handleReserve = async (item: PhoneItem) => {
    if (!item.inventoryUnitId) {
      showToast('This product has no physical inventory unit.');
      return;
    }
    setWorkflowBusy(true);
    try {
      await reservePhone(item.inventoryUnitId, customerName.trim(), customerPhone.replace(/\D/g, ''), 120);
      await refreshPhones();
      setQuotationItem(null);
      showToast(`Reserved ${item.model} successfully`);
    } catch (error) {
      showToast(`Reservation failed: ${error instanceof Error ? error.message : 'Operation failed'}`);
    } finally {
      setWorkflowBusy(false);
    }
  };

  const handleSell = async (item: PhoneItem) => {
    if (!item.inventoryUnitId) {
      showToast('This product has no physical inventory unit.');
      return;
    }
    setWorkflowBusy(true);
    try {
      let reservationId: string | undefined;
      if (item.status === 'Booked') {
        const reservations = await api.get<ApiReservation[]>('/api/reservations');
        reservationId = reservations.find(reservation =>
          reservation.inventoryUnitId === item.inventoryUnitId &&
          ['pending', 'active'].includes(reservation.status)
        )?.id;
      }
      await sellPhone(item.inventoryUnitId, customerName.trim(), customerPhone.replace(/\D/g, ''), item.price, 0, reservationId);
      await refreshPhones();
      setQuotationItem(null);
      showToast(`Sold ${item.model} successfully`);
    } catch (error) {
      showToast(`Sale failed: ${error instanceof Error ? error.message : 'Operation failed'}`);
    } finally {
      setWorkflowBusy(false);
    }
  };

  const submitCustomerAction = async (name: string, phone: string) => {
    if (!customerAction?.item.inventoryUnitId) throw new Error('This product has no physical inventory unit.');
    if (customerAction.action === 'reserve') {
      await reservePhone(customerAction.item.inventoryUnitId, name, phone, 120);
      showToast(`Reserved ${customerAction.item.model} successfully`);
    } else {
      let reservationId: string | undefined;
      if (customerAction.item.status === 'Booked') {
        const reservations = await api.get<ApiReservation[]>('/api/reservations');
        reservationId = reservations.find(candidate => candidate.inventoryUnitId === customerAction.item.inventoryUnitId && ['pending', 'active'].includes(candidate.status))?.id;
      }
      await sellPhone(customerAction.item.inventoryUnitId, name, phone, customerAction.item.price, 0, reservationId);
      showToast(`Sold ${customerAction.item.model} successfully`);
    }
    await refreshPhones();
    setCustomerAction(null);
  };

  const handleCancelReservation = async (item: PhoneItem) => {
    if (!item.inventoryUnitId) {
      showToast('This product has no physical inventory unit.');
      return;
    }
    setWorkflowBusy(true);
    try {
      await releasePhoneReservation(item.inventoryUnitId);
      await refreshPhones();
      setQuotationItem(null);
      showToast(`Released ${item.model} successfully`);
    } catch (error) {
      showToast(`Release failed: ${error instanceof Error ? error.message : 'Operation failed'}`);
    } finally {
      setWorkflowBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Toast Notification */}
        {notification && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-xl flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{notification}</span>
          </div>
        )}

        {/* Sales Header Navigation Bar */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold border border-blue-200 shrink-0">
              <UserCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold uppercase tracking-wider font-mono">
                  Sales Representative Window
                </span>
                <span className="text-xs text-slate-500 font-mono">MY BUDGET PC</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Store Sales & Stock Counter
              </h1>
            </div>
          </div>

          {/* Quick Header Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              id="sales-add-stock-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Item</span>
            </button>

            <button onClick={logout} className="px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold cursor-pointer">
              Sign Out
            </button>

            <button
              onClick={() => {
                setActiveView('stock');
              }}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4 text-slate-600" />
              <span>Customer Storefront</span>
            </button>

          </div>
        </div>

        {/* Operational Metrics (No valuation) */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Total Catalog</span>
              <ShoppingBag className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{totalUnits}</div>
            <p className="text-[11px] text-slate-500">Tracked showroom units</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Available for Enquiry</span>
              <Smartphone className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700">{availableUnits}</div>
            <p className="text-[11px] text-emerald-600 font-medium">Current catalogue availability</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Booked Units</span>
              <Tag className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-700">{bookedUnits}</div>
            <p className="text-[11px] text-amber-700 font-medium">Reserved inventory</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Sold Deals</span>
              <CheckCircle2 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-700">{soldUnits}</div>
            <p className="text-[11px] text-slate-500">Recorded sales</p>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Stock Inventory Table & Quick Operations */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search stock tag, model, brand, storage..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
              >
                <option value="All">All Statuses</option>
                <option value="Available">Available Units Only</option>
                <option value="Booked">Booked Units</option>
                <option value="Sold Out">Sold Out Units</option>
              </select>

              <span className="text-xs text-slate-500 font-mono">
                {filteredItems.length} items
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-3 px-3 font-bold uppercase">Item & Photo</th>
                  <th className="py-3 px-3 font-bold uppercase">Category & Tag</th>
                  <th className="py-3 px-3 font-bold uppercase">Configuration</th>
                  <th className="py-3 px-3 font-bold uppercase">Listed Price</th>
                  <th className="py-3 px-3 font-bold uppercase">Invoice</th>
                  <th className="py-3 px-3 font-bold uppercase">What's Included</th>
                  <th className="py-3 px-3 font-bold uppercase">Mark Status</th>
                  <th className="py-3 px-3 font-bold uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => {
                  const isAvailable = item.status === 'Available';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.images[0] || '/product-placeholder.svg'}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{item.brand} {item.model}</div>
                            <div className="text-[11px] text-slate-500">
                              {item.storage !== 'N/A' && `${item.storage} • `}{item.colour}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
                          {item.category || 'Products'}
                        </span>
                        <div className="font-mono text-[10px] text-slate-500 mt-0.5">{item.stockTag || item.id}</div>
                      </td>

                      <td className="py-3 px-3">
                        {item.ram || item.processor || item.batteryHealth ? (
                                  <span className="font-bold text-slate-700">
                            {[item.ram, item.processor, item.batteryHealth ? `${item.batteryHealth}% battery` : ''].filter(Boolean).join(' · ')}
                          </span>
                        ) : (
                          <span className="text-slate-400">Configuration not specified</span>
                        )}
                        <div className="text-[10px] text-slate-500">{item.condition.split(' ')[0]}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-black text-slate-900">{formatINR(item.price)}</div>
                        {item.priceDrop && <span className="text-[10px] text-amber-700 font-bold">Price Drop</span>}
                      </td>

                      <td className="py-3 px-3">
                        {item.billAvailable ? (
                          <div className="text-emerald-700 font-bold flex items-center gap-1">
                            <Receipt className="w-3 h-3" />
                            <span>Bill: Yes</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Bill: No</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="space-y-1 text-[10px] font-bold">
                          <div className={item.inBox.chargerIncluded ? 'text-emerald-700' : 'text-slate-400'}>
                            Charger: {item.inBox.chargerIncluded ? 'Yes' : 'No'}
                          </div>
                          <div className={item.inBox.cableIncluded ? 'text-emerald-700' : 'text-slate-400'}>
                            Cable: {item.inBox.cableIncluded ? 'Yes' : 'No'}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                            isAvailable
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {isAvailable ? 'Available' : 'Sold Out'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {item.status === 'Available' && (
                            <button
                              onClick={() => setCustomerAction({ item, action: 'reserve' })}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white border border-amber-300 font-bold text-[11px] cursor-pointer transition-colors"
                              title="Reserve"
                            >
                              Reserve
                            </button>
                          )}
                          {item.status === 'Booked' && (
                            <button
                              onClick={() => {
                                if (!item.inventoryUnitId) return;
                                setWorkflowBusy(true);
                                releasePhoneReservation(item.inventoryUnitId)
                                  .then(() => { showToast(`Released ${item.model} successfully`); return refreshPhones(); })
                                  .catch(error => showToast(`Release failed: ${error instanceof Error ? error.message : 'Operation failed'}`))
                                  .finally(() => setWorkflowBusy(false));
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-600 hover:bg-slate-700 text-white border border-slate-500 font-bold text-[11px] cursor-pointer transition-colors"
                              title="Release Hold"
                            >
                              Release Hold
                            </button>
                          )}
                          {(item.status === 'Available' || item.status === 'Booked') && (
                            <button
                              onClick={() => setCustomerAction({ item, action: 'sell' })}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 font-bold text-[11px] cursor-pointer transition-colors"
                              title="Complete Sale"
                            >
                              Complete Sale
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setQuotationItem(item);
                              setCustomerName('');
                              setCustomerPhone('');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                            title="Generate WhatsApp Quote"
                          >
                            <Send className="w-3 h-3" />
                            <span>Quote</span>
                          </button>

                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>

        {/* Add / Edit Gadget Modal with Optional MRP and Bill Amount */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-xl">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                    {editingItem ? 'Edit Item' : 'Add Item to Showroom'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add a computer, component, or accessory with verified details.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                
                {/* Category & Brand */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Category</label>
                    <input
                      type="text"
                      required
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:border-blue-500"
                      placeholder="e.g. Laptops, Graphics Cards, Monitors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Brand</label>
                    <input
                      type="text"
                      required
                      value={formData.brand}
                      onChange={e => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="e.g. Lenovo, Intel, ASUS"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                    />
                  </div>
                </div>

                {/* Model & Stock Tag */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Product Model Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Core i7-14700K / ThinkPad T14 / RTX 4070"
                      value={formData.model}
                      onChange={e => setFormData({ ...formData, model: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Stock Tag / IMEI Identifier</label>
                    <input
                      type="text"
                      placeholder="e.g. MBPC-CPU-001"
                      value={formData.stockTag}
                      onChange={e => setFormData({ ...formData, stockTag: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                    />
                  </div>
                </div>

                {/* Storage, RAM, Colour & Battery */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Storage / Capacity</label>
                    <input
                      type="text"
                      value={formData.storage}
                      onChange={e => setFormData({ ...formData, storage: e.target.value })}
                      placeholder="e.g. 1TB NVMe SSD"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Colour</label>
                    <input
                      type="text"
                      placeholder="e.g. Space Black / Titanium"
                      value={formData.colour}
                      onChange={e => setFormData({ ...formData, colour: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">RAM</label>
                    <input
                      type="text"
                      placeholder="e.g. 8GB / 16GB"
                      value={formData.ram}
                      onChange={e => setFormData({ ...formData, ram: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Battery health (%) if applicable</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Optional"
                      value={formData.batteryHealth}
                      onChange={e => setFormData({ ...formData, batteryHealth: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-emerald-700 font-bold"
                    />
                    <p className="text-[10px] text-slate-400">Leave blank if not applicable</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Condition Grade</label>
                  <select
                    required
                    value={formData.condition}
                    onChange={e => setFormData({ ...formData, condition: e.target.value as ConditionGrade })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  >
                    <option value="">Select an observed grade</option>
                    <option value="A+">A+ - Like New</option>
                    <option value="A">A - Excellent</option>
                    <option value="B">B - Very Good</option>
                    <option value="C">C - Good</option>
                  </select>
                </div>

                {/* Price, Optional MRP & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Listed Price (₹) *</label>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold"
                    />
                  </div>

                  {/* MRP Optional */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>Original MRP (₹)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Optional retail price"
                      value={formData.originalMsp}
                      onChange={e => setFormData({ ...formData, originalMsp: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Stock Status</label>
                    <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-sm space-y-2">
                      <p className="font-semibold">{formData.status}</p>
                      {editingItem?.inventoryUnitId && (
                        <div className="flex flex-wrap gap-1.5">
                          {formData.status === 'Available' && (
                            <button type="button" onClick={() => handleReserve(editingItem).then(() => setShowAddModal(false))} className="px-2 py-1 rounded-md bg-amber-500 text-white font-bold text-[11px]">
                              Reserve
                            </button>
                          )}
                          {formData.status === 'Booked' && (
                            <button type="button" onClick={() => releasePhoneReservation(editingItem.inventoryUnitId!).then(() => { setShowAddModal(false); showToast(`Released ${editingItem.model} successfully`); }).catch(error => showToast(`Release failed: ${error instanceof Error ? error.message : 'Operation failed'}`))} className="px-2 py-1 rounded-md bg-slate-600 text-white font-bold text-[11px]">
                              Release Hold
                            </button>
                          )}
                          {(formData.status === 'Available' || formData.status === 'Booked') && (
                            <button type="button" onClick={() => handleSell(editingItem).then(() => setShowAddModal(false))} className="px-2 py-1 rounded-md bg-blue-600 text-white font-bold text-[11px]">
                              Complete Sale
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Original Bill Section */}
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 text-xs">
                      <input
                        type="checkbox"
                        checked={formData.billAvailable}
                        onChange={e => setFormData({ ...formData, billAvailable: e.target.checked })}
                        className="accent-blue-600 w-4 h-4 rounded"
                      />
                      <Receipt className="w-4 h-4 text-blue-700" />
                      <span>Original Purchase / Store Bill Available</span>
                    </label>
                    <span className="text-[10px] text-blue-700 font-semibold">Verified invoice</span>
                  </div>

                  {formData.billAvailable && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 flex items-center justify-between">
                          <span>Original Bill Purchase Amount (₹)</span>
                          <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 79900"
                          value={formData.billAmount}
                          onChange={e => setFormData({ ...formData, billAmount: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-white border border-blue-200 text-slate-900 font-semibold"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Photo Upload */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Product Photo</label>
                  <label className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-100">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>{formData.imageUrl ? 'Change Photo' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const uploaded = await api.uploadImage(file);
                          setFormData(prev => ({ ...prev, imageUrl: uploaded.url }));
                        } catch (error) {
                          showToast(`Upload failed: ${error instanceof Error ? error.message : 'Operation failed'}`);
                        }
                      }}
                    />
                  </label>
                  {formData.imageUrl && <span className="text-[10px] text-slate-500">A photo is selected for this item.</span>}
                </div>

                {/* Condition Notes */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Condition Notes</label>
                  <textarea
                    rows={2}
                    value={formData.conditionDescription}
                    onChange={e => setFormData({ ...formData, conditionDescription: e.target.value })}
                    placeholder="Describe display, frame, scratch status..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Key specifications</label>
                  <textarea
                    rows={4}
                    value={formData.keyFeatures}
                    onChange={e => setFormData({ ...formData, keyFeatures: e.target.value })}
                    placeholder={'One detail per line, for example:\nGraphics: 8GB GDDR6\nPorts: HDMI 2.1, DisplayPort'}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  />
                  <p className="text-[10px] text-slate-500">Enter only specifications verified for this individual listing.</p>
                </div>

                <label className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.warrantyApplicable}
                    onChange={e => setFormData({ ...formData, warrantyApplicable: e.target.checked })}
                    className="accent-emerald-600 w-4 h-4"
                  />
                  <span>Warranty applicable</span>
                  <span className="text-[10px] text-emerald-700 font-normal">Show on product details</span>
                </label>

                {/* In Box Inclusions */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.originalBox}
                      onChange={e => setFormData({ ...formData, originalBox: e.target.checked })}
                      className="accent-blue-600"
                    />
                    <span>Original Box</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.taxInvoiceProvided}
                      onChange={e => setFormData({ ...formData, taxInvoiceProvided: e.target.checked })}
                      className="accent-blue-600"
                    />
                    <span>Store Bill</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.chargerIncluded}
                      onChange={e => setFormData({ ...formData, chargerIncluded: e.target.checked })}
                      className="accent-blue-600"
                    />
                    <span>Charger</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.cableIncluded}
                      onChange={e => setFormData({ ...formData, cableIncluded: e.target.checked })}
                      className="accent-blue-600"
                    />
                    <span>Cable</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.priceDrop}
                      onChange={e => setFormData({ ...formData, priceDrop: e.target.checked })}
                      className="accent-amber-500"
                    />
                    <span className="text-amber-700 font-bold">Price Drop</span>
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingItem ? 'Save Updates' : 'Add to Stock'}</span>
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

        {/* Product enquiry review */}
        {quotationItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-xl text-xs">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Send className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Review product enquiry</h3>
                    <p className="text-[11px] text-slate-500">{quotationItem.brand} {quotationItem.model} ({quotationItem.storage})</p>
                  </div>
                </div>
                <button
                  onClick={() => setQuotationItem(null)}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Review the details below, then continue to the configured store WhatsApp contact. WhatsApp will open, but the message is not sent until you send it there.
                </p>
                {!SITE_CONFIG.whatsappNumber && (
                  <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    WhatsApp is unavailable until VITE_STORE_WHATSAPP_NUMBER is configured.
                  </p>
                )}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer name (optional)</label>
                  <input
                    type="text"
                    placeholder="Customer name"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer phone (optional)</label>
                  <input
                    type="tel"
                    placeholder="Customer contact number"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                  />
                </div>

                <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-700">
                  {buildSalesProductMessage(quotationItem, customerName, customerPhone)}
                </pre>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={workflowBusy || quotationItem.status !== 'Booked'}
                  onClick={() => handleCancelReservation(quotationItem)}
                  className="px-4 py-2 rounded-xl bg-slate-600 hover:bg-slate-700 disabled:bg-slate-300 text-white font-bold cursor-pointer"
                >
                  {workflowBusy ? 'Saving...' : 'Release Hold'}
                </button>
                <button
                  type="button"
                  disabled={workflowBusy || quotationItem.status !== 'Available'}
                  onClick={() => handleReserve(quotationItem)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-bold cursor-pointer"
                >
                  {workflowBusy ? 'Saving...' : 'Reserve Unit'}
                </button>
                <button
                  type="button"
                  disabled={workflowBusy || quotationItem.status === 'Sold Out' || quotationItem.status === 'Retired'}
                  onClick={() => handleSell(quotationItem)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold cursor-pointer"
                >
                  {workflowBusy ? 'Saving...' : 'Complete Sale'}
                </button>
                <button
                  type="button"
                  onClick={() => setQuotationItem(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={workflowBusy || !SITE_CONFIG.whatsappNumber}
                  onClick={() => handleSendWhatsAppQuotation(quotationItem)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Continue to WhatsApp</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {customerAction && (
          <CustomerDetailsModal
            action={customerAction.action}
            productName={`${customerAction.item.brand} ${customerAction.item.model}`}
            onClose={() => setCustomerAction(null)}
            onSubmit={submitCustomerAction}
          />
        )}

      </div>
    </div>
  );
};
