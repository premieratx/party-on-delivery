import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format, isAfter } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, MapPin, Clock, Package, Users, AlertCircle } from 'lucide-react';
import { DeliveryWidget } from '@/components/DeliveryWidget';
import { supabase } from '@/integrations/supabase/client';

interface OrderItem {
  id: string;
  title: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
}

interface GroupOrderInfo {
  orderNumber: string;
  total: number;
  date: string;
  orderId: string;
  address: string;
  deliveryDate: string;
  deliveryTime: string;
  instructions?: string;
  customerName?: string;
  customerEmail?: string;
  items?: OrderItem[];
  subtotal?: number;
}

const GroupOrder = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [groupOrderInfo, setGroupOrderInfo] = useState<GroupOrderInfo | null>(null);
  const [isOrderExpired, setIsOrderExpired] = useState(false);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [showDeliveryWidget, setShowDeliveryWidget] = useState(false);

  useEffect(() => {
    const fetchGroupOrderData = async () => {
      // Parse the group order ID from URL params
      const searchParams = new URLSearchParams(location.search);
      const groupOrderId = searchParams.get('order');
      
      if (groupOrderId) {
        try {
          // First try localStorage for quick access
          const orderData = localStorage.getItem('partyondelivery_last_order');
          if (orderData) {
            const order = JSON.parse(orderData);
            if (order.orderNumber === groupOrderId) {
              // Try to fetch detailed order info from Shopify
              try {
                const { data: shopifyDetails, error: shopifyError } = await supabase.functions.invoke('get-shopify-order-details', {
                  body: { orderNumber: groupOrderId }
                });

                if (!shopifyError && shopifyDetails?.success) {
                  const enhancedOrder = {
                    ...order,
                    items: shopifyDetails.order.items,
                    subtotal: shopifyDetails.order.subtotal,
                    deliveryDate: shopifyDetails.order.delivery.date || order.deliveryDate,
                    deliveryTime: shopifyDetails.order.delivery.time || order.deliveryTime,
                    address: shopifyDetails.order.delivery.address || order.address,
                    instructions: shopifyDetails.order.delivery.instructions || order.instructions
                  };
                  setGroupOrderInfo(enhancedOrder);
                } else {
                  setGroupOrderInfo(order);
                }
              } catch (shopifyError) {
                console.error('Error fetching Shopify details:', shopifyError);
                setGroupOrderInfo(order);
              }

              // Check if the order is expired
              if (order.deliveryDate && order.deliveryTime) {
                const deliveryDateTime = new Date(`${order.deliveryDate}T${convertTimeToDateTime(order.deliveryTime)}`);
                setIsOrderExpired(isAfter(new Date(), deliveryDateTime));
              }
              return;
            }
          }

          // If not in localStorage, fetch from database and Shopify
          const { data: shopifyOrder, error } = await supabase
            .from('shopify_orders')
            .select(`
              shopify_order_number,
              amount,
              created_at,
              order_groups (
                customer_email,
                customer_name,
                delivery_address,
                delivery_city,
                delivery_state,
                delivery_zip,
                delivery_instructions,
                created_at
              )
            `)
            .eq('shopify_order_number', groupOrderId)
            .single();

          if (error) {
            console.error('Error fetching order:', error);
            return;
          }

          if (shopifyOrder?.order_groups) {
            const orderGroup = shopifyOrder.order_groups;
            const fullAddress = `${orderGroup.delivery_address}, ${orderGroup.delivery_city}, ${orderGroup.delivery_state} ${orderGroup.delivery_zip}`;
            
            // Fetch detailed order info from Shopify
            const { data: shopifyDetails, error: shopifyError } = await supabase.functions.invoke('get-shopify-order-details', {
              body: { orderNumber: groupOrderId }
            });

            let groupOrder;
            if (!shopifyError && shopifyDetails?.success) {
              // Use detailed Shopify data
              groupOrder = {
                orderNumber: shopifyOrder.shopify_order_number,
                total: shopifyDetails.order.total,
                subtotal: shopifyDetails.order.subtotal,
                date: shopifyOrder.created_at,
                orderId: shopifyOrder.shopify_order_number,
                address: shopifyDetails.order.delivery.address || fullAddress,
                deliveryDate: shopifyDetails.order.delivery.date || new Date(shopifyOrder.created_at).toISOString().split('T')[0],
                deliveryTime: shopifyDetails.order.delivery.time || "2:00 PM - 3:00 PM",
                instructions: shopifyDetails.order.delivery.instructions || orderGroup.delivery_instructions,
                customerName: shopifyDetails.order.customer.name || orderGroup.customer_name,
                customerEmail: shopifyDetails.order.customer.email || orderGroup.customer_email,
                items: shopifyDetails.order.items
              };
            } else {
              // Fallback to basic data
              const orderDate = new Date(shopifyOrder.created_at);
              const deliveryDate = new Date(orderDate.getTime() + 2 * 60 * 60 * 1000);
              
              groupOrder = {
                orderNumber: shopifyOrder.shopify_order_number,
                total: shopifyOrder.amount,
                date: shopifyOrder.created_at,
                orderId: shopifyOrder.shopify_order_number,
                address: fullAddress,
                deliveryDate: deliveryDate.toISOString().split('T')[0],
                deliveryTime: "2:00 PM - 3:00 PM",
                instructions: orderGroup.delivery_instructions,
                customerName: orderGroup.customer_name,
                customerEmail: orderGroup.customer_email
              };
            }
            
            setGroupOrderInfo(groupOrder);
            
            // Check if the order is expired
            const deliveryDateTime = new Date(`${groupOrder.deliveryDate}T${convertTimeToDateTime(groupOrder.deliveryTime)}`);
            setIsOrderExpired(isAfter(new Date(), deliveryDateTime));
          }
        } catch (error) {
          console.error('Error parsing group order:', error);
        }
      }
    };

    fetchGroupOrderData();
  }, [location]);

  const convertTimeToDateTime = (timeSlot: string): string => {
    const startTime = timeSlot.split(' - ')[0];
    const [time, period] = startTime.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}:00`;
  };

  const handleConfirmAddress = () => {
    if (groupOrderInfo) {
      // Set up group order context for delivery widget
      const groupOrderContext = {
        isGroupOrder: true,
        originalOrderNumber: groupOrderInfo.orderNumber,
        deliveryDate: groupOrderInfo.deliveryDate,
        deliveryTime: groupOrderInfo.deliveryTime,
        address: groupOrderInfo.address,
        instructions: groupOrderInfo.instructions || '',
        customerName: groupOrderInfo.customerName,
        customerEmail: groupOrderInfo.customerEmail
      };
      
      localStorage.setItem('partyondelivery_group_order', JSON.stringify(groupOrderContext));
      localStorage.setItem('partyondelivery_add_to_order', 'true');
      setAddressConfirmed(true);
      setShowDeliveryWidget(true);
    }
  };

  const handleUseNewAddress = () => {
    // Clear group order context and redirect to normal flow
    localStorage.removeItem('partyondelivery_group_order');
    navigate('/');
  };

  if (!groupOrderInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The group order link you followed is invalid or has expired.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Start New Order
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isOrderExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Order Has Expired</h1>
            <p className="text-muted-foreground mb-6">
              This group order has already been delivered and is no longer available for additional items.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Start New Order
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showDeliveryWidget) {
    return <DeliveryWidget />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-2xl mx-auto space-y-6 pt-8">
        {/* Group Order Header */}
        <Card className="shadow-floating animate-fade-in text-center">
          <CardContent className="p-8">
            <Users className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
              Add to Airbnb Delivery Order
            </h1>
            <p className="text-lg text-muted-foreground mb-4">
              to <strong>{groupOrderInfo.address}</strong>
            </p>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Original Order #{groupOrderInfo.orderNumber}
            </Badge>
          </CardContent>
        </Card>

        {/* Original Order Summary */}
        <Card className="shadow-floating animate-fade-in border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Package className="w-5 h-5" />
              Original Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order Total:</span>
                  <span className="font-medium">${groupOrderInfo.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ordered by:</span>
                  <span className="font-medium">{groupOrderInfo.customerName || groupOrderInfo.customerEmail}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Delivery:</span>
                  <span className="font-medium">
                    {format(new Date(groupOrderInfo.deliveryDate), 'MMM d, yyyy')} • {groupOrderInfo.deliveryTime}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span className="font-medium">{groupOrderInfo.address}</span>
                </div>
              </div>
            </div>
            
            {groupOrderInfo.instructions && (
              <div className="pt-3 border-t border-primary/20">
                <div className="text-sm">
                  <span className="text-muted-foreground">Delivery Instructions:</span>
                  <span className="font-medium ml-2">{groupOrderInfo.instructions}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Items Section */}
        {groupOrderInfo.items && groupOrderInfo.items.length > 0 && (
          <Card className="shadow-floating animate-fade-in border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <Package className="w-5 h-5" />
                Here's what we have ordered so far
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {groupOrderInfo.items.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border">
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-12 h-12 object-cover rounded-md bg-muted"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {item.title.replace(/(\d+)\s*Pack/gi, '$1pk').replace(/(\d+)\s*oz/gi, '$1oz')}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Qty: {item.quantity}</span>
                        <span>•</span>
                        <span>${item.price.toFixed(2)} each</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {groupOrderInfo.subtotal && (
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span>Subtotal ({groupOrderInfo.items.length} items)</span>
                      <span>${groupOrderInfo.subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Address Confirmation */}
        <Card className="shadow-floating animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Confirm Delivery Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-lg font-medium text-center">
                {groupOrderInfo.address}
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Is this the correct delivery address for your items?
              </p>
              
              <div className="space-y-3">
                <Button 
                  onClick={handleConfirmAddress}
                  className="w-full bg-gradient-primary hover:bg-gradient-primary/90"
                  size="lg"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Yes, this is correct - Continue Shopping
                </Button>
                
                <Button 
                  onClick={handleUseNewAddress}
                  variant="outline"
                  className="w-full"
                >
                  Use a different address
                </Button>
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800 dark:text-green-200">Free Delivery</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Since we're already delivering to this address, your order will have <strong>FREE delivery</strong>!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GroupOrder;