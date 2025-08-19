import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Eye, Users, Palette } from 'lucide-react';
import { toast } from 'sonner';

export const PostCheckoutScreenManager = () => {
  const [screens, setScreens] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingScreen, setEditingScreen] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    screen_name: '',
    screen_slug: '',
    title: '',
    message: '',
    affiliate_id: ''
  });

  useEffect(() => {
    fetchScreens();
    fetchAffiliates();
  }, []);

  const fetchScreens = async () => {
    try {
      const { data, error } = await supabase
        .from('post_checkout_screens')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScreens(data || []);
    } catch (error) {
      console.error('Error fetching screens:', error);
      toast.error('Failed to load screens');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAffiliates = async () => {
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('id, company_name, affiliate_code')
        .eq('status', 'active');

      if (error) throw error;
      setAffiliates(data || []);
    } catch (error) {
      console.error('Error fetching affiliates:', error);
    }
  };

  const handleSave = async () => {
    try {
      const screenData = {
        title: formData.title,
        message: formData.message,
        affiliate_id: formData.affiliate_id || null,
        cover_page_id: '', // Required field - set to empty string for now
        background_color: '#ffffff',
        text_color: '#000000'
      };

      if (editingScreen) {
        const { error } = await supabase
          .from('post_checkout_screens')
          .update(screenData)
          .eq('id', editingScreen.id);
        if (error) throw error;
        toast.success('Screen updated');
      } else {
        const { error } = await supabase
          .from('post_checkout_screens')
          .insert([screenData]);
        if (error) throw error;
        toast.success('Screen created');
      }

      setIsCreating(false);
      setEditingScreen(null);
      fetchScreens();
    } catch (error) {
      console.error('Error saving screen:', error);
      toast.error('Failed to save screen');
    }
  };

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Post-Checkout Screen Manager</h1>
      <Button onClick={() => setIsCreating(true)} className="mb-4">
        <Plus className="w-4 h-4 mr-2" />
        Create Screen
      </Button>
      
      {(isCreating || editingScreen) && (
        <Card className="mb-6">
          <CardContent className="p-6 space-y-4">
            <Input
              placeholder="Screen Name"
              value={formData.screen_name}
              onChange={(e) => setFormData({...formData, screen_name: e.target.value})}
            />
            <Input
              placeholder="Screen Slug"
              value={formData.screen_slug}
              onChange={(e) => setFormData({...formData, screen_slug: e.target.value})}
            />
            <Input
              placeholder="Title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
            <Textarea
              placeholder="Message"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
            />
            <div className="flex gap-2">
              <Button onClick={handleSave}>Save</Button>
              <Button variant="outline" onClick={() => {setIsCreating(false); setEditingScreen(null);}}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {screens.map((screen) => (
          <Card key={screen.id}>
            <CardContent className="p-4">
              <h3 className="font-semibold">{screen.screen_name}</h3>
              <p className="text-sm text-muted-foreground">{screen.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};