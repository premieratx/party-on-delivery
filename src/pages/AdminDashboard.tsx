import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDashboardSync } from '@/hooks/useDashboardSync';
import { RecentOrdersFeed } from '@/components/dashboard/RecentOrdersFeed';
import { formatCurrency } from '@/utils/currency';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Crown,
  Medal,
  Award,
  Package,
  Globe
} from 'lucide-react';
import TestSMS from '@/components/TestSMS';
import { SyncDataToSheets } from '@/components/SyncDataToSheets';

interface AffiliateStats {
  id: string;
  name: string;
  company_name: string;
  affiliate_code: string;
  commission_rate: number;
  total_sales: number;
  total_commission: number;
  commission_unpaid: number;
  orders_count: number;
  largest_order: number;
  created_at: string;
}

interface DashboardSummary {
  totalAffiliates: number;
  totalSales: number;
  totalCommissions: number;
  unpaidCommissions: number;
  totalOrders: number;
}

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  affiliate_id: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

interface AbandonedOrder {
  id: string;
  session_id: string;
  customer_email?: string;
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  affiliate_code?: string;
  affiliate_id?: string;
  cart_items: any;
  subtotal?: number;
  total_amount?: number;
  abandoned_at: string;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [affiliates, setAffiliates] = useState<AffiliateStats[]>([]);
  const [abandonedOrders, setAbandonedOrders] = useState<AbandonedOrder[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>({
    totalAffiliates: 0,
    totalSales: 0,
    totalCommissions: 0,
    unpaidCommissions: 0,
    totalOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [payoutAlerts, setPayoutAlerts] = useState<AffiliateStats[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const { toast } = useToast();

  // Set up dashboard sync
  const { refreshDashboardData } = useDashboardSync({
    dashboardType: 'admin',
    onOrderUpdate: (order) => {
      setRecentOrders(prev => {
        const exists = prev.some(o => o.id === order.id);
        if (!exists) {
          return [order, ...prev.slice(0, 9)]; // Keep only 10 most recent
        }
        return prev.map(o => o.id === order.id ? order : o);
      });
    }
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Check for delivery alerts
      try {
        await supabase.functions.invoke('check-delivery-alerts');
      } catch (alertError) {
        console.error('Error checking delivery alerts:', alertError);
      }
      
      // Use the unified dashboard data service
      const { data: dashboardData, error: dashboardError } = await supabase.functions.invoke('get-dashboard-data', {
        body: { type: 'admin' }
      });

      if (dashboardError) throw dashboardError;
      if (dashboardData.error) throw new Error(dashboardData.error);

      const { orders, customers, affiliateReferrals, totalRevenue, totalOrders, pendingCommissions, recentActivity } = dashboardData.data;
      const { data: affiliatesData, error: affiliatesError } = await supabase.from('affiliates').select('*').order('total_sales', { ascending: false });
      
      // Update recent orders for live feed
      setRecentOrders(orders?.slice(0, 10) || []);

      if (affiliatesError) throw affiliatesError;

      // Load notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (notificationsError) {
        console.error('Error loading notifications:', notificationsError);
      } else {
        setNotifications(notificationsData || []);
        setUnreadCount(notificationsData?.filter(n => !n.is_read).length || 0);
      }

      setAffiliates(affiliatesData || []);

      // Load abandoned orders with affiliate information
      const { data: abandonedData, error: abandonedError } = await supabase
        .from('abandoned_orders')
        .select(`
          *,
          affiliates(name, company_name, affiliate_code)
        `)
        .order('abandoned_at', { ascending: false })
        .limit(50);

      if (abandonedError) {
        console.error('Error loading abandoned orders:', abandonedError);
        toast({
          title: "Error loading abandoned orders",
          description: abandonedError.message,
          variant: "destructive",
        });
      } else {
        setAbandonedOrders(abandonedData || []);
      }

      // Calculate summary stats from dashboard data or fallback to affiliate data
      const totalAffiliates = affiliatesData?.length || 0;
      const totalSales = dashboardData.data.totalRevenue || affiliatesData?.reduce((sum, a) => sum + Number(a.total_sales), 0) || 0;
      const totalCommissions = affiliatesData?.reduce((sum, a) => sum + Number(a.total_commission), 0) || 0;
      const unpaidCommissions = dashboardData.data.pendingCommissions || affiliatesData?.reduce((sum, a) => sum + Number(a.commission_unpaid), 0) || 0;
      const orderCount = dashboardData.data.totalOrders || affiliatesData?.reduce((sum, a) => sum + Number(a.orders_count), 0) || 0;

      setSummary({
        totalAffiliates,
        totalSales,
        totalCommissions,
        unpaidCommissions,
        totalOrders: orderCount
      });

      // Check for payout alerts (affiliates with $200+ unpaid commissions)
      const alerts = affiliatesData?.filter(a => Number(a.commission_unpaid) >= 200) || [];
      setPayoutAlerts(alerts);

      if (alerts.length > 0) {
        toast({
          title: "Payout Alert!",
          description: `${alerts.length} affiliate(s) have $200+ in unpaid commissions.`,
          variant: "destructive"
        });
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground">#{index + 1}</span>;
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('is_read', false);
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-brand-blue mb-2">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Affiliate Program Management
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="default" 
              onClick={() => navigate('/admin/product-management')}
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Product Management
            </Button>
            <Button 
              variant="default" 
              onClick={() => navigate('/custom-sites')}
              className="flex items-center gap-2"
            >
              <Globe className="h-4 w-4" />
              Custom Sites
            </Button>
            <TestSMS />
            <Button variant="outline" onClick={loadDashboardData}>
              Refresh Data
            </Button>
            <Button 
              variant="outline" 
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/';
              }}
            >
              Sign Out
            </Button>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} new
              </Badge>
            )}
          </div>
        </div>

        {/* Notifications Section */}
        {notifications.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Recent Notifications
                  {unreadCount > 0 && (
                    <Badge variant="destructive">{unreadCount}</Badge>
                  )}
                </CardTitle>
                {unreadCount > 0 && (
                  <Button variant="outline" size="sm" onClick={markAllAsRead}>
                    Mark All Read
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {notifications.slice(0, 10).map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      notification.is_read 
                        ? 'bg-muted/30 border-muted' 
                        : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                    }`}
                    onClick={() => !notification.is_read && markNotificationAsRead(notification.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium ${!notification.is_read ? 'text-blue-900' : ''}`}>
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notification.created_at).toLocaleDateString()} at{' '}
                          {new Date(notification.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <Badge variant={
                        notification.type === 'duplicate_name' ? 'destructive' :
                        notification.type === 'payout_alert' ? 'secondary' :
                        'default'
                      }>
                        {notification.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payout Alerts */}
        {payoutAlerts.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Payout Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {payoutAlerts.map((affiliate) => (
                  <div key={affiliate.id} className="flex justify-between items-center p-2 bg-white rounded-md">
                    <div>
                      <p className="font-medium">{affiliate.name}</p>
                      <p className="text-sm text-muted-foreground">{affiliate.company_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">
                        {formatCurrency(affiliate.commission_unpaid)}
                      </p>
                      <p className="text-xs text-muted-foreground">unpaid</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalAffiliates}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalSales)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalCommissions)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unpaid Commissions</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.unpaidCommissions)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalOrders}</div>
            </CardContent>
          </Card>
        </div>

        {/* Live Recent Orders Feed */}
        <div className="mb-6">
          <RecentOrdersFeed 
            orders={recentOrders} 
            title="Live Order Feed"
            onRefresh={refreshDashboardData}
            refreshInterval={15000}
          />
        </div>

        {/* Google Sheets Sync */}
        <div className="flex justify-center">
          <SyncDataToSheets />
        </div>

        {/* Enhanced Affiliate Management Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Affiliate Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {affiliates.map((affiliate, index) => (
                <div key={affiliate.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {getRankIcon(index)}
                      <div>
                        <h3 className="font-semibold">{affiliate.name}</h3>
                        <p className="text-sm text-muted-foreground">{affiliate.company_name}</p>
                        <p className="text-sm text-muted-foreground">{affiliate.affiliate_code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(affiliate.total_sales)}</p>
                      <p className="text-sm text-muted-foreground">{affiliate.orders_count} orders</p>
                      <p className="text-sm text-green-600">{formatCurrency(affiliate.total_commission)} earned</p>
                      {affiliate.commission_unpaid > 0 && (
                        <p className="text-sm text-red-600">{formatCurrency(affiliate.commission_unpaid)} unpaid</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Affiliate details dropdown - expanded view */}
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium text-primary hover:underline">
                      View Details & Custom Sites
                    </summary>
                    <div className="mt-3 p-3 bg-muted/30 rounded-md space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium mb-1">Commission Info</h4>
                          <p>Rate: {affiliate.commission_rate}%</p>
                          <p>Largest Order: {formatCurrency(affiliate.largest_order)}</p>
                          <p>Joined: {new Date(affiliate.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Actions</h4>
                          <div className="flex gap-2 flex-wrap">
                            <Button size="sm" variant="outline" onClick={() => navigate('/custom-sites')}>
                              Manage Sites
                            </Button>
                            <Button size="sm" variant="outline">
                              View Orders
                            </Button>
                            <Button size="sm" variant="outline">
                              Process Payout
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Custom Sites for this affiliate */}
                      <div className="border-t pt-3">
                        <h4 className="font-medium mb-2">Custom Sites</h4>
                        <p className="text-sm text-muted-foreground">
                          Custom sites will be displayed here when linked to this affiliate.
                        </p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => {
                            navigate('/custom-sites');
                            // Could add affiliate filter here
                          }}
                        >
                          Create Custom Site
                        </Button>
                      </div>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Grid Layout for Quick Stats and Abandoned Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers Quick View */}
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              {affiliates.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No affiliates registered yet.
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {affiliates.slice(0, 10).map((affiliate, index) => (
                    <div key={affiliate.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getRankIcon(index)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{affiliate.name}</p>
                          <p className="text-xs text-muted-foreground">{affiliate.company_name}</p>
                          <p className="text-xs text-muted-foreground">Code: {affiliate.affiliate_code}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium text-sm">{formatCurrency(affiliate.total_sales)}</p>
                        <p className="text-xs text-muted-foreground">{affiliate.orders_count} orders</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className={`font-medium text-xs ${affiliate.commission_unpaid >= 200 ? 'text-red-600' : ''}`}>
                            {formatCurrency(affiliate.commission_unpaid)}
                          </p>
                          <Badge variant={affiliate.commission_rate >= 10 ? 'default' : affiliate.commission_rate >= 7.5 ? 'secondary' : 'outline'} className="text-xs">
                            {affiliate.commission_rate}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Abandoned Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600">⏰ All Abandoned Orders</CardTitle>
              <p className="text-sm text-muted-foreground">Customers who started checkout but didn't complete</p>
            </CardHeader>
            <CardContent>
              {abandonedOrders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No abandoned orders found.
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {abandonedOrders.map((order) => (
                    <div key={order.id} className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-orange-800 text-sm">
                            {order.customer_name || order.customer_email || 'Anonymous Customer'}
                          </p>
                          {order.customer_email && (
                            <p className="text-xs text-orange-600">{order.customer_email}</p>
                          )}
                          {order.customer_phone && (
                            <p className="text-xs text-orange-600">{order.customer_phone}</p>
                          )}
                          {order.delivery_address && (
                            <p className="text-xs text-orange-500 mt-1">{order.delivery_address}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {order.affiliate_code && (
                              <Badge variant="outline" className="text-xs">
                                Affiliate: {order.affiliate_code}
                              </Badge>
                            )}
                            <p className="text-xs text-orange-500">
                              {new Date(order.abandoned_at).toLocaleDateString()} at {new Date(order.abandoned_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          {order.total_amount && (
                            <p className="font-medium text-orange-800 text-sm">{formatCurrency(order.total_amount)}</p>
                          )}
                          <div className="flex gap-1 mt-1">
                            {order.customer_phone && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-xs px-2 py-1 h-auto"
                                onClick={() => window.open(`tel:${order.customer_phone}`)}
                                title="Call customer"
                              >
                                📞
                              </Button>
                            )}
                            {order.customer_phone && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-xs px-2 py-1 h-auto"
                                onClick={() => window.open(`sms:${order.customer_phone}&body=Hi! I noticed you started an order for party delivery. Everything OK? Let me know if you need any help completing your order!`)}
                                title="Text customer"
                              >
                                💬
                              </Button>
                            )}
                            {order.customer_email && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-xs px-2 py-1 h-auto"
                                onClick={() => window.open(`mailto:${order.customer_email}?subject=Complete your Party On Delivery order&body=Hi! I noticed you started an order for delivery. Everything OK? Let me know if you need any help completing your order!`)}
                                title="Email customer"
                              >
                                📧
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};