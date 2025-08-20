import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Star, 
  Copy, 
  Save,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
}

interface CoverPageFormData {
  title: string;
  subtitle: string;
  slug: string;
  bg_image_url: string;
  bg_video_url: string;
  logo_url: string;
  logo_height: number;
  is_active: boolean;
  is_default_homepage: boolean;
}

export const EnhancedCoverPageManager: React.FC = () => {
  const [coverPages, setCoverPages] = useState<CoverPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPage, setEditingPage] = useState<CoverPage | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CoverPageFormData>({
    title: '',
    subtitle: '',
    slug: '',
    bg_image_url: '',
    bg_video_url: '',
    logo_url: '',
    logo_height: 60,
    is_active: true,
    is_default_homepage: false
  });

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

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!formData.slug.trim()) {
      setFormData(prev => ({ ...prev, slug: formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }));
    }

    try {
      setLoading(true);
      
      // If this is the first cover page, make it default
      const isFirstPage = coverPages.length === 0;
      const pageData = {
        ...formData,
        is_default_homepage: isFirstPage || formData.is_default_homepage,
        buttons: [],
        checklist: [],
        styles: {}
      };

      const { data, error } = await supabase
        .from('cover_pages')
        .insert([pageData])
        .select()
        .single();

      if (error) throw error;

      toast.success(`Cover page created successfully${isFirstPage ? ' and set as default homepage' : ''}`);
      setShowCreateForm(false);
      setFormData({
        title: '',
        subtitle: '',
        slug: '',
        bg_image_url: '',
        bg_video_url: '',
        logo_url: '',
        logo_height: 60,
        is_active: true,
        is_default_homepage: false
      });
      loadCoverPages();
    } catch (error) {
      console.error('Error creating cover page:', error);
      toast.error('Failed to create cover page');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingPage) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('cover_pages')
        .update({
          title: formData.title,
          subtitle: formData.subtitle,
          slug: formData.slug,
          bg_image_url: formData.bg_image_url,
          bg_video_url: formData.bg_video_url,
          logo_url: formData.logo_url,
          logo_height: formData.logo_height,
          is_active: formData.is_active,
          is_default_homepage: formData.is_default_homepage,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPage.id);

      if (error) throw error;

      toast.success('Cover page updated successfully');
      setEditingPage(null);
      loadCoverPages();
    } catch (error) {
      console.error('Error updating cover page:', error);
      toast.error('Failed to update cover page');
    } finally {
      setLoading(false);
    }
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
      
      // First remove default from all pages
      await supabase
        .from('cover_pages')
        .update({ is_default_homepage: false })
        .neq('id', page.id);

      // Then set this page as default
      const { error } = await supabase
        .from('cover_pages')
        .update({ is_default_homepage: true, is_active: true })
        .eq('id', page.id);

      if (error) throw error;

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

  const startEdit = (page: CoverPage) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      subtitle: page.subtitle || '',
      slug: page.slug,
      bg_image_url: page.bg_image_url || '',
      bg_video_url: page.bg_video_url || '',
      logo_url: page.logo_url || '',
      logo_height: page.logo_height || 60,
      is_active: page.is_active,
      is_default_homepage: page.is_default_homepage
    });
  };

  const cancelEdit = () => {
    setEditingPage(null);
    setShowCreateForm(false);
    setFormData({
      title: '',
      subtitle: '',
      slug: '',
      bg_image_url: '',
      bg_video_url: '',
      logo_url: '',
      logo_height: 60,
      is_active: true,
      is_default_homepage: false
    });
  };

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
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="gap-2"
          disabled={showCreateForm || editingPage !== null}
        >
          <Plus className="h-4 w-4" />
          Create Cover Page
        </Button>
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

      {/* Create/Edit Form */}
      {(showCreateForm || editingPage) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingPage ? `Edit Cover Page: ${editingPage.title}` : 'Create New Cover Page'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter cover page title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="auto-generated"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Textarea
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Enter subtitle (optional)"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bg_image">Background Image URL</Label>
                <Input
                  id="bg_image"
                  value={formData.bg_image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, bg_image_url: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_default"
                  checked={formData.is_default_homepage}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default_homepage: checked }))}
                />
                <Label htmlFor="is_default">Set as Default Homepage</Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={editingPage ? handleUpdate : handleCreate}
                disabled={loading}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {editingPage ? 'Update' : 'Create'}
              </Button>
              <Button 
                variant="outline" 
                onClick={cancelEdit}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
              <Button onClick={() => setShowCreateForm(true)} className="gap-2">
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
                          <p className="text-xs text-muted-foreground">
                            Slug: /{page.slug} • Created: {new Date(page.created_at).toLocaleDateString()}
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
                            onClick={() => startEdit(page)}
                            disabled={loading || editingPage !== null || showCreateForm}
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