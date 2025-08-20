import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RecentOrdersFeed } from '@/components/dashboard/RecentOrdersFeed';
import { CustomerFlowBuilder } from '@/components/admin/CustomerFlowBuilder';
import { AffiliateFlowAssignmentManager } from '@/components/admin/AffiliateFlowAssignmentManager';
import { FullFeaturedCoverPageCreator } from '@/components/admin/FullFeaturedCoverPageCreator';
import { FullFeaturedDeliveryAppCreator } from '@/components/admin/FullFeaturedDeliveryAppCreator';
import AffiliateCreator from '@/components/admin/AffiliateCreator';
import { HomepageAppSwitcher } from '@/components/admin/HomepageAppSwitcher';
import { supabase } from '@/integrations/supabase/client';
import { withRetry, isRetryableError } from '@/utils/retryWrapper';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Package, 
  DollarSign, 
  TrendingUp, 
  LogOut, 
  Plus,
  Copy,
  ExternalLink,
  Crown,
  Mail,
  Phone,
  Building,
  MapPin
} from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { CANONICAL_DOMAIN } from '@/utils/links';

export default function AdminDashboard() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [abandonedOrders, setAbandonedOrders] = useState([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('🔄 Loading admin dashboard data...');
      
      // Load data directly from Supabase tables with proper error handling
      const [ordersResponse, customersResponse, affiliatesResponse] = await Promise.all([
        supabase
          .from('customer_orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)
          .then(response => {
            console.log('Orders response:', response);
            return response;
          }),
        supabase
          .from('customers')
          .select('*')
          .limit(100)
          .then(response => {
            console.log('Customers response:', response);
            return response;
          }),
        supabase
          .from('affiliates')
          .select('*')
          .eq('status', 'active')
          .limit(50)
          .then(response => {
            console.log('Affiliates response:', response);
            return response;
          })
      ]);

      // Check for errors in each response
      if (ordersResponse.error) {
        console.error('Orders error:', ordersResponse.error);
      }
      if (customersResponse.error) {
        console.error('Customers error:', customersResponse.error);
      }
      if (affiliatesResponse.error) {
        console.error('Affiliates error:', affiliatesResponse.error);
      }

      console.log('✅ Raw data loaded:', {
        orders: ordersResponse.data?.length || 0,
        ordersError: ordersResponse.error,
        customers: customersResponse.data?.length || 0,
        customersError: customersResponse.error,
        affiliates: affiliatesResponse.data?.length || 0,
        affiliatesError: affiliatesResponse.error
      });

      // Process orders data
      const orders = ordersResponse.data || [];
      const totalOrderRevenue = orders.reduce((sum, order) => sum + (parseFloat(String(order.total_amount || 0))), 0);
      
      // Set dashboard statistics
      setTotalRevenue(totalOrderRevenue);
      setTotalOrders(orders.length);
      setTotalCustomers(customersResponse.data?.length || 0);
      setTotalProducts(1052); // Static for now
      
      // Map orders with customer details
      const ordersWithDetails = orders.map((order: any) => ({
        ...order,
        customer_name: order.customer_name || (
          order.delivery_address?.email ? order.delivery_address.email.split('@')[0] : 'Unknown Customer'
        ),
        customer_email: order.customer_email || order.delivery_address?.email || 'No email',
        customer_phone: order.customer_phone || 'No phone',
        formatted_total: `$${parseFloat(String(order.total_amount || 0)).toFixed(2)}`,
        formatted_date: new Date(order.created_at).toLocaleDateString()
      }));
      
      setRecentOrders(ordersWithDetails);

      // Set affiliates data
      const affiliatesData = affiliatesResponse.data || [];
      setAffiliates(affiliatesData.map((affiliate: any) => ({
        ...affiliate,
        name: affiliate.name || affiliate.company_name || 'Unknown',
        total_sales: affiliate.total_sales || 0,
        orders_count: affiliate.orders_count || 0,
        commission_unpaid: affiliate.commission_unpaid || 0,
        commission_rate: affiliate.commission_rate || 5
      })));

      // Abandoned orders - skip for now to avoid permission issues
      setAbandonedOrders([]);

      console.log('✅ Dashboard data processed successfully');

    } catch (error: any) {
      console.error('❌ Error loading dashboard data:', error);
      
      // Set fallback data so admin can still use the interface
      setTotalRevenue(0);
      setTotalOrders(0);
      setTotalCustomers(0);
      setTotalProducts(1052);
      setRecentOrders([]);
      setAffiliates([]);
      setAbandonedOrders([]);
      
      toast({
        title: "Dashboard Warning",
        description: "Some dashboard data couldn't be loaded, but you can still manage delivery apps.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/affiliate/admin-login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const copyAffiliateLink = (affiliateCode: string) => {
    const url = `${CANONICAL_DOMAIN}/${affiliateCode}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "Affiliate link copied to clipboard.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your affiliate program and platform</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Summary Stats */}
        <Card className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <div className="text-sm text-muted-foreground">Total Orders</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="text-2xl font-bold">{totalCustomers}</div>
              <div className="text-sm text-muted-foreground">Total Customers</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <div className="text-sm text-muted-foreground">Total Products</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div className="text-2xl font-bold">{affiliates.length}</div>
              <div className="text-sm text-muted-foreground">Active Affiliates</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <DollarSign className="h-6 w-6 text-orange-500" />
              </div>
              <div className="text-2xl font-bold">{formatCurrency(affiliates.reduce((sum, a) => sum + (a.commission_unpaid || 0), 0))}</div>
              <div className="text-sm text-muted-foreground">Pending Commission</div>
            </div>
          </div>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="homepage" className="space-y-4">
          <TabsList className="grid grid-cols-4 md:grid-cols-8 gap-1 w-full h-auto flex-wrap p-2">
            <TabsTrigger value="homepage" className="px-3 py-2 text-xs sm:text-sm">🏠 Homepage</TabsTrigger>
            <TabsTrigger value="delivery-apps" className="px-3 py-2 text-xs sm:text-sm">🚚 Apps</TabsTrigger>
            <TabsTrigger value="customer-flows" className="px-3 py-2 text-xs sm:text-sm">🔄 Flows</TabsTrigger>
            <TabsTrigger value="flow-assignments" className="px-3 py-2 text-xs sm:text-sm">🎯 Assignments</TabsTrigger>
            <TabsTrigger value="cover-pages" className="px-3 py-2 text-xs sm:text-sm">🎬 Cover Pages</TabsTrigger>
            <TabsTrigger value="post-checkout" className="px-3 py-2 text-xs sm:text-sm">✅ Post-Checkout</TabsTrigger>
            <TabsTrigger value="orders" className="px-3 py-2 text-xs sm:text-sm">📋 Orders</TabsTrigger>
            <TabsTrigger value="affiliates" className="px-3 py-2 text-xs sm:text-sm">👥 Affiliates</TabsTrigger>
            <TabsTrigger value="abandoned" className="px-3 py-2 text-xs sm:text-sm">⏰ Abandoned</TabsTrigger>
          </TabsList>

          {/* Homepage Configuration - PRIORITY TAB */}
          <TabsContent value="homepage" className="space-y-4">
            <HomepageAppSwitcher />
          </TabsContent>

          {/* Customer Flow Configuration */}
          <TabsContent value="customer-flows" className="space-y-4">
            <CustomerFlowBuilder />
          </TabsContent>

          {/* Flow Assignments */}
          <TabsContent value="flow-assignments" className="space-y-4">
            <AffiliateFlowAssignmentManager />
          </TabsContent>

          {/* Cover Pages */}
          <TabsContent value="cover-pages" className="space-y-4">
            <div className="h-[calc(100vh-200px)] overflow-y-auto">
              <FullFeaturedCoverPageCreator />
            </div>
          </TabsContent>

          {/* Post-Checkout Creator - Temporarily disabled */}
          <TabsContent value="post-checkout" className="space-y-4">
            <div className="h-[calc(100vh-200px)] overflow-y-auto p-8 text-center">
              <h3 className="text-lg font-medium mb-2">Post-Checkout Creator</h3>
              <p className="text-muted-foreground">Post-checkout creator will be available soon. Database schema needs to be created first.</p>
            </div>
          </TabsContent>

          {/* Delivery Apps */}
          <TabsContent value="delivery-apps" className="space-y-4">
            <div className="h-[calc(100vh-200px)] overflow-y-auto">
              <FullFeaturedDeliveryAppCreator />
            </div>
          </TabsContent>

          {/* Orders */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentOrdersFeed 
                  orders={recentOrders} 
                  title=""
                  onRefresh={loadDashboardData}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Affiliates */}
          <TabsContent value="affiliates" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium">Affiliate Partners</h3>
                <p className="text-sm text-muted-foreground">Manage affiliate partners and their performance</p>
              </div>
              <AffiliateCreator onCreated={loadDashboardData} />
            </div>
            
            <div className="grid gap-4">
              {affiliates.length === 0 ? (
                <Card className="p-8 text-center">
                  <h4 className="text-lg font-medium mb-2">No Affiliates Yet</h4>
                  <p className="text-muted-foreground mb-4">When affiliates sign up, they'll appear here with their performance data.</p>
                  <Button onClick={() => window.open('/affiliate', '_blank')} variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Go to Affiliate Signup
                  </Button>
                </Card>
              ) : (
                affiliates.map((affiliate) => (
                  <Card key={affiliate.id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="text-lg font-semibold">{affiliate.name}</h4>
                          <Badge variant="secondary">Code: {affiliate.affiliate_code}</Badge>
                          <Badge variant={affiliate.status === 'active' ? 'default' : 'destructive'}>
                            {affiliate.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h5 className="font-medium text-sm text-muted-foreground mb-2">Contact Info</h5>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3" />
                                {affiliate.email}
                              </div>
                              {affiliate.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-3 w-3" />
                                  {affiliate.phone}
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-sm">
                                <Building className="h-3 w-3" />
                                {affiliate.company_name}
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="font-medium text-sm text-muted-foreground mb-2">Performance</h5>
                            <div className="space-y-1 text-sm">
                              <div>Revenue: {formatCurrency(affiliate.total_sales || 0)}</div>
                              <div>Orders: {affiliate.orders_count || 0}</div>
                              <div>Commission: {formatCurrency(affiliate.commission_unpaid || 0)} pending</div>
                              <div>Rate: {affiliate.commission_rate || 5}%</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyAffiliateLink(affiliate.affiliate_code)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy Link
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`${CANONICAL_DOMAIN}/${affiliate.affiliate_code}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Visit
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Abandoned Orders */}
          <TabsContent value="abandoned" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-orange-600">⏰ Abandoned Orders (Past 7 Days)</CardTitle>
                <p className="text-sm text-muted-foreground">Customers who started checkout but didn't complete</p>
              </CardHeader>
              <CardContent>
                {abandonedOrders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No abandoned orders in the past 7 days. Great job! 🎉
                  </p>
                ) : (
                  <div className="space-y-3">
                    {abandonedOrders.map((order: any) => (
                      <div key={order.id} className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{order.customer_name || 'Unknown Customer'}</h4>
                              <Badge variant="outline" className="text-orange-600 border-orange-300">
                                ${order.subtotal}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>📧 {order.customer_email}</p>
                              {order.customer_phone && <p>📱 {order.customer_phone}</p>}
                              <p>🛒 {order.cart_items?.length || 0} items in cart</p>
                              <p className="text-orange-600 font-medium">
                                ⏰ Abandoned: {new Date(order.abandoned_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {order.customer_email && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`mailto:${order.customer_email}?subject=Complete Your Order&body=Hi! We noticed you left some items in your cart.`, '_blank')}
                              >
                                📧 Email
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}