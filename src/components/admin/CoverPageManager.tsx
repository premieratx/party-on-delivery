import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Eye, Users } from 'lucide-react';
import { toast } from 'sonner';

interface CoverPage {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  affiliate_id?: string;
  affiliate_slug?: string;
  is_active: boolean;
  is_default_homepage: boolean;
  created_at: string;
  flow_name?: string;
  buttons: any; // Json type from Supabase
}

interface Affiliate {
  id: string;
  name: string;
  company_name: string;
  affiliate_code: string;
  email: string;
}

export const CoverPageManager = () => {
  const [coverPages, setCoverPages] = useState<CoverPage[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<CoverPage | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    slug: '',
    flow_name: '',
    buttons: [{ text: 'Get Started', url: '/delivery', variant: 'default' }]
  });

  useEffect(() => {
    fetchCoverPages();
    fetchAffiliates();
  }, []);

  const fetchCoverPages = async () => {
    try {
      const { data, error } = await supabase
        .from('cover_pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Transform the data to ensure buttons is properly typed
      const transformedData = (data || []).map(page => ({
        ...page,
        buttons: Array.isArray(page.buttons) ? page.buttons : []
      }));
      setCoverPages(transformedData);
    } catch (error) {
      console.error('Error fetching cover pages:', error);
      toast.error('Failed to load cover pages');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAffiliates = async () => {
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('id, name, company_name, affiliate_code, email')
        .eq('status', 'active')
        .order('company_name');

      if (error) throw error;
      setAffiliates(data || []);
    } catch (error) {
      console.error('Error fetching affiliates:', error);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingPage(null);
    setFormData({
      title: '',
      subtitle: '',
      slug: '',
      flow_name: '',
      buttons: [{ text: 'Get Started', url: '/delivery', variant: 'default' }]
    });
  };

  const handleEdit = (page: CoverPage) => {
    setEditingPage(page);
    setIsCreating(false);
    setFormData({
      title: page.title,
      subtitle: page.subtitle || '',
      slug: page.slug,
      flow_name: page.flow_name || '',
      buttons: page.buttons.length > 0 ? page.buttons : [{ text: 'Get Started', url: '/delivery', variant: 'default' }]
    });
  };

  const handleSave = async () => {
    try {
      const pageData = {
        title: formData.title,
        subtitle: formData.subtitle || null,
        slug: formData.slug,
        flow_name: formData.flow_name || null,
        buttons: formData.buttons,
        is_active: true
      };

      if (editingPage) {
        const { error } = await supabase
          .from('cover_pages')
          .update(pageData)
          .eq('id', editingPage.id);

        if (error) throw error;
        toast.success('Cover page updated successfully');
      } else {
        const { error } = await supabase
          .from('cover_pages')
          .insert([pageData]);

        if (error) throw error;
        toast.success('Cover page created successfully');
      }

      setIsCreating(false);
      setEditingPage(null);
      fetchCoverPages();
    } catch (error) {
      console.error('Error saving cover page:', error);
      toast.error('Failed to save cover page');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cover page?')) return;

    try {
      const { error } = await supabase
        .from('cover_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Cover page deleted successfully');
      fetchCoverPages();
    } catch (error) {
      console.error('Error deleting cover page:', error);
      toast.error('Failed to delete cover page');
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('cover_pages')
        .update({ is_active: !currentActive })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Cover page ${!currentActive ? 'activated' : 'deactivated'}`);
      fetchCoverPages();
    } catch (error) {
      console.error('Error toggling active status:', error);
      toast.error('Failed to update status');
    }
  };

  const updateButton = (index: number, field: string, value: string) => {
    const newButtons = [...formData.buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    setFormData({ ...formData, buttons: newButtons });
  };

  const addButton = () => {
    setFormData({
      ...formData,
      buttons: [...formData.buttons, { text: '', url: '', variant: 'default' }]
    });
  };

  const removeButton = (index: number) => {
    if (formData.buttons.length > 1) {
      setFormData({
        ...formData,
        buttons: formData.buttons.filter((_, i) => i !== index)
      });
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading cover pages...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cover Page Manager</h1>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Cover Page
        </Button>
      </div>

      {/* Form for creating/editing */}
      {(isCreating || editingPage) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingPage ? 'Edit Cover Page' : 'Create New Cover Page'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter page title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Slug</label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  placeholder="page-slug"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Subtitle</label>
              <Input
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Optional subtitle"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Flow Name (Optional)</label>
              <Input
                value={formData.flow_name}
                onChange={(e) => setFormData({ ...formData, flow_name: e.target.value })}
                placeholder="Optional flow identifier"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This cover page can be assigned to customer flows by administrators
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Buttons</label>
              {formData.buttons.map((button, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    placeholder="Button text"
                    value={button.text}
                    onChange={(e) => updateButton(index, 'text', e.target.value)}
                  />
                  <Input
                    placeholder="Button URL"
                    value={button.url}
                    onChange={(e) => updateButton(index, 'url', e.target.value)}
                  />
                  <Select
                    value={button.variant}
                    onValueChange={(value) => updateButton(index, 'variant', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="outline">Outline</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.buttons.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeButton(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addButton}>
                <Plus className="w-4 h-4 mr-2" />
                Add Button
              </Button>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave}>
                {editingPage ? 'Update' : 'Create'} Cover Page
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreating(false);
                  setEditingPage(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cover Pages List */}
      <div className="grid gap-4">
        {coverPages.map((page) => {
          const affiliate = affiliates.find(a => a.id === page.affiliate_id);
          
          return (
            <Card key={page.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{page.title}</h3>
                      {page.is_default_homepage && (
                        <Badge variant="secondary">Default Homepage</Badge>
                      )}
                      {page.is_active ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>
                    
                    {page.subtitle && (
                      <p className="text-muted-foreground mb-2">{page.subtitle}</p>
                    )}
                    
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Slug: /{page.slug}</span>
                      {page.flow_name && (
                        <span>Flow: {page.flow_name}</span>
                      )}
                      <span className="text-primary">Available for flow assignment</span>
                    </div>
                    
                    <div className="mt-2">
                      <span className="text-sm text-muted-foreground">Buttons: </span>
                      {page.buttons.map((btn, idx) => (
                        <Badge key={idx} variant="outline" className="mr-1">
                          {btn.text}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/${page.slug}`, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(page)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={page.is_active ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleActive(page.id, page.is_active)}
                    >
                      {page.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(page.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {coverPages.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No cover pages created yet</p>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Cover Page
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};