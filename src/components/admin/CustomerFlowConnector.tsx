import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowRight, 
  Plus, 
  Save, 
  Eye, 
  Link2, 
  Users, 
  Target,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FlowConnection {
  id?: string;
  name: string;
  slug: string;
  cover_page_id: string;
  delivery_app_id: string; 
  post_checkout_id: string;
  affiliate_id?: string;
  is_active: boolean;
  tracking_enabled: boolean;
}

interface FlowComponent {
  id: string;
  name: string;
  slug: string;
  type: 'cover_page' | 'delivery_app' | 'post_checkout';
  url: string;
}

export const CustomerFlowConnector: React.FC = () => {
  const [flows, setFlows] = useState<FlowConnection[]>([]);
  const [coverPages, setCoverPages] = useState<FlowComponent[]>([]);
  const [deliveryApps, setDeliveryApps] = useState<FlowComponent[]>([]);
  const [postCheckoutPages, setPostCheckoutPages] = useState<FlowComponent[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreator, setShowCreator] = useState(false);

  // Form state for creating new flow
  const [flowName, setFlowName] = useState('');
  const [flowSlug, setFlowSlug] = useState('');
  const [selectedCoverPage, setSelectedCoverPage] = useState('');
  const [selectedDeliveryApp, setSelectedDeliveryApp] = useState('');
  const [selectedPostCheckout, setSelectedPostCheckout] = useState('');
  const [selectedAffiliate, setSelectedAffiliate] = useState('');
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAllComponents();
    loadFlows();
  }, []);

  const loadAllComponents = async () => {
    try {
      setLoading(true);
      const [coverPagesRes, deliveryAppsRes, postCheckoutRes, affiliatesRes] = await Promise.all([
        supabase.from('cover_pages').select('id, title, slug').eq('is_active', true),
        supabase.from('delivery_app_variations').select('id, app_name, app_slug').eq('is_active', true),
        supabase.from('post_checkout_pages').select('id, name, slug').eq('is_active', true),
        supabase.from('affiliates').select('id, name, company_name, affiliate_code').eq('status', 'active')
      ]);

      setCoverPages(coverPagesRes.data?.map(p => ({
        id: p.id,
        name: p.title,
        slug: p.slug,
        type: 'cover_page' as const,
        url: `/${p.slug}`
      })) || []);

      setDeliveryApps(deliveryAppsRes.data?.map(p => ({
        id: p.id,
        name: p.app_name,
        slug: p.app_slug,
        type: 'delivery_app' as const,
        url: `/app/${p.app_slug}`
      })) || []);

      setPostCheckoutPages(postCheckoutRes.data?.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        type: 'post_checkout' as const,
        url: `/post-checkout/${p.slug}`
      })) || []);

      setAffiliates(affiliatesRes.data || []);
    } catch (error) {
      console.error('Error loading components:', error);
      toast.error('Failed to load flow components');
    } finally {
      setLoading(false);
    }
  };

  const loadFlows = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_flows')
        .select(`
          *,
          cover_pages (title, slug),
          delivery_app_variations (app_name, app_slug),
          post_checkout_pages (name, slug)
        `)
        .order('created_at', { ascending: false });

      const flows = data?.map(flow => ({
        ...flow,
        tracking_enabled: true // Default value for missing property
      })) || [];
      
      setFlows(flows);
    } catch (error) {
      console.error('Error loading flows:', error);
    }
  };

  const handleCreateFlow = async () => {
    if (!flowName || !selectedCoverPage || !selectedDeliveryApp || !selectedPostCheckout) {
      toast.error('All components are required to create a flow');
      return;
    }

    setSaving(true);
    try {
      const flowData = {
        name: flowName,
        slug: `${flowSlug || flowName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
        cover_page_id: selectedCoverPage,
        delivery_app_id: selectedDeliveryApp,
        post_checkout_id: selectedPostCheckout,
        is_active: isActive
      };

      const { error } = await supabase
        .from('customer_flows')
        .insert(flowData);

      if (error) throw error;

      toast.success('Customer flow created successfully!');
      setShowCreator(false);
      resetForm();
      loadFlows();
    } catch (error: any) {
      console.error('Error creating flow:', error);
      toast.error(error?.message || 'Failed to create customer flow');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFlowName('');
    setFlowSlug('');
    setSelectedCoverPage('');
    setSelectedDeliveryApp('');
    setSelectedPostCheckout('');
    setSelectedAffiliate('');
    setTrackingEnabled(true);
    setIsActive(true);
  };

  const renderFlowVisualization = (flow: FlowConnection) => {
    const coverPage = coverPages.find(c => c.id === flow.cover_page_id);
    const deliveryApp = deliveryApps.find(d => d.id === flow.delivery_app_id);
    const postCheckout = postCheckoutPages.find(p => p.id === flow.post_checkout_id);

    return (
      <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-lg">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
            <span className="text-2xl">🎬</span>
          </div>
          <p className="text-xs font-medium">{coverPage?.name}</p>
          <Badge variant="outline" className="text-xs mt-1">{coverPage?.slug}</Badge>
        </div>
        
        <ArrowRight className="text-muted-foreground" />
        
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-2">
            <span className="text-2xl">🚚</span>
          </div>
          <p className="text-xs font-medium">{deliveryApp?.name}</p>
          <Badge variant="outline" className="text-xs mt-1">{deliveryApp?.slug}</Badge>
        </div>
        
        <ArrowRight className="text-muted-foreground" />
        
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-xs font-medium">{postCheckout?.name}</p>
          <Badge variant="outline" className="text-xs mt-1">{postCheckout?.slug}</Badge>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Customer Flow Manager</h3>
          <p className="text-muted-foreground">
            Connect cover pages, delivery apps, and post-checkout experiences
          </p>
        </div>
        <Button onClick={() => setShowCreator(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Flow
        </Button>
      </div>

      {/* Creator Form */}
      {showCreator && (
        <Card>
          <CardHeader>
            <CardTitle>Create Customer Flow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Flow Name</Label>
                <Input
                  value={flowName}
                  onChange={(e) => setFlowName(e.target.value)}
                  placeholder="Premium Wine Experience"
                />
              </div>
              <div>
                <Label>Flow Slug</Label>
                <Input
                  value={flowSlug}
                  onChange={(e) => setFlowSlug(e.target.value)}
                  placeholder="premium-wine-flow"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Cover Page</Label>
                <Select value={selectedCoverPage} onValueChange={setSelectedCoverPage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cover page" />
                  </SelectTrigger>
                  <SelectContent>
                    {coverPages.map((page) => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Delivery App</Label>
                <Select value={selectedDeliveryApp} onValueChange={setSelectedDeliveryApp}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery app" />
                  </SelectTrigger>
                  <SelectContent>
                    {deliveryApps.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Post-Checkout Page</Label>
                <Select value={selectedPostCheckout} onValueChange={setSelectedPostCheckout}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select post-checkout" />
                  </SelectTrigger>
                  <SelectContent>
                    {postCheckoutPages.map((page) => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleCreateFlow} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Creating...' : 'Create Flow'}
              </Button>
              <Button onClick={() => setShowCreator(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Flows */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Flows ({flows.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {flows.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No customer flows created yet</p>
              <Button onClick={() => setShowCreator(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Flow
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {flows.map((flow) => (
                  <Card key={flow.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold">{flow.name}</h4>
                          <p className="text-sm text-muted-foreground">/{flow.slug}</p>
                          <Badge variant={flow.is_active ? 'default' : 'secondary'} className="mt-2">
                            {flow.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Link2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {renderFlowVisualization(flow)}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
