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
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeliveryApp {
  id: string;
  app_name: string;
  app_slug: string;
  business_name?: string;
  business_address?: any;
  delivery_address?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EditableDeliveryAppManagerProps {
  onBack: () => void;
}

export const EditableDeliveryAppManager: React.FC<EditableDeliveryAppManagerProps> = ({ onBack }) => {
  const [apps, setApps] = useState<DeliveryApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingApp, setEditingApp] = useState<DeliveryApp | null>(null);
  const [formData, setFormData] = useState({
    app_name: '',
    app_slug: '',
    business_name: '',
    business_address: '',
    delivery_address: '',
    is_active: true
  });

  useEffect(() => {
    loadDeliveryApps();
  }, []);

  const loadDeliveryApps = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApps(data || []);
    } catch (error) {
      console.error('Error loading delivery apps:', error);
      toast.error('Failed to load delivery apps');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (app: DeliveryApp) => {
    setEditingApp(app);
    setFormData({
      app_name: app.app_name,
      app_slug: app.app_slug,
      business_name: app.business_name || '',
      business_address: JSON.stringify(app.business_address || {}),
      delivery_address: JSON.stringify(app.delivery_address || {}),
      is_active: app.is_active
    });
  };

  const handleSave = async () => {
    if (!editingApp) return;

    try {
      const { error } = await supabase
        .from('delivery_app_variations')
        .update({
          app_name: formData.app_name,
          app_slug: formData.app_slug,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingApp.id);

      if (error) throw error;

      toast.success('Delivery app updated successfully');
      setEditingApp(null);
      loadDeliveryApps();
    } catch (error) {
      console.error('Error updating delivery app:', error);
      toast.error('Failed to update delivery app');
    }
  };

  const handleDelete = async (appId: string) => {
    if (!confirm('Are you sure you want to delete this delivery app?')) return;

    try {
      const { error } = await supabase
        .from('delivery_app_variations')
        .delete()
        .eq('id', appId);

      if (error) throw error;

      toast.success('Delivery app deleted successfully');
      loadDeliveryApps();
    } catch (error) {
      console.error('Error deleting delivery app:', error);
      toast.error('Failed to delete delivery app');
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
            <h1 className="text-3xl font-bold">Delivery App Manager</h1>
          </div>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <Card key={app.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{app.app_name}</CardTitle>
                  <Badge variant={app.is_active ? 'default' : 'secondary'}>
                    {app.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Business</p>
                  <p className="font-medium">{app.business_name || 'No business name'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Slug</p>
                  <p className="font-mono text-sm">{app.app_slug}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(app)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/app/${app.app_slug}`, '_blank')}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(app.id)}
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
        {editingApp && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Edit Delivery App</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingApp(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="app_name">App Name</Label>
                    <Input
                      id="app_name"
                      value={formData.app_name}
                      onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="app_slug">App Slug</Label>
                    <Input
                      id="app_slug"
                      value={formData.app_slug}
                      onChange={(e) => setFormData({ ...formData, app_slug: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="business_address">Business Address (JSON)</Label>
                  <Textarea
                    id="business_address"
                    value={formData.business_address}
                    onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="delivery_address">Delivery Address (JSON)</Label>
                  <Textarea
                    id="delivery_address"
                    value={formData.delivery_address}
                    onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSave} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditingApp(null)}
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