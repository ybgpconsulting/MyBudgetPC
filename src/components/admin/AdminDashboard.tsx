import React, { useRef, useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  RotateCcw, 
  Smartphone, 
  DollarSign, 
  Package, 
  Search, 
  X,
  Save,
  Download,
  ShieldCheck,
  Tag,
  Eye,
  ArrowRight,
  Sparkles,
  Receipt,
  FileSpreadsheet,
  Upload
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { PhoneItem, ConditionGrade, StockStatus, ProductCategory } from '../../types';
import { formatINR } from '../../config/siteConfig';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { CustomerDetailsModal } from '../common/CustomerDetailsModal';
import { readBulkStockRows } from '../../utils/bulkStockImport';
import { parseKeyFeatures } from '../../utils/storefront';

const PRESET_BRANDS = [
  'Acer', 'AMD', 'Apple', 'ASUS', 'Corsair', 'Dell', 'Gigabyte', 'HP',
  'Intel', 'Kingston', 'Lenovo', 'Logitech', 'MSI', 'NVIDIA', 'Samsung',
  'Seagate', 'Western Digital',
];

export const AdminDashboard: React.FC = () => {
  const { logout } = useAuth();
  const { 
    phones, 
    addPhone, 
    updatePhone, 
    deleteInventoryUnit,
    resetToDefaultStock,
    setActiveView,
    setFilters,
    reservePhone,
    releasePhoneReservation,
    sellPhone,
    retirePhone,
    restorePhone,
  } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Available' | 'Booked' | 'Sold Out'>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPhone, setEditingPhone] = useState<PhoneItem | null>(null);
  const [customerAction, setCustomerAction] = useState<{ item: PhoneItem; action: 'reserve' | 'sell' } | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const bulkFileRef = useRef<HTMLInputElement>(null);

  // Form State with optional MRP and Bill Amount
  const [formData, setFormData] = useState({
    category: 'Laptops' as ProductCategory,
    brand: '' as string,
    model: '',
    storage: 'N/A' as string,
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

  const submitCustomerAction = async (name: string, phone: string) => {
    if (!customerAction?.item.inventoryUnitId) throw new Error('This product has no physical inventory unit.');
    if (customerAction.action === 'reserve') {
      await reservePhone(customerAction.item.inventoryUnitId, name, phone, 120);
      showToast(`Reserved ${customerAction.item.model} successfully`);
    } else {
      await sellPhone(customerAction.item.inventoryUnitId, name, phone, customerAction.item.price);
      showToast(`Sold ${customerAction.item.model} successfully`);
    }
    setShowAddModal(false);
    setCustomerAction(null);
  };

  // Financial & Operational Metrics for Admin
  const availableItems = phones.filter(p => p.status === 'Available');
  const bookedItems = phones.filter(p => p.status === 'Booked');
  const soldItems = phones.filter(p => p.status === 'Sold Out');
  const totalStockValue = availableItems.reduce((acc, curr) => acc + curr.price, 0);
  const avgUnitPrice = availableItems.length > 0 ? Math.round(totalStockValue / availableItems.length) : 0;

  const categories = ['All', ...Array.from(new Set(phones.map(item => item.category).filter((category): category is string => Boolean(category))))];

  const filteredPhones = phones.filter(p => {
    if (selectedCategory !== 'All') {
      const cat = p.category || 'Laptops';
      if (cat !== selectedCategory) return false;
    }
    if (statusFilter !== 'All') {
      if (p.status !== statusFilter) return false;
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.brand.toLowerCase().includes(q) ||
      p.model.toLowerCase().includes(q) ||
      p.storage.toLowerCase().includes(q) ||
      p.colour.toLowerCase().includes(q) ||
      p.stockTag?.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  });

  const handleOpenAdd = () => {
    setFormData({
      category: 'Laptops',
      brand: '',
      model: '',
      storage: 'N/A',
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
      stockTag: `MBPC-${Date.now().toString().slice(-6)}`,
      screenSize: '',
      ram: '',
      processor: '',
      customBrand: '',
      warrantyApplicable: false,
    });
    setEditingPhone(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (phone: PhoneItem) => {
    setEditingPhone(phone);
    setFormData({
      category: phone.category || 'Laptops',
      brand: PRESET_BRANDS.includes(phone.brand) ? phone.brand : 'Other',
      customBrand: PRESET_BRANDS.includes(phone.brand) ? '' : phone.brand,
      model: phone.model,
      storage: phone.storage,
      colour: phone.colour,
      colorHex: phone.colorHex || '#3b82f6',
      condition: normalizeCondition(phone.condition),
      conditionDescription: phone.conditionDescription,
      keyFeatures: phone.keyFeatures.join('\n'),
      batteryHealth: phone.batteryHealth ?? '',
      price: phone.price,
      originalMsp: phone.originalMsp || '',
      billAvailable: phone.billAvailable ?? false,
      billAmount: phone.billAmount || '',
      priceDrop: !!phone.priceDrop,
      featured: !!phone.featured,
      status: phone.status,
      bookingCustomerName: phone.bookingCustomer?.name || '',
      bookingCustomerPhone: phone.bookingCustomer?.phone || '',
      bookingCustomerNote: phone.bookingCustomer?.note || '',
      imageUrl: phone.images[0] || '',
      additionalImageUrl: phone.images[1] || '',
      originalBox: phone.inBox.originalBox,
      chargerIncluded: phone.inBox.chargerIncluded,
      taxInvoiceProvided: phone.inBox.taxInvoiceProvided,
      cableIncluded: phone.inBox.cableIncluded,
      stockTag: phone.stockTag || '',
      screenSize: phone.screenSize || '',
      ram: phone.ram || '',
      processor: phone.processor || '',
      warrantyApplicable: !!phone.inBox.warrantyApplicable,
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.model.trim()) {
      alert('Please enter a product model name');
      return;
    }
    if (!formData.condition) {
      alert('Please select the product condition grade.');
      return;
    }

    const imagesArray = formData.imageUrl.trim() ? [formData.imageUrl.trim()] : [];
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
    if (editingPhone) {
      const updated: PhoneItem = {
        ...editingPhone,
        category: formData.category,
        brand: formData.brand === 'Other' ? formData.customBrand.trim() : formData.brand,
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
        images: imagesArray.length > 0 ? imagesArray : editingPhone.images,
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
        brand: formData.brand === 'Other' ? formData.customBrand.trim() : formData.brand,
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
        stockTag: formData.stockTag || `MBPC-${Date.now().toString().slice(-6)}`,
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
        inspectionPassed: []
      });
      showToast(`Added ${formData.brand} ${formData.model} to master stock!`);
    }

    setShowAddModal(false);
    } catch (err: any) {
      showToast(`Error: ${err?.message || 'Operation failed'}`);
    }
  };

  const handleExportCSV = () => {
    const headers = ['StockTag', 'Category', 'Brand', 'Model', 'Storage', 'Colour', 'BatteryHealth', 'Condition', 'SalePrice', 'LaunchMRP', 'BillAvailable', 'BillAmount', 'Status'];
    const rows = phones.map(p => [
      p.stockTag || p.id,
      p.category || 'Laptops',
      p.brand,
      `"${p.model}"`,
      p.storage,
      p.colour,
      p.batteryHealth || 'N/A',
      `"${p.condition}"`,
      p.price,
      p.originalMsp || '',
      p.billAvailable ? 'Yes' : 'No',
      p.billAmount || '',
      p.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `my-budget-pc-inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported CSV successfully!');
  };

  const downloadBulkTemplate = () => {
    const link = document.createElement('a');
    link.href = '/bulk-stock-template.csv';
    link.download = 'my-budget-pc-bulk-stock-template.csv';
    link.click();
  };

  const parseBoolean = (value: unknown, fallback = false) => {
    if (value === undefined || value === null || value === '') return fallback;
    return ['true', 'yes', '1', 'y'].includes(String(value).trim().toLowerCase());
  };

  const handleBulkImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBulkBusy(true);
    setBulkResult(null);
    const errors: string[] = [];
    let imported = 0;
    try {
      const rows = await readBulkStockRows(file);
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const rowNumber = index + 2;
        const category = String(row.Category || '').trim();
        const model = String(row.Model || '').trim();
        const brand = String(row.Brand || '').trim();
        const condition = normalizeCondition(String(row.Condition || '') as ConditionGrade);
        const priceValue = String(row.Price ?? '').trim();
        const price = Number(priceValue);
        if (!category || !brand || !model || !priceValue || !Number.isFinite(price) || price < 0) {
          errors.push(`Row ${rowNumber}: Category, Brand, Model, and a valid Price are required.`);
          continue;
        }
        if (!['A+', 'A', 'B', 'C'].includes(condition)) {
          errors.push(`Row ${rowNumber}: Condition must be A+, A, B, or C.`);
          continue;
        }
        const battery = row.BatteryHealth === '' || row.BatteryHealth === undefined ? undefined : Number(row.BatteryHealth);
        if (battery !== undefined && (!Number.isInteger(battery) || battery < 0 || battery > 100)) {
          errors.push(`Row ${rowNumber}: BatteryHealth must be blank or an integer from 0 to 100.`);
          continue;
        }
        const imageUrl = String(row.ImageUrl || '').trim();
        const additionalImageUrl = String(row.AdditionalImageUrl || '').trim();
        try {
          await addPhone({
            category,
            brand,
            model,
            storage: String(row.Storage || 'N/A'),
            colour: String(row.Colour || ''),
            condition,
            conditionDescription: String(row.ConditionDescription || ''),
            batteryHealth: battery,
            price,
            originalMsp: row.OriginalMsp === '' || row.OriginalMsp === undefined ? undefined : Number(row.OriginalMsp),
            billAvailable: parseBoolean(row.BillAvailable),
            billAmount: row.BillAmount === '' ? undefined : Number(row.BillAmount),
            featured: parseBoolean(row.Featured),
            priceDrop: parseBoolean(row.PriceDrop),
            status: 'Available',
            images: [imageUrl, additionalImageUrl].filter(Boolean),
            stockTag: String(row.StockTag || '').trim() || undefined,
            ram: String(row.RAM || '').trim() || undefined,
            processor: String(row.Processor || '').trim() || undefined,
            inBox: {
              originalBox: parseBoolean(row.OriginalBox),
              chargerIncluded: parseBoolean(row.ChargerIncluded),
              cableIncluded: parseBoolean(row.CableIncluded),
              taxInvoiceProvided: parseBoolean(row.TaxInvoiceProvided),
              warrantyApplicable: parseBoolean(row.WarrantyApplicable),
            },
            keyFeatures: parseKeyFeatures(String(row.KeyFeatures || '').split('|').join('\n')),
            inspectionPassed: [],
          });
          imported += 1;
        } catch (error) {
          errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Import failed.'}`);
        }
      }
      setBulkResult({ imported, errors });
      if (imported > 0) showToast(`Imported ${imported} stock item${imported === 1 ? '' : 's'} successfully`);
    } catch (error) {
      setBulkResult({ imported: 0, errors: [error instanceof Error ? error.message : 'Could not read this file.'] });
    } finally {
      setBulkBusy(false);
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

        {/* Top Header Navigation Bar with Direct Buttons */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold uppercase tracking-wider font-mono">
                  Admin Master Portal
                </span>
                <span className="text-xs text-slate-500 font-mono">MY BUDGET PC</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Product & Inventory Dashboard
              </h1>
            </div>
          </div>

          {/* Quick Header Buttons for Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              id="admin-add-item-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Item</span>
            </button>

            <button
              onClick={() => { setBulkResult(null); setShowBulkModal(true); }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Bulk catalog import</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download full CSV spreadsheet"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Export CSV</span>
            </button>

            <button onClick={logout} className="px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold cursor-pointer">
              Sign Out
            </button>

          </div>

        </div>

        {/* Simple 4-Card Financial Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Live Stock Valuation (₹)</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">{formatINR(totalStockValue)}</div>
            <p className="text-[11px] text-emerald-600 font-medium">{availableItems.length} available items</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Available Inventory Items</span>
              <Smartphone className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-blue-700">{availableItems.length}</div>
            <p className="text-[11px] text-slate-500">Currently available for enquiry</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Booked Units</span>
              <Tag className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-700">{bookedItems.length}</div>
            <p className="text-[11px] text-amber-700 font-medium">Awaiting customer pickup</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Sold Out Units</span>
              <CheckCircle2 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-700">{soldItems.length}</div>
            <p className="text-[11px] text-slate-500">Delivered to customers</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Avg. Unit Price</span>
              <Tag className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-700">{formatINR(avgUnitPrice)}</div>
            <p className="text-[11px] text-slate-500">Per available unit</p>
          </div>
        </div>

        {/* Category Filter Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Simple & Clean Stock Table */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tag, model, brand, storage..."
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
                <option value="Available">Available</option>
                <option value="Booked">Booked</option>
                <option value="Sold Out">Sold Out</option>
              </select>
              <span className="text-xs text-slate-500 font-mono">{filteredPhones.length} items</span>
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
                  <th className="py-3 px-3 font-bold uppercase">Price & Reference</th>
                  <th className="py-3 px-3 font-bold uppercase">Invoice</th>
                  <th className="py-3 px-3 font-bold uppercase">What's Included</th>
                  <th className="py-3 px-3 font-bold uppercase">Status</th>
                  <th className="py-3 px-3 font-bold uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPhones.map(item => {
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
                        <span className="font-bold text-slate-700">
                          {[item.processor, item.ram].filter(Boolean).join(' · ') || 'Configuration not specified'}
                        </span>
                        <div className="text-[10px] text-slate-500">{item.condition.split(' ')[0]}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-black text-slate-900">{item.price > 0 ? formatINR(item.price) : 'Price not set'}</div>
                        {item.originalMsp ? (
                          <div className="text-[10px] text-slate-400 line-through">MRP: {formatINR(item.originalMsp)}</div>
                        ) : (
                          <div className="text-[10px] text-slate-400">MRP: N/A</div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          {item.billAvailable ? (
                            <div className="text-emerald-700 font-bold flex items-center gap-1">
                              <Receipt className="w-3 h-3" />
                              <span>Bill: Yes</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Bill: No</span>
                          )}
                        </div>
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
                        <div className="flex flex-col items-start gap-1.5">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                              item.status === 'Available'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : item.status === 'Booked'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {item.status}
                          </span>
                          {item.status === 'Booked' && item.bookingCustomer && (
                            <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 max-w-[180px]">
                              {item.bookingCustomer.name} • {item.bookingCustomer.phone}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {item.status === 'Available' && item.inventoryUnitId && (
                            <button
                              onClick={() => setCustomerAction({ item, action: 'reserve' })}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white border border-amber-300 font-bold text-[11px] cursor-pointer transition-colors"
                            >
                              Reserve
                            </button>
                          )}
                          {(item.status === 'Sold Out' || item.status === 'Retired') && item.inventoryUnitId && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Restore ${item.brand} ${item.model} to available stock?`)) {
                                  restorePhone(item.inventoryUnitId!)
                                    .then(() => showToast(`Restored ${item.model} successfully`))
                                    .catch(error => showToast(`Restore failed: ${error instanceof Error ? error.message : 'Operation failed'}`));
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-200 font-bold text-[11px] cursor-pointer transition-colors"
                            >
                              Restore Stock
                            </button>
                          )}
                          {item.status === 'Booked' && item.inventoryUnitId && (
                            <button
                              onClick={() => {
                                releasePhoneReservation(item.inventoryUnitId!)
                                  .then(() => showToast(`Released ${item.model} successfully`))
                                  .catch(error => showToast(`Release failed: ${error instanceof Error ? error.message : 'Operation failed'}`));
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-600 hover:bg-slate-700 text-white border border-slate-500 font-bold text-[11px] cursor-pointer transition-colors"
                            >
                              Release Hold
                            </button>
                          )}
                          {(item.status === 'Available' || item.status === 'Booked') && item.inventoryUnitId && (
                            <button
                              onClick={() => setCustomerAction({ item, action: 'sell' })}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 font-bold text-[11px] cursor-pointer transition-colors"
                            >
                              Complete Sale
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm(`Permanently delete ${item.brand} ${item.model} (${item.stockTag || 'this unit'})?`)) {
                                await deleteInventoryUnit(item.inventoryUnitId!);
                                showToast(`Deleted ${item.model}`);
                              }
                            }}
                            disabled={!item.inventoryUnitId || item.status === 'Sold Out'}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title={item.status === 'Sold Out' ? 'Sold stock cannot be deleted' : 'Permanently delete this stock unit'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
        {showBulkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-blue-600" />Bulk stock upload</h3>
                  <p className="text-xs text-slate-500 mt-1">Upload .xlsx or .csv (up to 10MB and 1,000 products). Each valid row becomes one live stock item.</p>
                </div>
                <button onClick={() => setShowBulkModal(false)} className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer" aria-label="Close bulk upload"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
                <p className="text-xs font-bold text-blue-900">Use the supplied template columns</p>
                <p className="text-[11px] text-blue-800">Required: Category, Brand, Model, Condition, Price. Add ImageUrl and AdditionalImageUrl for product photos. BatteryHealth may be blank.</p>
                <button onClick={downloadBulkTemplate} className="text-xs font-bold text-blue-700 underline cursor-pointer">Download CSV template</button>
              </div>
              <input ref={bulkFileRef} type="file" accept=".xlsx,.csv" onChange={handleBulkImport} className="hidden" />
              <button disabled={bulkBusy} onClick={() => bulkFileRef.current?.click()} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:cursor-wait">
                <Upload className="w-4 h-4" />{bulkBusy ? 'Importing live stock...' : 'Choose .xlsx or .csv file'}
              </button>
              {bulkResult && <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"><p className="text-sm font-bold text-emerald-700">Imported: {bulkResult.imported}</p>{bulkResult.errors.length > 0 && <div className="text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">{bulkResult.errors.map(error => <p key={error}>{error}</p>)}</div>}</div>}
            </div>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-xl">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    {editingPhone ? 'Edit Product' : 'Add Product'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add verified product details, optional reference price, and current availability.
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
                    <select
                      value={formData.brand}
                      onChange={e => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                    >
                      <option value="">Select a brand</option>
                      {PRESET_BRANDS.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                      <option value="Other">Other Brand</option>
                    </select>
                    {formData.brand === 'Other' && (
                      <input
                        type="text"
                        required
                        placeholder="Enter brand name"
                        value={formData.customBrand}
                        onChange={e => setFormData({ ...formData, customBrand: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                      />
                    )}
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
                    <label className="font-bold text-slate-700">Stock Tag / Identifier</label>
                    <input
                      type="text"
                      placeholder="e.g. MBPC-CPU-001"
                      value={formData.stockTag}
                      onChange={e => setFormData({ ...formData, stockTag: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                    />
                  </div>
                </div>

                {/* Storage, RAM, colour, and processor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Storage</label>
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
                      placeholder="e.g. Natural Titanium / Space Black"
                      value={formData.colour}
                      onChange={e => setFormData({ ...formData, colour: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
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
                    <label className="font-bold text-slate-700">Processor</label>
                    <input
                      type="text"
                      placeholder="e.g. Intel Core i5 / Ryzen 7"
                      value={formData.processor}
                      onChange={e => setFormData({ ...formData, processor: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                    />
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
                    <label className="font-bold text-slate-700">Counter Sale Price (₹) *</label>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold"
                    />
                  </div>

                  {/* MRP is Optional */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>Launch MRP (₹)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Optional retail MRP"
                      value={formData.originalMsp}
                      onChange={e => setFormData({ ...formData, originalMsp: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Stock Status</label>
                    <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-sm space-y-2">
                      <p className="font-semibold">{formData.status}</p>
                      {editingPhone?.inventoryUnitId && (
                        <div className="flex flex-wrap gap-1.5">
                          {formData.status === 'Available' && (
                            <button type="button" onClick={() => {
                              setCustomerAction({ item: editingPhone, action: 'reserve' });
                            }} className="px-2 py-1 rounded-md bg-amber-500 text-white font-bold text-[11px]">
                              Reserve
                            </button>
                          )}
                          {formData.status === 'Booked' && (
                            <button type="button" onClick={() => releasePhoneReservation(editingPhone.inventoryUnitId!)
                              .then(() => { setShowAddModal(false); showToast(`Released ${editingPhone.model} successfully`); })
                              .catch(error => showToast(`Release failed: ${error instanceof Error ? error.message : 'Operation failed'}`))} className="px-2 py-1 rounded-md bg-slate-600 text-white font-bold text-[11px]">
                              Release Hold
                            </button>
                          )}
                          {(formData.status === 'Available' || formData.status === 'Booked') && (
                            <button type="button" onClick={() => {
                              setCustomerAction({ item: editingPhone, action: 'sell' });
                            }} className="px-2 py-1 rounded-md bg-blue-600 text-white font-bold text-[11px]">
                              Complete Sale
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {formData.status === 'Booked' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Booked By</label>
                      <input
                        type="text"
                        value={formData.bookingCustomerName}
                        onChange={e => setFormData({ ...formData, bookingCustomerName: e.target.value })}
                        placeholder="Customer name"
                        className="w-full p-2.5 rounded-xl bg-white border border-amber-200 text-slate-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Phone</label>
                      <input
                        type="tel"
                        value={formData.bookingCustomerPhone}
                        onChange={e => setFormData({ ...formData, bookingCustomerPhone: e.target.value })}
                        placeholder="Customer phone"
                        className="w-full p-2.5 rounded-xl bg-white border border-amber-200 text-slate-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Notes</label>
                      <input
                        type="text"
                        value={formData.bookingCustomerNote}
                        onChange={e => setFormData({ ...formData, bookingCustomerNote: e.target.value })}
                        placeholder="Pickup, deposit, etc."
                        className="w-full p-2.5 rounded-xl bg-white border border-amber-200 text-slate-900"
                      />
                    </div>
                  </div>
                )}

                {/* Original Bill Section (Optional Bill Amount if Bill Available) */}
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
                    <span className="text-[10px] text-blue-700 font-semibold">Increases buyer trust</span>
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
                  <label className="font-bold text-slate-700">Condition Description</label>
                  <textarea
                    rows={2}
                    value={formData.conditionDescription}
                    onChange={e => setFormData({ ...formData, conditionDescription: e.target.value })}
                    placeholder="Describe display, chassis, parts authenticity..."
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

                {/* In Box items */}
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
                    <span>{editingPhone ? 'Save Changes' : 'Add to Stock'}</span>
                  </button>
                </div>

              </form>

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
