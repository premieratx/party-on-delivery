import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Eye, 
  Trash2, 
  ArrowLeft,
  Settings,
  Save,
  X,
  Layout
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CoverPage {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  affiliate_slug?: string;
  is_active: boolean;
  is_default_homepage?: boolean;
  buttons: any;
  styles: any;
  created_at: string;
  updated_at: string;
}

interface EditableCoverPageManagerProps {
  onBack: () => void;
}

export const EditableCoverPageManager: React.FC<EditableCoverPageManagerProps> = ({ onBack }) => {
  const [coverPages, setCoverPages] = useState<CoverPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<CoverPage | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    slug: '',
    affiliate_slug: '',
    is_active: true,
    is_default_homepage: false,
    buttons: '[]',
    styles: '{}'
  });

  useEffect(() => {
    loadCoverPages();
  }, []);

  const loadCoverPages = async () => {
    try {
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
  };

  const handleEdit = (page: CoverPage) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      subtitle: page.subtitle || '',
      slug: page.slug,
      affiliate_slug: page.affiliate_slug || '',
      is_active: page.is_active,
      is_default_homepage: page.is_default_homepage || false,
      buttons: JSON.stringify(page.buttons || []),
      styles: JSON.stringify(page.styles || {})
    });
  };

  const handleSave = async () => {
    if (!editingPage) return;

    try {
      const { error } = await supabase
        .from('cover_pages')
        .update({
          title: formData.title,
          subtitle: formData.subtitle,
          slug: formData.slug,
          affiliate_slug: formData.affiliate_slug,
          is_active: formData.is_active,
          is_default_homepage: formData.is_default_homepage,
          buttons: JSON.parse(formData.buttons || '[]'),
          styles: JSON.parse(formData.styles || '{}'),
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
    }
  };

  const handleDelete = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this cover page?')) return;

    try {
      const { error } = await supabase
        .from('cover_pages')
        .delete()
        .eq('id', pageId);

      if (error) throw error;

      toast.success('Cover page deleted successfully');
      loadCoverPages();
    } catch (error) {
      console.error('Error deleting cover page:', error);
      toast.error('Failed to delete cover page');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Layout className="w-8 h-8" />
              Cover Page Manager
            </h1>
          </div>
        </div>

        {/* Cover Pages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coverPages.map((page) => (
            <Card key={page.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{page.title}</CardTitle>
                  <div className="flex gap-1">
                    <Badge variant={page.is_active ? 'default' : 'secondary'}>
                      {page.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {page.is_default_homepage && (
                      <Badge variant="outline">Default</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Subtitle</p>
                  <p className="text-sm">{page.subtitle || 'No subtitle'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Slug</p>
                  <p className="font-mono text-sm">{page.slug}</p>
                </div>
                {page.affiliate_slug && (
                  <div>
                    <p className="text-sm text-muted-foreground">Affiliate</p>
                    <p className="font-mono text-sm">{page.affiliate_slug}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(page)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/cover/${page.slug}`, '_blank')}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(page.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Modal */}
        {editingPage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Edit Cover Page</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingPage(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="affiliate_slug">Affiliate Slug</Label>
                  <Input
                    id="affiliate_slug"
                    value={formData.affiliate_slug}
                    onChange={(e) => setFormData({ ...formData, affiliate_slug: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="buttons">Buttons (JSON)</Label>
                  <Textarea
                    id="buttons"
                    value={formData.buttons}
                    onChange={(e) => setFormData({ ...formData, buttons: e.target.value })}
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="styles">Styles (JSON)</Label>
                  <Textarea
                    id="styles"
                    value={formData.styles}
                    onChange={(e) => setFormData({ ...formData, styles: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_default_homepage"
                      checked={formData.is_default_homepage}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_default_homepage: checked })}
                    />
                    <Label htmlFor="is_default_homepage">Default Homepage</Label>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSave} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditingPage(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};