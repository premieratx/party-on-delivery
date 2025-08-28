import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { GlobalCartProvider } from "@/components/common/GlobalCartProvider";
import { DynamicRouteHandler } from "@/components/routing/DynamicRouteHandler";
import CustomAppView from "@/pages/CustomAppView";

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