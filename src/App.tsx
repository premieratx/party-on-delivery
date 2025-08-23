import { AdminAuthFix } from '@/components/admin/AdminAuthFix';
import ColdStartSolution from '@/components/admin/ColdStartSolution';
import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAppConfig } from '@/hooks/useAppConfig';
import RequireAdmin from "./components/admin/RequireAdmin";
import { GlobalCartProvider } from "@/components/common/GlobalCartProvider";
import { AuthProvider } from '@/contexts/AuthContext';
import { RobustErrorBoundary } from '@/components/common/RobustErrorBoundary';

// Simple, bulletproof homepage
import DynamicHomepage from "./pages/DynamicHomepage";
const Success = lazy(() => import("./pages/Success"));
const OrderComplete = lazy(() => import("./pages/OrderComplete"));
const CustomerLogin = lazy(() => import("./pages/CustomerLogin"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));
const Checkout = lazy(() => import("./pages/Checkout"));
const TestCheckout = lazy(() => import("./pages/TestCheckout"));
const TestCoverPage = lazy(() => import("./pages/TestCoverPage"));
const DirectCoverPage = lazy(() => import("./pages/DirectCoverPage"));
const BasicCoverPage = lazy(() => import("./pages/BasicCoverPage"));
const RoutingTest = lazy(() => import("./pages/RoutingTest"));
const MobileCoverPage = lazy(() => import("./pages/MobileCoverPage"));
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

// Admin pages - using direct imports since they use named exports
import { AdminLogin } from "./pages/AdminLogin";
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
  const { config } = useAppConfig();
  
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
                    {/* Cover page routes - HIGHEST PRIORITY */}
                    <Route path="/premier-concierge" element={<MobileCoverPage />} />
                    <Route path="/cover/:slug" element={<MobileCoverPage />} />
                    
                    {/* DYNAMIC HOMEPAGE ROUTE */}
                    <Route path="/" element={<DynamicHomepage />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/delivery" element={<DynamicHomepage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/app/:appSlug" element={<CustomAppView />} />
                    
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
                    <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                    <Route path="/admin/*" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                    
                    {/* Customer Routes */}
                    <Route path="/customer/login" element={<CustomerLogin />} />
                    <Route path="/customer/dashboard" element={<CustomerDashboard />} />
                    
                    {/* Test Routes */}
                    <Route path="/test-checkout" element={<TestCheckout />} />
                    <Route path="/test-cover" element={<TestCoverPage />} />
                    <Route path="/direct-cover" element={<DirectCoverPage />} />
                    <Route path="/basic" element={<BasicCoverPage />} />
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