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
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedCoverPageEditor } from './UnifiedCoverPageEditor';

interface CoverPage {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  bg_image_url?: string;
  bg_video_url?: string;
  logo_url?: string;
  logo_height?: number;
  buttons?: any;
  checklist?: any;
  is_active: boolean;
  is_default_homepage: boolean;
  created_at: string;
  updated_at: string;
  styles: any;
  affiliate_slug?: string;
  theme?: string;
  unified_theme?: string;
  free_shipping_enabled?: boolean;
  affiliate_id?: string;
  flow_name?: string;
  is_multi_flow?: boolean;
}

interface CoverPageConfig {
  id?: string;
  slug: string;
  title: string;
  subtitle?: string;
  logo_url?: string;
  logo_height?: number;
  bg_image_url?: string;
  bg_video_url?: string;
  checklist: string[];
  buttons: any[];
  is_active: boolean;
  affiliate_id?: string;
  affiliate_slug?: string;
  theme?: 'gold' | 'original' | 'platinum' | 'ocean' | 'sunset' | 'forest';
  styles?: any;
  is_default_homepage?: boolean;
  flow_name?: string;
  is_multi_flow?: boolean;
  free_shipping_enabled?: boolean;
}

export const EnhancedCoverPageManager: React.FC = () => {
  const [coverPages, setCoverPages] = useState<CoverPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPage, setEditingPage] = useState<CoverPageConfig | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const loadCoverPages = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cover_pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoverPages(data || []);
    } catch (error) {
      console.error('Error loading cover pages:', error);
      toast.error('Failed to load cover pages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoverPages();
  }, [loadCoverPages]);

  const handleCreateNew = () => {
    setEditingPage(null);
    setShowEditor(true);
  };

  const handleEdit = (page: CoverPage) => {
    // Convert CoverPage to CoverPageConfig format for the editor
    // Create proper config object for the editor
    const coverPageConfig: CoverPageConfig = {
      id: page.id,
      slug: page.slug,
      title: page.title,
      subtitle: page.subtitle || '',
      logo_url: page.logo_url || '',
      logo_height: page.logo_height || 160,
      bg_image_url: page.bg_image_url || '',
      bg_video_url: page.bg_video_url || '',
      checklist: Array.isArray(page.checklist) ? page.checklist : [],
      buttons: Array.isArray(page.buttons) ? page.buttons : [],
      is_active: page.is_active,
      theme: (page.theme || page.unified_theme || 'gold') as 'gold' | 'original' | 'platinum' | 'ocean' | 'sunset' | 'forest',
      styles: page.styles || {},
      is_default_homepage: page.is_default_homepage,
      affiliate_slug: page.affiliate_slug,
      free_shipping_enabled: page.free_shipping_enabled || false,
      affiliate_id: page.affiliate_id,
      flow_name: page.flow_name,
      is_multi_flow: page.is_multi_flow
    };
    
    setEditingPage(coverPageConfig);
    setShowEditor(true);
  };

  const handleEditorSave = () => {
    setShowEditor(false);
    setEditingPage(null);
    loadCoverPages();
  };

  const handleDelete = async (page: CoverPage) => {
    if (!confirm(`Are you sure you want to delete "${page.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('cover_pages')
        .delete()
        .eq('id', page.id);

      if (error) throw error;

      toast.success('Cover page deleted successfully');
      loadCoverPages();
    } catch (error) {
      console.error('Error deleting cover page:', error);
      toast.error('Failed to delete cover page');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (page: CoverPage) => {
    try {
      setLoading(true);
      console.log('🔧 Setting default cover page:', page.title, page.id);
      
      // First remove default from all pages
      const { error: clearError } = await supabase
        .from('cover_pages')
        .update({ is_default_homepage: false })
        .neq('id', page.id);

      if (clearError) {
        console.error('❌ Error clearing defaults:', clearError);
        throw clearError;
      }

      // Then set this page as default
      const { error } = await supabase
        .from('cover_pages')
        .update({ is_default_homepage: true, is_active: true })
        .eq('id', page.id);

      if (error) {
        console.error('❌ Error setting default:', error);
        throw error;
      }

      console.log('✅ Successfully set default cover page');
      toast.success(`"${page.title}" is now the default homepage cover page`);
      loadCoverPages();
    } catch (error) {
      console.error('Error setting default cover page:', error);
      toast.error('Failed to set default cover page');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (page: CoverPage) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('cover_pages')
        .update({ is_active: !page.is_active })
        .eq('id', page.id);

      if (error) throw error;

      toast.success(`Cover page ${!page.is_active ? 'activated' : 'deactivated'}`);
      loadCoverPages();
    } catch (error) {
      console.error('Error toggling cover page status:', error);
      toast.error('Failed to update cover page status');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (page: CoverPage) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('cover_pages')
        .insert([{
          title: `${page.title} (Copy)`,
          subtitle: page.subtitle,
          slug: `${page.slug}-copy-${Date.now()}`,
          bg_image_url: page.bg_image_url,
          bg_video_url: page.bg_video_url,
          logo_url: page.logo_url,
          logo_height: page.logo_height,
          buttons: page.buttons,
          checklist: page.checklist,
          styles: page.styles,
          is_active: false,
          is_default_homepage: false
        }]);

      if (error) throw error;

      toast.success('Cover page duplicated successfully');
      loadCoverPages();
    } catch (error) {
      console.error('Error duplicating cover page:', error);
      toast.error('Failed to duplicate cover page');
    } finally {
      setLoading(false);
    }
  };

  // startEdit and cancelEdit removed - handled by handleEdit and handleEditorSave

  const defaultPage = coverPages.find(page => page.is_default_homepage);
  const hasCoverPages = coverPages.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Cover Page Manager</h3>
          <p className="text-muted-foreground">
            Create and manage cover pages for your delivery apps
          </p>
        </div>
        {/* Enhanced Managers */}
        <div className="flex gap-2">
          <Button onClick={() => setShowEditor(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Cover Page
          </Button>
        </div>
      </div>

          {/* Status Banner */}
      {hasCoverPages ? (
        defaultPage ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800">
                  Cover page functionality is <strong>enabled</strong>. Default: "{defaultPage.title}"
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
                  No default cover page set. Homepage will show default delivery app.
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
                Cover page functionality is <strong>disabled</strong>. Create your first cover page to enable it.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cover Page Creator */}
      <UnifiedCoverPageEditor
        open={showEditor}
        onOpenChange={setShowEditor}
        initial={editingPage}
        onSaved={handleEditorSave}
      />

      {/* Cover Pages List */}
      <Card>
        <CardHeader>
          <CardTitle>Cover Pages ({coverPages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && coverPages.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading cover pages...</p>
            </div>
          ) : coverPages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No cover pages created yet</p>
              <Button onClick={handleCreateNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Cover Page
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {coverPages.map((page) => (
                  <Card key={page.id} className={`${page.is_default_homepage ? 'border-primary' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{page.title}</h4>
                            {page.is_default_homepage && (
                              <Badge variant="default" className="gap-1">
                                <Star className="h-3 w-3" />
                                Default
                              </Badge>
                            )}
                            <Badge variant={page.is_active ? 'default' : 'secondary'}>
                              {page.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          {page.subtitle && (
                            <p className="text-sm text-muted-foreground mb-2">{page.subtitle}</p>
                          )}
                           <p className="text-xs text-muted-foreground mb-2">
                            Slug: /{page.slug} • Created: {new Date(page.created_at).toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const url = `${window.location.origin}/${page.slug}`;
                                navigator.clipboard.writeText(url);
                                toast.success('URL copied to clipboard!');
                              }}
                              className="text-xs h-7 px-2"
                            >
                              Copy URL
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(`/${page.slug}`, '_blank')}
                              className="text-xs h-7 px-2"
                            >
                              Preview
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              {window.location.origin}/{page.slug}
                            </span>
                          </div>
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
                          {!page.is_default_homepage && (
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