import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// Removed Stripe integration
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GlobalNavigation } from "@/components/common/GlobalNavigation";
import { GlobalCartProvider } from "@/components/common/GlobalCartProvider";
// Removed sync components from global app - moved to admin dashboard
// import { PerformanceMonitor } from "@/components/common/PerformanceMonitor"; // DISABLED
import { Suspense, lazy } from "react";
import RequireAdmin from "@/components/admin/RequireAdmin";
import { TriggerProductSync } from "@/components/TriggerProductSync";

// Core pages that load immediately
import Index from "./pages/Index";

import VoiceChat from "./pages/VoiceChat";
// PARTY PLANNER COMPLETELY REMOVED
import NotFound from "./pages/NotFound";

// Lazy load all other components
const Success = lazy(() => import("./pages/Success"));
const OrderComplete = lazy(() => import("./pages/OrderComplete"));

// Affiliate routes
const AffiliateIntro = lazy(() => import("./pages/AffiliateIntro").then(m => ({ default: m.AffiliateIntro })));
const AffiliateDashboard = lazy(() => import("./pages/AffiliateDashboard").then(m => ({ default: m.AffiliateDashboard })));
const AffiliateLanding = lazy(() => import("./pages/AffiliateLanding").then(m => ({ default: m.AffiliateLanding })));
const AffiliateCompleteSignup = lazy(() => import("./pages/AffiliateCompleteSignup").then(m => ({ default: m.AffiliateCompleteSignup })));
const AffiliateCustomLanding = lazy(() => import("./pages/AffiliateCustomLanding"));

// Admin routes
const AdminLogin = lazy(() => import("./pages/AdminLogin").then(m => ({ default: m.AdminLogin })));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ProductManagement = lazy(() => import("./pages/ProductManagement").then(m => ({ default: m.ProductManagement })));
const CustomCollectionCreator = lazy(() => import("./pages/CustomCollectionCreator"));
const DeliveryAppManagerPage = lazy(() => import("./pages/DeliveryAppManager"));
const CoverPagesAdmin = lazy(() => import("./pages/CoverPagesAdmin"));
const AdminQuote = lazy(() => import("./pages/AdminQuote"));
// Customer routes
const CustomerAuth = lazy(() => import("./pages/CustomerAuth"));
const CustomerLogin = lazy(() => import("./pages/CustomerLogin"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));
const OrderContinuation = lazy(() => import("./pages/OrderContinuation"));

// Group order routes - REMOVED for cleanup

// Party planning routes - removed (replaced by user's better version)
const Checkout = lazy(() => import("./pages/Checkout"));

// Delivery app routes
const CustomAppView = lazy(() => import("./pages/CustomAppView"));
const CustomAppPostCheckout = lazy(() => import("./pages/CustomAppPostCheckout"));
const ShortLinkResolver = lazy(() => import("./pages/ShortLinkResolver"));

// Specific custom apps
const CustomPartyOnDeliveryStartScreen = lazy(() => import("./pages/CustomPartyOnDeliveryStartScreen"));
const CustomPartyOnDeliveryPostCheckout = lazy(() => import("./pages/CustomPartyOnDeliveryPostCheckout"));

// Other routes
const ProductSearch = lazy(() => import("./pages/ProductSearch").then(m => ({ default: m.ProductSearch })));
const SearchPage = lazy(() => import("./pages/OptimizedProductSearch"));
const ConciergeService = lazy(() => import("./pages/ConciergeService"));
const PerformanceOptimization = lazy(() => import("./pages/PerformanceOptimization"));
const PerformanceTests = lazy(() => import("./pages/PerformanceTests"));
const TestSMS = lazy(() => import("./components/TestSMS"));

const QuotePreview = lazy(() => import("./pages/QuotePreview"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
    },
  },
});

