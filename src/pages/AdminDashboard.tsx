import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RecentOrdersFeed } from '@/components/dashboard/RecentOrdersFeed';
// Analytics dashboard removed to eliminate PostHog
import SimpleProductManager from '@/components/admin/SimpleProductManager';
import VoucherManagement from '@/components/admin/VoucherManagement';
import { DeliveryAppManager } from '@/components/admin/DeliveryAppManager';
import { SpeechModeManager } from '@/components/admin/SpeechModeManager';
import { PerformanceTestRunner } from '@/components/admin/PerformanceTestRunner';
import { PerformanceChecklist } from '@/components/admin/PerformanceChecklist';
import { PerformanceOptimizationSummary } from '@/components/admin/PerformanceOptimizationSummary';
import { DatabaseOptimizationTester } from '@/components/admin/DatabaseOptimizationTester';
import { PerformanceReportGenerator } from '@/components/admin/PerformanceReportGenerator';
import { ForceShopifySync } from '@/components/delivery/ForceShopifySync';
import { LinkValidationDashboard } from '@/components/admin/LinkValidationDashboard';
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
import TestGHLIntegration from '@/components/TestGHLConnection';
import CleanupUserData from '@/components/CleanupUserData';
import { SystemTestingSuite } from '@/components/SystemTestingSuite';
import AffiliateCreator from '@/components/admin/AffiliateCreator';
import { UnifiedCoverPostCheckoutBuilder } from '@/components/admin/UnifiedCoverPostCheckoutBuilder';
import { CANONICAL_DOMAIN } from '@/utils/links';
import { TriggerShopifySync } from '@/components/admin/TriggerShopifySync';
import { CoverPageToggle } from '@/components/admin/CoverPageToggle';
import { SecuritySyncDashboard } from '@/components/admin/SecuritySyncDashboard';
import { EnhancedCacheManager } from '@/components/admin/EnhancedCacheManager';
import SearchAppConfig from '@/components/admin/SearchAppConfig';
import { AppConfigManager } from '@/components/admin/AppConfigManager';
import { DeliveryAppCreator } from '@/components/admin/DeliveryAppCreator';

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
      // Proactively sync last 3 days of Shopify orders so names/emails are accurate
      try {
        await supabase.functions.invoke('sync-shopify-orders-recent', { body: { days: 3 } });
      } catch (e) {
        console.warn('Shopify sync (admin) skipped:', e);
      }

      const response: any = await withRetry(async () =>
        await supabase.rpc('get_dashboard_data', {
          dashboard_type: 'admin',
          user_email: null,
          affiliate_code: null,
        }),
        { shouldRetry: isRetryableError, maxRetries: 3, initialDelay: 800 }
      );

      const error = response?.error;
      const rpcResult = response?.data;

      if (error) throw error;
      if (!rpcResult?.success) {
        throw new Error(rpcResult?.error || 'Failed to load dashboard data');
      }

      const dashboardData = rpcResult;

      // Set dashboard data with full order details
      setTotalRevenue(dashboardData.data.totalRevenue || 0);
      setTotalOrders(dashboardData.data.totalOrders || 0);
      setTotalCustomers(dashboardData.data.customers?.length || 0);
      setTotalProducts(dashboardData.data.totalProducts || 0);
      
      // Map orders with full customer details for admin view
      const ordersWithDetails = (dashboardData.data.orders || []).map((order: any) => ({
        ...order,
        customer_name: order.customer_name || (
          order.delivery_address?.email ? order.delivery_address.email.split('@')[0] : 'Unknown Customer'
        ),
        customer_email: order.customer_email || order.delivery_address?.email || 'No email',
        customer_phone: order.customer_phone || 'No phone'
      }));
      
      setRecentOrders(ordersWithDetails);

      // Load affiliates data with delivery apps
      const { data: affiliatesData, error: affiliatesError } = await supabase
        .from('affiliates')
        .select(`
          *,
          custom_affiliate_sites(
            site_slug,
            site_name,
            delivery_address,
            custom_promo_code,
            is_active,
            delivery_app_id
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (affiliatesError) {
        console.error('Error loading affiliates:', affiliatesError);
      } else {
        setAffiliates(affiliatesData || []);
      }

      // Abandoned orders: fetch directly for past 7 days to ensure visibility
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: abandonedList, error: abandonedErr } = await supabase
          .from('abandoned_orders')
          .select('*')
          .gte('abandoned_at', sevenDaysAgo)
          .order('abandoned_at', { ascending: false })
          .limit(500);
        if (abandonedErr) {
          console.warn('Failed to load abandoned orders (direct):', abandonedErr);
          // Fallback to RPC result if available
          setAbandonedOrders(dashboardData.data.abandonedOrders || []);
        } else {
          setAbandonedOrders(abandonedList || []);
        }
      } catch (e) {
        console.warn('Abandoned orders fetch exception:', e);
        setAbandonedOrders(dashboardData.data.abandonedOrders || []);
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
    const url = `${CANONICAL_DOMAIN}/${affiliateCode}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "Affiliate link copied to clipboard.",
    });
  };

  const copyCustomSiteLink = (siteSlug: string) => {
    const url = `${CANONICAL_DOMAIN}/sites/${siteSlug}`;
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
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Consolidated Summary Stats - Single Row */}
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

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-1 w-full h-auto flex-wrap p-2">
              <TabsTrigger value="overview" className="px-3 py-2 text-xs sm:text-sm min-w-0 flex-shrink-0">Overview</TabsTrigger>
              <TabsTrigger value="orders" className="px-3 py-2 text-xs sm:text-sm min-w-0 flex-shrink-0">📋 Orders</TabsTrigger>
              <TabsTrigger value="affiliates" className="px-3 py-2 text-xs sm:text-sm min-w-0 flex-shrink-0">👥 Affiliates</TabsTrigger>
              <TabsTrigger value="abandoned" className="px-3 py-2 text-xs sm:text-sm min-w-0 flex-shrink-0">⏰ Abandoned</TabsTrigger>
              <TabsTrigger value="products" onClick={() => navigate('/admin/create-collection')} className="px-3 py-2 text-xs sm:text-sm min-w-0 flex-shrink-0">📦 Products</TabsTrigger>
              <TabsTrigger value="delivery-apps" className="px-3 py-2 text-xs sm:text-sm min-w-0 flex-shrink-0">🚚 Apps</TabsTrigger>
              <TabsTrigger value="cover-pages" onClick={() => navigate('/admin/cover-pages')} className="px-3 py-2 text-xs sm:text-sm min-w-0 flex-shrink-0">🎬 Cover Pages</TabsTrigger>
              <TabsTrigger value="post-checkout-builder" className="px-3 py-2 text-xs sm:text-sm min-w-0 flex-shrink-0">✅ Post-Checkout</TabsTrigger>
              <TabsTrigger value="quotes" onClick={() => navigate('/admin/quotes')} className="px-3 py-2 text-xs sm:text-sm min-w-0 flex-shrink-0">📋 Quotes</TabsTrigger>
              <TabsTrigger value="search-app-config" className="px-3 py-2 text-xs sm:text-sm min-w-0 flex-shrink-0">🔍 Search App</TabsTrigger>
              <TabsTrigger value="security-sync" className="px-3 py-2 text-xs sm:text-sm min-w-0 flex-shrink-0">🛡️ Security & Sync</TabsTrigger>
              <TabsTrigger value="performance" className="px-3 py-2 text-xs sm:text-sm min-w-0 flex-shrink-0">⚡ Performance & Optimization</TabsTrigger>
              <TabsTrigger value="ghl-setup" className="px-3 py-2 text-xs sm:text-sm min-w-0 flex-shrink-0">📱 GHL/SMS</TabsTrigger>
              <TabsTrigger value="settings" className="px-3 py-2 text-xs sm:text-sm min-w-0 flex-shrink-0">⚙️ Settings</TabsTrigger>
              <TabsTrigger value="cleanup" className="px-3 py-2 text-xs sm:text-sm min-w-0 flex-shrink-0">🗑️ Cleanup</TabsTrigger>
            </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Complete Order Summary</CardTitle>
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

          <TabsContent value="orders" className="space-y-4">
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Orders</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming Deliveries</TabsTrigger>
                <TabsTrigger value="past">Past Deliveries</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <Card>
                  <CardHeader>
                    <CardTitle>All Orders</CardTitle>
                    <p className="text-sm text-muted-foreground">Complete order history</p>
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
              
              <TabsContent value="upcoming">
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Deliveries</CardTitle>
                    <p className="text-sm text-muted-foreground">Orders scheduled for future delivery</p>
                  </CardHeader>
                  <CardContent>
                    <RecentOrdersFeed 
                      orders={recentOrders.filter(order => {
                        if (!order.delivery_date) return false;
                        const deliveryDate = new Date(order.delivery_date);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return deliveryDate >= today;
                      }).sort((a, b) => {
                        const dateA = new Date(a.delivery_date || 0);
                        const dateB = new Date(b.delivery_date || 0);
                        return dateA.getTime() - dateB.getTime();
                      })} 
                      title=""
                      onRefresh={loadDashboardData}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="past">
                <Card>
                  <CardHeader>
                    <CardTitle>Past Deliveries</CardTitle>
                    <p className="text-sm text-muted-foreground">Completed and overdue deliveries</p>
                  </CardHeader>
                  <CardContent>
                    <RecentOrdersFeed 
                      orders={recentOrders.filter(order => {
                        if (!order.delivery_date) return false;
                        const deliveryDate = new Date(order.delivery_date);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return deliveryDate < today;
                      }).sort((a, b) => {
                        const dateA = new Date(a.delivery_date || 0);
                        const dateB = new Date(b.delivery_date || 0);
                        return dateB.getTime() - dateA.getTime();
                      })} 
                      title=""
                      onRefresh={loadDashboardData}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>


          <TabsContent value="affiliates" className="space-y-4">
            <Tabs defaultValue="partners" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="partners">Affiliate Partners</TabsTrigger>
                <TabsTrigger value="discount-codes">Discount Codes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="partners">
                <ForceShopifySync />
                
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Affiliate Partners</h3>
                    <p className="text-sm text-muted-foreground">View affiliate partners and their custom delivery apps</p>
                  </div>
                  <AffiliateCreator onCreated={loadDashboardData} />
                </div>
            
            <div className="grid gap-4">
              {affiliates.length === 0 ? (
                <Card className="p-8 text-center">
                  <h4 className="text-lg font-medium mb-2">No Affiliates Yet</h4>
                  <p className="text-muted-foreground mb-4">When affiliates sign up, they'll appear here with their custom delivery apps.</p>
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
                            <h5 className="font-medium text-sm text-muted-foreground mb-2">Custom Delivery App</h5>
                            {affiliate.custom_affiliate_sites && affiliate.custom_affiliate_sites.length > 0 ? (
                              <div className="space-y-2">
                                {affiliate.custom_affiliate_sites.map((site: any) => (
                                  <div key={site.site_slug} className="space-y-1">
                                    <div className="text-sm font-medium">{site.site_name}</div>
                                    <div className="flex items-center gap-2">
                                      <div className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                        /app/{site.site_slug}
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
                                        {JSON.parse(site.delivery_address).city || 'Austin'}, {JSON.parse(site.delivery_address).state || 'TX'}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">No delivery app yet</div>
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
              
              <TabsContent value="discount-codes">
                <VoucherManagement />
              </TabsContent>
            </Tabs>
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
            <Tabs defaultValue="manager" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manager">App Manager</TabsTrigger>
                <TabsTrigger value="creator">App Creator</TabsTrigger>
              </TabsList>
              
              <TabsContent value="manager">
                <DeliveryAppManager />
              </TabsContent>
              
              <TabsContent value="creator">
                <DeliveryAppCreator />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="post-checkout-builder" className="space-y-4">
            <UnifiedCoverPostCheckoutBuilder onSuccess={loadDashboardData} />
          </TabsContent>

          <TabsContent value="link-validation" className="space-y-4">
            <LinkValidationDashboard />
          </TabsContent>

          <TabsContent value="security-sync" className="space-y-4">
            <SecuritySyncDashboard />
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Performance Optimization & Testing</h3>
                <p className="text-sm text-muted-foreground">Comprehensive performance monitoring, testing, and optimization tools</p>
              </div>
              
              <Tabs defaultValue="optimization" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="optimization">Optimization</TabsTrigger>
                  <TabsTrigger value="testing">Testing</TabsTrigger>
                  <TabsTrigger value="database">Database</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>
                
                <TabsContent value="optimization" className="space-y-4">
                  <div className="grid gap-4">
                    <EnhancedCacheManager />
                    <PerformanceOptimizationSummary />
                    <PerformanceChecklist />
                  </div>
                </TabsContent>
                
                <TabsContent value="testing" className="space-y-4">
                  <div className="grid gap-4">
                    <PerformanceTestRunner />
                    <SystemTestingSuite />
                  </div>
                </TabsContent>
                
                <TabsContent value="database" className="space-y-4">
                  <DatabaseOptimizationTester />
                </TabsContent>
                
                <TabsContent value="reports" className="space-y-4">
                  <PerformanceReportGenerator />
                </TabsContent>
              </Tabs>
            </div>
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



          <TabsContent value="speech-mode" className="space-y-4">
            <SpeechModeManager />
          </TabsContent>

          <TabsContent value="ghl-setup" className="space-y-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">GoHighLevel/SMS Integration Setup</h3>
                <p className="text-sm text-muted-foreground">Configure SMS and email notifications through GoHighLevel</p>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>GHL API Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    To enable SMS and email notifications, you need to configure your GoHighLevel API key.
                  </p>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Setup Instructions:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Log in to your GoHighLevel account</li>
                      <li>Go to Settings → Integrations → API</li>
                      <li>Generate a new API key with SMS permissions</li>
                      <li>Enter the API key below to enable the integration</li>
                    </ol>
                  </div>
                  
                   <TestGHLIntegration />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">App Settings</h3>
                <p className="text-sm text-muted-foreground">Configure global app behavior and features</p>
              </div>
              
              <AppConfigManager />
              <CoverPageToggle />
            </div>
          </TabsContent>

          <TabsContent value="search-app-config" className="space-y-4">
            <SearchAppConfig />
          </TabsContent>

          <TabsContent value="cleanup" className="space-y-4">
            <CleanupUserData />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}