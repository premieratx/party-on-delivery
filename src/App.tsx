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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => (
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
              <Route path="/a/:affiliateCode" element={<AffiliateLanding />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </StripeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
