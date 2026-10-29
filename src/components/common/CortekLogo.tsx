import React from 'react';

interface CortekLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  showText?: boolean;
  theme?: 'light' | 'dark';
}

export const CortekLogo: React.FC<CortekLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  showText = true,
  theme = 'light',
}) => {
  const sizeMap = {
    sm: { main: 'text-[24px]', sub: 'text-[9px]' },
    md: { main: 'text-[34px]', sub: 'text-[11px]' },
    lg: { main: 'text-[50px]', sub: 'text-xs' },
    xl: { main: 'text-[64px]', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];
  const isDark = theme === 'dark';

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      {showText && (
        <div className="flex flex-col items-start leading-none">
          <div
            className={`font-black uppercase tracking-[-0.02em] ${currentSize.main}`}
            style={{
              color: '#0f172a',
              textShadow: '0 2px 4px rgba(15, 23, 42, 0.16)',
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
            }}
          >
            CORTEK
          </div>
          <div
            className={`font-black uppercase tracking-[0.05em] ${currentSize.main}`}
            style={{
              color: '#059669',
              textShadow: '0 2px 4px rgba(5, 150, 105, 0.16)',
              lineHeight: 1.1,
              marginTop: '-0.04em',
              letterSpacing: '0.05em',
            }}
          >
            ENTERPRISES
          </div>
        </div>
      )}

      {showSubtitle && (
        <p className={`${currentSize.sub} ${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium flex items-center gap-1.5 mt-2.5`}>
          <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 animate-pulse" />
          <span className="text-slate-600 dark:text-slate-400">Direct Counter Stock</span>
          <span className="text-emerald-600 font-bold">•</span>
          <span className="text-slate-600 dark:text-slate-400">4.9★</span>
        </p>
      )}
    </div>
  );
};
