import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PartyPlanningButton } from '@/components/PartyPlanningButton';
import { ShoppingBag, Plus, ArrowRight, Users, Crown, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoImage from '@/assets/party-on-delivery-logo.png';

interface OrderContinuationProps {
  onStartNewOrder: () => void;
  onResumeOrder: () => void;
  onAddToRecentOrder: () => void;
  lastOrderInfo?: {
    orderNumber: string;
    total: number;
    date: string;
    address?: string;
    deliveryDate?: string;
    deliveryTime?: string;
    instructions?: string;
  };
  hasCartItems: boolean;
}

export const OrderContinuation: React.FC<OrderContinuationProps> = ({
  onStartNewOrder,
  onResumeOrder,
  onAddToRecentOrder,
  lastOrderInfo,
  hasCartItems
}) => {
  const navigate = useNavigate();

  const handleAffiliateLogin = () => {
    navigate('/affiliate');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-2">
      <Card className="max-w-sm w-full shadow-floating animate-fade-in">
        <CardHeader className="text-center py-4">
          {/* Condensed logo and heading */}
          <img 
            src={logoImage} 
            alt="Party On Delivery Logo" 
            className="w-24 h-24 mx-auto mb-2"
          />
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-brand-blue">
              Austin's Best Alcohol Delivery
            </h1>
            <CardTitle className="text-base text-brand-blue">
              Party On Delivery
            </CardTitle>
          </div>
          
        </CardHeader>
        
        <CardContent className="space-y-3 pb-4">
          {/* Start New Order button */}
          <Button 
            onClick={() => {
              onStartNewOrder();
              // Ensure we navigate to delivery app
              navigate('/?start=delivery');
            }}
            className="w-full h-12 text-base"
            variant="default"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Start New Order
          </Button>
          
          {/* Resume Order button - always show */}
          <Button 
            onClick={() => {
              onResumeOrder();
              // Ensure we navigate to delivery app
              navigate('/?start=delivery');
            }}
            className="w-full h-12 text-base"
            variant="outline"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Resume Order
          </Button>
          
          {/* Login to Manage Order button - always show */}
          <Button 
            onClick={() => navigate('/customer/login?redirect=dashboard')}
            className="w-full h-12 text-base"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Login to Manage Order
          </Button>
          
          {/* Performance Optimization button */}
          <div className="pt-2 border-t border-border">
            <Button 
              onClick={() => navigate('/performance-optimization')}
              className="w-full h-10 text-sm"
              variant="ghost"
            >
              <Zap className="w-4 h-4 mr-2" />
              Performance Dashboard
            </Button>
          </div>
          
          {/* Concierge Service button */}
          <div className="pt-2">
            <Button 
              onClick={() => navigate('/concierge')}
              className="w-full h-10 text-sm"
              variant="ghost"
            >
              <Crown className="w-4 h-4 mr-2" />
              Concierge Service
            </Button>
          </div>
          
          {/* Plan My Party button */}
          <div className="pt-2">
            <PartyPlanningButton />
          </div>
          
          {/* Affiliate Dashboard Login button */}
          <div className="pt-2">
            <Button 
              onClick={handleAffiliateLogin}
              className="w-full h-10 text-sm"
              variant="ghost"
            >
              <Users className="w-4 h-4 mr-2" />
              Affiliate Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};