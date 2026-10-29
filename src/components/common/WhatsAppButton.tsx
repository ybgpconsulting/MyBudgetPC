import React from 'react';
import { MessageCircle } from 'lucide-react';
import { buildSimpleEnquiryMessage, createWhatsAppUrl } from '../../utils/whatsapp';

export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M20.52 3.48A11.82 11.82 0 0 0 12.08 0C5.55 0 .24 5.3.24 11.84c0 2.09.55 4.13 1.6 5.93L.14 24l6.37-1.67a11.83 11.83 0 0 0 5.57 1.41h.01c6.53 0 11.84-5.31 11.84-11.84 0-3.16-1.23-6.13-3.41-8.42ZM12.09 21.7h-.01a9.83 9.83 0 0 1-5.01-1.37l-.36-.21-3.78.99 1.01-3.68-.23-.38a9.84 9.84 0 0 1-1.51-5.21c0-5.42 4.41-9.83 9.84-9.83 2.63 0 5.1 1.03 6.96 2.9a9.78 9.78 0 0 1 2.88 6.97c0 5.42-4.41 9.82-9.79 9.82Zm5.39-7.37c-.29-.15-1.71-.84-1.98-.94-.27-.1-.46-.15-.65.15-.19.29-.75.94-.92 1.13-.17.19-.34.22-.63.07-.29-.15-1.23-.45-2.35-1.45-.87-.78-1.46-1.74-1.63-2.03-.17-.29-.02-.45.13-.6.13-.13.29-.34.43-.51.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.15-.65-1.57-.89-2.15-.23-.56-.47-.48-.65-.49h-.55c-.19 0-.5.07-.77.36-.27.29-1.04 1.02-1.04 2.49s1.07 2.89 1.21 3.08c.15.19 2.1 3.2 5.09 4.49.71.31 1.26.5 1.69.64.71.23 1.36.2 1.87.12.57-.09 1.71-.7 1.95-1.38.24-.68.24-1.26.17-1.38-.07-.12-.26-.19-.55-.34Z" />
  </svg>
);

interface WhatsAppButtonProps {
  productName?: string;
  price?: number;
  customMessage?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'outline' | 'floating' | 'subtle';
  showIcon?: boolean;
  label?: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  productName,
  price,
  customMessage,
  className = '',
  size = 'md',
  variant = 'primary',
  showIcon = true,
  label = 'WhatsApp Enquiry',
}) => {
  const url = createWhatsAppUrl(customMessage || buildSimpleEnquiryMessage(productName, price));

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 font-medium rounded-lg',
    md: 'px-4 py-2.5 text-sm gap-2 font-semibold rounded-xl',
    lg: 'px-6 py-3.5 text-base gap-2.5 font-bold rounded-2xl',
  };

  const variantClasses = {
    primary:
      'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all duration-200 active:scale-[0.98]',
    outline:
      'border border-emerald-500/60 hover:border-emerald-400 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 font-semibold transition-all duration-200 active:scale-[0.98]',
    subtle:
      'bg-slate-800 hover:bg-emerald-900/40 text-emerald-400 hover:text-emerald-300 border border-slate-700/60 font-medium transition-all duration-200',
    floating:
      'fixed bottom-6 right-6 z-50 w-16 h-16 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-[0_10px_30px_rgba(37,211,102,0.35)] hover:scale-110 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center border-4 border-white',
  };

  if (variant === 'floating' && !url) return null;

  if (variant === 'floating' && url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp with My Budget PC"
        className={`${variantClasses.floating} ${className}`}
        id="floating-whatsapp-trigger"
      >
        <WhatsAppIcon className="w-8 h-8 text-white" />
        <span className="sr-only">Chat on WhatsApp</span>
      </a>
    );
  }

  if (!url) {
    return (
      <button type="button" disabled title="WhatsApp contact has not been configured" className={`inline-flex items-center justify-center select-none text-center opacity-60 cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
        {showIcon && <MessageCircle className={size === 'sm' ? 'w-3.5 h-3.5 shrink-0' : size === 'lg' ? 'w-5 h-5 shrink-0' : 'w-4 h-4 shrink-0'} />}
        <span>WhatsApp contact not configured</span>
      </button>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center cursor-pointer select-none text-center ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      id={`whatsapp-btn-${productName ? productName.toLowerCase().replace(/\s+/g, '-') : 'general'}`}
    >
      {showIcon && <MessageCircle className={size === 'sm' ? 'w-3.5 h-3.5 shrink-0' : size === 'lg' ? 'w-5 h-5 shrink-0' : 'w-4 h-4 shrink-0'} />}
      <span>{label}</span>
    </a>
  );
};
