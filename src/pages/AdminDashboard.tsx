import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RecentOrdersFeed } from '@/components/dashboard/RecentOrdersFeed';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import SimpleProductManager from '@/components/admin/SimpleProductManager';
import VoucherManagement from '@/components/admin/VoucherManagement';
import { DeliveryAppManager } from '@/components/admin/DeliveryAppManager';
import { PerformanceTestRunner } from '@/components/admin/PerformanceTestRunner';
import { PerformanceChecklist } from '@/components/admin/PerformanceChecklist';
import { PerformanceOptimizationSummary } from '@/components/admin/PerformanceOptimizationSummary';
import { DatabaseOptimizationTester } from '@/components/admin/DatabaseOptimizationTester';
import { PerformanceReportGenerator } from '@/components/admin/PerformanceReportGenerator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Package, 
  DollarSign, 
  TrendingUp, 
  LogOut, 
  Plus,
  Copy,
  Phone,
  Mail,
  Building,
  MapPin,
  ExternalLink,
  Edit,
  Zap,
  Crown
} from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import AITestingControl from '@/components/AITestingControl';
import TelegramBotSetup from '@/components/TelegramBotSetup';
import CleanupUserData from '@/components/CleanupUserData';

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
      const { data: dashboardData, error } = await supabase.functions.invoke('get-dashboard-data', {
        body: { type: 'admin' }
      });

      if (error) throw error;

      if (dashboardData.error) {
        throw new Error(dashboardData.error);
      }

      // Set dashboard data with full order details
      setTotalRevenue(dashboardData.data.totalRevenue || 0);
      setTotalOrders(dashboardData.data.totalOrders || 0);
      setTotalCustomers(dashboardData.data.customers?.length || 0);
      setTotalProducts(dashboardData.data.totalProducts || 0);
      
      // Map orders with full customer details for admin view
      const ordersWithDetails = (dashboardData.data.orders || []).map((order: any) => ({
        ...order,
        customer_name: order.customers ? 
          `${order.customers.first_name || ''} ${order.customers.last_name || ''}`.trim() : 
          'Unknown Customer',
        customer_email: order.customers?.email || 'No email',
        customer_phone: order.customers?.phone || 'No phone'
      }));
      
      setRecentOrders(ordersWithDetails);

      // Load affiliates data with custom sites
      const { data: affiliatesData, error: affiliatesError } = await supabase
        .from('affiliates')
        .select(`
          *,
          custom_affiliate_sites(
            site_slug,
            site_name,
            delivery_address,
            custom_promo_code,
            is_active
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (affiliatesError) {
        console.error('Error loading affiliates:', affiliatesError);
      } else {
        setAffiliates(affiliatesData || []);
      }

      // Load abandoned orders from past 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: abandonedData, error: abandonedError } = await supabase
        .from('abandoned_orders')
        .select('*')
        .gte('abandoned_at', sevenDaysAgo.toISOString())
        .order('abandoned_at', { ascending: false });

      if (abandonedError) {
        console.error('Error loading abandoned orders:', abandonedError);
      } else {
        setAbandonedOrders(abandonedData || []);
      }

    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
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
    const url = `${window.location.origin}/a/${affiliateCode}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "Affiliate link copied to clipboard.",
    });
  };

  const copyCustomSiteLink = (siteSlug: string) => {
    const url = `${window.location.origin}/sites/${siteSlug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "Custom site link copied to clipboard.",
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
          <div className="flex gap-2">
            <Button onClick={() => navigate('/admin/custom-sites')} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Site
            </Button>
            <Button onClick={() => navigate('/admin/create-collection')} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Collection
            </Button>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
              <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="abandoned">Abandoned Orders</TabsTrigger>
              <TabsTrigger value="vouchers">Vouchers</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="delivery-apps">🚚 Delivery Apps</TabsTrigger>
              <TabsTrigger value="performance">⚡ Performance</TabsTrigger>
              <TabsTrigger value="ai-testing">🤖 AI Testing</TabsTrigger>
              <TabsTrigger value="bot-setup">🤖 Bot Setup</TabsTrigger>
              <TabsTrigger value="cleanup">🗑️ Cleanup</TabsTrigger>
            </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button onClick={() => navigate('/admin/custom-sites')} className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Custom Site
                  </Button>
                  <Button onClick={() => navigate('/admin/create-collection')} variant="outline" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Product Collection
                  </Button>
                  <Button onClick={() => navigate('/admin/product-management')} variant="outline" className="w-full justify-start">
                    <Package className="h-4 w-4 mr-2" />
                    Manage Products
                  </Button>
                  <Button onClick={() => navigate('/performance-optimization')} variant="outline" className="w-full justify-start">
                    <Zap className="h-4 w-4 mr-2" />
                    Performance Dashboard
                  </Button>
                  <Button onClick={() => navigate('/concierge')} variant="outline" className="w-full justify-start">
                    <Crown className="h-4 w-4 mr-2" />
                    Concierge Service
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Platform Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Active Affiliates:</span>
                      <span className="font-semibold">{affiliates.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Commission Paid:</span>
                      <span className="font-semibold">{formatCurrency(affiliates.reduce((sum, a) => sum + (a.total_commission || 0), 0))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Commissions:</span>
                      <span className="font-semibold text-orange-600">{formatCurrency(affiliates.reduce((sum, a) => sum + (a.commission_unpaid || 0), 0))}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="affiliates" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Affiliate Management</h3>
                <p className="text-sm text-muted-foreground">Manage your affiliate partners and their custom sites</p>
              </div>
              <Button onClick={() => navigate('/admin/custom-sites')} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Custom Site
              </Button>
            </div>
            
            <div className="grid gap-4">
              {affiliates.map((affiliate) => (
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                            {affiliate.venmo_handle && (
                              <div className="text-sm text-muted-foreground">
                                Venmo: {affiliate.venmo_handle}
                              </div>
                            )}
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
                        
                        <div>
                          <h5 className="font-medium text-sm text-muted-foreground mb-2">Custom Site</h5>
                          {affiliate.custom_affiliate_sites && affiliate.custom_affiliate_sites.length > 0 ? (
                            <div className="space-y-2">
                              {affiliate.custom_affiliate_sites.map((site: any) => (
                                <div key={site.site_slug} className="space-y-1">
                                  <div className="text-sm font-medium">{site.site_name}</div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                      /sites/{site.site_slug}
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => copyCustomSiteLink(site.site_slug)}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  {site.custom_promo_code && (
                                    <div className="text-xs text-muted-foreground">
                                      Promo: {site.custom_promo_code}
                                    </div>
                                  )}
                                  {site.delivery_address && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {site.delivery_address.city}, {site.delivery_address.state}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">No custom site</div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyAffiliateLink(affiliate.affiliate_code)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/a/${affiliate.affiliate_code}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/admin/custom-sites?affiliate=${affiliate.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              
              {affiliates.length === 0 && (
                <Card className="p-8 text-center">
                  <div className="text-muted-foreground mb-4">No affiliates found</div>
                  <Button onClick={() => navigate('/admin/custom-sites')} variant="outline">
                    Create First Custom Site
                  </Button>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="vouchers" className="space-y-4">
            <VoucherManagement />
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">Product Management</h3>
              <p className="text-muted-foreground mb-4">Manage your product catalog and collections</p>
              <Button onClick={() => navigate('/admin/product-management')} variant="outline">
                <Package className="h-4 w-4 mr-2" />
                Open Product Manager
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="delivery-apps" className="space-y-4">
            <DeliveryAppManager />
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <PerformanceReportGenerator />
            <DatabaseOptimizationTester />
            <PerformanceOptimizationSummary />
            <PerformanceTestRunner />
            <PerformanceChecklist />
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <RecentOrdersFeed 
              orders={recentOrders} 
              title="Recent Orders"
              onRefresh={loadDashboardData}
            />
          </TabsContent>

          <TabsContent value="abandoned" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-orange-600">⏰ Abandoned Orders (Past 7 Days)</CardTitle>
                <p className="text-sm text-muted-foreground">Customers who started checkout but didn't complete - reach out to them!</p>
              </CardHeader>
              <CardContent>
                {abandonedOrders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No abandoned orders in the past 7 days. Your customers are completing their purchases! 🎉
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
                              {order.delivery_address && <p>📍 {order.delivery_address}</p>}
                              <p>🛒 {order.cart_items?.length || 0} items in cart</p>
                              <p className="text-orange-600 font-medium">
                                ⏰ Abandoned: {new Date(order.abandoned_at).toLocaleDateString()} at {new Date(order.abandoned_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {order.customer_email && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`mailto:${order.customer_email}?subject=Complete Your Order&body=Hi! We noticed you left some items in your cart. Would you like to complete your order?`, '_blank')}
                              >
                                📧 Email
                              </Button>
                            )}
                            {order.customer_phone && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`sms:${order.customer_phone}?body=Hi! We noticed you left some items in your cart. Would you like to complete your order?`, '_blank')}
                              >
                                📱 SMS
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

          <TabsContent value="ai-testing" className="space-y-4">
            <AITestingControl />
          </TabsContent>

          <TabsContent value="bot-setup" className="space-y-4">
            <TelegramBotSetup />
          </TabsContent>

          <TabsContent value="cleanup" className="space-y-4">
            <CleanupUserData />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}