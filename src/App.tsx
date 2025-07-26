import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StripeProvider } from "@/components/payment/StripeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Success from "./pages/Success";
import OrderComplete from "./pages/OrderComplete";
import { AffiliateIntro } from "./pages/AffiliateIntro";
import { AffiliateDashboard } from "./pages/AffiliateDashboard";
import { AffiliateLanding } from "./pages/AffiliateLanding";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminDashboard";
import { ProductManagement } from "./pages/ProductManagement";
import { AffiliateCompleteSignup } from "./pages/AffiliateCompleteSignup";
import CustomerLogin from "./pages/CustomerLogin";
import CustomerDashboard from "./pages/CustomerDashboard";
import OrderContinuation from "./pages/OrderContinuation";
import SharedOrderView from "./pages/SharedOrderView";
import GroupOrderView from "./pages/GroupOrderView";
import NotFound from "./pages/NotFound";
import TestSMS from "./components/TestSMS";
import { PartyPlanner } from "./pages/PartyPlanner";
import Checkout from "./pages/Checkout";
import AffiliateCustomLanding from "./pages/AffiliateCustomLanding";
import { ProductSearch } from "./pages/ProductSearch";

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
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/success" element={<Success />} />
                <Route path="/order-complete" element={<OrderComplete />} />
                
                {/* Affiliate Routes */}
                <Route path="/affiliate" element={<AffiliateIntro />} />
                <Route path="/affiliate/dashboard" element={<AffiliateDashboard />} />
                <Route path="/affiliate/admin-login" element={<AdminLogin />} />
                <Route path="/affiliate/admin" element={<AdminDashboard />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/product-management" element={<ProductManagement />} />
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
                <Route path="/order/:shareToken" element={<GroupOrderView />} />
                <Route path="/shared-order/:shareToken" element={<SharedOrderView />} />
                
                {/* Party Planning Routes */}
                <Route path="/plan-my-party" element={<PartyPlanner />} />
                <Route path="/checkout" element={<Checkout />} />
                
                {/* Search Route */}
                <Route path="/search" element={<ProductSearch />} />
                
                {/* Test Routes */}
                <Route path="/test-sms" element={<TestSMS />} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </StripeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
