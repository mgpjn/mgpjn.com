import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import PrescriptionModal from './components/PrescriptionModal';

// Core Pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import InvoiceView from './pages/InvoiceView';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// User Account Pages
import ProfilePage from './pages/user/ProfilePage';
import MyOrdersPage from './pages/user/MyOrdersPage';
import MyPrescriptionsPage from './pages/user/MyPrescriptionsPage';

// 7-Tier Hierarchy Team Management
import HierarchyDashboard from './pages/hierarchy/HierarchyDashboard';

// Refer & Earn Member Portal Pages
import MlmDashboard from './pages/mlm/MlmDashboard';
import GenealogyTree from './pages/mlm/GenealogyTree';
import WalletPayouts from './pages/mlm/WalletPayouts';
import ReferralsPage from './pages/mlm/ReferralsPage';
import CommissionsLedger from './pages/mlm/CommissionsLedger';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ImpersonateSessionPage from './pages/admin/ImpersonateSessionPage';

// Informational & Policy Pages
import AboutUsPage from './pages/info/AboutUsPage';
import ContactUsPage from './pages/info/ContactUsPage';
import FaqPage from './pages/info/FaqPage';
import PrivacyPolicyPage from './pages/info/PrivacyPolicyPage';
import TermsConditionsPage from './pages/info/TermsConditionsPage';
import ReturnRefundPage from './pages/info/ReturnRefundPage';
import ShippingPolicyPage from './pages/info/ShippingPolicyPage';

import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children, minLevel = 1, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xs text-slate-400">Loading MediGlaxo...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleLevels = {
    super_admin: 7,
    admin: 6,
    super_distributor: 5,
    distributor: 4,
    sub_distributor: 3,
    retailer: 2,
    sub_retailer: 2,
    customer: 1,
  };

  const userLevel = roleLevels[user.role] || 1;

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  if (userLevel < minLevel) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xs text-slate-400">Loading MediGlaxo...</div>;
  }

  if (user) {
    const role = user.role;
    if (role === 'admin' || role === 'super_admin') {
      return <Navigate to="/admin" replace />;
    } else if (['super_distributor', 'distributor', 'sub_distributor', 'retailer'].includes(role)) {
      return <Navigate to="/hierarchy" replace />;
    } else if (role === 'sub_retailer' || role === 'member') {
      return <Navigate to="/mlm" replace />;
    } else {
      return <Navigate to="/shop" replace />;
    }
  }

  return children;
}

export default function App() {
  const { isImpersonated, user } = useAuth();
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isInvoiceRoute = location.pathname.startsWith('/invoice');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-brand-blue-900 selection:text-white">
      {/* Super Admin Impersonated Session Notification Banner */}
      {isImpersonated && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-md sticky top-0 z-50">
          <div className="flex items-center space-x-2">
            <span className="bg-slate-950 text-amber-400 text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
              Admin Impersonation Tab
            </span>
            <span>
              Viewing account as: <strong>{user?.name || 'Partner'}</strong> ({user?.role?.replace('_', ' ').toUpperCase()}) • Super Admin tab is active in your previous tab.
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.close()}
              className="bg-slate-950 hover:bg-black text-white text-[11px] font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Close Tab
            </button>
          </div>
        </div>
      )}

      {/* Hide navbar on full admin & invoice print pages */}
      {!isAdminRoute && !isInvoiceRoute && (
        <Navbar onOpenPrescriptionModal={() => setIsPrescriptionModalOpen(true)} />
      )}

      <main className="flex-grow">
        <Routes>
          {/* Isolated Impersonation Session Initializer */}
          <Route path="/impersonate" element={<ImpersonateSessionPage />} />

          {/* Public Storefront Routes */}
          <Route path="/" element={<HomePage onOpenPrescriptionModal={() => setIsPrescriptionModalOpen(true)} />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage onOpenPrescriptionModal={() => setIsPrescriptionModalOpen(true)} />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success/:id" element={<OrderSuccessPage />} />
          <Route path="/track-order" element={<OrderTrackingPage />} />
          <Route path="/invoice/:id" element={<InvoiceView />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />

          {/* User Account Protected Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute>
                <MyOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/orders"
            element={
              <ProtectedRoute>
                <MyOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-prescriptions"
            element={
              <ProtectedRoute>
                <MyPrescriptionsPage onOpenPrescriptionModal={() => setIsPrescriptionModalOpen(true)} />
              </ProtectedRoute>
            }
          />

          {/* 7-Tier Hierarchy Team Management */}
          <Route
            path="/hierarchy"
            element={
              <ProtectedRoute minLevel={2}>
                <HierarchyDashboard />
              </ProtectedRoute>
            }
          />

          {/* Refer & Earn Protected Routes */}
          <Route
            path="/mlm"
            element={
              <ProtectedRoute>
                <MlmDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mlm/tree"
            element={
              <ProtectedRoute>
                <GenealogyTree />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mlm/wallet"
            element={
              <ProtectedRoute>
                <WalletPayouts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mlm/referrals"
            element={
              <ProtectedRoute>
                <ReferralsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mlm/commissions"
            element={
              <ProtectedRoute>
                <CommissionsLedger />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute minLevel={6}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/:section"
            element={
              <ProtectedRoute minLevel={6}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Informational & Policy Routes */}
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/contact-us" element={<ContactUsPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-and-conditions" element={<TermsConditionsPage />} />
          <Route path="/return-and-refund-policy" element={<ReturnRefundPage />} />
          <Route path="/shipping-policy" element={<ShippingPolicyPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <CartDrawer />
      <PrescriptionModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
      />

      {/* Hide footer on full admin & invoice print pages */}
      {!isAdminRoute && !isInvoiceRoute && <Footer />}
    </div>
  );
}
