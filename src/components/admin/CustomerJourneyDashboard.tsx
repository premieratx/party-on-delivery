import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Palette, 
  Settings, 
  BarChart3, 
  Zap, 
  Users,
  Globe,
  ShoppingCart,
  Award,
  Rocket
} from 'lucide-react';
// EmbeddedCoverPageCreator removed - standalone implementation only
import { EmbeddedPostCheckoutCreator } from './EmbeddedPostCheckoutCreator';
// CustomerFlowConfigurator removed - standalone architecture

export default function CustomerJourneyDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const features = [
    {
      icon: Sparkles,
      title: 'Cover Page Templates',
      description: 'Gold, Platinum & Original themes with full customization',
      status: 'Ready',
      badge: 'Templates Active',
      color: 'bg-gradient-to-r from-amber-500 to-yellow-500'
    },
    {
      icon: Award,
      title: 'Post-Checkout Experiences',
      description: 'Thank you pages with custom messaging and branding',
      status: 'Ready', 
      badge: 'Templates Active',
      color: 'bg-gradient-to-r from-green-500 to-emerald-500'
    },
    {
      icon: Settings,
      title: 'Customer Flow Orchestration',
      description: 'Link cover pages, apps, and post-checkout seamlessly',
      status: 'Ready',
      badge: 'Flow Builder',
      color: 'bg-gradient-to-r from-blue-500 to-purple-500'
    },
    {
      icon: Users,
      title: 'Affiliate Integration',
      description: 'Complete tracking from landing to conversion',
      status: 'Ready',
      badge: 'Tracking Active',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500'
    },
    {
      icon: Globe,
      title: 'Standalone URLs',
      description: 'Each page gets its own shareable URL',
      status: 'Ready',
      badge: 'URLs Generated',
      color: 'bg-gradient-to-r from-cyan-500 to-blue-500'
    },
    {
      icon: Zap,
      title: 'Button Link Management',
      description: 'Configure where each button leads with affiliate passing',
      status: 'Ready',
      badge: 'Full Control',
      color: 'bg-gradient-to-r from-orange-500 to-red-500'
    }
  ];

  const stats = [
    { label: 'System Status', value: 'Production Ready', color: 'text-green-600' },
    { label: 'Templates Available', value: '3 Themes', color: 'text-blue-600' },
    { label: 'Customization Options', value: '50+ Controls', color: 'text-purple-600' },
    { label: 'Integration Points', value: 'Fully Connected', color: 'text-amber-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-3">
            <Rocket className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-amber-500 bg-clip-text text-transparent">
              Customer Journey Control Center
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Complete system for creating end-to-end customer experiences with templates, 
            affiliate tracking, and seamless integration between cover pages, delivery apps, and post-checkout.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="default" className="bg-green-500 text-white">
              ✅ Production Ready
            </Badge>
            <Badge variant="secondary">
              🚀 All Components Active
            </Badge>
            <Badge variant="outline">
              📊 Analytics Ready
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-4">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              System Overview
            </TabsTrigger>
            <TabsTrigger value="cover-pages" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Cover Pages
            </TabsTrigger>
            <TabsTrigger value="post-checkout" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Post-Checkout
            </TabsTrigger>
            <TabsTrigger value="flow-builder" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Flow Builder
            </TabsTrigger>
          </TabsList>

          {/* System Overview */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  System Architecture & Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {features.map((feature, index) => (
                    <Card key={index} className="relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-full h-1 ${feature.color}`} />
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <feature.icon className="h-6 w-6 text-primary" />
                          <Badge variant="secondary" className="text-xs">
                            {feature.badge}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">
                          {feature.description}
                        </p>
                        <Badge variant="default" className="bg-green-500 text-white">
                          ✅ {feature.status}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => setActiveTab('cover-pages')}
                    className="h-20 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                  >
                    <div className="text-center">
                      <Sparkles className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-medium">Create Cover Page</div>
                      <div className="text-xs opacity-90">Gold • Platinum • Original</div>
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => setActiveTab('post-checkout')}
                    variant="outline"
                    className="h-20 border-green-200 hover:bg-green-50"
                  >
                    <div className="text-center">
                      <Award className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-medium">Create Post-Checkout</div>
                      <div className="text-xs opacity-70">Thank you experiences</div>
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => setActiveTab('flow-builder')}
                    variant="outline"
                    className="h-20 border-purple-200 hover:bg-purple-50"
                  >
                    <div className="text-center">
                      <Settings className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-medium">Build Customer Flow</div>
                      <div className="text-xs opacity-70">Connect everything</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cover Pages Tab */}
          <TabsContent value="cover-pages">
            <Card className="border-amber-200">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-600" />
                  Cover Page Creator
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Create stunning landing pages with Gold, Platinum, and Original templates. 
                  Full customization with logo sizing, typography, colors, and button configuration.
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">Cover page creation moved to standalone implementation</div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Post-Checkout Tab */}
          <TabsContent value="post-checkout">
            <Card className="border-green-200">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-600" />
                  Post-Checkout Experience Creator
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Design thank you pages that match your cover page themes. 
                  Custom messaging, branding, and call-to-action buttons.
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <EmbeddedPostCheckoutCreator />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Flow Builder Tab */}
          <TabsContent value="flow-builder">
            <Card className="border-purple-200">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  Customer Flow Configurator
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Connect cover pages to delivery apps and post-checkout experiences. 
                  Configure affiliate tracking, button URLs, and complete customer journeys.
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  Components are now standalone - no flow configuration needed.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}