import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package2, 
  FileText, 
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Palette,
  Home,
  Star,
  Copy,
  ExternalLink,
  Layers,
  ArrowRight,
  Code
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UnifiedDeliveryAppCreator } from './UnifiedDeliveryAppCreator';
import { UnifiedCoverPageCreator } from './UnifiedCoverPageCreator';
import { UnifiedPostCheckoutCreator } from './UnifiedPostCheckoutCreator';
import { EmbedCodeManager } from './EmbedCodeManager';
import { UNIFIED_THEMES } from '@/lib/themeSystem';

interface FlowItem {
  id: string;
  name: string;
  slug: string;
  theme: 'original' | 'gold' | 'platinum';
  is_active?: boolean;
  is_homepage?: boolean;
  is_default?: boolean;
  created_at: string;
}

export const UnifiedFlowCreatorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('delivery-apps');
  const [deliveryApps, setDeliveryApps] = useState<FlowItem[]>([]);
  const [coverPages, setCoverPages] = useState<FlowItem[]>([]);
  const [postCheckoutPages, setPostCheckoutPages] = useState<FlowItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Creator states
  const [showDeliveryCreator, setShowDeliveryCreator] = useState(false);
  const [showCoverCreator, setShowCoverCreator] = useState(false);
  const [showPostCheckoutCreator, setShowPostCheckoutCreator] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const { toast } = useToast();

  // Load all data
  const loadData = async () => {
    setLoading(true);
    try {
      const [deliveryResponse, coverResponse, postCheckoutResponse] = await Promise.all([
        supabase.from('delivery_app_variations').select('*').order('created_at', { ascending: false }),
        supabase.from('cover_pages').select('*').eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('post_checkout_pages').select('*').order('created_at', { ascending: false })
      ]);

      if (deliveryResponse.data) {
        setDeliveryApps(deliveryResponse.data.map(app => ({
          id: app.id,
          name: app.app_name,
          slug: app.app_slug,
          theme: (app.theme || 'gold') as 'original' | 'gold' | 'platinum',
          is_active: app.is_active,
          is_homepage: app.is_homepage,
          created_at: app.created_at
        })));
      }

      if (coverResponse.data) {
        setCoverPages(coverResponse.data.map(page => ({
          id: page.id,
          name: page.title,
          slug: page.slug,
          theme: (page.unified_theme || 'gold') as 'original' | 'gold' | 'platinum',
          is_active: page.is_active,
          is_homepage: page.is_default_homepage,
          created_at: page.created_at
        })));
      }

      if (postCheckoutResponse.data) {
        setPostCheckoutPages(postCheckoutResponse.data.map(page => ({
          id: page.id,
          name: page.name,
          slug: page.slug,
          theme: (page.theme || 'gold') as 'original' | 'gold' | 'platinum',
          is_default: page.is_default,
          created_at: page.created_at
        })));
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error loading data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Create/Edit handlers
  const handleCreateDeliveryApp = () => {
    setEditingItem(null);
    setShowDeliveryCreator(true);
  };

  const handleEditDeliveryApp = async (item: FlowItem) => {
    try {
      const { data } = await supabase
        .from('delivery_app_variations')
        .select('*')
        .eq('id', item.id)
        .single();
      setEditingItem(data);
      setShowDeliveryCreator(true);
    } catch (error) {
      toast({ title: 'Error loading app details', variant: 'destructive' });
    }
  };

  const handleCreateCoverPage = () => {
    setEditingItem(null);
    setShowCoverCreator(true);
  };

  const handleEditCoverPage = async (item: FlowItem) => {
    try {
      const { data } = await supabase
        .from('cover_pages')
        .select('*')
        .eq('id', item.id)
        .single();
      setEditingItem(data);
      setShowCoverCreator(true);
    } catch (error) {
      toast({ title: 'Error loading cover page details', variant: 'destructive' });
    }
  };

  const handleCreatePostCheckout = () => {
    setEditingItem(null);
    setShowPostCheckoutCreator(true);
  };

  const handleEditPostCheckout = async (item: FlowItem) => {
    try {
      const { data } = await supabase
        .from('post_checkout_pages')
        .select('*')
        .eq('id', item.id)
        .single();
      setEditingItem(data);
      setShowPostCheckoutCreator(true);
    } catch (error) {
      toast({ title: 'Error loading post-checkout page details', variant: 'destructive' });
    }
  };

  // Delete handlers
  const handleDelete = async (type: 'delivery' | 'cover' | 'post-checkout', item: FlowItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      let query;
      
      if (type === 'delivery') {
        query = supabase.from('delivery_app_variations').delete().eq('id', item.id);
      } else if (type === 'cover') {
        query = supabase.from('cover_pages').delete().eq('id', item.id);
      } else if (type === 'post-checkout') {
        query = supabase.from('post_checkout_pages').delete().eq('id', item.id);
      } else {
        throw new Error('Invalid type');
      }

      const { error } = await query;

      if (error) throw error;
      
      toast({ title: `${item.name} deleted successfully` });
      loadData();
    } catch (error) {
      toast({ title: 'Error deleting item', variant: 'destructive' });
    }
  };

  // URL helpers
  const getItemUrl = (type: 'delivery' | 'cover' | 'post-checkout', item: FlowItem) => {
    const urlMap = {
      'delivery': `/app/${item.slug}`,
      'cover': `/cover/${item.slug}`,
      'post-checkout': `/post-checkout/${item.slug}`
    };
    return `${window.location.origin}${urlMap[type]}`;
  };

  const copyUrl = async (type: 'delivery' | 'cover' | 'post-checkout', item: FlowItem) => {
    const url = getItemUrl(type, item);
    await navigator.clipboard.writeText(url);
    toast({ title: `URL copied for ${item.name}` });
  };

  const openUrl = (type: 'delivery' | 'cover' | 'post-checkout', item: FlowItem) => {
    const url = getItemUrl(type, item);
    window.open(url, '_blank');
  };

  // Theme badge component
  const ThemeBadge = ({ theme }: { theme: 'original' | 'gold' | 'platinum' }) => {
    const themeConfig = UNIFIED_THEMES[theme];
    return (
      <Badge 
        variant="outline" 
        className="gap-1"
        style={{ 
          borderColor: themeConfig.colors.primary,
          color: themeConfig.colors.primary
        }}
      >
        <Palette className="w-3 h-3" />
        {themeConfig.name}
      </Badge>
    );
  };

  // Item card component
  const ItemCard = ({ 
    item, 
    type, 
    onEdit, 
    onDelete 
  }: { 
    item: FlowItem; 
    type: 'delivery' | 'cover' | 'post-checkout'; 
    onEdit: () => void; 
    onDelete: () => void; 
  }) => (
    <Card className={`${(item.is_homepage || item.is_default) ? 'ring-2 ring-primary/50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold">{item.name}</h4>
              {item.is_homepage && (
                <Badge variant="default" className="gap-1">
                  <Home className="w-3 h-3" />
                  Homepage
                </Badge>
              )}
              {item.is_default && (
                <Badge variant="default" className="gap-1">
                  <Star className="w-3 h-3" />
                  Default
                </Badge>
              )}
              {item.is_active !== false && (
                <Badge variant="outline">Active</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <ThemeBadge theme={item.theme} />
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              {getItemUrl(type, item).replace(window.location.origin, '')}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Edit className="w-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => copyUrl(type, item)}>
            <Copy className="w-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => openUrl(type, item)}>
            <ExternalLink className="w-3 w-3" />
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>
            <Trash2 className="w-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Unified Flow Creator</h1>
        <p className="text-muted-foreground">
          Create cohesive customer experiences with unified theming across delivery apps, cover pages, and post-checkout flows
        </p>
      </div>

      {/* Theme Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Available Themes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.values(UNIFIED_THEMES).map((theme) => (
              <div key={theme.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{theme.name}</h3>
                  <div className="flex gap-1">
                    {Object.entries(theme.colors).slice(0, 4).map(([name, color]) => (
                      <div
                        key={name}
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: color }}
                        title={name}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{theme.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="delivery-apps" className="flex items-center gap-2">
            <Package2 className="w-4 h-4" />
            Delivery Apps ({deliveryApps.length})
          </TabsTrigger>
          <TabsTrigger value="cover-pages" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Cover Pages ({coverPages.length})
          </TabsTrigger>
          <TabsTrigger value="post-checkout" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Post-Checkout ({postCheckoutPages.length})
          </TabsTrigger>
          <TabsTrigger value="embed-codes" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            Embed Codes
          </TabsTrigger>
        </TabsList>

        {/* Delivery Apps Tab */}
        <TabsContent value="delivery-apps" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Delivery Applications</h2>
            <Button onClick={handleCreateDeliveryApp}>
              <Plus className="w-4 h-4 mr-2" />
              Create Delivery App
            </Button>
          </div>
          
          <div className="grid gap-4">
            {deliveryApps.map((app) => (
              <ItemCard
                key={app.id}
                item={app}
                type="delivery"
                onEdit={() => handleEditDeliveryApp(app)}
                onDelete={() => handleDelete('delivery', app)}
              />
            ))}
          </div>
        </TabsContent>

        {/* Cover Pages Tab */}
        <TabsContent value="cover-pages" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Cover Pages</h2>
            <Button onClick={handleCreateCoverPage}>
              <Plus className="w-4 h-4 mr-2" />
              Create Cover Page
            </Button>
          </div>
          
          <div className="grid gap-4">
            {coverPages.map((page) => (
              <ItemCard
                key={page.id}
                item={page}
                type="cover"
                onEdit={() => handleEditCoverPage(page)}
                onDelete={() => handleDelete('cover', page)}
              />
            ))}
          </div>
        </TabsContent>

        {/* Post-Checkout Tab */}
        <TabsContent value="post-checkout" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Post-Checkout Pages</h2>
            <Button onClick={handleCreatePostCheckout}>
              <Plus className="w-4 h-4 mr-2" />
              Create Post-Checkout Page
            </Button>
          </div>
          
          <div className="grid gap-4">
            {postCheckoutPages.map((page) => (
              <ItemCard
                key={page.id}
                item={page}
                type="post-checkout"
                onEdit={() => handleEditPostCheckout(page)}
                onDelete={() => handleDelete('post-checkout', page)}
              />
            ))}
          </div>
        </TabsContent>

        {/* Embed Codes Tab */}
        <TabsContent value="embed-codes">
          <EmbedCodeManager />
        </TabsContent>
      </Tabs>

      {/* Creators */}
      <UnifiedDeliveryAppCreator
        open={showDeliveryCreator}
        onOpenChange={setShowDeliveryCreator}
        initial={editingItem}
        onSaved={() => {
          setShowDeliveryCreator(false);
          setEditingItem(null);
          loadData();
        }}
      />

      <UnifiedCoverPageCreator
        open={showCoverCreator}
        onOpenChange={setShowCoverCreator}
        initial={editingItem}
        onSaved={() => {
          setShowCoverCreator(false);
          setEditingItem(null);
          loadData();
        }}
      />

      <UnifiedPostCheckoutCreator
        open={showPostCheckoutCreator}
        onOpenChange={setShowPostCheckoutCreator}
        initial={editingItem}
        onSaved={() => {
          setShowPostCheckoutCreator(false);
          setEditingItem(null);
          loadData();
        }}
      />
    </div>
  );
};