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

interface PostCheckoutScreen {
  id?: string;
  title: string;
  subtitle: string;
  logo_url: string;
  background_image_url: string;
  background_video_url: string;
  primary_button_text: string;
  primary_button_url: string;
  secondary_button_text: string;
  secondary_button_url: string;
  custom_message: string;
  text_color: string;
  background_color: string;
  is_active: boolean;
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

  // Form state
  const [formData, setFormData] = useState<PostCheckoutScreen>({
    title: '',
    subtitle: '',
    logo_url: '',
    background_image_url: '',
    background_video_url: '',
    primary_button_text: '',
    primary_button_url: '',
    secondary_button_text: '',
    secondary_button_url: '',
    custom_message: '',
    text_color: '#000000',
    background_color: '#ffffff',
    is_active: true
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
        .from('post_checkout_screens')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPostCheckoutScreens(data || []);
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

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      let logoUrl = formData.logo_url;
      let backgroundImageUrl = formData.background_image_url;

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
        ...formData,
        logo_url: logoUrl,
        background_image_url: backgroundImageUrl,
      };

      let result;
      if (isEditing && selectedScreen?.id) {
        const { data, error } = await supabase
          .from('post_checkout_screens')
          .update(screenData)
          .eq('id', selectedScreen.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('post_checkout_screens')
          .insert([screenData])
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      toast.success(isEditing ? 'Post-checkout screen updated!' : 'Post-checkout screen created!');
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
    setFormData(screen);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post-checkout screen?')) return;

    try {
      const { error } = await supabase
        .from('post_checkout_screens')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Post-checkout screen deleted');
      await loadPostCheckoutScreens();
    } catch (error: any) {
      console.error('Error deleting post-checkout screen:', error);
      toast.error('Failed to delete post-checkout screen');
    }
  };

  const handleReset = () => {
    setFormData({
      title: '',
      subtitle: '',
      logo_url: '',
      background_image_url: '',
      background_video_url: '',
      primary_button_text: '',
      primary_button_url: '',
      secondary_button_text: '',
      secondary_button_url: '',
      custom_message: '',
      text_color: '#000000',
      background_color: '#ffffff',
      is_active: true
    });
    setSelectedScreen(null);
    setIsEditing(false);
    setLogoFile(null);
    setBackgroundImageFile(null);
  };

  const handlePreview = (screen: PostCheckoutScreen) => {
    // Create a preview URL or open in new tab
    const previewData = encodeURIComponent(JSON.stringify(screen));
    window.open(`/post-checkout-preview?data=${previewData}`, '_blank');
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
                      value={formData.custom_message}
                      onChange={(e) => setFormData({ ...formData, custom_message: e.target.value })}
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
                        value={formData.logo_url}
                        onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
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
                        value={formData.background_image_url}
                        onChange={(e) => setFormData({ ...formData, background_image_url: e.target.value })}
                        placeholder="https://example.com/background.jpg"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="background_video_url">Background Video URL</Label>
                    <Input
                      id="background_video_url"
                      value={formData.background_video_url}
                      onChange={(e) => setFormData({ ...formData, background_video_url: e.target.value })}
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
                        value={formData.primary_button_text}
                        onChange={(e) => setFormData({ ...formData, primary_button_text: e.target.value })}
                        placeholder="Continue Shopping"
                      />
                    </div>
                    <div>
                      <Label htmlFor="primary_button_url">Primary Button URL</Label>
                      <Input
                        id="primary_button_url"
                        value={formData.primary_button_url}
                        onChange={(e) => setFormData({ ...formData, primary_button_url: e.target.value })}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="secondary_button_text">Secondary Button Text</Label>
                      <Input
                        id="secondary_button_text"
                        value={formData.secondary_button_text}
                        onChange={(e) => setFormData({ ...formData, secondary_button_text: e.target.value })}
                        placeholder="Track Order"
                      />
                    </div>
                    <div>
                      <Label htmlFor="secondary_button_url">Secondary Button URL</Label>
                      <Input
                        id="secondary_button_url"
                        value={formData.secondary_button_url}
                        onChange={(e) => setFormData({ ...formData, secondary_button_url: e.target.value })}
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
                          value={formData.text_color}
                          onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                          className="w-16 h-10"
                        />
                        <Input
                          value={formData.text_color}
                          onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
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
                          value={formData.background_color}
                          onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                          className="w-16 h-10"
                        />
                        <Input
                          value={formData.background_color}
                          onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
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
                      backgroundColor: formData.background_color,
                      color: formData.text_color,
                      backgroundImage: formData.background_image_url ? `url(${formData.background_image_url})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {formData.logo_url && (
                      <img src={formData.logo_url} alt="Logo" className="h-12 w-auto" />
                    )}
                    <h3 className="text-xl font-bold">{formData.title || 'Your Title Here'}</h3>
                    <p>{formData.subtitle || 'Your subtitle here'}</p>
                    {formData.custom_message && (
                      <p className="text-sm opacity-90">{formData.custom_message}</p>
                    )}
                    <div className="flex gap-3">
                      {formData.primary_button_text && (
                        <Button variant="default" size="sm">
                          {formData.primary_button_text}
                        </Button>
                      )}
                      {formData.secondary_button_text && (
                        <Button variant="outline" size="sm">
                          {formData.secondary_button_text}
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
                    <CardTitle>{screen.title}</CardTitle>
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