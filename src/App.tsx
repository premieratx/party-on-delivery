import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { GlobalCartProvider } from "@/components/common/GlobalCartProvider";
import { DynamicRouteHandler } from "@/components/routing/DynamicRouteHandler";
import CustomAppView from "@/pages/CustomAppView";
import Checkout from "@/pages/Checkout";

const App = () => {
  console.log('🚀 APP STARTING WITH PROPER ROUTING');
  
  return (
    <BrowserRouter>
      <GlobalCartProvider>
        <div className="min-h-screen">
          <Routes>
            {/* Homepage - redirect to delivery app */}
            <Route path="/" element={<Navigate to="/app/delivery" replace />} />
            
            {/* Delivery apps */}
            <Route path="/app/:appSlug" element={<CustomAppView />} />
            
            {/* Checkout */}
            <Route path="/checkout" element={<Checkout />} />
            
            {/* Catch-all for cover pages and 404 */}
            <Route path="*" element={<DynamicRouteHandler />} />
          </Routes>
        </div>
        <Toaster />
      </GlobalCartProvider>
    </BrowserRouter>
  );
};

export default App;