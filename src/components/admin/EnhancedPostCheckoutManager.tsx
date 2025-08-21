import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Star, 
  Copy,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Link2
} from 'lucide-react';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PostCheckoutCreator } from './PostCheckoutCreator';
import { UnifiedPostCheckoutVisualEditor } from './UnifiedPostCheckoutVisualEditor';

interface PostCheckoutPage {
  id: string;
  name: string;
  slug: string;
  content: any;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface PostCheckoutButton {
  text: string;
  url: string;
  style: 'primary' | 'secondary';
}

interface PostCheckoutConfig {
  id?: string;
  title: string;
  subtitle?: string;
  logo_url?: string;
  buttons: PostCheckoutButton[];
  background_color?: string;
  text_color?: string;
  cover_page_id?: string;
  affiliate_id?: string;
  is_template?: boolean;
  theme?: string;
}

export const EnhancedPostCheckoutManager: React.FC = () => {
  const [pages, setPages] = useState<PostCheckoutPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPage, setEditingPage] = useState<PostCheckoutConfig | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const loadPages = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('post_checkout_pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error loading post-checkout pages:', error);
      toast.error('Failed to load post-checkout pages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const handleCreateNew = () => {
    setEditingPage(null);
    setShowEditor(true);
  };

  const handleEdit = (page: PostCheckoutPage) => {
    // Convert PostCheckoutPage to PostCheckoutConfig format for the editor
    const postCheckoutConfig: PostCheckoutConfig = {
      id: page.id,
      title: page.content?.title || page.name || 'Order Complete!',
      subtitle: page.content?.subtitle || 'Thank you for your order.',
      logo_url: page.content?.logo_url || '',
      buttons: page.content?.buttons || [
        { text: 'Continue Shopping', url: '/', style: 'primary' },
        { text: 'Track Order', url: '/orders', style: 'secondary' }
      ],
      background_color: page.content?.background_color || '#ffffff',
      text_color: page.content?.text_color || '#000000',
      theme: page.content?.theme || 'default'
    };
    
    setEditingPage(postCheckoutConfig);
    setShowEditor(true);
  };

  const handleDelete = async (page: PostCheckoutPage) => {
    if (!confirm(`Are you sure you want to delete "${page.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('post_checkout_pages')
        .delete()
        .eq('id', page.id);

      if (error) throw error;

      toast.success('Post-checkout page deleted successfully');
      loadPages();
    } catch (error) {
      console.error('Error deleting post-checkout page:', error);
      toast.error('Failed to delete post-checkout page');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (page: PostCheckoutPage) => {
    try {
      setLoading(true);
      
      // First remove default from all pages
      await supabase
        .from('post_checkout_pages')
        .update({ is_default: false })
        .neq('id', page.id);

      // Then set this page as default
      const { error } = await supabase
        .from('post_checkout_pages')
        .update({ is_default: true, is_active: true })
        .eq('id', page.id);

      if (error) throw error;

      toast.success(`"${page.name}" is now the default post-checkout page`);
      loadPages();
    } catch (error) {
      console.error('Error setting default post-checkout page:', error);
      toast.error('Failed to set default post-checkout page');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (page: PostCheckoutPage) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('post_checkout_pages')
        .update({ is_active: !page.is_active })
        .eq('id', page.id);

      if (error) throw error;

      toast.success(`Post-checkout page ${!page.is_active ? 'activated' : 'deactivated'}`);
      loadPages();
    } catch (error) {
      console.error('Error toggling post-checkout page status:', error);
      toast.error('Failed to update post-checkout page status');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (page: PostCheckoutPage) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('post_checkout_pages')
        .insert([{
          name: `${page.name} (Copy)`,
          slug: `${page.slug}-copy-${Date.now()}`,
          content: page.content,
          is_active: false,
          is_default: false
        }]);

      if (error) throw error;

      toast.success('Post-checkout page duplicated successfully');
      loadPages();
    } catch (error) {
      console.error('Error duplicating post-checkout page:', error);
      toast.error('Failed to duplicate post-checkout page');
    } finally {
      setLoading(false);
    }
  };

  const copyPageUrl = async (page: PostCheckoutPage) => {
    const url = `https://order.partyondelivery.com/post-checkout/${page.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(`Copied URL for ${page.name}`);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success(`Copied URL for ${page.name}`);
    }
  };

  const openPageUrl = (page: PostCheckoutPage) => {
    window.open(`/post-checkout/${page.slug}`, '_blank');
  };

  const defaultPage = pages.find(page => page.is_default);
  const hasPages = pages.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Post-Checkout Manager</h3>
          <p className="text-muted-foreground">
            Create and manage custom post-purchase experiences
          </p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Post-Checkout Page
        </Button>
      </div>

      {/* Status Banner */}
      {hasPages ? (
        defaultPage ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800">
                  Post-checkout functionality is <strong>enabled</strong>. Default: "{defaultPage.name}"
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="text-orange-800">
                  No default post-checkout page set. Please designate one as default.
                </span>
              </div>
            </CardContent>
          </Card>
        )
      ) : (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              <span className="text-blue-800">
                No post-checkout pages created yet. Create your first page to get started.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post-Checkout Visual Creator */}
      <UnifiedPostCheckoutVisualEditor
        open={showEditor}
        onOpenChange={setShowEditor}
        initial={editingPage}
        onSaved={() => {
          setEditingPage(null);
          loadPages();
        }}
      />

      {/* Post-Checkout Pages List */}
      <Card>
        <CardHeader>
          <CardTitle>Post-Checkout Pages ({pages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && pages.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading post-checkout pages...</p>
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No post-checkout pages created yet</p>
              <Button onClick={handleCreateNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Post-Checkout Page
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {pages.map((page) => (
                  <Card key={page.id} className={`${page.is_default ? 'border-primary' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{page.name}</h4>
                            {page.is_default && (
                              <Badge variant="default" className="gap-1">
                                <Star className="h-3 w-3" />
                                Default
                              </Badge>
                            )}
                            <Badge variant={page.is_active ? 'default' : 'secondary'}>
                              {page.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {page.content?.title || 'No title set'}
                          </p>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs font-mono bg-muted px-2 py-1 rounded text-primary">
                              https://order.partyondelivery.com/post-checkout/{page.slug}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyPageUrl(page)}
                              className="h-5 w-5 p-0"
                              title="Copy URL"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openPageUrl(page)}
                              className="h-5 w-5 p-0"
                              title="Open in new tab"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(page.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleActive(page)}
                            disabled={loading}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(page)}
                            disabled={loading || showEditor}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDuplicate(page)}
                            disabled={loading}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          {!page.is_default && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetDefault(page)}
                              disabled={loading}
                            >
                              <Star className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(page)}
                            disabled={loading}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};