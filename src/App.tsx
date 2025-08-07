import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StripeProvider } from "@/components/payment/StripeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GlobalNavigation } from "@/components/common/GlobalNavigation";
import { PerformanceMonitor } from "@/components/common/PerformanceMonitor";
import { Suspense, lazy } from "react";

// Core pages that load immediately
import Index from "./pages/Index";
import CoverPage from "./pages/CoverPage";
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

// Customer routes
const CustomerLogin = lazy(() => import("./pages/CustomerLogin"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));
const OrderContinuation = lazy(() => import("./pages/OrderContinuation"));

// Group order routes
const GroupOrderView = lazy(() => import("./pages/GroupOrderView"));
const GroupOrderDashboard = lazy(() => import("./components/GroupOrderDashboard"));
const SharedOrderView = lazy(() => import("./pages/SharedOrderView"));
const GroupOrderInvite = lazy(() => import("./pages/GroupOrderInvite"));
const TestGroupOrderFlow = lazy(() => import("./pages/TestGroupOrderFlow"));

// Party planning routes
const PartyPlanner = lazy(() => import("./pages/PartyPlanner").then(m => ({ default: m.PartyPlanner })));
const ChatPartyPlanner = lazy(() => import("./components/party-planner/ChatPartyPlanner").then(m => ({ default: m.ChatPartyPlanner })));
const Checkout = lazy(() => import("./pages/Checkout"));

// Delivery app routes
const CustomAppView = lazy(() => import("./pages/CustomAppView"));
const CustomAppPostCheckout = lazy(() => import("./pages/CustomAppPostCheckout"));

// Specific custom apps
const CustomPartyOnDeliveryStartScreen = lazy(() => import("./pages/CustomPartyOnDeliveryStartScreen"));
const CustomPartyOnDeliveryPostCheckout = lazy(() => import("./pages/CustomPartyOnDeliveryPostCheckout"));

// Other routes
const ProductSearch = lazy(() => import("./pages/ProductSearch").then(m => ({ default: m.ProductSearch })));
const ConciergeService = lazy(() => import("./pages/ConciergeService"));
const PerformanceOptimization = lazy(() => import("./pages/PerformanceOptimization"));
const TestSMS = lazy(() => import("./components/TestSMS"));

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

// Loading component for suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <StripeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="pb-14">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Core pages - no lazy loading */}
                    <Route path="/cover" element={<CoverPage />} />
                    <Route path="/" element={<Index />} />
                    
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
                    <Route path="/affiliate/admin" element={<AdminDashboard />} />
                    <Route path="/affiliate/complete-signup" element={<AffiliateCompleteSignup />} />
                    <Route path="/a/:affiliateCode" element={<AffiliateLanding />} />
                    <Route path="/custom/:affiliateSlug" element={<AffiliateCustomLanding />} />
                    
                    {/* Admin Routes - These should have auth guards */}
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/*" element={<AdminDashboard />} />
                    <Route path="/admin/product-management" element={<ProductManagement />} />
                    <Route path="/admin/create-collection" element={<CustomCollectionCreator />} />
                    <Route path="/admin/delivery-app-manager" element={<DeliveryAppManagerPage />} />
                    
                    {/* Customer Routes */}
                    <Route path="/customer/login" element={<CustomerLogin />} />
                    <Route path="/customer/dashboard" element={<CustomerDashboard />} />
                    <Route path="/order-continuation" element={<OrderContinuation />} />
                    <Route path="/manage-order" element={<CustomerLogin />} />
                    
                    {/* Shared Order Routes */}
                    <Route path="/order/:shareToken" element={<GroupOrderDashboard />} />
                    <Route path="/group/:shareToken" element={<GroupOrderView />} />
                    <Route path="/shared-order/:shareToken" element={<SharedOrderView />} />
                    <Route path="/join/:shareToken" element={<GroupOrderInvite />} />
                    
                    {/* Party Planning Routes */}
                    <Route path="/plan-my-party" element={<PartyPlanner />} />
                    <Route path="/chat-party-planner" element={<ChatPartyPlanner />} />
                    <Route path="/checkout" element={<Checkout />} />
                    
                    {/* Search Routes */}
                    <Route path="/search" element={<ProductSearch />} />
                    <Route path="/product-search" element={<ProductSearch />} />
                    
                    {/* Main Delivery App - removed, now handled by Index page */}
                    
                    {/* Party On Delivery Custom Routes */}
                    <Route path="/app/party-on-delivery---concierge-" element={<CustomPartyOnDeliveryStartScreen />} />
                    <Route path="/app/party-on-delivery---concierge-/order-complete" element={<CustomPartyOnDeliveryPostCheckout />} />
                    
                    {/* Dynamic delivery app routes */}
                    <Route path="/app/:appName" element={<CustomAppView />} />
                    <Route path="/app/:appName/order-complete" element={<CustomAppPostCheckout />} />
                    
                    {/* Test Routes */}
                    <Route path="/test-group-order-flow" element={<TestGroupOrderFlow />} />
                    <Route path="/test-sms" element={<TestSMS />} />
                    
                    {/* Utility Routes */}
                    <Route path="/concierge" element={<ConciergeService />} />
                    <Route path="/performance-optimization" element={<PerformanceOptimization />} />
                    
                    
                    {/* 404 - MUST be absolute last */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </div>
              <PerformanceMonitor />
              <GlobalNavigation />
            </BrowserRouter>
          </TooltipProvider>
        </StripeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
