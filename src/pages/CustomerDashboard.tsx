import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, MapPin, Package, Share2, LogOut } from 'lucide-react';
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
}

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCustomerData();
  }, []);

  const loadCustomerData = async () => {
    try {
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

      // Load customer orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('customer_orders')
        .select('*')
        .eq('customer_id', customerData?.id || '')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

    } catch (error) {
      console.error('Error loading customer data:', error);
      toast({
        title: "Error",
        description: "Failed to load your information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/customer/login');
  };

  const handleAddToOrder = () => {
    navigate('/?customer=true');
  };

  const handleShareOrder = (order: Order) => {
    const message = `Hey, I ordered drinks for us...if you want to add anything to the order, you can schedule it for the same date & time (${order.delivery_date} from ${order.delivery_time}) to ${order.delivery_address.street}, ${order.delivery_address.city}, ${order.delivery_address.state} and enter code 'PREMIER2025' to get free delivery.`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join My Delivery Order',
        text: message,
        url: window.location.origin,
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
            <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
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
                            Share
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleAddToOrder}
                            className="flex items-center gap-2"
                          >
                            <Package className="h-4 w-4" />
                            Add Items
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

        {/* Recent Orders */}
        <div>
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
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">Order #{order.order_number}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(order.created_at), 'MMMM do, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                        <p className="text-lg font-semibold mt-1">${order.total_amount}</p>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {order.line_items.length} items • 
                      {order.delivery_date && ` Delivered ${format(new Date(order.delivery_date), 'MMM do')}`}
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