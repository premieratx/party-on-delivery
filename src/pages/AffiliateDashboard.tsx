import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDashboardSync } from '@/hooks/useDashboardSync';
import { RecentOrdersFeed } from '@/components/dashboard/RecentOrdersFeed';
import { formatCurrency } from '@/utils/currency';
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
  MessageSquare,
  ChevronDown,
  FileText,
  Mail,
  Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AffiliateData {
  id: string;
  name: string;
  email: string;
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

export const AffiliateDashboard: React.FC = () => {
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [abandonedOrders, setAbandonedOrders] = useState<AbandonedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    phone: '',
    companyName: '',
    venmoHandle: ''
  });
  const [affiliateOrders, setAffiliateOrders] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Set up dashboard sync
  const { refreshDashboardData } = useDashboardSync({
    dashboardType: 'affiliate',
    userEmail: affiliate?.email,
    affiliateCode: affiliate?.affiliate_code,
    onAffiliateUpdate: (referral) => {
      setRecentOrders(prev => {
        const exists = prev.some(o => o.id === referral.id);
        if (!exists) {
          return [referral, ...prev.slice(0, 9)];
        }
        return prev;
      });
    }
  });

  useEffect(() => {
    // Set up auth state listener for handling OAuth redirects
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔥 Auth state changed in dashboard:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user?.email) {
        console.log('✅ User signed in via OAuth, loading affiliate data...');
        // Load data immediately for OAuth redirects
        loadAffiliateData();
      }
      
      if (event === 'SIGNED_OUT') {
        console.log('❌ User signed out, redirecting...');
        navigate('/affiliate');
      }
    });

    // Initial load - check if user is already authenticated
    const checkInitialAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔍 Initial session check:', session?.user?.email);
        
        if (session?.user?.email) {
          console.log('✅ Found existing session, loading data...');
          loadAffiliateData();
        } else {
          console.log('❌ No session found, redirecting to signup...');
          setLoading(false);
          navigate('/affiliate');
        }
      } catch (error) {
        console.error('Error checking initial auth:', error);
        setLoading(false);
        navigate('/affiliate');
      }
    };

    checkInitialAuth();

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadAffiliateData = async () => {
    console.log('🔄 Loading affiliate data...');
    setLoading(true);
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('👤 Current user:', user?.email);
      
      if (userError || !user) {
        console.log('❌ No user found, redirecting to signup');
        navigate('/affiliate');
        return;
      }

      // Load affiliate profile
      console.log('🔍 Looking for affiliate with email:', user.email);
      const { data: affiliateData, error: affiliateError } = await supabase
        .from('affiliates')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      console.log('📊 Affiliate query result:', { affiliateData, affiliateError });

      if (affiliateError) {
        console.error('❌ Error fetching affiliate:', affiliateError);
        throw affiliateError;
      }

      if (!affiliateData) {
        // No affiliate found, redirect to signup
        console.log('❌ No affiliate found for user, redirecting to signup');
        navigate('/affiliate');
        return;
      }

      console.log('✅ Affiliate found:', affiliateData.name);
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

      // Use the unified dashboard data service
      const { data: dashboardData, error: dashboardError } = await supabase.functions.invoke('get-dashboard-data', {
        body: { 
          type: 'affiliate', 
          email: user.email,
          affiliateCode: affiliateData.affiliate_code
        }
      });

      if (dashboardError) {
        console.error('Dashboard data error:', dashboardError);
        // Fallback to direct queries
        const { data: referrals, error: referralsError } = await supabase
          .from('affiliate_referrals')
          .select('*')
          .eq('affiliate_id', affiliateData.id)
          .order('order_date', { ascending: false })
          .limit(10);

        if (referralsError) throw referralsError;
        setRecentOrders(referrals || []);
      } else if (dashboardData.error) {
        throw new Error(dashboardData.error);
      } else {
        // Use dashboard service data  
        setRecentOrders(dashboardData.data.affiliateReferrals || []);
        setAffiliateOrders(dashboardData.data.orders || []);
        // Update affiliate stats from dashboard data
        setAffiliate(prev => ({
          ...prev,
          total_sales: dashboardData.data.totalRevenue || prev.total_sales,
          orders_count: dashboardData.data.totalOrders || prev.orders_count,
          commission_unpaid: dashboardData.data.pendingCommissions || prev.commission_unpaid
        }));
      }

      // Load abandoned orders
      const { data: abandoned, error: abandonedError } = await supabase
        .from('abandoned_orders')
        .select('*')
        .eq('affiliate_id', affiliateData.id)
        .order('abandoned_at', { ascending: false })
        .limit(20);

      if (abandonedError) console.warn('Failed to load abandoned orders:', abandonedError);
      
      setAbandonedOrders(abandoned || []);
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

  const getEmailTemplate = () => {
    return `🎉 SURPRISE! Free Cold Delivery to Your Rental! 🎉

Hey there!

Hope you're having an amazing time at your rental! I'm with ${affiliate?.company_name}, and I've got some exciting news for you.

Since you're staying at one of our partner properties, you qualify for FREE DELIVERY from Party on Delivery Austin! 🚚❄️

🍺 Ice-cold beer, wine, seltzers & cocktails
🧊 Delivered COLD directly to your door
💰 FREE shipping (normally $12.99)
⚡ Same-day delivery available

Perfect for pool parties, game nights, or just relaxing after exploring Austin!

Use this special link to order:
${window.location.origin}/a/${affiliate?.affiliate_code}

Questions? Just reply to this email!

Cheers to your Austin adventure! 🍻
${affiliate?.name}
${affiliate?.company_name}`;
  };

  const getWebsiteBlurb = () => {
    return `🍻 FREE Cold Delivery for Our Guests! 🍻

Welcome to your Austin getaway! As our valued guest, you get FREE DELIVERY on ice-cold drinks from Party on Delivery Austin.

✅ Beer, wine, cocktails & seltzers
✅ Delivered ice-cold to your door  
✅ FREE shipping (save $12.99!)
✅ Same-day delivery available

Perfect for pool time, BBQs, or exploring Austin's nightlife scene!

ORDER NOW: ${window.location.origin}/a/${affiliate?.affiliate_code}

Questions? Contact ${affiliate?.name} at ${affiliate?.email}`;
  };

  const getTextTemplate = () => {
    return `🎉 Hey! Free cold delivery perk at your rental! 

${affiliate?.company_name} guests get FREE shipping on ice-cold drinks delivered to your door. Beer, wine, cocktails - all delivered cold! 

Order: ${window.location.origin}/a/${affiliate?.affiliate_code}

Enjoy Austin! 🍻
${affiliate?.name}`;
  };

  const getInstagramTemplate = () => {
    return `🍻✨ SURPRISE YOUR GUESTS! ✨🍻

Hey ${affiliate?.company_name} fam! Want to absolutely WOW your guests? 

🎉 FREE COLD DELIVERY just dropped at your rental!
🧊 Ice-cold beer, wine & cocktails 
🚚 Delivered straight to your door
💰 NO delivery fees (we got you!)
⚡ Same-day delivery available

Perfect for:
🏊‍♀️ Pool parties that pop off
🌮 Taco Tuesday takeovers  
🎮 Game night greatness
🌅 Sunset sip sessions

Don't let your crew settle for warm drinks from the corner store when you can have EVERYTHING delivered ice-cold! 

Tag a friend who needs this! 👇

#AustinLife #PartyOnDelivery #POD #VacationVibes #AustinRentals #FreeDelivery

Link in bio: ${window.location.origin}/a/${affiliate?.affiliate_code}`;
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard!`,
    });
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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={async () => {
              await supabase.auth.signOut();
              navigate('/affiliate');
            }}
            className="mt-2"
          >
            Sign Out
          </Button>
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
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(progressData.progress, 100)}%` }}
                />
              </div>
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
            <CardTitle className="text-xl font-bold">🎉 Your Personal Concierge Website</CardTitle>
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

        {/* Marketing Templates Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-bold">🚀 Marketing Templates</CardTitle>
            <p className="text-muted-foreground">Ready-to-use content to share with your guests and spread the POD love!</p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="email">📧 Email</TabsTrigger>
                <TabsTrigger value="text">💬 Text</TabsTrigger>
                <TabsTrigger value="instagram">📸 IG Post</TabsTrigger>
                <TabsTrigger value="website">🌐 Website</TabsTrigger>
              </TabsList>
              
              <TabsContent value="email" className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Email Template</h4>
                  <p className="text-sm text-muted-foreground mb-3">Perfect for sending to your guest list!</p>
                  <div className="bg-background p-3 rounded border text-sm whitespace-pre-line">
                    {getEmailTemplate()}
                  </div>
                  <Button 
                    onClick={() => copyToClipboard(getEmailTemplate(), "Email template")} 
                    className="mt-3 w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Email Template
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="text" className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Text Message Template</h4>
                  <p className="text-sm text-muted-foreground mb-3">Quick and easy for instant sharing!</p>
                  <div className="bg-background p-3 rounded border text-sm whitespace-pre-line">
                    {getTextTemplate()}
                  </div>
                  <Button 
                    onClick={() => copyToClipboard(getTextTemplate(), "Text message template")} 
                    className="mt-3 w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Text Template
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="instagram" className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Instagram Post Template</h4>
                  <p className="text-sm text-muted-foreground mb-3">Engaging content for your social media!</p>
                  <div className="bg-background p-3 rounded border text-sm whitespace-pre-line">
                    {getInstagramTemplate()}
                  </div>
                  <Button 
                    onClick={() => copyToClipboard(getInstagramTemplate(), "Instagram template")} 
                    className="mt-3 w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy IG Template
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="website" className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Website Blurb</h4>
                  <p className="text-sm text-muted-foreground mb-3">Add this to your website or booking confirmation!</p>
                  <div className="bg-background p-3 rounded border text-sm whitespace-pre-line">
                    {getWebsiteBlurb()}
                  </div>
                  <Button 
                    onClick={() => copyToClipboard(getWebsiteBlurb(), "Website blurb")} 
                    className="mt-3 w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Website Blurb
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Back to Start Button */}
            <div className="mt-6 pt-4 border-t border-border">
              <Button 
                onClick={() => {
                  const affiliateCode = affiliate?.affiliate_code;
                  if (affiliateCode) {
                    navigate(`/a/${affiliateCode}`);
                  } else {
                    navigate('/');
                  }
                }}
                className="w-full h-12 text-base"
                variant="outline"
              >
                🏠 Back to Start
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders & Abandoned Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">✅ Recent Orders</CardTitle>
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

          {/* Abandoned Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600">⏰ Abandoned Orders</CardTitle>
              <p className="text-sm text-muted-foreground">Customers who started checkout but didn't complete - reach out to them!</p>
            </CardHeader>
            <CardContent>
              {abandonedOrders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No abandoned orders. Your customers are completing their purchases! 🎉
                </p>
              ) : (
                <div className="space-y-3">
                  {abandonedOrders.map((order) => (
                    <div key={order.id} className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-orange-800">
                            {order.customer_name || order.customer_email || 'Anonymous Customer'}
                          </p>
                          {order.customer_email && (
                            <p className="text-sm text-orange-600">{order.customer_email}</p>
                          )}
                          {order.customer_phone && (
                            <p className="text-sm text-orange-600">{order.customer_phone}</p>
                          )}
                          {order.delivery_address && (
                            <p className="text-xs text-orange-500 mt-1">{order.delivery_address}</p>
                          )}
                          <p className="text-xs text-orange-500 mt-1">
                            Abandoned: {new Date(order.abandoned_at).toLocaleDateString()} at {new Date(order.abandoned_at).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="text-right ml-2">
                          {order.total_amount && (
                            <p className="font-medium text-orange-800">{formatCurrency(order.total_amount)}</p>
                          )}
                          <div className="flex gap-1 mt-1">
                            {order.customer_email && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-xs px-2 py-1 h-auto"
                                onClick={() => window.open(`mailto:${order.customer_email}?subject=Complete your Party On Delivery order&body=Hi! I noticed you started an order for delivery. Everything OK? Let me know if you need any help completing your order!`)}
                              >
                                📧
                              </Button>
                            )}
                            {order.customer_phone && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-xs px-2 py-1 h-auto"
                                onClick={() => window.open(`sms:${order.customer_phone}&body=Hi! I noticed you started an order for party delivery. Everything OK? Let me know if you need any help completing your order!`)}
                              >
                                💬
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