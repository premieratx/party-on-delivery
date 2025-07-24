import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  ArrowUpIcon,
  Share2,
  Facebook,
  Twitter,
  Instagram,
  MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AffiliateData {
  id: string;
  name: string;
  company_name: string;
  phone?: string;
  venmo_handle?: string;
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
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    phone: '',
    companyName: '',
    venmoHandle: ''
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener for handling OAuth redirects
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email) {
        console.log('Auth state changed: SIGNED_IN', session.user.email);
        // Load affiliate data when user signs in
        setTimeout(() => {
          loadAffiliateData();
        }, 500); // Small delay to ensure auth is fully established
      }
    });

    // Initial load
    loadAffiliateData();

    return () => subscription.unsubscribe();
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

      // Check if profile needs completion
      const needsCompletion = !affiliateData.phone || !affiliateData.company_name;
      setNeedsProfileCompletion(needsCompletion);
      if (needsCompletion) {
        setProfileFormData({
          phone: affiliateData.phone || '',
          companyName: affiliateData.company_name || '',
          venmoHandle: affiliateData.venmo_handle || ''
        });
      }

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

  const shareToSocial = (platform: string) => {
    if (!affiliate) return;
    const affiliateUrl = `${window.location.origin}/a/${affiliate.affiliate_code}`;
    const text = `Get FREE delivery on your party supplies with ${affiliate.company_name}! 🎉`;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(affiliateUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(affiliateUrl)}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct URL sharing, so copy link
        copyAffiliateLink();
        toast({
          title: "Link Copied!",
          description: "Share your affiliate link in your Instagram story or bio.",
        });
        return;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + affiliateUrl)}`;
        break;
      case 'sms':
        shareUrl = `sms:?&body=${encodeURIComponent(text + ' ' + affiliateUrl)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
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

  const handleProfileCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!affiliate || !profileFormData.phone || !profileFormData.companyName) {
      toast({
        title: "Error",
        description: "Please fill in phone and company name.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('affiliates')
        .update({
          phone: profileFormData.phone,
          company_name: profileFormData.companyName,
          venmo_handle: profileFormData.venmoHandle || null
        })
        .eq('id', affiliate.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your profile has been updated successfully.",
      });

      setNeedsProfileCompletion(false);
      setShowProfileForm(false);
      
      // Reload the affiliate data
      loadAffiliateData();
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const progressData = getProgressToNextTier();
  const affiliateUrl = `${window.location.origin}/a/${affiliate.affiliate_code}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Profile Completion Prompt */}
        {needsProfileCompletion && (
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-blue-800 text-xl">🎉 Finish signup to see your personal concierge website!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-700 mb-4">
                Complete your profile with phone and company details to unlock your custom affiliate page and start earning commissions!
              </p>
              <Button 
                onClick={() => setShowProfileForm(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold"
                size="lg"
              >
                Complete Signup
              </Button>
            </CardContent>
          </Card>
        )}

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

        {/* Personal Concierge Website Section */}
        <Card>
          <CardHeader>
            <CardTitle>Your Personal Concierge Website</CardTitle>
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
            
            <div className="mb-4">
              <Button
                onClick={() => window.open(affiliateUrl, '_blank')}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Your Custom Page
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
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Share on Social Media</Label>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => shareToSocial('facebook')} 
                  variant="outline" 
                  size="sm"
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                >
                  <Facebook className="h-4 w-4 mr-2" />
                  Facebook
                </Button>
                <Button 
                  onClick={() => shareToSocial('twitter')} 
                  variant="outline" 
                  size="sm"
                  className="bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200"
                >
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                </Button>
                <Button 
                  onClick={() => shareToSocial('instagram')} 
                  variant="outline" 
                  size="sm"
                  className="bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200"
                >
                  <Instagram className="h-4 w-4 mr-2" />
                  Instagram
                </Button>
                <Button 
                  onClick={() => shareToSocial('whatsapp')} 
                  variant="outline" 
                  size="sm"
                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
                <Button 
                  onClick={() => shareToSocial('sms')} 
                  variant="outline" 
                  size="sm"
                  className="bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  SMS
                </Button>
              </div>
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

      {/* Profile Completion Dialog */}
      <Dialog open={showProfileForm} onOpenChange={setShowProfileForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProfileCompletion} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Best Cell Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={profileFormData.phone}
                onChange={(e) => setProfileFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 123-4567"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={profileFormData.companyName}
                onChange={(e) => setProfileFormData(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Enter your company name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="venmoHandle">Venmo Handle (Optional)</Label>
              <Input
                id="venmoHandle"
                value={profileFormData.venmoHandle}
                onChange={(e) => setProfileFormData(prev => ({ ...prev, venmoHandle: e.target.value }))}
                placeholder="@your-venmo-handle"
              />
              <p className="text-xs text-muted-foreground">
                For faster commission payouts
              </p>
            </div>

            <Button type="submit" className="w-full">
              Complete Profile
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};