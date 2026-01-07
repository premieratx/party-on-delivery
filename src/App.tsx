import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { GlobalCartProvider } from "@/components/common/GlobalCartProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { DynamicRouteHandler } from "@/components/routing/DynamicRouteHandler";
import { StandaloneCoverPage } from "@/components/cover-pages/StandaloneCoverPage";
import ConciergeIndex from "@/pages/ConciergeIndex";
import { ConciergeHome } from "@/components/concierge/ConciergeHome";
import { Navigation } from "@/components/concierge/Navigation";
import ItineraryPage from "@/pages/ItineraryPage";
import SharedItineraryPage from "@/pages/SharedItineraryPage";
import TransportPage from "@/pages/TransportPage";
import BoatsPage from "@/pages/BoatsPage";
import ExplorePage from "@/pages/ExplorePage";
import RentalsPage from "@/pages/RentalsPage";
import QuoteBuilderPage from "@/pages/QuoteBuilderPage";
import CustomAppView from "@/pages/CustomAppView";
import Checkout from "@/pages/Checkout";
import OrderComplete from "@/pages/OrderComplete";
import AdminDashboard from "@/pages/AdminDashboard";
import RequireAdmin from "@/components/admin/RequireAdmin";
import { AutoProductOrderFix } from "@/components/admin/AutoProductOrderFix";
import { TestDiscountCodes } from "@/components/TestDiscountCodes";
import HomePage from "@/pages/HomePage";

const App = () => {
  console.log('🚀 APP STARTING WITH PROPER ROUTING');
  
  return (
    <BrowserRouter>
      <AuthProvider>
        <GlobalCartProvider>
          <div className="min-h-screen">
            <Routes>
              {/* Homepage - shows default cover page */}
              <Route path="/" element={<HomePage />} />
              
              {/* Cover pages with specific slugs */}
              <Route path="/cover/:slug" element={<StandaloneCoverPage />} />
              
              {/* Concierge Framework - Accessible via /home */}
              <Route path="/home" element={
                <div>
                  <ConciergeHome />
                  <Navigation />
                </div>
              } />
              <Route path="/concierge" element={<ConciergeIndex />} />
              
              {/* Concierge Service Pages */}
              <Route path="/itinerary" element={<ItineraryPage />} />
              <Route path="/shared-itinerary/:shareId" element={<SharedItineraryPage />} />
              <Route path="/transport" element={<TransportPage />} />
              <Route path="/boats" element={<BoatsPage />} />
              <Route path="/boats/quote" element={<QuoteBuilderPage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/rentals" element={<RentalsPage />} />
              
              {/* Delivery apps - Integrated as a service */}
              <Route path="/app/:appSlug" element={<CustomAppView />} />
              
              {/* Checkout */}
              <Route path="/checkout" element={<Checkout />} />
              
              {/* Order Complete */}
              <Route path="/order-complete" element={<OrderComplete />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
              
              {/* Test Discount Integration - REMOVE WHEN READY */}
              <Route path="/test-discounts" element={<TestDiscountCodes />} />
              
              <Route path="/affiliate/admin-login" element={<DynamicRouteHandler />} />
              
              {/* Catch-all for cover pages and 404 */}
              <Route path="*" element={<DynamicRouteHandler />} />
            </Routes>
          </div>
          <Toaster />
        </GlobalCartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;