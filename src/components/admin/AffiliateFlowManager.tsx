import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CANONICAL_DOMAIN } from '@/utils/domain';

interface AffiliateFlow {
  id: string;
  affiliate_id: string;
  flow_name: string;
  flow_slug: string;
  flow_description?: string;
  cover_page_id?: string;
  post_checkout_screen_id?: string;
  delivery_app_configs: any;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface Affiliate {
  id: string;
  name: string;
  email: string;
  company_name: string;
  custom_handle?: string;
}

export const AffiliateFlowManager: React.FC = () => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [flows, setFlows] = useState<AffiliateFlow[]>([]);
  const [selectedAffiliate, setSelectedAffiliate] = useState<string>('');
  const [editingFlow, setEditingFlow] = useState<AffiliateFlow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    flow_name: '',
    flow_slug: '',
    flow_description: '',
    is_active: true,
    is_default: false
  });

  useEffect(() => {
    loadAffiliates();
  }, []);

  useEffect(() => {
    if (selectedAffiliate) {
      loadFlows(selectedAffiliate);
    }
  }, [selectedAffiliate]);

  const loadAffiliates = async () => {
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('id, name, email, company_name, custom_handle')
        .order('company_name');

      if (error) throw error;
      setAffiliates(data || []);
    } catch (error) {
      console.error('Error loading affiliates:', error);
      toast({
        title: "Error",
        description: "Failed to load affiliates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFlows = async (affiliateId: string) => {
    try {
      const { data, error } = await supabase
        .from('affiliate_flows')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFlows((data || []).map(flow => ({
        ...flow,
        delivery_app_configs: Array.isArray(flow.delivery_app_configs) 
          ? flow.delivery_app_configs 
          : typeof flow.delivery_app_configs === 'string'
            ? JSON.parse(flow.delivery_app_configs || '[]')
            : []
      })));
    } catch (error) {
      console.error('Error loading flows:', error);
      toast({
        title: "Error",
        description: "Failed to load flows",
        variant: "destructive"
      });
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleCreateFlow = async () => {
    if (!selectedAffiliate || !formData.flow_name.trim()) {
      toast({
        title: "Error",
        description: "Please select an affiliate and provide a flow name",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('affiliate_flows')
        .insert({
          affiliate_id: selectedAffiliate,
          flow_name: formData.flow_name,
          flow_slug: formData.flow_slug || generateSlug(formData.flow_name),
          flow_description: formData.flow_description,
          is_active: formData.is_active,
          is_default: formData.is_default
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Flow created successfully"
      });

      resetForm();
      loadFlows(selectedAffiliate);
    } catch (error) {
      console.error('Error creating flow:', error);
      toast({
        title: "Error",
        description: "Failed to create flow",
        variant: "destructive"
      });
    }
  };

  const handleUpdateFlow = async () => {
    if (!editingFlow) return;

    try {
      const { error } = await supabase
        .from('affiliate_flows')
        .update({
          flow_name: formData.flow_name,
          flow_slug: formData.flow_slug,
          flow_description: formData.flow_description,
          is_active: formData.is_active,
          is_default: formData.is_default
        })
        .eq('id', editingFlow.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Flow updated successfully"
      });

      resetForm();
      loadFlows(selectedAffiliate);
    } catch (error) {
      console.error('Error updating flow:', error);
      toast({
        title: "Error",
        description: "Failed to update flow",
        variant: "destructive"
      });
    }
  };

  const handleDeleteFlow = async (flowId: string) => {
    if (!confirm('Are you sure you want to delete this flow?')) return;

    try {
      const { error } = await supabase
        .from('affiliate_flows')
        .delete()
        .eq('id', flowId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Flow deleted successfully"
      });

      loadFlows(selectedAffiliate);
    } catch (error) {
      console.error('Error deleting flow:', error);
      toast({
        title: "Error",
        description: "Failed to delete flow",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      flow_name: '',
      flow_slug: '',
      flow_description: '',
      is_active: true,
      is_default: false
    });
    setEditingFlow(null);
    setIsCreating(false);
  };

  const startEditing = (flow: AffiliateFlow) => {
    setFormData({
      flow_name: flow.flow_name,
      flow_slug: flow.flow_slug,
      flow_description: flow.flow_description || '',
      is_active: flow.is_active,
      is_default: flow.is_default
    });
    setEditingFlow(flow);
    setIsCreating(true);
  };

  const copyFlowURL = (flow: AffiliateFlow) => {
    const affiliate = affiliates.find(a => a.id === flow.affiliate_id);
    const url = `${CANONICAL_DOMAIN}/${affiliate?.custom_handle}/${flow.flow_slug}/cover`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "Flow URL copied to clipboard"
    });
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Affiliate Flow Manager</h1>
        <Button
          onClick={() => setIsCreating(true)}
          disabled={!selectedAffiliate}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Flow
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Affiliate</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedAffiliate} onValueChange={setSelectedAffiliate}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an affiliate to manage flows" />
            </SelectTrigger>
            <SelectContent>
              {affiliates.map((affiliate) => (
                <SelectItem key={affiliate.id} value={affiliate.id}>
                  {affiliate.company_name} ({affiliate.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedAffiliate && (
        <Tabs defaultValue="flows" className="space-y-4">
          <TabsList>
            <TabsTrigger value="flows">Customer Flows</TabsTrigger>
            <TabsTrigger value="create" disabled={!isCreating}>
              {editingFlow ? 'Edit Flow' : 'Create Flow'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flows" className="space-y-4">
            {flows.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No flows created yet</p>
                  <Button
                    onClick={() => setIsCreating(true)}
                    className="mt-4"
                  >
                    Create First Flow
                  </Button>
                </CardContent>
              </Card>
            ) : (
              flows.map((flow) => (
                <Card key={flow.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{flow.flow_name}</h3>
                          {flow.is_default && <Badge variant="default">Default</Badge>}
                          {!flow.is_active && <Badge variant="secondary">Inactive</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Slug: {flow.flow_slug}
                        </p>
                        {flow.flow_description && (
                          <p className="text-sm">{flow.flow_description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          URL: /{affiliates.find(a => a.id === flow.affiliate_id)?.custom_handle}/{flow.flow_slug}/cover
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyFlowURL(flow)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditing(flow)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteFlow(flow.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingFlow ? 'Edit Flow' : 'Create New Flow'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="flow_name">Flow Name</Label>
                    <Input
                      id="flow_name"
                      value={formData.flow_name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          flow_name: name,
                          flow_slug: prev.flow_slug || generateSlug(name)
                        }));
                      }}
                      placeholder="e.g., Wedding Package Flow"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flow_slug">Flow Slug</Label>
                    <Input
                      id="flow_slug"
                      value={formData.flow_slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, flow_slug: e.target.value }))}
                      placeholder="e.g., wedding-package"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="flow_description">Description (Optional)</Label>
                  <Textarea
                    id="flow_description"
                    value={formData.flow_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, flow_description: e.target.value }))}
                    placeholder="Describe this customer flow..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_default"
                      checked={formData.is_default}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
                    />
                    <Label htmlFor="is_default">Default Flow</Label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button
                    onClick={editingFlow ? handleUpdateFlow : handleCreateFlow}
                  >
                    {editingFlow ? 'Update Flow' : 'Create Flow'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};