import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Save, Eye, Plus } from 'lucide-react';

interface PostCheckoutScreen {
  id?: string;
  cover_page_id: string;
  affiliate_id?: string;
  title: string;
  subtitle: string;
  logo_url?: string;
  button_1_text: string;
  button_1_url: string;
  button_2_text: string;
  button_2_url: string;
  background_color: string;
  text_color: string;
  styles: any;
}

interface CoverPage {
  id: string;
  title: string;
  slug: string;
  affiliate_slug?: string;
}

export default function PostCheckoutScreenCreator() {
  const { toast } = useToast();
  const [postCheckoutScreens, setPostCheckoutScreens] = useState<PostCheckoutScreen[]>([]);
  const [coverPages, setCoverPages] = useState<CoverPage[]>([]);
  const [selectedScreen, setSelectedScreen] = useState<PostCheckoutScreen | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<PostCheckoutScreen>({
    cover_page_id: '',
    title: '',
    subtitle: '',
    logo_url: '',
    button_1_text: 'Continue Shopping',
    button_1_url: '/',
    button_2_text: 'Track Order',
    button_2_url: '/orders',
    background_color: '#ffffff',
    text_color: '#000000',
    styles: {}
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load cover pages
      const { data: coverPagesData, error: coverError } = await supabase
        .from('cover_pages')
        .select('id, title, slug, affiliate_slug')
        .eq('is_active', true)
        .order('title');

      if (coverError) throw coverError;
      setCoverPages(coverPagesData || []);

      // Load post-checkout screens
      const { data: screensData, error: screensError } = await supabase
        .from('post_checkout_screens')
        .select(`
          *,
          cover_pages(title, slug, affiliate_slug)
        `)
        .order('created_at', { ascending: false });

      if (screensError) throw screensError;
      setPostCheckoutScreens(screensData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load post-checkout screens",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.cover_page_id || !formData.title) {
      toast({
        title: "Validation Error",
        description: "Please fill in required fields (cover page and title)",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isEditing && selectedScreen?.id) {
        // Update existing screen
        const { error } = await supabase
          .from('post_checkout_screens')
          .update(formData)
          .eq('id', selectedScreen.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Post-checkout screen updated successfully"
        });
      } else {
        // Create new screen
        const { error } = await supabase
          .from('post_checkout_screens')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Post-checkout screen created successfully"
        });
      }

      // Reset form and reload data
      setFormData({
        cover_page_id: '',
        title: '',
        subtitle: '',
        logo_url: '',
        button_1_text: 'Continue Shopping',
        button_1_url: '/',
        button_2_text: 'Track Order',
        button_2_url: '/orders',
        background_color: '#ffffff',
        text_color: '#000000',
        styles: {}
      });
      setIsEditing(false);
      setSelectedScreen(null);
      loadData();

    } catch (error) {
      console.error('Error saving post-checkout screen:', error);
      toast({
        title: "Error",
        description: "Failed to save post-checkout screen",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (screen: PostCheckoutScreen) => {
    setSelectedScreen(screen);
    setFormData(screen);
    setIsEditing(true);
  };

  const handleNew = () => {
    setSelectedScreen(null);
    setFormData({
      cover_page_id: '',
      title: '',
      subtitle: '',
      logo_url: '',
      button_1_text: 'Continue Shopping',
      button_1_url: '/',
      button_2_text: 'Track Order',
      button_2_url: '/orders',
      background_color: '#ffffff',
      text_color: '#000000',
      styles: {}
    });
    setIsEditing(false);
  };

  const handlePreview = (screen: PostCheckoutScreen) => {
    const coverPage = coverPages.find(cp => cp.id === screen.cover_page_id);
    if (coverPage?.affiliate_slug) {
      window.open(`/${coverPage.affiliate_slug}/post?preview=true`, '_blank');
    } else {
      toast({
        title: "Preview Error",
        description: "No affiliate slug found for this cover page",
        variant: "destructive"
      });
    }
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Post-Checkout Screen Creator</h2>
        <Button onClick={handleNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Post-Checkout Screen
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditing ? 'Edit Post-Checkout Screen' : 'Create New Post-Checkout Screen'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cover_page_id">Cover Page *</Label>
              <Select 
                value={formData.cover_page_id} 
                onValueChange={(value) => setFormData({...formData, cover_page_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a cover page" />
                </SelectTrigger>
                <SelectContent>
                  {coverPages.map((page) => (
                    <SelectItem key={page.id} value={page.id}>
                      {page.title} {page.affiliate_slug && `(/${page.affiliate_slug})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Thank you for your order!"
              />
            </div>

            <div>
              <Label htmlFor="subtitle">Subtitle</Label>
              <Textarea
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                placeholder="Your order has been confirmed and will be delivered soon."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="logo_url">Logo URL</Label>
              <div className="flex gap-2">
                <Input
                  id="logo_url"
                  value={formData.logo_url || ''}
                  onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                  placeholder="https://example.com/logo.png"
                />
                <Button variant="outline" size="icon">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="background_color">Background Color</Label>
                <Input
                  id="background_color"
                  type="color"
                  value={formData.background_color}
                  onChange={(e) => setFormData({...formData, background_color: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="text_color">Text Color</Label>
                <Input
                  id="text_color"
                  type="color"
                  value={formData.text_color}
                  onChange={(e) => setFormData({...formData, text_color: e.target.value})}
                />
              </div>
            </div>

            {/* Button 1 */}
            <div className="space-y-2">
              <Label>Button 1</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={formData.button_1_text}
                  onChange={(e) => setFormData({...formData, button_1_text: e.target.value})}
                  placeholder="Button text"
                />
                <Input
                  value={formData.button_1_url}
                  onChange={(e) => setFormData({...formData, button_1_url: e.target.value})}
                  placeholder="Button URL"
                />
              </div>
            </div>

            {/* Button 2 */}
            <div className="space-y-2">
              <Label>Button 2</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={formData.button_2_text}
                  onChange={(e) => setFormData({...formData, button_2_text: e.target.value})}
                  placeholder="Button text"
                />
                <Input
                  value={formData.button_2_url}
                  onChange={(e) => setFormData({...formData, button_2_url: e.target.value})}
                  placeholder="Button URL"
                />
              </div>
            </div>

            <Button onClick={handleSave} className="w-full flex items-center gap-2">
              <Save className="w-4 h-4" />
              {isEditing ? 'Update Screen' : 'Create Screen'}
            </Button>
          </CardContent>
        </Card>

        {/* Existing Screens List */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Post-Checkout Screens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {postCheckoutScreens.map((screen) => {
                const coverPage = coverPages.find(cp => cp.id === screen.cover_page_id);
                return (
                  <div key={screen.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{screen.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          For: {coverPage?.title || 'Unknown Cover Page'}
                        </p>
                        {coverPage?.affiliate_slug && (
                          <p className="text-xs text-primary">
                            URL: /{coverPage.affiliate_slug}/post
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreview(screen)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(screen)}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {postCheckoutScreens.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No post-checkout screens created yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
