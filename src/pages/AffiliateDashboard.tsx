import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Gift, 
  Copy, 
  QrCode,
  ExternalLink,
  Smartphone,
  Trophy,
  ArrowUpIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AffiliateData {
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
}

interface RecentOrder {
  id: string;
  order_id: string;
  customer_email: string;
  subtotal: number;
  commission_amount: number;
  order_date: string;
}

export const AffiliateDashboard: React.FC = () => {
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadAffiliateData();
  }, []);

  const loadAffiliateData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        navigate('/affiliate');
        return;
      }

      // Load affiliate profile
      const { data: affiliateData, error: affiliateError } = await supabase
        .from('affiliates')
        .select('*')
        .eq('email', user.email)
        .single();

      if (affiliateError) {
        if (affiliateError.code === 'PGRST116') {
          // No affiliate found, redirect to signup
          navigate('/affiliate');
          return;
        }
        throw affiliateError;
      }

      setAffiliate(affiliateData);

      // Load recent referrals
      const { data: referrals, error: referralsError } = await supabase
        .from('affiliate_referrals')
        .select('*')
        .eq('affiliate_id', affiliateData.id)
        .order('order_date', { ascending: false })
        .limit(10);

      if (referralsError) throw referralsError;

      setRecentOrders(referrals || []);
    } catch (error: any) {
      console.error('Error loading affiliate data:', error);
      toast({
        title: "Error",
        description: "Failed to load affiliate data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyAffiliateLink = async () => {
    if (!affiliate) return;
    
    setCopying(true);
    try {
      const affiliateUrl = `${window.location.origin}/a/${affiliate.affiliate_code}`;
      await navigator.clipboard.writeText(affiliateUrl);
      toast({
        title: "Copied!",
        description: "Your affiliate link has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCopying(false);
    }
  };

  const generateQRCode = () => {
    if (!affiliate) return;
    const affiliateUrl = `${window.location.origin}/a/${affiliate.affiliate_code}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(affiliateUrl)}`;
    window.open(qrUrl, '_blank');
  };

  const addToHomeScreen = () => {
    if (!affiliate) return;
    const affiliateUrl = `${window.location.origin}/a/${affiliate.affiliate_code}`;
    
    if (navigator.share) {
      navigator.share({
        title: `${affiliate.company_name} - Party On Delivery`,
        url: affiliateUrl
      });
    } else {
      // Fallback - copy to clipboard and show instructions
      copyAffiliateLink();
      toast({
        title: "Add to Home Screen",
        description: "Visit your affiliate link and use your browser's 'Add to Home Screen' feature.",
      });
    }
  };

  const getProgressToNextTier = () => {
    if (!affiliate) return { progress: 0, nextTier: 10000, nextRate: 7.5 };
    
    const sales = affiliate.total_sales;
    if (sales < 10000) {
      return { 
        progress: (sales / 10000) * 100, 
        nextTier: 10000, 
        nextRate: 7.5,
        reward: "7.5% Commission Rate"
      };
    } else if (sales < 20000) {
      return { 
        progress: ((sales - 10000) / 10000) * 100, 
        nextTier: 20000, 
        nextRate: 10,
        reward: "10% Commission + Free Boat Party!"
      };
    } else {
      return { 
        progress: 100, 
        nextTier: 20000, 
        nextRate: 10,
        reward: "Maximum Tier Reached!"
      };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Affiliate Account Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">You don't have an affiliate account yet.</p>
            <Button onClick={() => navigate('/affiliate')} className="w-full">
              Sign Up as Affiliate
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressData = getProgressToNextTier();
  const affiliateUrl = `${window.location.origin}/a/${affiliate.affiliate_code}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-brand-blue mb-2">
            Welcome back, {affiliate.name}!
          </h1>
          <p className="text-muted-foreground">
            {affiliate.company_name} Affiliate Dashboard
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(affiliate.total_sales)}</div>
              <p className="text-xs text-muted-foreground">
                From {affiliate.orders_count} orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(affiliate.total_commission)}</div>
              <p className="text-xs text-muted-foreground">
                {affiliate.commission_rate}% commission rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unpaid Commission</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(affiliate.commission_unpaid)}</div>
              <p className="text-xs text-muted-foreground">
                Pending payout
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Largest Order</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(affiliate.largest_order)}</div>
              <p className="text-xs text-muted-foreground">
                Best single sale
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progress to Next Tier */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Progress to Next Tier
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current: {affiliate.commission_rate}%</span>
                <span>Next: {progressData.reward}</span>
              </div>
              <Progress value={progressData.progress} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(affiliate.total_sales)}</span>
                <span>{formatCurrency(progressData.nextTier)}</span>
              </div>
            </div>
            {affiliate.total_sales >= 20000 && (
              <Badge variant="secondary" className="w-full justify-center">
                🎉 Congratulations! You've earned your boat party! 🎉
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Affiliate Link Section */}
        <Card>
          <CardHeader>
            <CardTitle>Your Affiliate Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={affiliateUrl}
                readOnly
                className="flex-1 px-3 py-2 border rounded-md bg-muted text-sm"
              />
              <Button onClick={copyAffiliateLink} disabled={copying} size="sm">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button onClick={generateQRCode} variant="outline" size="sm">
                <QrCode className="h-4 w-4 mr-2" />
                QR Code
              </Button>
              <Button onClick={addToHomeScreen} variant="outline" size="sm">
                <Smartphone className="h-4 w-4 mr-2" />
                Add to Home Screen
              </Button>
              <Button 
                onClick={() => window.open(affiliateUrl, '_blank')} 
                variant="outline" 
                size="sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview Page
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No orders yet. Start sharing your link to earn commissions!
              </p>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b">
                    <div>
                      <p className="font-medium">Order #{order.order_id}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.order_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(order.subtotal)}</p>
                      <p className="text-sm text-green-600">
                        +{formatCurrency(order.commission_amount)}
                      </p>
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