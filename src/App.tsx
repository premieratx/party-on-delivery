import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StripeProvider } from "@/components/payment/StripeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GlobalNavigation } from "@/components/common/GlobalNavigation";
import { PerformanceMonitor } from "@/components/common/PerformanceMonitor";
import Index from "./pages/Index";
import CoverPage from "./pages/CoverPage";
import Success from "./pages/Success";
import OrderComplete from "./pages/OrderComplete";
import { AffiliateIntro } from "./pages/AffiliateIntro";
import { AffiliateDashboard } from "./pages/AffiliateDashboard";
import { AffiliateLanding } from "./pages/AffiliateLanding";
import { AdminLogin } from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import { ProductManagement } from "./pages/ProductManagement";
import { AffiliateCompleteSignup } from "./pages/AffiliateCompleteSignup";
import CustomerLogin from "./pages/CustomerLogin";
import CustomerDashboard from "./pages/CustomerDashboard";
import OrderContinuation from "./pages/OrderContinuation";
import SharedOrderView from "./pages/SharedOrderView";
import GroupOrderView from "./pages/GroupOrderView";
import GroupOrderDashboard from "./components/GroupOrderDashboard";
import NotFound from "./pages/NotFound";
import TestSMS from "./components/TestSMS";
import { PartyPlanner } from "./pages/PartyPlanner";
import Checkout from "./pages/Checkout";
import AffiliateCustomLanding from "./pages/AffiliateCustomLanding";
import { ProductSearch } from "./pages/ProductSearch";
import CustomCollectionCreator from "./pages/CustomCollectionCreator";
import CustomDeliveryApp from "./pages/CustomDeliveryApp";
import CustomDeliveryPostCheckout from "./pages/CustomDeliveryPostCheckout";
import DeliveryAppView from "./pages/DeliveryAppView";
import CustomAppView from "./pages/CustomAppView";
import CustomAppPostCheckout from "./pages/CustomAppPostCheckout";
import { ChatPartyPlanner } from "./components/party-planner/ChatPartyPlanner";
import ConciergeService from "./pages/ConciergeService";
import PerformanceOptimization from "./pages/PerformanceOptimization";
import TestGroupOrderFlow from "./pages/TestGroupOrderFlow";
import GroupOrderInvite from "./pages/GroupOrderInvite";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <StripeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="pb-14"> {/* Add padding bottom for navigation bar */}
          <Routes>
            <Route path="/cover" element={<CoverPage />} />
            <Route path="/" element={<Index />} />
                  <Route path="/success" element={<Success />} />
                  <Route path="/order-complete" element={<OrderComplete />} />
                  
                  {/* Affiliate Routes */}
                  <Route path="/affiliate" element={<AffiliateIntro />} />
                  <Route path="/affiliate/dashboard" element={<AffiliateDashboard />} />
                  <Route path="/affiliate/admin-login" element={<AdminLogin />} />
                  <Route path="/affiliate/admin" element={<AdminDashboard />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/*" element={<AdminDashboard />} />
                  <Route path="/admin/product-management" element={<ProductManagement />} />
                  <Route path="/admin/create-collection" element={<CustomCollectionCreator />} />
                  <Route path="/affiliate/complete-signup" element={<AffiliateCompleteSignup />} />
                  <Route path="/a/:affiliateCode" element={<AffiliateLanding />} />
                  
                  {/* Custom Affiliate Landing Pages */}
                  <Route path="/custom/:affiliateSlug" element={<AffiliateCustomLanding />} />
                  
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
                  
                  {/* Search Route */}
                  <Route path="/search" element={<ProductSearch />} />
                  <Route path="/product-search" element={<ProductSearch />} />
                  
                   {/* Custom Delivery App */}
                   <Route path="/custom-delivery" element={<CustomDeliveryApp />} />
                   <Route path="/app/:appSlug" element={<CustomDeliveryApp />} />
                   <Route path="/app/:appSlug/success" element={<CustomDeliveryPostCheckout />} />
                   
                   {/* Delivery App Variations */}
                   <Route path="/delivery-app/:appSlug" element={<DeliveryAppView />} />
                   
                   {/* Individual Custom Delivery Apps - Dynamic Routes */}
                   <Route path="/:appName" element={<CustomAppView />} />
                   <Route path="/:appName/success" element={<CustomAppPostCheckout />} />
                  
                  {/* Test Routes */}
              <Route path="/test-group-order-flow" element={<TestGroupOrderFlow />} />
                  
                  {/* Concierge Service Route */}
                  <Route path="/concierge" element={<ConciergeService />} />
                  
                  {/* Performance Optimization Route */}
                  <Route path="/performance-optimization" element={<PerformanceOptimization />} />
                  
                   {/* Test Routes */}
                   <Route path="/test-sms" element={<TestSMS />} />
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
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
