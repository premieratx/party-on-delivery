import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Settings, 
  Eye, 
  BarChart3, 
  Users, 
  Package, 
  ShoppingCart,
  Palette,
  Layout,
  FileText,
  Zap,
  Globe,
  Smartphone,
  Monitor,
  ArrowRight,
  Sparkles,
  Star,
  TrendingUp
} from 'lucide-react';

import { UnifiedCoverPageEditor } from './UnifiedCoverPageEditor';
import { EnhancedPostCheckoutManager } from './EnhancedPostCheckoutManager';
import { UnifiedDeliveryAppCreator } from './UnifiedDeliveryAppCreator';

interface AdminDashboardImprovedProps {
  onNavigate?: (page: string) => void;
}

const QUICK_STATS = [
  { title: 'Active Apps', value: '12', change: '+2', icon: Package, color: 'text-blue-600' },
  { title: 'Cover Pages', value: '8', change: '+1', icon: Layout, color: 'text-green-600' },
  { title: 'Total Orders', value: '1,234', change: '+12%', icon: ShoppingCart, color: 'text-purple-600' },
  { title: 'Conversion Rate', value: '3.2%', change: '+0.5%', icon: TrendingUp, color: 'text-orange-600' }
];

const RECENT_ACTIVITY = [
  { type: 'app', title: 'Airbnb Concierge Service updated', time: '2 hours ago', status: 'active' },
  { type: 'page', title: 'New cover page "Elite Concierge" created', time: '4 hours ago', status: 'new' },
  { type: 'order', title: '23 new orders received', time: '6 hours ago', status: 'success' },
  { type: 'system', title: 'Inventory sync completed', time: '8 hours ago', status: 'info' }
];

export const AdminDashboardImproved: React.FC<AdminDashboardImprovedProps> = ({ onNavigate }) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'apps' | 'pages' | 'checkout'>('overview');
  const [showAppCreator, setShowAppCreator] = useState(false);
  const [showPageCreator, setShowPageCreator] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [editingPage, setEditingPage] = useState(null);

  const handleCreateApp = () => {
    setEditingApp(null);
    setShowAppCreator(true);
  };

  const handleCreatePage = () => {
    setEditingPage(null);
    setShowPageCreator(true);
  };

  const handleEditApp = (app: any) => {
    setEditingApp(app);
    setShowAppCreator(true);
  };

  const handleEditPage = (page: any) => {
    setEditingPage(page);
    setShowPageCreator(true);
  };

  if (showAppCreator) {
    return (
      <div className="min-h-screen bg-background">
        <UnifiedDeliveryAppCreator
          open={showAppCreator}
          onOpenChange={setShowAppCreator}
          initial={editingApp}
          onSaved={() => {
            setShowAppCreator(false);
            setEditingApp(null);
          }}
        />
      </div>
    );
  }

  if (showPageCreator) {
    return (
      <UnifiedCoverPageEditor
        open={showPageCreator}
        onOpenChange={setShowPageCreator}
        initial={editingPage}
        onSaved={() => {
          setShowPageCreator(false);
          setEditingPage(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-primary" />
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage your delivery apps, cover pages, and customer experiences
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => onNavigate?.('analytics')}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
              <Button variant="outline" onClick={() => onNavigate?.('settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeSection} onValueChange={(value: any) => setActiveSection(value)}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="apps" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Delivery Apps
            </TabsTrigger>
            <TabsTrigger value="pages" className="flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Cover Pages
            </TabsTrigger>
            <TabsTrigger value="checkout" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Post-Checkout
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {QUICK_STATS.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {stat.title}
                          </p>
                          <p className="text-2xl font-bold">{stat.value}</p>
                          <p className="text-xs text-green-600 font-medium">
                            {stat.change} from last month
                          </p>
                        </div>
                        <Icon className={`w-8 h-8 ${stat.color}`} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => setActiveSection('apps')}
                    className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    <Package className="w-6 h-6" />
                    <span>Manage Delivery Apps</span>
                  </Button>
                  <Button 
                    onClick={handleCreatePage}
                    className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    <Layout className="w-6 h-6" />
                    <span>Create Cover Page</span>
                  </Button>
                  <Button 
                    onClick={() => setActiveSection('checkout')}
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-muted"
                  >
                    <ShoppingCart className="w-6 h-6" />
                    <span>Manage Post-Checkout</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {RECENT_ACTIVITY.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.status === 'active' ? 'bg-blue-500' :
                          activity.status === 'new' ? 'bg-green-500' :
                          activity.status === 'success' ? 'bg-purple-500' :
                          'bg-gray-500'
                        }`} />
                        <span className="font-medium">{activity.title}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="apps" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Delivery Apps</h2>
                <p className="text-muted-foreground">
                  Create and manage your custom delivery applications
                </p>
              </div>
              <Button onClick={handleCreateApp} className="gap-2">
                <Plus className="w-4 h-4" />
                Create New App
              </Button>
            </div>

            {/* App Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
                <CardContent className="p-6 text-center">
                  <Smartphone className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Mobile-First Design</h3>
                  <p className="text-sm text-muted-foreground">
                    Perfectly optimized for mobile devices with responsive layouts
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
                <CardContent className="p-6 text-center">
                  <Palette className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Custom Branding</h3>
                  <p className="text-sm text-muted-foreground">
                    Full customization of colors, logos, and visual themes
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
                <CardContent className="p-6 text-center">
                  <Globe className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Multi-Store Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect multiple product collections and categories
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Create First App CTA */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-8 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">Ready to Create Your First App?</h3>
                <p className="text-muted-foreground mb-6">
                  Launch your custom delivery experience in minutes with our visual editor
                </p>
                <Button onClick={handleCreateApp} size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  Manage Delivery Apps
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Cover Pages</h2>
                <p className="text-muted-foreground">
                  Design beautiful landing pages for your services
                </p>
              </div>
              <Button onClick={handleCreatePage} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Cover Page
              </Button>
            </div>

            {/* Page Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Premium Themes</h3>
                      <p className="text-sm text-muted-foreground">
                        Choose from luxury, modern, and custom themes
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      Luxury Gold Theme
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-blue-500" />
                      Ocean Blue Theme
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-green-500" />
                      Forest Green Theme
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <Eye className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Live Preview</h3>
                      <p className="text-sm text-muted-foreground">
                        See your changes in real-time across all devices
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-muted-foreground" />
                      Desktop Preview
                    </li>
                    <li className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-muted-foreground" />
                      Mobile Preview
                    </li>
                    <li className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      Instant Updates
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Create First Page CTA */}
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <CardContent className="p-8 text-center">
                <Layout className="w-16 h-16 mx-auto mb-4 text-green-600" />
                <h3 className="text-xl font-bold mb-2">Create Your First Cover Page</h3>
                <p className="text-muted-foreground mb-6">
                  Design stunning landing pages with our drag-and-drop editor
                </p>
                <Button onClick={handleCreatePage} size="lg" className="gap-2 bg-green-600 hover:bg-green-700">
                  <Plus className="w-5 h-5" />
                  Create Cover Page
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checkout" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Post-Checkout Experience</h2>
                <p className="text-muted-foreground">
                  Customize what customers see after completing their purchase
                </p>
              </div>
            </div>

            <EnhancedPostCheckoutManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};