// Simple loading without spinning animation
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-lg text-muted-foreground">Loading...</div>
  </div>
);

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {/* Removed StripeProvider */}
          <TooltipProvider>
            <BrowserRouter>
              <GlobalCartProvider>
                <Toaster />
                <Sonner />
                <div className="pb-14">
                <Suspense fallback={null}>
                  <Routes>
                    {/* Core Routes - Main Delivery App as homepage */}
                    <Route path="/" element={<Index />} />
                    
                    <Route path="/app/:appSlug" element={<CustomAppView />} />
                    <Route path="/voice-chat" element={<VoiceChat />} />
                    {/* PARTY PLANNER ROUTE REMOVED */}
                    
                    {/* Order completion */}
                    <Route path="/success" element={<Success />} />
                    <Route path="/order-complete" element={<OrderComplete />} />
                    <Route path="/post-checkout/:appName" element={<CustomAppPostCheckout />} />
                    <Route path="/custom-post-checkout/:appName" element={<CustomAppPostCheckout />} />
                    <Route path="/custom-party-on-delivery-post-checkout" element={<CustomPartyOnDeliveryPostCheckout />} />
                    
                    {/* Affiliate Routes */}
                    <Route path="/affiliate" element={<AffiliateIntro />} />
                    <Route path="/affiliate/dashboard" element={<AffiliateDashboard />} />
                    <Route path="/affiliate/admin-login" element={<AdminLogin />} />
                    <Route path="/affiliate/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                    <Route path="/affiliate/complete-signup" element={<AffiliateCompleteSignup />} />
                    <Route path="/a/:affiliateCode" element={<AffiliateLanding />} />
                    <Route path="/custom/:affiliateSlug" element={<AffiliateCustomLanding />} />
                    
                    {/* Admin Routes - These should have auth guards */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                    <Route path="/admin/*" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                    <Route path="/admin/dashboard" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
<Route path="/admin/product-management" element={<RequireAdmin><ProductManagement /></RequireAdmin>} />
<Route path="/admin/create-collection" element={<RequireAdmin><CustomCollectionCreator /></RequireAdmin>} />
<Route path="/admin/delivery-app-manager" element={<RequireAdmin><DeliveryAppManagerPage /></RequireAdmin>} />
<Route path="/admin/cover-pages" element={<RequireAdmin><CoverPagesAdmin /></RequireAdmin>} />
<Route path="/admin/quotes" element={<RequireAdmin><AdminQuote /></RequireAdmin>} />
                    
                    {/* Customer Routes */}
                    <Route path="/customer/auth" element={<CustomerAuth />} />
                    <Route path="/customer/login" element={<CustomerLogin />} />
                    <Route path="/customer/dashboard" element={<CustomerDashboard />} />
                    <Route path="/order-continuation" element={<OrderContinuation />} />
                    <Route path="/manage-order" element={<CustomerAuth />} />
                    
                    {/* Shared Order Routes - REMOVED for cleanup */}
                    
                    {/* Party Planning Routes - removed (replaced by user's better version) */}
                    <Route path="/checkout" element={<Checkout />} />
                    
                    {/* Search Routes */}
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/product-search" element={<SearchPage />} />
                    
                    {/* Main Delivery App - removed, now handled by Index page */}
                    
                    {/* Party On Delivery Custom Routes */}
                    <Route path="/app/party-on-delivery---concierge-" element={<CustomPartyOnDeliveryStartScreen />} />
                    <Route path="/app/party-on-delivery---concierge-/order-complete" element={<CustomPartyOnDeliveryPostCheckout />} />
                    
                    {/* Dynamic delivery app routes - removed duplicate */}
                    
                    {/* Test Routes */}
                    <Route path="/test-sms" element={<TestSMS />} />
                    
{/* Utility Routes */}
<Route path="/concierge" element={<ConciergeService />} />
<Route path="/performance-optimization" element={<PerformanceOptimization />} />
<Route path="/performance" element={<PerformanceTests />} />

                    
                    {/* Short link resolver */}
                    <Route path="/:appShortPath/:affiliateSlug" element={<ShortLinkResolver />} />
                    <Route path="/:affiliateSlug/:coverSlug" element={<ShortLinkResolver />} />
                    <Route path="/:shortPath" element={<ShortLinkResolver />} />

                     {/* Quote Routes */}
                     <Route path="/quote-preview" element={<QuotePreview />} />
                     
                     {/* 404 - MUST be absolute last */}
                     <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
               </div>
                {/* <PerformanceMonitor /> DISABLED */}
                <GlobalNavigation />
               </GlobalCartProvider>
            </BrowserRouter>
          </TooltipProvider>
        {/* Removed StripeProvider closing tag */}
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
