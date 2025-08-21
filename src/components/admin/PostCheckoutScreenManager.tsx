import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Eye, Users, Palette, Settings, Home } from 'lucide-react';
import { toast } from 'sonner';

export const PostCheckoutScreenManager = () => {
  const [screens, setScreens] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [coverPages, setCoverPages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingScreen, setEditingScreen] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    logo_url: '',
    button_1_text: 'Continue Shopping',
    button_1_url: '/',
    button_2_text: 'Track Order',
    button_2_url: '/orders',
    button_3_text: '',
    button_3_url: '',
    button_4_text: '',
    button_4_url: '',
    background_color: '#ffffff',
    text_color: '#000000',
    affiliate_id: '',
    cover_page_id: '',
    is_template: false,
    is_active: true,
    theme: 'success'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [screensRes, coverPagesRes] = await Promise.all([
        supabase.from('post_checkout_screens').select('*').order('created_at', { ascending: false }),
        supabase.from('cover_pages').select('id, title, slug').eq('is_active', true)
      ]);

      if (screensRes.error) throw screensRes.error;
      if (coverPagesRes.error) throw coverPagesRes.error;

      setScreens(screensRes.data || []);
      setCoverPages(coverPagesRes.data || []);
      
      // Skip affiliates to avoid 403 errors
      setAffiliates([]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast.error('Title is required');
      return;
    }

    try {
      const screenData = {
        title: formData.title,
        subtitle: formData.subtitle || '',
        logo_url: formData.logo_url || null,
        button_1_text: formData.button_1_text || 'Continue Shopping',
        button_1_url: formData.button_1_url || '/',
        button_2_text: formData.button_2_text || 'Track Order',
        button_2_url: formData.button_2_url || '/orders',
        button_3_text: formData.button_3_text || null,
        button_3_url: formData.button_3_url || null,
        button_4_text: formData.button_4_text || null,
        button_4_url: formData.button_4_url || null,
        background_color: formData.background_color,
        text_color: formData.text_color,
        affiliate_id: formData.affiliate_id || null,
        cover_page_id: formData.cover_page_id || null,
        is_template: formData.is_template,
        is_active: formData.is_active,
        theme: formData.theme,
        styles: {}
      };

      // If no cover page is selected and we have available cover pages, use the first one
      if (!screenData.cover_page_id && coverPages.length > 0) {
        screenData.cover_page_id = coverPages[0].id;
      }

      if (editingScreen) {
        const { error } = await supabase
          .from('post_checkout_screens')
          .update(screenData)
          .eq('id', editingScreen.id);
        if (error) throw error;
        toast.success('Screen updated successfully');
      } else {
        const { error } = await supabase
          .from('post_checkout_screens')
          .insert([screenData]);
        if (error) throw error;
        toast.success('Screen created successfully');
      }

      resetForm();
      setIsDialogOpen(false);
      setEditingScreen(null);
      fetchData();
    } catch (error: any) {
      console.error('Error saving screen:', error);
      toast.error(error.message || 'Failed to save screen');
    }
  };

  const handleEdit = (screen: any) => {
    setFormData({
      title: screen.title || '',
      subtitle: screen.subtitle || '',
      logo_url: screen.logo_url || '',
      button_1_text: screen.button_1_text || 'Continue Shopping',
      button_1_url: screen.button_1_url || '/',
      button_2_text: screen.button_2_text || 'Track Order',
      button_2_url: screen.button_2_url || '/orders',
      button_3_text: screen.button_3_text || '',
      button_3_url: screen.button_3_url || '',
      button_4_text: screen.button_4_text || '',
      button_4_url: screen.button_4_url || '',
      background_color: screen.background_color || '#ffffff',
      text_color: screen.text_color || '#000000',
      affiliate_id: screen.affiliate_id || '',
      cover_page_id: screen.cover_page_id || '',
      is_template: screen.is_template || false,
      is_active: screen.is_active !== false,
      theme: screen.theme || 'success'
    });
    setEditingScreen(screen);
    setIsDialogOpen(true);
  };

  const handleDelete = async (screen: any) => {
    if (!confirm(`Are you sure you want to delete "${screen.title}"?`)) return;

    try {
      const { error } = await supabase
        .from('post_checkout_screens')
        .delete()
        .eq('id', screen.id);

      if (error) throw error;
      toast.success('Screen deleted successfully');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting screen:', error);
      toast.error(error.message || 'Failed to delete screen');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      logo_url: '',
      button_1_text: 'Continue Shopping',
      button_1_url: '/',
      button_2_text: 'Track Order',
      button_2_url: '/orders',
      button_3_text: '',
      button_3_url: '',
      button_4_text: '',
      button_4_url: '',
      background_color: '#ffffff',
      text_color: '#000000',
      affiliate_id: '',
      cover_page_id: '',
      is_template: false,
      is_active: true,
      theme: 'success'
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingScreen(null);
    setIsDialogOpen(true);
  };

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold">Post-Checkout Screen Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage custom post-purchase experiences and screens
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Create Screen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh]" aria-describedby="dialog-description">
            <DialogHeader>
              <DialogTitle>
                {editingScreen ? `Edit: ${editingScreen.title}` : 'Create Post-Checkout Screen'}
              </DialogTitle>
              <DialogDescription id="dialog-description">
                Configure post-checkout screens with custom styling, buttons, and affiliate assignments.
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          placeholder="Order Confirmed!"
                        />
                      </div>
                      <div>
                        <Label htmlFor="theme">Theme</Label>
                        <Select value={formData.theme} onValueChange={(value) => setFormData({...formData, theme: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="success">Success</SelectItem>
                            <SelectItem value="celebration">Celebration</SelectItem>
                            <SelectItem value="elegant">Elegant</SelectItem>
                            <SelectItem value="minimal">Minimal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="subtitle">Subtitle</Label>
                      <Textarea
                        id="subtitle"
                        value={formData.subtitle}
                        onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                        placeholder="Thank you for your order. We'll send you updates on your delivery."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="logo_url">Logo URL</Label>
                      <Input
                        id="logo_url"
                        value={formData.logo_url}
                        onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Buttons Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Buttons Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Button 1 Text</Label>
                        <Input
                          value={formData.button_1_text}
                          onChange={(e) => setFormData({...formData, button_1_text: e.target.value})}
                          placeholder="Continue Shopping"
                        />
                      </div>
                      <div>
                        <Label>Button 1 URL</Label>
                        <Input
                          value={formData.button_1_url}
                          onChange={(e) => setFormData({...formData, button_1_url: e.target.value})}
                          placeholder="/"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Button 2 Text</Label>
                        <Input
                          value={formData.button_2_text}
                          onChange={(e) => setFormData({...formData, button_2_text: e.target.value})}
                          placeholder="Track Order"
                        />
                      </div>
                      <div>
                        <Label>Button 2 URL</Label>
                        <Input
                          value={formData.button_2_url}
                          onChange={(e) => setFormData({...formData, button_2_url: e.target.value})}
                          placeholder="/orders"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Button 3 Text (Optional)</Label>
                        <Input
                          value={formData.button_3_text}
                          onChange={(e) => setFormData({...formData, button_3_text: e.target.value})}
                          placeholder="Contact Support"
                        />
                      </div>
                      <div>
                        <Label>Button 3 URL</Label>
                        <Input
                          value={formData.button_3_url}
                          onChange={(e) => setFormData({...formData, button_3_url: e.target.value})}
                          placeholder="/support"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Button 4 Text (Optional)</Label>
                        <Input
                          value={formData.button_4_text}
                          onChange={(e) => setFormData({...formData, button_4_text: e.target.value})}
                          placeholder="Share Order"
                        />
                      </div>
                      <div>
                        <Label>Button 4 URL</Label>
                        <Input
                          value={formData.button_4_url}
                          onChange={(e) => setFormData({...formData, button_4_url: e.target.value})}
                          placeholder="/share"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Styling */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Styling</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="background_color">Background Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="background_color"
                            value={formData.background_color}
                            onChange={(e) => setFormData({...formData, background_color: e.target.value})}
                            placeholder="#ffffff"
                          />
                          <input
                            type="color"
                            value={formData.background_color}
                            onChange={(e) => setFormData({...formData, background_color: e.target.value})}
                            className="w-12 h-10 rounded border"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="text_color">Text Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="text_color"
                            value={formData.text_color}
                            onChange={(e) => setFormData({...formData, text_color: e.target.value})}
                            placeholder="#000000"
                          />
                          <input
                            type="color"
                            value={formData.text_color}
                            onChange={(e) => setFormData({...formData, text_color: e.target.value})}
                            className="w-12 h-10 rounded border"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Associations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Associations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Cover Page</Label>
                        <Select value={formData.cover_page_id} onValueChange={(value) => setFormData({...formData, cover_page_id: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cover page..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {coverPages.map((page) => (
                              <SelectItem key={page.id} value={page.id}>
                                {page.title} ({page.slug})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Affiliate</Label>
                        <Select value={formData.affiliate_id} onValueChange={(value) => setFormData({...formData, affiliate_id: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select affiliate..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {affiliates.map((affiliate) => (
                              <SelectItem key={affiliate.id} value={affiliate.id}>
                                {affiliate.company_name || affiliate.name} ({affiliate.affiliate_code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="is_active"
                            checked={formData.is_active}
                            onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                          />
                          <Label htmlFor="is_active">Active</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="is_template"
                            checked={formData.is_template}
                            onCheckedChange={(checked) => setFormData({...formData, is_template: checked})}
                          />
                          <Label htmlFor="is_template">Template</Label>
                        </div>
                      </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    {editingScreen ? 'Update' : 'Create'} Screen
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1 p-6">
        {screens.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Settings className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No post-checkout screens created yet</p>
            <p className="text-sm">Create your first screen to customize the post-purchase experience</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {screens.map((screen) => (
              <Card key={screen.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{screen.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {screen.theme}
                        </Badge>
                        {!screen.is_active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        {screen.is_template && (
                          <Badge variant="outline">Template</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {screen.subtitle || 'No subtitle set'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Created: {new Date(screen.created_at).toLocaleDateString()}</span>
                        {screen.cover_page_id && <span>• Linked to Cover Page</span>}
                        {screen.affiliate_id && <span>• Affiliate Linked</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/post-checkout-preview/${screen.id}`, '_blank')}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(screen)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(screen)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};