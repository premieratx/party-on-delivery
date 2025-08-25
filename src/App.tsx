import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RequireAdmin from "./components/admin/RequireAdmin";
import { GlobalCartProvider } from "@/components/common/GlobalCartProvider";
import { AuthProvider } from '@/contexts/AuthContext';
import { RobustErrorBoundary } from '@/components/common/RobustErrorBoundary';
import { AdminAuthFix } from '@/components/admin/AdminAuthFix';
import ColdStartSolution from '@/components/admin/ColdStartSolution';
import { useGlobalKeyboardHiding } from '@/hooks/useGlobalKeyboardHiding';
import { DynamicRouteHandler } from '@/components/routing/DynamicRouteHandler';
const Success = lazy(() => import("./pages/Success"));
const OrderComplete = lazy(() => import("./pages/OrderComplete"));
const CustomerLogin = lazy(() => import("./pages/CustomerLogin"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));
const Checkout = lazy(() => import("./pages/Checkout"));
const TestCheckout = lazy(() => import("./pages/TestCheckout"));
const SearchPage = lazy(() => import("./pages/SearchPage"));

// Affiliate pages - using direct imports since they use named exports
import { AffiliateIntro } from "./pages/AffiliateIntro";
import { AffiliateDashboard } from "./pages/AffiliateDashboard";  
import { AffiliateCompleteSignup } from "./pages/AffiliateCompleteSignup";
import { AffiliateLanding } from "./pages/AffiliateLanding";
// AffiliateFlowLanding removed - standalone architecture
import AffiliateCustomLanding from "./pages/AffiliateCustomLanding";

// Custom app pages
const CustomAppView = lazy(() => import("./pages/CustomAppView"));
const CustomAppPostCheckout = lazy(() => import("./pages/CustomAppPostCheckout"));
import PostCheckoutPage from '@/pages/PostCheckoutPage';

// Cover pages
import CoverPage from "./pages/CoverPage";
import StandaloneCoverPage from "./components/cover-pages/StandaloneCoverPage";

// Admin pages - using direct imports since they use named exports
import AdminLogin from "./pages/AdminLogin";
import AdminBypass from "./pages/AdminBypass";
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  // Global keyboard hiding on mobile scroll
  useGlobalKeyboardHiding();
  
  return (
    <RobustErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <AdminAuthFix />
              <ColdStartSolution />
              <GlobalCartProvider>
                <Toaster />
                <Sonner />
              <div className="min-h-screen">
                <Suspense fallback={<div />}>
                  <Routes>
                    {/* SIMPLE HOMEPAGE - redirect to the active delivery app */}
                    <Route path="/" element={<Navigate to="/app/party-on-delivery---concierge-" replace />} />
                    
                    {/* Core app routes - MUST come before catch-all */}
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/app/:appSlug" element={<CustomAppView />} />
                    
                    {/* Standalone Cover Pages - No restrictions */}
                    <Route path="/cover/:slug" element={<StandaloneCoverPage />} />
                    <Route path="/premier-concierge" element={<CoverPage />} />
                    
                    {/* Post-checkout pages only */}
                    <Route path="/post-checkout/:slug" element={<PostCheckoutPage />} />
                    
                    {/* Order completion - standardized routes */}
                    <Route path="/success" element={<Success />} />
                    <Route path="/order-complete" element={<OrderComplete />} />
                    <Route path="/post-checkout/:appName" element={<CustomAppPostCheckout />} />
                    
                    {/* Affiliate Routes */}
                    <Route path="/affiliate" element={<AffiliateIntro />} />
                    <Route path="/affiliate/dashboard" element={<AffiliateDashboard />} />
                    <Route path="/affiliate/admin-login" element={<AdminLogin />} />
                    <Route path="/affiliate/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                    <Route path="/affiliate/complete-signup" element={<AffiliateCompleteSignup />} />
                    <Route path="/a/:affiliateCode" element={<AffiliateLanding />} />
                    <Route path="/custom/:affiliateSlug" element={<AffiliateCustomLanding />} />
                    
                    {/* Admin Routes - consolidated to prevent remounting */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/bypass" element={<AdminBypass />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/*" element={<AdminDashboard />} />
                    
                    {/* Customer Routes */}
                    <Route path="/customer/login" element={<CustomerLogin />} />
                    <Route path="/customer/dashboard" element={<CustomerDashboard />} />
                    
                    {/* Test Routes */}
                    <Route path="/test-checkout" element={<TestCheckout />} />
                    
                    {/* CRITICAL: Catch-all route for dynamic cover pages - MUST BE LAST */}
                    <Route path="*" element={<DynamicRouteHandler />} />
                  </Routes>
                </Suspense>
              </div>
              </GlobalCartProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </RobustErrorBoundary>
  );
};

export default App;