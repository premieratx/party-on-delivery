import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Trash2, Star, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';

interface PostCheckoutScreen {
  id?: string;
  screen_name: string;
  title: string;
  message: string;
  button_1_text: string;
  button_1_url: string;
  button_2_text: string;
  button_2_url: string;
  background_color: string;
  is_active: boolean;
}

export const SimplePostCheckoutCreator: React.FC = () => {
  const [screens, setScreens] = useState<PostCheckoutScreen[]>([]);
  const [selectedScreen, setSelectedScreen] = useState<PostCheckoutScreen | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<PostCheckoutScreen>({
    screen_name: '',
    title: 'Thank You for Your Order!',
    message: 'Your order has been confirmed and will be processed shortly.',
    button_1_text: 'Track Order',
    button_1_url: '#',
    button_2_text: 'Shop Again',
    button_2_url: '/',
    background_color: '#ffffff',
    is_active: true
  });

  useEffect(() => {
    loadScreens();
  }, []);

  const loadScreens = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('post_checkout_screens')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScreens(data || []);
    } catch (error) {
      console.error('Error loading screens:', error);
      toast.error('Failed to load screens');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.screen_name) {
      toast.error('Screen name is required');
      return;
    }

    try {
      setSaving(true);
      
      if (selectedScreen?.id) {
        const { error } = await supabase
          .from('post_checkout_screens')
          .update({
            screen_name: formData.screen_name,
            title: formData.title,
            message: formData.message,
            button_1_text: formData.button_1_text,
            button_1_url: formData.button_1_url,
            button_2_text: formData.button_2_text,
            button_2_url: formData.button_2_url,
            background_color: formData.background_color,
            is_active: formData.is_active
          })
          .eq('id', selectedScreen.id);

        if (error) throw error;
        toast.success('Screen updated successfully');
      } else {
        const { error } = await supabase
          .from('post_checkout_screens')
          .insert(formData);

        if (error) throw error;
        toast.success('Screen created successfully');
      }

      loadScreens();
      resetForm();
    } catch (error) {
      console.error('Error saving screen:', error);
      toast.error('Failed to save screen');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this screen?')) return;

    try {
      const { error } = await supabase
        .from('post_checkout_screens')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Screen deleted successfully');
      loadScreens();
      
      if (selectedScreen?.id === id) {
        resetForm();
      }
    } catch (error) {
      console.error('Error deleting screen:', error);
      toast.error('Failed to delete screen');
    }
  };

  const selectScreen = (screen: PostCheckoutScreen) => {
    setSelectedScreen(screen);
    setFormData({ ...screen });
  };

  const resetForm = () => {
    setSelectedScreen(null);
    setFormData({
      screen_name: '',
      title: 'Thank You for Your Order!',
      message: 'Your order has been confirmed and will be processed shortly.',
      button_1_text: 'Track Order',
      button_1_url: '#',
      button_2_text: 'Shop Again',
      button_2_url: '/',
      background_color: '#ffffff',
      is_active: true
    });
  };

  return (
    <div className="container mx-auto p-6 max-h-screen overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center justify-between">
              Post-Checkout Screens
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
                  {screens.map((screen) => (
                    <div
                      key={screen.id}
                      className={`p-3 border rounded cursor-pointer hover:bg-accent ${
                        selectedScreen?.id === screen.id ? 'border-primary bg-accent' : ''
                      }`}
                      onClick={() => selectScreen(screen)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{screen.screen_name}</h4>
                          <p className="text-sm text-muted-foreground">{screen.title}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(screen.id!);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center justify-between">
              {selectedScreen ? 'Edit Screen' : 'Create Screen'}
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Screen Name</label>
                    <Input
                      value={formData.screen_name}
                      onChange={(e) => setFormData({ ...formData, screen_name: e.target.value })}
                      placeholder="Default Thank You Screen"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Thank You for Your Order!"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Message</label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Your order has been confirmed..."
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Button 1 Text</label>
                      <Input
                        value={formData.button_1_text}
                        onChange={(e) => setFormData({ ...formData, button_1_text: e.target.value })}
                        placeholder="Track Order"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Button 1 URL</label>
                      <Input
                        value={formData.button_1_url}
                        onChange={(e) => setFormData({ ...formData, button_1_url: e.target.value })}
                        placeholder="#"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Button 2 Text</label>
                      <Input
                        value={formData.button_2_text}
                        onChange={(e) => setFormData({ ...formData, button_2_text: e.target.value })}
                        placeholder="Shop Again"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Button 2 URL</label>
                      <Input
                        value={formData.button_2_url}
                        onChange={(e) => setFormData({ ...formData, button_2_url: e.target.value })}
                        placeholder="/"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Background Color</label>
                    <Input
                      type="color"
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <label className="text-sm font-medium">Active</label>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};