import React, { lazy, Suspense, useEffect, useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { Storefront } from './components/storefront/Storefront';
import { updateMetaTags } from './utils/seo';
import { SITE_CONFIG } from './config/siteConfig';

const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard').then(({ AdminDashboard: dashboard }) => ({ default: dashboard })));
const SalesPortal = lazy(() => import('./components/sales/SalesPortal').then(({ SalesPortal: portal }) => ({ default: portal })));

const AppContent: React.FC = () => {
  const { activeView, activeDetailId, getPhoneById } = useInventory();
  const { user, loading: authLoading } = useAuth();
  const [pathname, setPathname] = useState(window.location.pathname);
  const isStaffRoute = ['/login', '/admin', '/sales'].some((path) => pathname.startsWith(path));

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const product = activeDetailId ? getPhoneById(activeDetailId) : undefined;
    const suffix = product ? ` | ${SITE_CONFIG.storeName}` : '';
    updateMetaTags({
      title: product
        ? `${product.brand} ${product.model}${product.storage && product.storage !== 'N/A' ? ` ${product.storage}` : ''}${suffix}`
        : isStaffRoute
          ? `Staff sign in${suffix}`
          : activeView === 'checkout'
            ? `Review your enquiry${suffix}`
            : activeView === 'stock'
            ? `Refurbished computer catalogue${suffix}`
              : `${SITE_CONFIG.storeName} | Refurbished Computers & Components`,
      description: product
        ? `${product.brand} ${product.model}. ${product.conditionDescription || 'View the product configuration and enquire about current availability and pricing.'}`
        : 'Explore refurbished computers, laptops, PC components and peripherals from My Budget PC. Enquire directly to confirm current availability and pricing.',
      canonicalUrl: pathname,
      product: product || null,
    });
  }, [activeDetailId, activeView, getPhoneById, isStaffRoute, pathname]);

  if (isStaffRoute) {
    if (authLoading) return <div className="mbpc-loading" role="status">Checking staff access…</div>;
    if (!user) return <LoginPage />;
    return (
      <Suspense fallback={<div className="mbpc-loading" role="status">Loading staff workspace…</div>}>
        {user.role === 'admin' ? <AdminDashboard /> : <SalesPortal />}
      </Suspense>
    );
  }

  return <Storefront />;
};

export default function App() {
  return (
    <InventoryProvider>
      <AppContent />
    </InventoryProvider>
  );
}
