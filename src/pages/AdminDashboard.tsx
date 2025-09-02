import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RecentOrdersFeed } from '@/components/dashboard/RecentOrdersFeed';
// Customer Flow Manager removed - standalone architecture
// AffiliateFlowAssignmentManager removed - standalone architecture
import { EnhancedCoverPageManager } from '@/components/admin/EnhancedCoverPageManager';
import { EnhancedDeliveryAppManager } from '@/components/admin/EnhancedDeliveryAppManager';
import { EnhancedPostCheckoutManager } from '@/components/admin/EnhancedPostCheckoutManager';
import { AffiliateCreator } from '@/components/admin/AffiliateCreator';
import { HomepageAppSwitcher } from '@/components/admin/HomepageAppSwitcher';
import { HomepageTestComponent } from '@/components/admin/HomepageTestComponent';
import { HomepageDiagnosticTool } from '@/components/admin/HomepageDiagnosticTool';
// EnhancedCoverPageCreator removed - standalone implementation only
import EnhancedPostCheckoutCreator from '@/components/admin/EnhancedPostCheckoutCreator';
import { UnifiedDeliveryAppCreator } from '@/components/admin/UnifiedDeliveryAppCreator';
import { supabase } from '@/integrations/supabase/client';
import { withRetry, isRetryableError } from '@/utils/retryWrapper';
import { useToast } from '@/hooks/use-toast';
import { useAdminState } from '@/hooks/useAdminState';
import { useAdminDashboard } from '@/hooks/useDashboardData';
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
import { AdminPerformanceFix } from '@/components/admin/AdminPerformanceFix';
import { DeliveryAppIntegrationTest } from '@/components/admin/DeliveryAppIntegrationTest';
import { AbandonedOrdersManager } from '@/components/admin/AbandonedOrdersManager';
import { GoogleSheetsManager } from '@/components/admin/GoogleSheetsManager';
import { ShopifyForceSync } from '@/components/admin/ShopifyForceSync';
import { DeliveryFeeSummary } from '@/components/admin/DeliveryFeeSummary';
import { PromoCodeManager } from '@/components/admin/PromoCodeManager';
import { TailgateBeerOrderChecker } from '@/components/admin/TailgateBeerOrderChecker';

export default function AdminDashboard() {
  // Use the dashboard hook for data loading
  const { data: dashboardData, loading, error, refresh } = useAdminDashboard();
  
  // Derived state from dashboard data
  const totalRevenue = dashboardData?.totalRevenue || 0;
  const totalOrders = dashboardData?.totalOrders || 0;
  const totalCustomers = dashboardData?.customers?.length || 0;
  const totalProducts = 1052;
  const recentOrders = dashboardData?.orders || [];
  const affiliates = dashboardData?.affiliateReferrals || [];
  const abandonedOrders = [];
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeTab, updateActiveTab } = useAdminState('overview');
  const [showDeliveryCreator, setShowDeliveryCreator] = useState(false);
  const [showCoverCreator, setShowCoverCreator] = useState(false);
  const [showPostCheckoutCreator, setShowPostCheckoutCreator] = useState(false);

  // Show error toast if dashboard loading fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Dashboard Error",
        description: error,
        variant: "destructive"
      });
    }
  }, [error, toast]);

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

  // Remove excessive render logging - dashboard works silently
  // console.log('🎯 AdminDashboard: Rendering with activeTab:', activeTab, 'loading:', loading);

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
    <AdminPerformanceFix>
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
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
            <TabsTrigger value="covers">Cover Pages</TabsTrigger>
            <TabsTrigger value="delivery">Delivery Apps</TabsTrigger>
            <TabsTrigger value="checkout">Post-Checkout</TabsTrigger>
            <TabsTrigger value="abandoned">Abandoned Orders</TabsTrigger>
            <TabsTrigger value="sheets">Google Sheets</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="tests">Integration Tests</TabsTrigger>
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
              {/* AffiliateFlowAssignmentManager removed - standalone architecture */}
              
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
              <TailgateBeerOrderChecker />
              <ShopifyForceSync />
              <DeliveryFeeSummary />
              <PromoCodeManager />
              {/* Customer Flow Manager removed - standalone architecture */}
              <HomepageDiagnosticTool />
              <HomepageAppSwitcher />
              <HomepageTestComponent />
            </div>
          </TabsContent>

          <TabsContent value="abandoned" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Abandoned Orders</h2>
            </div>
            <AbandonedOrdersManager />
          </TabsContent>

          <TabsContent value="sheets" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Google Sheets Integration</h2>
            </div>
            <GoogleSheetsManager />
          </TabsContent>

          <TabsContent value="tests" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Integration Tests</h2>
            </div>
            <DeliveryAppIntegrationTest />
          </TabsContent>
        </Tabs>
      </div>

      {/* Creator Modals */}
      {showCoverCreator && (
        <div>Cover page creation moved to EnhancedCoverPageManager</div>
      )}
      
      {showDeliveryCreator && (
        <UnifiedDeliveryAppCreator 
          open={showDeliveryCreator}
          onOpenChange={setShowDeliveryCreator}
          onSaved={() => {
            setShowDeliveryCreator(false);
            refresh(); // Refresh data after creation
          }}
        />
      )}
      
      {showPostCheckoutCreator && (
        <EnhancedPostCheckoutCreator 
          open={showPostCheckoutCreator}
          onOpenChange={setShowPostCheckoutCreator}
          onSaved={() => {
            setShowPostCheckoutCreator(false);
            refresh(); // Refresh data after creation
          }}
        />
      )}
      </div>
    </AdminPerformanceFix>
  );
}