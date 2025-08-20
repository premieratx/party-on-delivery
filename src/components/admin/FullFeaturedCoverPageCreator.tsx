import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FontSelector } from '@/components/ui/font-selector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Trash2, Eye, Star, Upload, Plus, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';

interface FontStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  color: string;
}

interface CoverPage {
  id?: string;
  title: string;
  subtitle: string;
  slug: string;
  bg_image_url: string;
  bg_video_url: string;
  logo_url: string;
  logo_height: number;
  buttons: any;
  checklist: any;
  styles: any;
  is_active: boolean;
  is_default_homepage: boolean;
}

const defaultFontStyle: FontStyle = {
  fontFamily: 'Inter',
  fontSize: 16,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  color: '#000000'
};

export const FullFeaturedCoverPageCreator: React.FC = () => {
  const [coverPages, setCoverPages] = useState<CoverPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<CoverPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<CoverPage>({
    title: '',
    subtitle: '',
    slug: '',
    bg_image_url: '',
    bg_video_url: '',
    logo_url: '',
    logo_height: 60,
    buttons: [],
    checklist: [],
    styles: {
      title: { ...defaultFontStyle, fontSize: 36, fontWeight: 'bold' },
      subtitle: { ...defaultFontStyle, fontSize: 18 },
      background: '#ffffff'
    },
    is_active: true,
    is_default_homepage: false
  });

  useEffect(() => {
    loadCoverPages();
  }, []);

  const loadCoverPages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cover_pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const processedData = (data || []).map(page => ({
        ...page,
        buttons: typeof page.buttons === 'string' ? JSON.parse(page.buttons) : page.buttons || [],
        checklist: typeof page.checklist === 'string' ? JSON.parse(page.checklist) : page.checklist || [],
        styles: typeof page.styles === 'string' ? JSON.parse(page.styles) : page.styles || {
          title: { ...defaultFontStyle, fontSize: 36, fontWeight: 'bold' },
          subtitle: { ...defaultFontStyle, fontSize: 18 },
          background: '#ffffff'
        }
      }));
      setCoverPages(processedData);
    } catch (error) {
      console.error('Error loading cover pages:', error);
      toast.error('Failed to load cover pages');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.slug) {
      toast.error('Title and slug are required');
      return;
    }

    try {
      setSaving(true);
      
      if (selectedPage?.id) {
        // Update existing
        const { error } = await supabase
          .from('cover_pages')
          .update({
            title: formData.title,
            subtitle: formData.subtitle,
            bg_image_url: formData.bg_image_url,
            bg_video_url: formData.bg_video_url,
            logo_url: formData.logo_url,
            logo_height: formData.logo_height,
            buttons: JSON.stringify(formData.buttons),
            checklist: JSON.stringify(formData.checklist),
            styles: JSON.stringify(formData.styles),
            is_active: formData.is_active,
            is_default_homepage: formData.is_default_homepage
          })
          .eq('id', selectedPage.id);

        if (error) throw error;
        toast.success('Cover page updated successfully');
      } else {
        // Create new
        const { error } = await supabase
          .from('cover_pages')
          .insert({
            title: formData.title,
            subtitle: formData.subtitle,
            slug: formData.slug,
            bg_image_url: formData.bg_image_url,
            bg_video_url: formData.bg_video_url,
            logo_url: formData.logo_url,
            logo_height: formData.logo_height,
            buttons: JSON.stringify(formData.buttons),
            checklist: JSON.stringify(formData.checklist),
            styles: JSON.stringify(formData.styles),
            is_active: formData.is_active,
            is_default_homepage: formData.is_default_homepage
          });

        if (error) throw error;
        toast.success('Cover page created successfully');
      }

      loadCoverPages();
      resetForm();
    } catch (error) {
      console.error('Error saving cover page:', error);
      toast.error('Failed to save cover page');
    } finally {
      setSaving(false);
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
      loadCoverPages();
      
      if (selectedPage?.id === id) {
        resetForm();
      }
    } catch (error) {
      console.error('Error deleting cover page:', error);
      toast.error('Failed to delete cover page');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cover_pages')
        .update({ is_default_homepage: true })
        .eq('id', id);

      if (error) throw error;
      toast.success('Set as default homepage');
      loadCoverPages();
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Failed to set as default');
    }
  };

  const selectPage = (page: CoverPage) => {
    setSelectedPage(page);
    setFormData({
      ...page,
      buttons: Array.isArray(page.buttons) ? page.buttons : [],
      checklist: Array.isArray(page.checklist) ? page.checklist : [],
      styles: typeof page.styles === 'object' ? page.styles : {
        title: { ...defaultFontStyle, fontSize: 36, fontWeight: 'bold' },
        subtitle: { ...defaultFontStyle, fontSize: 18 },
        background: '#ffffff'
      }
    });
  };

  const resetForm = () => {
    setSelectedPage(null);
    setFormData({
      title: '',
      subtitle: '',
      slug: '',
      bg_image_url: '',
      bg_video_url: '',
      logo_url: '',
      logo_height: 60,
      buttons: [],
      checklist: [],
      styles: {
        title: { ...defaultFontStyle, fontSize: 36, fontWeight: 'bold' },
        subtitle: { ...defaultFontStyle, fontSize: 18 },
        background: '#ffffff'
      },
      is_active: true,
      is_default_homepage: false
    });
  };

  const addButton = () => {
    setFormData({
      ...formData,
      buttons: [...formData.buttons, { 
        text: 'New Button', 
        url: '#', 
        style: { ...defaultFontStyle }
      }]
    });
  };

  const updateButton = (index: number, updates: Partial<typeof formData.buttons[0]>) => {
    const newButtons = [...formData.buttons];
    newButtons[index] = { ...newButtons[index], ...updates };
    setFormData({ ...formData, buttons: newButtons });
  };

  const removeButton = (index: number) => {
    setFormData({
      ...formData,
      buttons: formData.buttons.filter((_, i) => i !== index)
    });
  };

  const addChecklistItem = () => {
    setFormData({
      ...formData,
      checklist: [...formData.checklist, { 
        text: 'New Item', 
        style: { ...defaultFontStyle }
      }]
    });
  };

  const updateChecklistItem = (index: number, updates: Partial<typeof formData.checklist[0]>) => {
    const newChecklist = [...formData.checklist];
    newChecklist[index] = { ...newChecklist[index], ...updates };
    setFormData({ ...formData, checklist: newChecklist });
  };

  const removeChecklistItem = (index: number) => {
    setFormData({
      ...formData,
      checklist: formData.checklist.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="container mx-auto p-6 max-h-screen overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Cover Pages List */}
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center justify-between">
              Cover Pages
              <Button onClick={resetForm} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : (
                <div className="space-y-2">
                  {coverPages.map((page) => (
                    <div
                      key={page.id}
                      className={`p-3 border rounded cursor-pointer hover:bg-accent ${
                        selectedPage?.id === page.id ? 'border-primary bg-accent' : ''
                      }`}
                      onClick={() => selectPage(page)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{page.title}</h4>
                          <p className="text-sm text-muted-foreground">{page.slug}</p>
                          {page.is_default_homepage && (
                            <span className="inline-flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2 py-1 rounded mt-1">
                              <Star className="h-3 w-3" />
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetDefault(page.id!);
                            }}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(page.id!);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Editor */}
        <Card className="lg:col-span-2 h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center justify-between">
              {selectedPage ? 'Edit Cover Page' : 'Create Cover Page'}
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Title</label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Page title"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Slug</label>
                      <Input
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="page-slug"
                        disabled={!!selectedPage}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Subtitle</label>
                    <Textarea
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      placeholder="Page subtitle"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <label className="text-sm font-medium">Active</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.is_default_homepage}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_default_homepage: checked })}
                    />
                    <label className="text-sm font-medium">Set as Default Homepage</label>
                  </div>
                </div>

                {/* Styling */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Text Styling</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium w-20">Title:</label>
                      <FontSelector
                        value={formData.styles.title}
                        onChange={(style) => setFormData({
                          ...formData,
                          styles: { ...formData.styles, title: style }
                        })}
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium w-20">Subtitle:</label>
                      <FontSelector
                        value={formData.styles.subtitle}
                        onChange={(style) => setFormData({
                          ...formData,
                          styles: { ...formData.styles, subtitle: style }
                        })}
                      />
                    </div>
                  </div>
                </div>

                {/* Media */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Media</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Background Image URL</label>
                      <Input
                        value={formData.bg_image_url}
                        onChange={(e) => setFormData({ ...formData, bg_image_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Background Video URL</label>
                      <Input
                        value={formData.bg_video_url}
                        onChange={(e) => setFormData({ ...formData, bg_video_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Logo URL</label>
                      <Input
                        value={formData.logo_url}
                        onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Logo Height (px)</label>
                      <Input
                        type="number"
                        value={formData.logo_height}
                        onChange={(e) => setFormData({ ...formData, logo_height: parseInt(e.target.value) || 60 })}
                        min="20"
                        max="200"
                      />
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Buttons</h3>
                    <Button onClick={addButton} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Button
                    </Button>
                  </div>
                  {formData.buttons.map((button, index) => (
                    <div key={index} className="border rounded p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Button {index + 1}</h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeButton(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          value={button.text}
                          onChange={(e) => updateButton(index, { text: e.target.value })}
                          placeholder="Button text"
                        />
                        <Input
                          value={button.url}
                          onChange={(e) => updateButton(index, { url: e.target.value })}
                          placeholder="Button URL"
                        />
                      </div>
                      <FontSelector
                        value={button.style}
                        onChange={(style) => updateButton(index, { style })}
                      />
                    </div>
                  ))}
                </div>

                {/* Checklist */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Checklist Items</h3>
                    <Button onClick={addChecklistItem} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                  {formData.checklist.map((item, index) => (
                    <div key={index} className="border rounded p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Item {index + 1}</h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeChecklistItem(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        value={item.text}
                        onChange={(e) => updateChecklistItem(index, { text: e.target.value })}
                        placeholder="Checklist item text"
                      />
                      <FontSelector
                        value={item.style}
                        onChange={(style) => updateChecklistItem(index, { style })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};