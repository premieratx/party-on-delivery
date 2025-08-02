import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Package, Plus, Users, Calendar, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDeliveryDate } from '@/utils/deliveryInfoManager';
import partyOnDeliveryLogo from '@/assets/party-on-delivery-logo.png';

interface CustomOrderContinuationProps {
  onStartNewOrder: () => void;
  onResumeOrder: () => void;
  onAddToRecentOrder: () => void;
  lastOrderInfo: any;
  hasCartItems: boolean;
}

export const CustomOrderContinuation: React.FC<CustomOrderContinuationProps> = ({
  onStartNewOrder,
  onResumeOrder,
  onAddToRecentOrder,
  lastOrderInfo,
  hasCartItems
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-3">
            <img 
              src={partyOnDeliveryLogo} 
              alt="Party on Delivery" 
              className="h-8 w-auto object-contain"
            />
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900">Custom Delivery</h1>
              <p className="text-sm text-purple-600 font-medium">Premium Service</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        
        {/* Welcome Message */}
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Store className="w-8 h-8 text-purple-600" />
            </div>
            <CardTitle className="text-xl text-gray-900">Welcome to Custom Delivery!</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Your personalized delivery experience with curated product selections
            </p>
          </CardHeader>
        </Card>

        {/* Recent Order Card - Show if exists */}
        {lastOrderInfo && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Clock className="w-5 h-5" />
                Recent Order Available
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Calendar className="w-4 h-4" />
                <span>{formatDeliveryDate(lastOrderInfo.deliveryDate)}</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {lastOrderInfo.deliveryTime}
                </Badge>
              </div>
              
              {lastOrderInfo.deliveryAddress && (
                <div className="flex items-start gap-2 text-sm text-blue-700">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">
                    {typeof lastOrderInfo.deliveryAddress === 'string' 
                      ? lastOrderInfo.deliveryAddress 
                      : lastOrderInfo.deliveryAddress?.street || 'Address on file'
                    }
                  </span>
                </div>
              )}
              
              <Button 
                onClick={onAddToRecentOrder}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to This Order
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Current Cart Status - Show if has items */}
        {hasCartItems && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-green-900">Cart in Progress</p>
                  <p className="text-sm text-green-600">You have items ready to order</p>
                </div>
              </div>
              
              <Button 
                onClick={onResumeOrder}
                className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white"
              >
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Primary Action - Start New Order */}
        <Card className="border-purple-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Start Fresh Order</h3>
                <p className="text-sm text-gray-600">
                  Browse our curated selection and create a new order
                </p>
              </div>
              
              <Button 
                onClick={onStartNewOrder}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                size="lg"
              >
                Browse Products
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Back to Main App */}
        <Card className="border-gray-200">
          <CardContent className="pt-6">
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Back to Main App
            </Button>
          </CardContent>
        </Card>

        {/* Feature Highlights */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3 text-center">Custom Delivery Features</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Curated product selection</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Premium delivery service</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Personalized experience</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};