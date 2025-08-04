import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ShoppingCart, Plus, Minus, Trash2, Package } from 'lucide-react';
import { CustomDeliveryInfo } from './CustomDeliveryAppWidget';

interface CustomDeliveryCartProps {
  isOpen: boolean;
  onClose: () => void;
  items: any[];
  onUpdateQuantity: (id: string, variant: string | undefined, quantity: number) => void;
  onRemoveItem: (id: string, variant?: string) => void;
  totalPrice: number;
  onCheckout: () => void;
  deliveryInfo: CustomDeliveryInfo;
  onEmptyCart: () => void;
}

export const CustomDeliveryCart: React.FC<CustomDeliveryCartProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  totalPrice,
  onCheckout,
  deliveryInfo,
  onEmptyCart
}) => {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (items.length === 0) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          <div className="h-full flex flex-col bg-white">
            <SheetHeader className="px-6 py-4 border-b">
              <SheetTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Custom Delivery Cart
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-500 mb-4">Start adding products to see them here!</p>
                <Button onClick={onClose} className="bg-purple-600 hover:bg-purple-700">
                  Continue Shopping
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <div className="h-full flex flex-col bg-white">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Custom Delivery Cart
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </Badge>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-4">
              {items.map((item) => (
                <Card key={`${item.id}-${item.variant || 'default'}`} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                          {item.title}
                        </h3>
                        
                        {item.variant && (
                          <p className="text-xs text-gray-500 mt-1">
                            {item.variant}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className="font-bold text-purple-600">
                            ${item.price.toFixed(2)}
                          </span>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center bg-gray-100 rounded-lg">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onUpdateQuantity(item.id, item.variant, item.quantity - 1)}
                                className="h-8 w-8 p-0 hover:bg-gray-200"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              
                              <span className="font-medium text-sm min-w-[2rem] text-center">
                                {item.quantity}
                              </span>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onUpdateQuantity(item.id, item.variant, item.quantity + 1)}
                                className="h-8 w-8 p-0 hover:bg-gray-200"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemoveItem(item.id, item.variant)}
                              className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Cart Footer */}
          <div className="border-t bg-gray-50 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-purple-600">
                ${totalPrice.toFixed(2)}
              </span>
            </div>

            <div className="space-y-2">
              <Button
                onClick={onCheckout}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                size="lg"
              >
                Continue to Checkout
              </Button>
              
              <Button
                onClick={onEmptyCart}
                variant="outline"
                className="w-full text-gray-600 border-gray-300"
                size="sm"
              >
                Empty Cart
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Secure checkout powered by Stripe
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};