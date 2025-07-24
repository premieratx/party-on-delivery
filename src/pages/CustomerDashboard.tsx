import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useSessionTracking } from '@/hooks/useSessionTracking';
import { CalendarDays, MapPin, Package, Share2, LogOut, MessageSquare, ChevronDown, RefreshCw } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface Customer {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  total_orders: number;
  total_spent: number;
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
  share_token?: string;
  customer_id?: string;
  session_id?: string;
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

      // Load or create customer profile
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('email', session.user.email)
        .maybeSingle();

      if (customerError && customerError.code !== 'PGRST116') {
        throw customerError;
      }

      if (!customerData) {
        // Create new customer profile
        const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .insert({
            email: session.user.email!,
            google_id: session.user.id,
            first_name: session.user.user_metadata?.first_name,
            last_name: session.user.user_metadata?.last_name,
          })
          .select()
          .single();

        if (createError) throw createError;
        setCustomer(newCustomer);
      } else {
        setCustomer(customerData);
      }

      // First, try to link any recent sessions to this customer before loading orders
      await linkSessionToUser(session.user.email!);
      
      // Refetch customer data to get updated session tokens after linking
      const { data: updatedCustomerData } = await supabase
        .from('customers')
        .select('*')
        .eq('email', session.user.email)
        .single();
      
      const currentCustomer = updatedCustomerData || customerData;
      
      // Load customer orders - check both by customer_id and session tokens
      let ordersQuery = supabase
        .from('customer_orders')
        .select('*');
      
      if (currentCustomer?.id) {
        // Create a comprehensive filter for all possible ways to find customer orders
        const filters = [`customer_id.eq.${currentCustomer.id}`];
        
        // Add session tokens if they exist
        if (currentCustomer.session_tokens && currentCustomer.session_tokens.length > 0) {
          currentCustomer.session_tokens.forEach(token => {
            if (token && token.trim()) {
              filters.push(`session_id.eq.${token}`);
            }
          });
        }
        
        // Also search by email for orders that might not have customer_id linked yet
        filters.push(`delivery_address->>email.eq.${session.user.email}`);
        
        ordersQuery = ordersQuery.or(filters.join(','));
      } else {
        // Fallback if no customer data - search by email
        ordersQuery = ordersQuery.or(`delivery_address->>email.eq.${session.user.email}`);
      }
      
      const { data: ordersData, error: ordersError } = await ordersQuery
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      // Set up real-time subscription for new orders - listen to all orders for this user
      const channel = supabase
        .channel('customer-orders-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all changes
            schema: 'public',
            table: 'customer_orders'
          },
          (payload) => {
            console.log('Order change received:', payload);
            const order = payload.new as Order;
            
            // Check if this order belongs to current customer
            const belongsToCustomer = order.customer_id === currentCustomer?.id ||
              (currentCustomer?.session_tokens && currentCustomer.session_tokens.includes(order.session_id)) ||
              (order.delivery_address && typeof order.delivery_address === 'object' && 
               order.delivery_address.email === session.user.email);
            
            if (belongsToCustomer) {
              if (payload.eventType === 'INSERT') {
                setOrders(prevOrders => {
                  // Avoid duplicates
                  if (prevOrders.some(o => o.id === order.id)) return prevOrders;
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
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/customer/login');
  };

  const handleAddToOrder = () => {
    navigate('/?customer=true&discount=PREMIER2025');
  };

  const handleTextUs = () => {
    const phoneNumber = '7377377376';
    const message = `Hi! I need to make changes to my order. Customer: ${customer?.first_name} ${customer?.last_name} (${customer?.email})`;
    
    // Check if on mobile device
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.location.href = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    } else {
      // For desktop, copy message and show instructions
      navigator.clipboard.writeText(`${phoneNumber}: ${message}`);
      toast({
        title: "Message Copied",
        description: `Message copied! Text us at ${phoneNumber}`,
      });
    }
  };

  // Create combined order summary
  const getCombinedOrderSummary = () => {
    const allItems: any[] = [];
    const orderMap = new Map();
    
    orders.forEach(order => {
      orderMap.set(order.id, {
        order_number: order.order_number,
        customer_name: `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim(),
        delivery_date: order.delivery_date,
        delivery_time: order.delivery_time,
        delivery_address: order.delivery_address
      });
      
      order.line_items.forEach((item: any) => {
        allItems.push({
          ...item,
          order_id: order.id,
          order_number: order.order_number,
          customer_name: `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim()
        });
      });
    });
    
    // Sort items alphabetically
    allItems.sort((a, b) => a.title.localeCompare(b.title));
    
    return { allItems, orderMap };
  };

  const handleShareOrder = (order: Order) => {
    const shareUrl = `${window.location.origin}/order/${order.share_token || order.id}`;
    const message = `Hey, I ordered drinks for us...if you want to add anything to the order, you can schedule it for the same date & time (${order.delivery_date} from ${order.delivery_time}) to ${order.delivery_address.street}, ${order.delivery_address.city}, ${order.delivery_address.state} and enter code 'PREMIER2025' to get free delivery. Join here: ${shareUrl}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join My Delivery Order',
        text: message,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(message);
      toast({
        title: "Message Copied",
        description: "The order sharing message has been copied to your clipboard.",
      });
    }
  };

  const getDaysUntilDelivery = (deliveryDate: string) => {
    const today = new Date();
    const delivery = new Date(deliveryDate);
    return differenceInDays(delivery, today);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter(order => 
    order.status !== 'delivered' && order.delivery_date && 
    new Date(order.delivery_date) >= new Date()
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {customer?.first_name || 'Customer'}!
              </h1>
              <p className="text-sm text-muted-foreground">{customer?.email}</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => loadCustomerData(true)} 
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{customer?.total_orders || 0}</p>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold">${customer?.total_spent || 0}</p>
                </div>
                <CalendarDays className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Orders</p>
                  <p className="text-2xl font-bold">{activeOrders.length}</p>
                </div>
                <MapPin className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Upcoming Deliveries</h2>
            <div className="space-y-4">
              {activeOrders.map((order) => (
                <Card key={order.id} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
                        <CardDescription>
                          {order.delivery_date && (
                            <span className="flex items-center gap-2 mt-2">
                              <CalendarDays className="h-4 w-4" />
                              {format(new Date(order.delivery_date), 'EEEE, MMMM do, yyyy')} 
                              {order.delivery_time && ` at ${order.delivery_time}`}
                              <Badge variant="secondary">
                                {getDaysUntilDelivery(order.delivery_date)} days to go
                              </Badge>
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <Badge variant={order.status === 'confirmed' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Delivery Address */}
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Delivery Address</p>
                          <p className="text-sm text-muted-foreground">
                            {order.delivery_address.street}, {order.delivery_address.city}, {order.delivery_address.state} {order.delivery_address.zipCode}
                          </p>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div>
                        <p className="font-medium mb-2">Items ({order.line_items.length})</p>
                        <div className="space-y-1">
                          {order.line_items.slice(0, 3).map((item: any, index: number) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{item.quantity}x {item.title}</span>
                              <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                          {order.line_items.length > 3 && (
                            <p className="text-sm text-muted-foreground">
                              +{order.line_items.length - 3} more items
                            </p>
                          )}
                        </div>
                      </div>

                      <Separator />

                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">Total: ${order.total_amount}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShareOrder(order)}
                            className="flex items-center gap-2"
                          >
                            <Share2 className="h-4 w-4" />
                            Copy Group Link
                          </Button>
                           <Button
                            size="sm"
                            onClick={handleAddToOrder}
                            className="flex items-center gap-2"
                          >
                            <Package className="h-4 w-4" />
                            Add to Order
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Combined Order Summary - Only show if multiple orders */}
        {orders.length > 1 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Complete Order Summary</h2>
            <Card>
              <CardHeader>
                <CardTitle>All Items Combined</CardTitle>
                <CardDescription>
                  Summary of all orders placed by your group
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const { allItems, orderMap } = getCombinedOrderSummary();
                  const firstOrder = orders[0];
                  
                  return (
                    <div className="space-y-4">
                      {/* Delivery Info */}
                      {firstOrder?.delivery_date && (
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <CalendarDays className="h-4 w-4" />
                            <span className="font-medium">
                              Delivery: {format(new Date(firstOrder.delivery_date), 'EEEE, MMMM do, yyyy')}
                              {firstOrder.delivery_time && ` at ${firstOrder.delivery_time}`}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-1" />
                            <span className="text-sm">
                              {firstOrder.delivery_address.street}, {firstOrder.delivery_address.city}, {firstOrder.delivery_address.state} {firstOrder.delivery_address.zipCode}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Items List */}
                      <div>
                        <h4 className="font-medium mb-3">Items ({allItems.length})</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {allItems.map((item, index) => (
                            <div key={index} className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded">
                              <div className="flex-1">
                                <span className="font-medium">{item.quantity}x {item.title}</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  (Order #{item.order_number} - {item.customer_name})
                                </span>
                              </div>
                              <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleTextUs}
                            className="flex items-center gap-2"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Text Us for Changes
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleAddToOrder}
                            className="flex items-center gap-2"
                          >
                            <Package className="h-4 w-4" />
                            Add to Order
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            Total: ${orders.reduce((sum, order) => sum + order.total_amount, 0).toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {orders.length} separate orders
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Individual Orders - Show all in full detail */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Order History</h2>
          {orders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start your first order to see it here
                </p>
                <Button onClick={handleAddToOrder}>
                  Start Shopping
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Order #{order.order_number}</CardTitle>
                        <CardDescription>
                          Ordered on {format(new Date(order.created_at), 'MMMM do, yyyy')}
                          {order.delivery_date && (
                            <span className="flex items-center gap-2 mt-1">
                              <CalendarDays className="h-4 w-4" />
                              Delivery: {format(new Date(order.delivery_date), 'EEEE, MMMM do')} 
                              {order.delivery_time && ` at ${order.delivery_time}`}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                        <p className="text-lg font-semibold mt-1">${order.total_amount}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Delivery Address */}
                      {order.delivery_address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Delivery Address</p>
                            <p className="text-sm text-muted-foreground">
                              {order.delivery_address.street}, {order.delivery_address.city}, {order.delivery_address.state} {order.delivery_address.zipCode}
                            </p>
                            {order.special_instructions && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Instructions: {order.special_instructions}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Order Items */}
                      <div>
                        <h4 className="font-medium mb-3">Items ({order.line_items?.length || 0})</h4>
                        <div className="space-y-2">
                          {order.line_items && order.line_items.length > 0 ? (
                            order.line_items.map((item: any, index: number) => (
                              <div key={index} className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded">
                                <div className="flex-1">
                                  <span className="font-medium">{item.quantity}x {item.title}</span>
                                  <span className="text-sm text-muted-foreground block">
                                    ${item.price} each • Ordered by {customer?.first_name} {customer?.last_name}
                                  </span>
                                </div>
                                <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4 text-muted-foreground">
                              <Package className="h-8 w-8 mx-auto mb-2" />
                              <p>No items found for this order</p>
                              <p className="text-sm">This may be due to a data sync issue</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator />

                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          {order.line_items?.length || 0} items • Order total: ${order.total_amount}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleTextUs}
                          className="flex items-center gap-2"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Text Us for Changes
                        </Button>
                      </div>
                    </div>
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