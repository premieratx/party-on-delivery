import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Search, ArrowLeft, MapPin, Clock, Users, Phone, Mail, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroPartyAustin from '@/assets/hero-party-austin.jpg';
import partyOnDeliveryLogo from '@/assets/party-on-delivery-logo.png';

export default function AirbnbConciergeServiceStartScreen() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartOrder = () => {
    setIsLoading(true);
    // Store the app context for the custom delivery flow
    localStorage.setItem('currentAppContext', JSON.stringify({
      appName: 'airbnb-concierge-service',
      collections: ['cocktail-kits', 'spirits', 'tailgate-beer']
    }));
    navigate('/airbnb-concierge-service/tabs');
  };

  const handleSearchProducts = () => {
    setIsLoading(true);
    // Store the app context for the custom delivery flow
    localStorage.setItem('currentAppContext', JSON.stringify({
      appName: 'airbnb-concierge-service',
      collections: ['cocktail-kits', 'spirits', 'tailgate-beer']
    }));
    navigate('/airbnb-concierge-service/tabs');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen relative">
      {/* Hero Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroPartyAustin})` }}
      >
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 text-white">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleGoHome}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Main
          </Button>
          
          <img 
            src={partyOnDeliveryLogo} 
            alt="Party On Delivery" 
            className="h-12 w-auto"
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center text-white max-w-2xl mx-auto">
            {/* Hero Title */}
            <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">
              Lynn's Lodgings Concierge Service
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-white/90 leading-relaxed">
              All the Things, All the Fun
            </p>

            {/* Action Buttons */}
            <div className="space-y-4 max-w-md mx-auto">
              <Button 
                onClick={handleStartOrder}
                disabled={isLoading}
                className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-white border-0"
                size="lg"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Stock My BnB Now
              </Button>

              <Button 
                onClick={handleSearchProducts}
                disabled={isLoading}
                variant="outline"
                className="w-full h-14 text-lg bg-white/10 hover:bg-white/20 text-white border-white/30"
                size="lg"
              >
                <Search className="w-5 h-5 mr-2" />
                Search BnB Essentials
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 text-center">
              <div className="space-y-2">
                <Car className="w-8 h-8 mx-auto text-primary" />
                <p className="text-sm text-white/80">Fast Delivery</p>
              </div>
              <div className="space-y-2">
                <Clock className="w-8 h-8 mx-auto text-primary" />
                <p className="text-sm text-white/80">Same Day</p>
              </div>
              <div className="space-y-2">
                <Users className="w-8 h-8 mx-auto text-primary" />
                <p className="text-sm text-white/80">Group Orders</p>
              </div>
              <div className="space-y-2">
                <Phone className="w-8 h-8 mx-auto text-primary" />
                <p className="text-sm text-white/80">24/7 Support</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="mt-8 p-4 bg-black/30 rounded-lg backdrop-blur-sm">
              <p className="text-white/90 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Austin: (512) 123-PARTY
              </p>
              <p className="text-white/90">
                <Mail className="w-4 h-4 inline mr-2" />
                concierge@partyondelivery.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}