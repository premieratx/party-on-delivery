import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { GlobalCartProvider } from "@/components/common/GlobalCartProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { DynamicRouteHandler } from "@/components/routing/DynamicRouteHandler";
import CustomAppView from "@/pages/CustomAppView";
import Checkout from "@/pages/Checkout";
import OrderComplete from "@/pages/OrderComplete";
import AdminDashboard from "@/pages/AdminDashboard";
import RequireAdmin from "@/components/admin/RequireAdmin";
import { AutoProductOrderFix } from "@/components/admin/AutoProductOrderFix";
import { VisibleSyncFixer } from "@/components/VisibleSyncFixer";

const App = () => {
  console.log('🚀 APP STARTING WITH PROPER ROUTING');
  
  return (
    <BrowserRouter>
      <AuthProvider>
        <GlobalCartProvider>
          <VisibleSyncFixer />
          <div className="min-h-screen">
            <Routes>
              {/* Homepage - redirect to delivery app */}
              <Route path="/" element={<Navigate to="/app/delivery" replace />} />
              
              {/* Delivery apps */}
              <Route path="/app/:appSlug" element={<CustomAppView />} />
              
              {/* Checkout */}
              <Route path="/checkout" element={<Checkout />} />
              
              {/* Order Complete */}
              <Route path="/order-complete" element={<OrderComplete />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
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