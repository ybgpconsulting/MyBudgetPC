import React, { useState } from 'react';
import { X } from 'lucide-react';

type CustomerDetailsModalProps = {
  action: 'reserve' | 'sell';
  productName: string;
  onClose: () => void;
  onSubmit: (name: string, phone: string) => Promise<void>;
};

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({ action, productName, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (phone.trim() && digits.length !== 10) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onSubmit(name.trim(), digits);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Operation failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-5 w-full max-w-md shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900">{action === 'reserve' ? 'Reserve unit' : 'Complete sale'}</h3>
            <p className="text-xs text-slate-500 mt-1">{productName}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full bg-slate-100 text-slate-500" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700">
            Customer name <span className="font-normal text-slate-400">(Optional)</span>
            <input value={name} onChange={event => setName(event.target.value)} className="mt-1 w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900" />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Mobile number <span className="font-normal text-slate-400">(Optional, 10 digits)</span>
            <input type="tel" inputMode="numeric" maxLength={10} value={phone} onChange={event => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} className="mt-1 w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900" />
          </label>
        </div>
        {error && <p className="text-xs font-semibold text-red-600" role="alert">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">Cancel</button>
          <button type="submit" disabled={busy} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold disabled:opacity-50">{busy ? 'Saving...' : action === 'reserve' ? 'Reserve' : 'Complete Sale'}</button>
        </div>
      </form>
    </div>
  );
};
