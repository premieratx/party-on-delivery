import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, ExternalLink, Save, Upload, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import { createPostCheckoutFromTemplate } from '../templates/PostCheckoutTemplates';

interface PostCheckoutScreen {
  id?: string;
  name: string;
  title: string;
  subtitle: string;
  slug?: string;
  content: {
    logo_url?: string;
    background_image_url?: string;
    background_video_url?: string;
    primary_button_text?: string;
    primary_button_url?: string;
    secondary_button_text?: string;
    secondary_button_url?: string;
    custom_message?: string;
    text_color?: string;
    background_color?: string;
  };
  is_active: boolean;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function EnhancedPostCheckoutCreator() {
  const { toast: shadToast } = useToast();
  const [postCheckoutScreens, setPostCheckoutScreens] = useState<PostCheckoutScreen[]>([]);
  const [selectedScreen, setSelectedScreen] = useState<PostCheckoutScreen | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state - Initialize with template
  const [formData, setFormData] = useState<PostCheckoutScreen>(() => {
    const template = createPostCheckoutFromTemplate('gold');
    return {
      name: template.name,
      title: template.title,
      subtitle: template.subtitle,
      content: {
        logo_url: template.content.logo_url,
        background_image_url: '',
        background_video_url: '',
        primary_button_text: template.content.continue_shopping_text,
        primary_button_url: template.content.continue_shopping_url,
        secondary_button_text: template.content.manage_order_text,
        secondary_button_url: template.content.manage_order_url,
        custom_message: template.content.thankYouMessage,
        text_color: template.content.primary_button_text_color,
        background_color: '#ffffff',
      },
      is_active: true
    };
  });

  // File upload states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null);

  useEffect(() => {
    loadPostCheckoutScreens();
  }, []);

  const loadPostCheckoutScreens = async () => {
    try {
      const { data, error } = await supabase
        .from('post_checkout_pages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform database data to match our interface
      const transformedData = data?.map((item: any) => ({
        id: item.id,
        name: item.name,
        title: item.title,
        subtitle: item.subtitle,
        slug: item.slug,
        content: typeof item.content === 'string' ? JSON.parse(item.content) : item.content,
        is_active: item.is_active,
        is_default: item.is_default,
        created_at: item.created_at,
        updated_at: item.updated_at
      })) || [];
      
      setPostCheckoutScreens(transformedData);
    } catch (error: any) {
      console.error('Error loading post-checkout screens:', error);
      toast.error('Failed to load post-checkout screens');
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const updateFormField = (field: keyof PostCheckoutScreen['content'], value: string) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      let logoUrl = formData.content.logo_url || '';
      let backgroundImageUrl = formData.content.background_image_url || '';

      // Upload logo if provided
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `post-checkout-logo-${Date.now()}.${fileExt}`;
        logoUrl = await uploadFile(logoFile, 'post-checkout-assets', fileName);
      }

      // Upload background image if provided
      if (backgroundImageFile) {
        const fileExt = backgroundImageFile.name.split('.').pop();
        const fileName = `post-checkout-bg-${Date.now()}.${fileExt}`;
        backgroundImageUrl = await uploadFile(backgroundImageFile, 'post-checkout-assets', fileName);
      }

      const screenData = {
        name: formData.title,
        title: formData.title,
        subtitle: formData.subtitle,
        content: {
          ...formData.content,
          logo_url: logoUrl,
          background_image_url: backgroundImageUrl,
        },
        slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        is_active: formData.is_active
      };

      let result;
      if (isEditing && selectedScreen?.id) {
        result = await supabase
          .from('post_checkout_pages')
          .update(screenData)
          .eq('id', selectedScreen.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('post_checkout_pages')
          .insert([screenData])
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast.success(isEditing ? 'Post-checkout screen updated!' : 'Post-checkout screen created!');
      
      // Reload the list to get fresh data
      await loadPostCheckoutScreens();
      handleReset();
      setIsDialogOpen(false);

    } catch (error: any) {
      console.error('Error saving post-checkout screen:', error);
      toast.error('Failed to save post-checkout screen');
    }
  };

  const handleEdit = (screen: PostCheckoutScreen) => {
    setSelectedScreen(screen);
    // Transform the screen data to match the form structure
    setFormData({
      ...screen,
      content: screen.content || {}
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post-checkout screen?')) return;

    try {
      const { error } = await supabase
        .from('post_checkout_pages')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setPostCheckoutScreens(prev => prev.filter(screen => screen.id !== id));
      toast.success('Post-checkout screen deleted');
    } catch (error: any) {
      console.error('Error deleting post-checkout screen:', error);
      toast.error('Failed to delete post-checkout screen');
    }
  };

  const handleReset = () => {
    const template = createPostCheckoutFromTemplate('gold');
    setFormData({
      name: template.name,
      title: template.title,
      subtitle: template.subtitle,
      content: {
        logo_url: template.content.logo_url,
        background_image_url: '',
        background_video_url: '',
        primary_button_text: template.content.continue_shopping_text,
        primary_button_url: template.content.continue_shopping_url,
        secondary_button_text: template.content.manage_order_text,
        secondary_button_url: template.content.manage_order_url,
        custom_message: template.content.thankYouMessage,
        text_color: template.content.primary_button_text_color,
        background_color: '#ffffff',
      },
      is_active: true
    });
    setSelectedScreen(null);
    setIsEditing(false);
    setLogoFile(null);
    setBackgroundImageFile(null);
  };

  const handlePreview = (screen: PostCheckoutScreen) => {
    // Create a preview URL based on the screen slug or ID
    const slug = screen.slug || screen.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'preview';
    window.open(`/post-checkout/${slug}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Post-Checkout Screen Creator</h2>
          <p className="text-muted-foreground">Create and manage custom post-checkout experiences</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleReset}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Screen
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Edit Post-Checkout Screen' : 'Create New Post-Checkout Screen'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Thank you for your order!"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subtitle">Subtitle</Label>
                      <Input
                        id="subtitle"
                        value={formData.subtitle}
                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                        placeholder="We'll contact you shortly to confirm delivery"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="custom_message">Custom Message</Label>
                    <Textarea
                      id="custom_message"
                      value={formData.content.custom_message || ''}
                      onChange={(e) => updateFormField('custom_message', e.target.value)}
                      placeholder="Add any additional message or instructions..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Visual Assets */}
              <Card>
                <CardHeader>
                  <CardTitle>Visual Assets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="logo-upload">Logo Upload</Label>
                      <Input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setLogoFile(file);
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG, SVG supported</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="logo_url">Or Logo URL</Label>
                      <Input
                        id="logo_url"
                        value={formData.content.logo_url || ''}
                        onChange={(e) => updateFormField('logo_url', e.target.value)}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bg-image-upload">Background Image Upload</Label>
                      <Input
                        id="bg-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setBackgroundImageFile(file);
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="background_image_url">Or Background Image URL</Label>
                      <Input
                        id="background_image_url"
                        value={formData.content.background_image_url || ''}
                        onChange={(e) => updateFormField('background_image_url', e.target.value)}
                        placeholder="https://example.com/background.jpg"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="background_video_url">Background Video URL</Label>
                    <Input
                      id="background_video_url"
                      value={formData.content.background_video_url || ''}
                      onChange={(e) => updateFormField('background_video_url', e.target.value)}
                      placeholder="https://example.com/background-video.mp4"
                    />
                    <p className="text-xs text-muted-foreground mt-1">MP4 format recommended</p>
                  </div>
                </CardContent>
              </Card>

              {/* Buttons Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Button Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="primary_button_text">Primary Button Text</Label>
                      <Input
                        id="primary_button_text"
                        value={formData.content.primary_button_text || ''}
                        onChange={(e) => updateFormField('primary_button_text', e.target.value)}
                        placeholder="Continue Shopping"
                      />
                    </div>
                    <div>
                      <Label htmlFor="primary_button_url">Primary Button URL</Label>
                      <Input
                        id="primary_button_url"
                        value={formData.content.primary_button_url || ''}
                        onChange={(e) => updateFormField('primary_button_url', e.target.value)}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="secondary_button_text">Secondary Button Text</Label>
                      <Input
                        id="secondary_button_text"
                        value={formData.content.secondary_button_text || ''}
                        onChange={(e) => updateFormField('secondary_button_text', e.target.value)}
                        placeholder="Track Order"
                      />
                    </div>
                    <div>
                      <Label htmlFor="secondary_button_url">Secondary Button URL</Label>
                      <Input
                        id="secondary_button_url"
                        value={formData.content.secondary_button_url || ''}
                        onChange={(e) => updateFormField('secondary_button_url', e.target.value)}
                        placeholder="https://tracking.example.com"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Styling */}
              <Card>
                <CardHeader>
                  <CardTitle>Styling</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="text_color">Text Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={formData.content.text_color || '#000000'}
                          onChange={(e) => updateFormField('text_color', e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={formData.content.text_color || '#000000'}
                          onChange={(e) => updateFormField('text_color', e.target.value)}
                          placeholder="#000000"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="background_color">Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={formData.content.background_color || '#ffffff'}
                          onChange={(e) => updateFormField('background_color', e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={formData.content.background_color || '#ffffff'}
                          onChange={(e) => updateFormField('background_color', e.target.value)}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="p-6 rounded-lg border min-h-[200px] flex flex-col items-center justify-center text-center space-y-4"
                    style={{ 
                      backgroundColor: formData.content.background_color || '#ffffff',
                      color: formData.content.text_color || '#000000',
                      backgroundImage: formData.content.background_image_url ? `url(${formData.content.background_image_url})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {formData.content.logo_url && (
                      <img src={formData.content.logo_url} alt="Logo" className="h-12 w-auto" />
                    )}
                    <h3 className="text-xl font-bold">{formData.title || 'Your Title Here'}</h3>
                    <p>{formData.subtitle || 'Your subtitle here'}</p>
                    {formData.content.custom_message && (
                      <p className="text-sm opacity-90">{formData.content.custom_message}</p>
                    )}
                    <div className="flex gap-3">
                      {formData.content.primary_button_text && (
                        <Button variant="default" size="sm">
                          {formData.content.primary_button_text}
                        </Button>
                      )}
                      {formData.content.secondary_button_text && (
                        <Button variant="outline" size="sm">
                          {formData.content.secondary_button_text}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update Screen' : 'Create Screen'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Screens List */}
      <div className="grid gap-4">
        {postCheckoutScreens.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No post-checkout screens created yet.</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                Create Your First Screen
              </Button>
            </CardContent>
          </Card>
        ) : (
          postCheckoutScreens.map((screen) => (
            <Card key={screen.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {screen.title}
                      {screen.slug && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`/post-checkout/${screen.slug}`, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View Live
                        </Button>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{screen.subtitle}</p>
                  </div>
                  <Badge variant={screen.is_active ? 'default' : 'secondary'}>
                    {screen.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handlePreview(screen)}>
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(screen)}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(screen.id!)}>
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}