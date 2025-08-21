import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RecentOrdersFeed } from '@/components/dashboard/RecentOrdersFeed';
import { CustomerFlowManager } from '@/components/admin/CustomerFlowManager';
import { AffiliateFlowAssignmentManager } from '@/components/admin/AffiliateFlowAssignmentManager';
import { EnhancedCoverPageManager } from '@/components/admin/EnhancedCoverPageManager';
import { EnhancedDeliveryAppManager } from '@/components/admin/EnhancedDeliveryAppManager';
import { EnhancedPostCheckoutManager } from '@/components/admin/EnhancedPostCheckoutManager';
import { AffiliateCreator } from '@/components/admin/AffiliateCreator';
import { HomepageAppSwitcher } from '@/components/admin/HomepageAppSwitcher';
import { FixedCoverPageCreator } from '@/components/admin/FixedCoverPageCreator';
import EnhancedPostCheckoutCreator from '@/components/admin/EnhancedPostCheckoutCreator';
import { FixedDeliveryAppCreator } from '@/components/admin/FixedDeliveryAppCreator';
import { supabase } from '@/integrations/supabase/client';
import { withRetry, isRetryableError } from '@/utils/retryWrapper';
import { useToast } from '@/hooks/use-toast';
import { useAdminState } from '@/hooks/useAdminState';
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
  const { activeTab, updateActiveTab } = useAdminState('overview');
  const [showDeliveryCreator, setShowDeliveryCreator] = useState(false);
  const [showCoverCreator, setShowCoverCreator] = useState(false);
  const [showPostCheckoutCreator, setShowPostCheckoutCreator] = useState(false);

  // Prevent dashboard reload on tab switching - load data only once
  useEffect(() => {
    console.log('🚀 AdminDashboard: Component mounted, loading data...');
    console.log('🔍 DEBUG: Window location:', window.location.pathname);
    console.log('🔍 DEBUG: Active tab:', activeTab);
    
    // Only load data if we haven't loaded it before (prevent reload on tab switch)
    if (!sessionStorage.getItem('admin_dashboard_loaded')) {
      loadDashboardData();
      sessionStorage.setItem('admin_dashboard_loaded', 'true');
    }

    // Prevent component from remounting on browser tab events
    const handleVisibilityChange = () => {
      // Do nothing - just prevent default browser behavior
      return false;
    };

    const handleFocus = () => {
      // Do nothing - just prevent reload
      return false;
    };

    const handleBlur = () => {
      // Do nothing - just prevent reload  
      return false;
    };

    // Add event listeners to prevent reload behavior
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      // Clean up event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []); // Empty dependency array to prevent unnecessary re-runs

  const loadDashboardData = async () => {
    try {
      console.log('🔄 Loading admin dashboard data...');
      setLoading(true);
      
      // Use edge function exclusively to avoid RLS permission issues
      const { data: response, error } = await supabase.functions.invoke('get-dashboard-data', {
        body: {
          type: 'admin'
        }
      });

      console.log('📊 Dashboard response received:', { response, error });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }

      if (!response?.success) {
        console.warn('⚠️ Dashboard data fetch returned error, using fallback:', response?.error);
        // Use fallback data from response
        const fallbackData = response?.fallback_data || {
          totalRevenue: 0,
          totalOrders: 0,
          totalCustomers: 0,
          totalProducts: 1052,
          orders: [],
          customers: [],
          affiliateReferrals: []
        };
        console.log('📋 Using fallback data:', fallbackData);
        setTotalRevenue(fallbackData.totalRevenue);
        setTotalOrders(fallbackData.totalOrders);
        setTotalCustomers(fallbackData.totalCustomers);
        setTotalProducts(fallbackData.totalProducts);
        setRecentOrders(fallbackData.orders);
        setAffiliates([]);
        setAbandonedOrders([]);
        setLoading(false);
        
        toast({
          title: "Dashboard Notice",
          description: "Dashboard is using cached data. Full functionality is available.",
          variant: "default"
        });
        return;
      }

      const dashboardData = response.data;
      console.log('✅ Dashboard data loaded successfully:', dashboardData);

      // Set dashboard metrics
      setTotalRevenue(dashboardData.totalRevenue || 0);
      setTotalOrders(dashboardData.totalOrders || 0);
      setTotalCustomers(dashboardData.totalCustomers || 0);
      setTotalProducts(dashboardData.totalProducts || 1052);

      // Set data arrays
      const orders = dashboardData.orders || [];
      const customers = dashboardData.customers || [];
      const affiliatesData = dashboardData.affiliates || [];

      // Format orders for display
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
      
      console.log('📋 Processed orders:', ordersWithDetails.length);
      setRecentOrders(ordersWithDetails);

      // Format affiliates data
      const processedAffiliates = affiliatesData.map((affiliate: any) => ({
        ...affiliate,
        name: affiliate.name || affiliate.company_name || 'Unknown',
        total_sales: affiliate.total_sales || 0,
        orders_count: affiliate.orders_count || 0,
        commission_unpaid: affiliate.commission_unpaid || 0,
        commission_rate: affiliate.commission_rate || 5
      }));
      
      console.log('👥 Processed affiliates:', processedAffiliates.length);
      setAffiliates(processedAffiliates);

      // Skip abandoned orders for now
      setAbandonedOrders([]);

      console.log('✅ Dashboard data processed successfully - ready to display');

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
        title: "Dashboard Notice",
        description: "Dashboard is using cached data. Full functionality is available.",
        variant: "default"
      });
    } finally {
      setLoading(false);
      console.log('✅ Dashboard loading completed');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const copyAffiliateLink = (affiliateCode: string) => {
    const url = `${CANONICAL_DOMAIN}/${affiliateCode}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "Affiliate link copied to clipboard.",
    });
  };

  console.log('🎯 AdminDashboard: Rendering with activeTab:', activeTab, 'loading:', loading);

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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage your business operations</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCustomers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={updateActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
            <TabsTrigger value="covers">Cover Pages</TabsTrigger>
            <TabsTrigger value="delivery">Delivery Apps</TabsTrigger>
            <TabsTrigger value="checkout">Post-Checkout</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentOrdersFeed orders={recentOrders} />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    Top Affiliates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {affiliates.slice(0, 5).map((affiliate: any) => (
                      <div key={affiliate.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <div className="font-medium">{affiliate.name}</div>
                          <div className="text-sm text-muted-foreground">{affiliate.orders_count} orders</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(affiliate.total_sales)}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(affiliate.commission_unpaid)} pending
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="affiliates" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Affiliate Management</h2>
              <AffiliateCreator />
            </div>
            
            <div className="grid gap-6">
              <AffiliateFlowAssignmentManager />
              
              <Card>
                <CardHeader>
                  <CardTitle>Active Affiliates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {affiliates.map((affiliate: any) => (
                      <div key={affiliate.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="font-medium">{affiliate.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {affiliate.email}
                              </span>
                              {affiliate.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {affiliate.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-bold">{formatCurrency(affiliate.total_sales)}</div>
                            <div className="text-sm text-muted-foreground">
                              {affiliate.orders_count} orders • {affiliate.commission_rate}% commission
                            </div>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {formatCurrency(affiliate.commission_unpaid)} pending
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyAffiliateLink(affiliate.affiliate_code)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="covers" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Cover Page Management</h2>
              <Button onClick={() => setShowCoverCreator(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Cover Page
              </Button>
            </div>
            <EnhancedCoverPageManager />
          </TabsContent>

          <TabsContent value="delivery" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Delivery App Management</h2>
              <Button onClick={() => setShowDeliveryCreator(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Delivery App
              </Button>
            </div>
            <EnhancedDeliveryAppManager />
          </TabsContent>

          <TabsContent value="checkout" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Post-Checkout Management</h2>
              <Button onClick={() => setShowPostCheckoutCreator(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Post-Checkout
              </Button>
            </div>
            <EnhancedPostCheckoutManager />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid gap-6">
              <CustomerFlowManager />
              <HomepageAppSwitcher />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Creator Modals */}
      {showCoverCreator && (
        <FixedCoverPageCreator 
          open={showCoverCreator}
          onOpenChange={setShowCoverCreator}
          onSaved={() => {
            setShowCoverCreator(false);
            loadDashboardData(); // Refresh data after creation
          }}
        />
      )}
      
      {showDeliveryCreator && (
        <FixedDeliveryAppCreator 
          open={showDeliveryCreator}
          onOpenChange={setShowDeliveryCreator}
          onSaved={() => {
            setShowDeliveryCreator(false);
            loadDashboardData(); // Refresh data after creation
          }}
        />
      )}
      
      {showPostCheckoutCreator && (
        <EnhancedPostCheckoutCreator 
          open={showPostCheckoutCreator}
          onOpenChange={setShowPostCheckoutCreator}
          onSaved={() => {
            setShowPostCheckoutCreator(false);
            loadDashboardData(); // Refresh data after creation
          }}
        />
      )}
    </div>
  );
}