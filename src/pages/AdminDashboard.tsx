import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Crown,
  Medal,
  Award
} from 'lucide-react';

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

export const AdminDashboard: React.FC = () => {
  const [affiliates, setAffiliates] = useState<AffiliateStats[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>({
    totalAffiliates: 0,
    totalSales: 0,
    totalCommissions: 0,
    unpaidCommissions: 0,
    totalOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [payoutAlerts, setPayoutAlerts] = useState<AffiliateStats[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load all affiliates with their stats
      const { data: affiliatesData, error: affiliatesError } = await supabase
        .from('affiliates')
        .select('*')
        .order('total_sales', { ascending: false });

      if (affiliatesError) throw affiliatesError;

      setAffiliates(affiliatesData || []);

      // Calculate summary stats
      const totalAffiliates = affiliatesData?.length || 0;
      const totalSales = affiliatesData?.reduce((sum, a) => sum + Number(a.total_sales), 0) || 0;
      const totalCommissions = affiliatesData?.reduce((sum, a) => sum + Number(a.total_commission), 0) || 0;
      const unpaidCommissions = affiliatesData?.reduce((sum, a) => sum + Number(a.commission_unpaid), 0) || 0;
      const totalOrders = affiliatesData?.reduce((sum, a) => sum + Number(a.orders_count), 0) || 0;

      setSummary({
        totalAffiliates,
        totalSales,
        totalCommissions,
        unpaidCommissions,
        totalOrders
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
          <Button onClick={loadDashboardData}>
            Refresh Data
          </Button>
        </div>

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

        {/* Affiliate Leaderboard */}
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
              <div className="space-y-3">
                {affiliates.map((affiliate, index) => (
                  <div key={affiliate.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getRankIcon(index)}
                      </div>
                      <div>
                        <p className="font-medium">{affiliate.name}</p>
                        <p className="text-sm text-muted-foreground">{affiliate.company_name}</p>
                        <p className="text-xs text-muted-foreground">Code: {affiliate.affiliate_code}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-right">
                      <div>
                        <p className="font-medium">{formatCurrency(affiliate.total_sales)}</p>
                        <p className="text-xs text-muted-foreground">Total Sales</p>
                      </div>
                      <div>
                        <p className="font-medium">{affiliate.orders_count}</p>
                        <p className="text-xs text-muted-foreground">Orders</p>
                      </div>
                      <div>
                        <p className="font-medium">{formatCurrency(affiliate.total_commission)}</p>
                        <p className="text-xs text-muted-foreground">Total Commission</p>
                      </div>
                      <div>
                        <div className="flex flex-col items-end gap-1">
                          <p className={`font-medium ${affiliate.commission_unpaid >= 200 ? 'text-red-600' : ''}`}>
                            {formatCurrency(affiliate.commission_unpaid)}
                          </p>
                          <p className="text-xs text-muted-foreground">Unpaid</p>
                          <Badge variant={affiliate.commission_rate >= 10 ? 'default' : affiliate.commission_rate >= 7.5 ? 'secondary' : 'outline'}>
                            {affiliate.commission_rate}%
                          </Badge>
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
  );
};