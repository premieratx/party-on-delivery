import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VideoBackground } from "@/components/common/VideoBackground";
import { PerformanceMonitor } from "@/components/common/PerformanceMonitor";
import logo from '@/assets/party-on-delivery-logo.svg';

const CustomPartyOnDeliveryStartScreen = () => {
  const navigate = useNavigate();

  const handleStartOrder = () => {
    navigate('/app/party-on-delivery---concierge-/tabs');
  };

  return (
    <VideoBackground>
      {/* Performance Monitor (only shows in debug mode) */}
      <PerformanceMonitor />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-0">
          <div className="p-8 text-center space-y-6">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img 
                src={logo} 
                alt="Party On Delivery & Concierge"
                className="h-20 w-auto"
              />
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Party On Delivery & Concierge
              </h1>
              <p className="text-gray-600">
                Premium party supplies and alcohol delivered to your door
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handleStartOrder}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary transition-all duration-300"
              >
                Start New Order
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="w-full h-12"
              >
                Back to Main App
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </VideoBackground>
  );
};

export default CustomPartyOnDeliveryStartScreen;