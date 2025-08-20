import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Download, 
  Star, 
  Filter,
  ExternalLink,
  Figma,
  Palette,
  Layout,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FigmaTemplate {
  id: string;
  name: string;
  description: string;
  preview_url: string;
  figma_url: string;
  category: 'delivery_app' | 'cover_page' | 'post_checkout';
  device_type: 'mobile' | 'tablet' | 'desktop' | 'all';
  design_data: any;
  is_active: boolean;
  created_at: string;
  tags: string[];
}

interface FigmaTemplateLibraryProps {
  onSelectTemplate?: (template: FigmaTemplate) => void;
  category?: 'delivery_app' | 'cover_page' | 'post_checkout';
}

export const FigmaTemplateLibrary: React.FC<FigmaTemplateLibraryProps> = ({
  onSelectTemplate,
  category
}) => {
  const [templates, setTemplates] = useState<FigmaTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(category || 'all');
  const [selectedDevice, setSelectedDevice] = useState<string>('all');

  // Default Figma templates
  const defaultTemplates: FigmaTemplate[] = [
    {
      id: 'delivery-mobile-1',
      name: 'Modern Delivery App',
      description: 'Clean, modern design with card-based layout and premium feel',
      preview_url: '/api/placeholder/375/812',
      figma_url: 'https://figma.com/design/delivery-app-modern',
      category: 'delivery_app',
      device_type: 'mobile',
      design_data: {
        theme: 'modern',
        colors: { primary: '#3B82F6', secondary: '#10B981', background: '#F8FAFC' },
        typography: { heading: 'Inter', body: 'Inter' },
        layout: 'card-based',
        components: ['hero-section', 'product-tabs', 'floating-cart']
      },
      is_active: true,
      created_at: new Date().toISOString(),
      tags: ['modern', 'clean', 'blue', 'mobile-first']
    },
    {
      id: 'delivery-mobile-2',
      name: 'Luxury Alcohol Delivery',
      description: 'Premium gold theme perfect for high-end alcohol delivery services',
      preview_url: '/api/placeholder/375/812',
      figma_url: 'https://figma.com/design/luxury-alcohol-delivery',
      category: 'delivery_app',
      device_type: 'mobile',
      design_data: {
        theme: 'luxury',
        colors: { primary: '#D97706', secondary: '#000000', background: '#FFFBEB' },
        typography: { heading: 'Playfair Display', body: 'Inter' },
        layout: 'premium-grid',
        components: ['hero-video', 'product-carousel', 'exclusive-badge']
      },
      is_active: true,
      created_at: new Date().toISOString(),
      tags: ['luxury', 'gold', 'premium', 'alcohol']
    },
    {
      id: 'cover-page-1',
      name: 'Welcome Cover Page',
      description: 'Engaging cover page with video background and clear call-to-action',
      preview_url: '/api/placeholder/375/812',
      figma_url: 'https://figma.com/design/welcome-cover-page',
      category: 'cover_page',
      device_type: 'all',
      design_data: {
        theme: 'welcome',
        colors: { primary: '#7C3AED', secondary: '#F59E0B', background: '#1F2937' },
        typography: { heading: 'Poppins', body: 'Inter' },
        layout: 'centered-hero',
        components: ['video-background', 'feature-checklist', 'cta-buttons']
      },
      is_active: true,
      created_at: new Date().toISOString(),
      tags: ['welcome', 'video', 'dark', 'conversion']
    },
    {
      id: 'post-checkout-1',
      name: 'Order Confirmation',
      description: 'Friendly post-purchase screen with upsell opportunities',
      preview_url: '/api/placeholder/375/812',
      figma_url: 'https://figma.com/design/order-confirmation',
      category: 'post_checkout',
      device_type: 'all',
      design_data: {
        theme: 'success',
        colors: { primary: '#10B981', secondary: '#3B82F6', background: '#F0FDF4' },
        typography: { heading: 'Inter', body: 'Inter' },
        layout: 'centered-success',
        components: ['success-animation', 'order-summary', 'next-steps']
      },
      is_active: true,
      created_at: new Date().toISOString(),
      tags: ['success', 'green', 'confirmation', 'upsell']
    },
    {
      id: 'delivery-desktop-1',
      name: 'Desktop Delivery Portal',
      description: 'Full-width desktop experience with sidebar navigation',
      preview_url: '/api/placeholder/1200/800',
      figma_url: 'https://figma.com/design/desktop-delivery-portal',
      category: 'delivery_app',
      device_type: 'desktop',
      design_data: {
        theme: 'professional',
        colors: { primary: '#1F2937', secondary: '#3B82F6', background: '#FFFFFF' },
        typography: { heading: 'Inter', body: 'Inter' },
        layout: 'sidebar-main',
        components: ['navigation-sidebar', 'product-grid', 'filters-panel']
      },
      is_active: true,
      created_at: new Date().toISOString(),
      tags: ['desktop', 'professional', 'sidebar', 'grid']
    }
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      // Try to load from Supabase first
      const { data, error } = await supabase
        .from('figma_design_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not load from database, using default templates:', error);
        setTemplates(defaultTemplates);
      } else {
        // Merge database templates with defaults, but only those that match our interface
        const dbTemplates = (data || []).filter((item: any) => 
          item.template_name && item.template_category
        ).map((item: any) => ({
          id: item.id,
          name: item.template_name,
          description: 'Custom template from database',
          preview_url: item.preview_image_url || '/api/placeholder/375/812',
          figma_url: `https://figma.com/design/${item.figma_file_id}`,
          category: item.template_category as 'delivery_app' | 'cover_page' | 'post_checkout',
          device_type: 'all' as const,
          design_data: item.design_data,
          is_active: item.is_active,
          created_at: item.created_at,
          tags: ['custom', 'database']
        }));
        setTemplates([...defaultTemplates, ...dbTemplates]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates(defaultTemplates);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesDevice = selectedDevice === 'all' || template.device_type === selectedDevice || template.device_type === 'all';
    
    return matchesSearch && matchesCategory && matchesDevice;
  });

  const handleSelectTemplate = async (template: FigmaTemplate) => {
    try {
      toast.success(`Template "${template.name}" selected!`);
      onSelectTemplate?.(template);
    } catch (error) {
      console.error('Error selecting template:', error);
      toast.error('Failed to load template');
    }
  };

  const openInFigma = (figmaUrl: string) => {
    window.open(figmaUrl, '_blank');
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      case 'desktop': return <Monitor className="h-4 w-4" />;
      default: return <Layout className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'delivery_app': return 'bg-blue-100 text-blue-800';
      case 'cover_page': return 'bg-purple-100 text-purple-800';
      case 'post_checkout': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Figma className="h-6 w-6 text-purple-600" />
            Figma Template Library
          </h3>
          <p className="text-muted-foreground">
            Professional design templates to kickstart your projects
          </p>
        </div>
        <Button variant="outline" onClick={loadTemplates} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh Templates'}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label>Search Templates</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, description, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Category</Label>
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="delivery_app">Delivery</TabsTrigger>
                  <TabsTrigger value="cover_page">Cover</TabsTrigger>
                  <TabsTrigger value="post_checkout">Checkout</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div>
              <Label>Device</Label>
              <Tabs value={selectedDevice} onValueChange={setSelectedDevice}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="mobile">Mobile</TabsTrigger>
                  <TabsTrigger value="tablet">Tablet</TabsTrigger>
                  <TabsTrigger value="desktop">Desktop</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="group hover:shadow-lg transition-shadow">
            <div className="relative">
              <div className="aspect-[4/5] bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Layout className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Template Preview</p>
                  <p className="text-xs">({template.device_type})</p>
                </div>
              </div>
              <div className="absolute top-2 right-2 flex gap-1">
                <Badge className={getCategoryColor(template.category)}>
                  {template.category.replace('_', ' ')}
                </Badge>
              </div>
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  {getDeviceIcon(template.device_type)}
                  {template.device_type}
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold line-clamp-1">{template.name}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {template.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.tags.length - 3}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSelectTemplate(template)}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openInFigma(template.figma_url)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Layout className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or filter criteria
          </p>
          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setSelectedCategory('all');
            setSelectedDevice('all');
          }}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};