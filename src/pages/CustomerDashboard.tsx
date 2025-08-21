import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useSessionTracking } from '@/hooks/useSessionTracking';
import { formatCurrency } from '@/utils/currency';
import { CalendarDays, MapPin, Package, LogOut, MessageSquare, ChevronDown, RefreshCw, ChevronUp, User, Mail } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { formatInAppTimezone } from '@/utils/timezoneManager';

interface Customer {
  id: string | number;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  google_id?: string;
  default_address?: any;
  created_at?: string;
  updated_at?: string;
  total_orders?: number;
  total_spent?: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  delivery_date?: string;
  delivery_time?: string;
  delivery_address: any;
  special_instructions?: string;
  line_items: any;
  created_at: string;
  customer_id?: string;
  session_id?: string;
  shopify_order_id?: string;
  affiliate_code?: string;
  affiliate_id?: string;
  delivery_app_slug?: string;
}

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { linkSessionToUser } = useSessionTracking();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [expandedOrderItems, setExpandedOrderItems] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadCustomerData();
    
    // Cleanup real-time subscription on unmount
    return () => {
      if ((window as any).customerOrdersSubscription) {
        supabase.removeChannel((window as any).customerOrdersSubscription);
      }
    };
  }, []);

  const loadCustomerData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/customer/login');
        return;
      }

      // Set user info for display
      setUser(session.user);

      // Sync Shopify orders for this customer for the last 3 days
      try {
        await supabase.functions.invoke('sync-shopify-orders-recent', { 
          body: { days: 3, customerEmail: session.user.email } 
        });
      } catch (e) {
        console.warn('Shopify sync (customer) skipped:', e);
      }

      // Use enhanced customer session linking function
      console.log('🔄 Linking customer session for:', session.user.email);
      const { data: linkResult, error: linkError } = await supabase.functions.invoke('link-customer-session-enhanced', {
        body: {
          customerEmail: session.user.email!,
          sessionToken: session.access_token,
          orderData: {
            customer_name: [session.user.user_metadata?.first_name, session.user.user_metadata?.last_name]
              .filter(Boolean)
              .join(' ') || session.user.user_metadata?.name || '',
            customer_phone: session.user.user_metadata?.phone || ''
          }
        }
      });

      if (linkError) {
        console.warn('Customer linking warning:', linkError);
      } else {
        console.log('✅ Customer session linked:', linkResult);
      }

      // Load customer data
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('email', session.user.email)
        .maybeSingle();

      if (customerError) {
        console.error('Error loading customer data:', customerError);
      }

      setCustomer({
        id: customerData?.id || 'temp',
        email: session.user.email!,
        name: customerData?.name || [session.user.user_metadata?.first_name, session.user.user_metadata?.last_name]
          .filter(Boolean)
          .join(' ') || session.user.user_metadata?.name || '',
        phone: customerData?.phone,
        google_id: customerData?.google_id,
        default_address: customerData?.default_address,
        created_at: customerData?.created_at,
        updated_at: customerData?.updated_at,
        total_orders: 0,
        total_spent: 0
      });

      // First, try to link any recent sessions to this customer before loading orders
      await linkSessionToUser(session.user.email!);

      // Load orders directly by email address - simple and reliable
      console.log('Loading orders for customer:', session.user.email);
      
      const { data: ordersData, error: ordersError } = await supabase
        .from('customer_orders')
        .select('*')
        .eq('delivery_address->>email', session.user.email)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      
      // Remove duplicates based on shopify_order_id and id
      const uniqueOrders = ordersData?.reduce((acc, order) => {
        const existingOrder = acc.find(o => 
          (o.shopify_order_id && o.shopify_order_id === order.shopify_order_id) ||
          o.id === order.id
        );
        if (!existingOrder) {
          acc.push(order);
        }
        return acc;
      }, [] as any[]);
      
      setOrders(uniqueOrders || []);
      console.log('Loaded', uniqueOrders?.length || 0, 'orders for customer');

      // Set up real-time subscription for new orders
      const channel = supabase
        .channel('customer-orders-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'customer_orders'
          },
          (payload) => {
            console.log('Order change received:', payload);
            const order = payload.new as Order;
            
            // Check if this order belongs to current customer
            const belongsToCustomer = order.delivery_address && 
              typeof order.delivery_address === 'object' && 
              order.delivery_address.email === session.user.email;
            
            if (belongsToCustomer) {
              if (payload.eventType === 'INSERT') {
                setOrders(prevOrders => {
                  const isDuplicate = prevOrders.some(o => 
                    o.id === order.id || 
                    (o.shopify_order_id && order.shopify_order_id && o.shopify_order_id === order.shopify_order_id)
                  );
                  if (isDuplicate) return prevOrders;
                  return [order, ...prevOrders];
                });
                toast({
                  title: "New Order",
                  description: "Your order has been added to your dashboard.",
                });
              } else if (payload.eventType === 'UPDATE') {
                setOrders(prevOrders => 
                  prevOrders.map(o => 
                    o.id === order.id ? order : o
                  )
                );
              }
            }
          }
        )
        .subscribe();

      // Store subscription reference for cleanup
      (window as any).customerOrdersSubscription = channel;

      if (isRefresh) {
        toast({
          title: "Data Refreshed",
          description: "Your dashboard has been updated with the latest information.",
        });
      }

    } catch (error) {
      console.error('Error loading customer data:', error);
      toast({
        title: "Error",
        description: "Failed to load your information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      
      // Clean up any old localStorage
      localStorage.removeItem('groupOrderJoinDecision');
      localStorage.removeItem('originalGroupOrderData');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/order-continuation');
  };

  const handleAddToOrder = () => {
    navigate('/?customer=true&discount=PREMIER2025');
  };

  const handleTextUs = () => {
    const phoneNumber = '7373719700';
    const customerName = customer?.first_name && customer?.last_name 
      ? `${customer.first_name} ${customer.last_name}` 
      : customer?.email || 'Customer';
    const message = `Hi! I need to make changes to my order. Customer: ${customerName} (${customer?.email})`;
    
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.location.href = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    } else {
      navigator.clipboard.writeText(`${phoneNumber}: ${message}`);
      toast({
        title: "Message Copied",
        description: `Message copied! Text us at ${phoneNumber}`,
      });
    }
  };

  const toggleOrderItemsExpansion = (orderId: string) => {
    setExpandedOrderItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const getOrderStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'confirmed':
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (date: string, time?: string) => {
    try {
      const deliveryDate = new Date(date);
      const formattedDate = formatInAppTimezone(deliveryDate, 'EEE, MMM d');
      return time ? `${formattedDate} at ${time}` : formattedDate;
    } catch (error) {
      return `${date}${time ? ` at ${time}` : ''}`;
    }
  };

  const getDeliveryStatus = (order: Order) => {
    if (order.status === 'delivered') {
      return 'Delivered';
    }
    
    if (!order.delivery_date) {
      return 'Date TBD';
    }
    
    try {
      const deliveryDate = new Date(order.delivery_date);
      const today = new Date();
      const daysDiff = differenceInDays(deliveryDate, today);
      
      if (daysDiff < 0) {
        return 'Past Due';
      } else if (daysDiff === 0) {
        return 'Today';
      } else if (daysDiff === 1) {
        return 'Tomorrow';
      } else {
        return `In ${daysDiff} days`;
      }
    } catch (error) {
      return 'Date TBD';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* User Info Header */}
      <div className="bg-card border-b">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">
                  {user?.user_metadata?.first_name?.[0] || user?.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-semibold">
                  {user?.user_metadata?.first_name && user?.user_metadata?.last_name 
                    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                    : customer?.name || 'Welcome'}
                </h1>
                <p className="text-muted-foreground text-sm flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  {user?.email} • {orders.length} order{orders.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={handleAddToOrder}
            className="bg-primary hover:bg-primary/90"
          >
            <Package className="mr-2 h-4 w-4" />
            Place New Order
          </Button>
          <Button 
            variant="outline" 
            onClick={handleTextUs}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Need Help? Text Us
          </Button>
          <Button 
            variant="outline" 
            onClick={() => loadCustomerData(true)}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>

        {/* Orders Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Your Orders</h2>
            <Badge variant="secondary">{orders.length} total</Badge>
          </div>

          {orders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                <p className="text-muted-foreground mb-4">
                  Ready to place your first order?
                </p>
                <Button onClick={handleAddToOrder}>
                  Place Your First Order
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          Order #{order.order_number}
                        </CardTitle>
                        <CardDescription>
                          Placed on {formatInAppTimezone(new Date(order.created_at), 'PPp')}
                        </CardDescription>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge className={getOrderStatusColor(order.status)}>
                          {order.status || 'Pending'}
                        </Badge>
                        <div className="text-lg font-semibold">
                          {formatCurrency(order.total_amount)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Delivery Information */}
                    <div className="flex items-start space-x-4 text-sm">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {order.delivery_date 
                            ? formatDateTime(order.delivery_date, order.delivery_time)
                            : 'Delivery date TBD'
                          }
                        </span>
                        <Badge variant="secondary" className="ml-2">
                          {getDeliveryStatus(order)}
                        </Badge>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    {order.delivery_address && (
                      <div className="flex items-start space-x-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="text-muted-foreground">
                          {typeof order.delivery_address === 'string' 
                            ? order.delivery_address
                            : `${order.delivery_address.street || ''}, ${order.delivery_address.city || ''}, ${order.delivery_address.state || ''} ${order.delivery_address.zipCode || ''}`
                          }
                        </span>
                      </div>
                    )}

                    {/* Order Items Toggle */}
                    {order.line_items && order.line_items.length > 0 && (
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-between p-0 h-auto font-normal"
                            onClick={() => toggleOrderItemsExpansion(order.id)}
                          >
                            <span className="text-sm text-muted-foreground">
                              {order.line_items.length} item{order.line_items.length !== 1 ? 's' : ''}
                            </span>
                            {expandedOrderItems.has(order.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-3 pt-3 border-t space-y-2">
                             {order.line_items.map((item: any, index: number) => (
                              <div key={index} className="flex justify-between items-center text-sm">
                                <span>{item.quantity}× {item.title?.replace(/gid:\/\/shopify\/[^\s]+/g, '').trim()}</span>
                                <span className="font-medium">
                                  {formatCurrency(item.price * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                     )}

                     {/* Affiliate & Source Information */}
                     {(order.affiliate_code || order.delivery_app_slug) && (
                       <div className="text-sm space-y-1 bg-muted/50 p-3 rounded-lg">
                         <div className="font-medium text-muted-foreground">Order Source:</div>
                         {order.affiliate_code && (
                           <div className="flex items-center text-xs">
                             <span className="text-muted-foreground">Affiliate:</span>
                             <Badge variant="outline" className="ml-2 text-xs">
                               {order.affiliate_code}
                             </Badge>
                           </div>
                         )}
                         {order.delivery_app_slug && (
                           <div className="flex items-center text-xs">
                             <span className="text-muted-foreground">App:</span>
                             <Badge variant="outline" className="ml-2 text-xs">
                               {order.delivery_app_slug}
                             </Badge>
                           </div>
                         )}
                       </div>
                     )}

                     {/* Special Instructions */}
                    {order.special_instructions && (
                      <div className="text-sm">
                        <span className="font-medium">Special Instructions: </span>
                        <span className="text-muted-foreground">{order.special_instructions}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;