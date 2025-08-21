import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  ArrowRight, 
  Settings, 
  Zap,
  Layout,
  ShoppingBag,
  CheckCircle
} from 'lucide-react';

interface FlowComponent {
  id: string;
  name: string;
  type: 'cover_page' | 'delivery_app' | 'post_checkout';
  slug: string;
  status: 'active' | 'draft';
  created_at: string;
}

interface CustomerFlow {
  id?: string;
  name: string;
  slug: string;
  cover_page_id?: string;
  delivery_app_id?: string;
  post_checkout_id?: string;
  is_active: boolean;
  is_default: boolean;
}

export const CustomerFlowBuilder: React.FC = () => {
  const [flows, setFlows] = useState<CustomerFlow[]>([]);
  const [components, setComponents] = useState<{
    coverPages: FlowComponent[];
    deliveryApps: FlowComponent[];
    postCheckouts: FlowComponent[];
  }>({
    coverPages: [],
    deliveryApps: [],
    postCheckouts: []
  });
  const [selectedFlow, setSelectedFlow] = useState<CustomerFlow | null>(null);
  const [isCreatingFlow, setIsCreatingFlow] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Load all components
      const [coverPages, deliveryApps, flows] = await Promise.all([
        supabase.from('cover_pages').select('*').order('created_at', { ascending: false }),
        supabase.from('delivery_app_variations').select('*').order('created_at', { ascending: false }),
        supabase.from('customer_flows').select('*').order('created_at', { ascending: false })
      ]);

      if (coverPages.error) throw coverPages.error;
      if (deliveryApps.error) throw deliveryApps.error;
      if (flows.error) throw flows.error;

      setComponents({
        coverPages: (coverPages.data || []).map(cp => ({
          id: cp.id,
          name: cp.title,
          type: 'cover_page',
          slug: cp.slug,
          status: cp.is_active ? 'active' : 'draft',
          created_at: cp.created_at
        })),
        deliveryApps: (deliveryApps.data || []).map(da => ({
          id: da.id,
          name: da.app_name,
          type: 'delivery_app',
          slug: da.app_slug,
          status: da.is_active ? 'active' : 'draft',
          created_at: da.created_at
        })),
        postCheckouts: [] // We'll add post-checkout pages later
      });

      setFlows(flows.data || []);
    } catch (error) {
      console.error('Error loading flow data:', error);
      toast({ title: 'Error loading data', description: 'Please try again', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const createNewFlow = async (flowData: Omit<CustomerFlow, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('customer_flows')
        .insert([flowData])
        .select()
        .single();

      if (error) throw error;

      await loadAllData();
      setIsCreatingFlow(false);
      toast({ title: 'Success', description: 'Customer flow created successfully!' });
    } catch (error) {
      console.error('Error creating flow:', error);
      toast({ title: 'Error', description: 'Failed to create flow', variant: 'destructive' });
    }
  };

  const FlowBuilder = ({ flow }: { flow: CustomerFlow }) => {
    const coverPage = components.coverPages.find(cp => cp.id === flow.cover_page_id);
    const deliveryApp = components.deliveryApps.find(da => da.id === flow.delivery_app_id);
    
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{flow.name}</h3>
          <Badge variant={flow.is_active ? 'default' : 'secondary'}>
            {flow.is_active ? 'Active' : 'Draft'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Cover Page */}
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Cover Page</Label>
            <div className={`p-3 border rounded-lg ${coverPage ? 'bg-primary/5' : 'bg-muted'}`}>
              {coverPage ? (
                <div>
                  <div className="font-medium">{coverPage.name}</div>
                  <div className="text-sm text-muted-foreground">/{coverPage.slug}</div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No cover page</div>
              )}
            </div>
          </div>

          <ArrowRight className="w-4 h-4 text-muted-foreground" />

          {/* Delivery App */}
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Delivery App</Label>
            <div className={`p-3 border rounded-lg ${deliveryApp ? 'bg-primary/5' : 'bg-muted'}`}>
              {deliveryApp ? (
                <div>
                  <div className="font-medium">{deliveryApp.name}</div>
                  <div className="text-sm text-muted-foreground">/app/{deliveryApp.slug}</div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No delivery app</div>
              )}
            </div>
          </div>

          <ArrowRight className="w-4 h-4 text-muted-foreground" />

          {/* Post Checkout */}
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Post-Purchase</Label>
            <div className="p-3 border rounded-lg bg-muted">
              <div className="text-sm text-muted-foreground">Default post-checkout</div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedFlow(flow)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Flow
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(`${window.location.origin}/flow/${flow.slug}`, '_blank')}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>
    );
  };

  const NewFlowForm = () => {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [coverPageId, setCoverPageId] = useState<string>('');
    const [deliveryAppId, setDeliveryAppId] = useState<string>('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!name || !slug) return;
      
      createNewFlow({
        name,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        cover_page_id: coverPageId || undefined,
        delivery_app_id: deliveryAppId || undefined,
        is_active: true,
        is_default: false
      });
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>Create New Customer Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Flow Name</Label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                }}
                placeholder="Party Supply Flow"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Create complete customer journeys. Administrators can assign these to affiliates.
              </p>
            </div>
            
            <div>
              <Label>URL Slug</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="party-supply-flow"
              />
            </div>
            
            <div>
              <Label>Cover Page (Optional)</Label>
              <Select value={coverPageId} onValueChange={setCoverPageId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cover page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No cover page</SelectItem>
                  {components.coverPages.map(cp => (
                    <SelectItem key={cp.id} value={cp.id}>{cp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Delivery App</Label>
              <Select value={deliveryAppId} onValueChange={setDeliveryAppId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select delivery app" />
                </SelectTrigger>
                <SelectContent>
                  {components.deliveryApps.map(da => (
                    <SelectItem key={da.id} value={da.id}>{da.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button type="submit">Create Flow</Button>
              <Button type="button" variant="outline" onClick={() => setIsCreatingFlow(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  const FlowEditor = ({ flow, onSave }: { flow: CustomerFlow; onSave: () => void }) => {
    const [editingFlow, setEditingFlow] = useState(flow);
    const [saving, setSaving] = useState(false);

    const handleSaveFlow = async () => {
      setSaving(true);
      try {
        const { error } = await supabase
          .from('customer_flows')
          .update({
            name: editingFlow.name,
            slug: editingFlow.slug,
            cover_page_id: editingFlow.cover_page_id,
            delivery_app_id: editingFlow.delivery_app_id,
            post_checkout_id: editingFlow.post_checkout_id,
            is_active: editingFlow.is_active,
            is_default: editingFlow.is_default
          })
          .eq('id', flow.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Flow updated successfully!"
        });
        onSave();
        setSelectedFlow(null);
      } catch (error) {
        console.error('Error saving flow:', error);
        toast({
          title: "Error",
          description: "Failed to save flow",
          variant: "destructive"
        });
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Flow Name</Label>
            <Input
              value={editingFlow.name}
              onChange={(e) => setEditingFlow(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <Label>URL Slug</Label>
            <Input
              value={editingFlow.slug}
              onChange={(e) => setEditingFlow(prev => ({ ...prev, slug: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Cover Page</Label>
            <Select
              value={editingFlow.cover_page_id || ''}
              onValueChange={(value) => setEditingFlow(prev => ({ ...prev, cover_page_id: value || undefined }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select cover page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No cover page</SelectItem>
                {components.coverPages.map(cp => (
                  <SelectItem key={cp.id} value={cp.id}>{cp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Delivery App</Label>
            <Select
              value={editingFlow.delivery_app_id || ''}
              onValueChange={(value) => setEditingFlow(prev => ({ ...prev, delivery_app_id: value || undefined }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select delivery app" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No delivery app</SelectItem>
                {components.deliveryApps.map(da => (
                  <SelectItem key={da.id} value={da.id}>{da.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Post-Checkout</Label>
            <Select
              value={editingFlow.post_checkout_id || ''}
              onValueChange={(value) => setEditingFlow(prev => ({ ...prev, post_checkout_id: value || undefined }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select post-checkout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default post-checkout</SelectItem>
                {components.postCheckouts.map(pc => (
                  <SelectItem key={pc.id} value={pc.id}>{pc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="flow-active"
              checked={editingFlow.is_active}
              onCheckedChange={(checked) => setEditingFlow(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="flow-active">Active</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="flow-default"
              checked={editingFlow.is_default}
              onCheckedChange={(checked) => setEditingFlow(prev => ({ ...prev, is_default: checked }))}
            />
            <Label htmlFor="flow-default">Default Flow</Label>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSaveFlow} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="outline" onClick={() => setSelectedFlow(null)}>
            Cancel
          </Button>
        </div>
      </div>
    );
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
        <div>
          <h2 className="text-2xl font-bold">Customer Flow Configuration</h2>
          <p className="text-muted-foreground">
            Create and manage complete customer journeys from cover page to delivery app to post-purchase
          </p>
        </div>
        <Button onClick={() => setIsCreatingFlow(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Flow
        </Button>
      </div>

      {isCreatingFlow && <NewFlowForm />}
      
      {selectedFlow && (
        <Card className="p-6 border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Editing Flow: {selectedFlow.name}</h3>
            <Button variant="outline" size="sm" onClick={() => setSelectedFlow(null)}>
              Cancel
            </Button>
          </div>
          <FlowEditor flow={selectedFlow} onSave={loadAllData} />
        </Card>
      )}

      <Tabs defaultValue="flows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="flows">Customer Flows</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
        </TabsList>

        <TabsContent value="flows" className="space-y-4">
          {flows.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Layout className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Customer Flows</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first customer flow to link cover pages, delivery apps, and post-purchase experiences.
                </p>
                <Button onClick={() => setIsCreatingFlow(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Flow
                </Button>
              </CardContent>
            </Card>
          ) : (
            flows.map(flow => <FlowBuilder key={flow.id} flow={flow} />)
          )}
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cover Pages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="w-5 h-5" />
                  Cover Pages ({components.coverPages.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {components.coverPages.map(cp => (
                  <div key={cp.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium text-sm">{cp.name}</div>
                      <div className="text-xs text-muted-foreground">/{cp.slug}</div>
                    </div>
                    <Badge variant={cp.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {cp.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Delivery Apps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Delivery Apps ({components.deliveryApps.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {components.deliveryApps.map(da => (
                  <div key={da.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium text-sm">{da.name}</div>
                      <div className="text-xs text-muted-foreground">/app/{da.slug}</div>
                    </div>
                    <Badge variant={da.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {da.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Post-Checkout */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Post-Purchase (1)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium text-sm">Default Post-Checkout</div>
                    <div className="text-xs text-muted-foreground">/order-complete</div>
                  </div>
                  <Badge variant="default" className="text-xs">active</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};