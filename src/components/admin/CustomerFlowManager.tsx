import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Trash2, Plus, Copy, ExternalLink, X } from 'lucide-react';
import { CANONICAL_DOMAIN } from '@/utils/links';

interface CustomerFlow {
  id: string;
  name: string;
  slug: string;
  cover_page_id: string | null;
  delivery_app_id: string | null;
  post_checkout_id: string | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface CoverPage {
  id: string;
  title: string;
  slug: string;
}

interface DeliveryApp {
  id: string;
  app_name: string;
  app_slug: string;
}

interface PostCheckoutPage {
  id: string;
  name: string;
  slug: string;
}

interface Affiliate {
  id: string;
  name: string;
  company_name: string;
  email: string;
  affiliate_code: string;
}

interface FlowAssignment {
  id: string;
  customer_flow_id: string;
  affiliate_id: string;
  share_slug: string;
  is_active: boolean;
  created_at: string;
  free_shipping: boolean;
  discount_type: string | null;
  discount_percentage: number | null;
  discount_dollar_amount: number | null;
}

export const CustomerFlowManager: React.FC = () => {
  const [flows, setFlows] = useState<CustomerFlow[]>([]);
  const [coverPages, setCoverPages] = useState<CoverPage[]>([]);
  const [deliveryApps, setDeliveryApps] = useState<DeliveryApp[]>([]);
  const [postCheckoutPages, setPostCheckoutPages] = useState<PostCheckoutPage[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [assignments, setAssignments] = useState<FlowAssignment[]>([]);
  
  const [selectedFlow, setSelectedFlow] = useState<CustomerFlow | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state for flows
  const [flowForm, setFlowForm] = useState({
    name: '',
    slug: '',
    cover_page_id: '',
    delivery_app_id: '',
    post_checkout_id: '',
    is_active: true,
    is_default: false
  });

  // Form state for assignments
  const [assignmentForm, setAssignmentForm] = useState({
    customer_flow_id: '',
    affiliate_id: '',
    share_slug: '',
    free_shipping: false,
    discount_type: '',
    discount_percentage: null as number | null,
    discount_dollar_amount: null as number | null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadFlows(),
        loadCoverPages(),
        loadDeliveryApps(),
        loadPostCheckoutPages(),
        loadAffiliates(),
        loadAssignments()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadFlows = async () => {
    const { data, error } = await supabase
      .from('customer_flows')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setFlows(data || []);
  };

  const loadCoverPages = async () => {
    const { data, error } = await supabase
      .from('cover_pages')
      .select('id, title, slug')
      .eq('is_active', true)
      .order('title');
    
    if (error) throw error;
    setCoverPages(data || []);
  };

  const loadDeliveryApps = async () => {
    const { data, error } = await supabase
      .from('delivery_app_variations')
      .select('id, app_name, app_slug')
      .eq('is_active', true)
      .order('app_name');
    
    if (error) throw error;
    setDeliveryApps(data || []);
  };

  const loadPostCheckoutPages = async () => {
    const { data, error } = await supabase
      .from('post_checkout_pages')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    setPostCheckoutPages(data || []);
  };

  const loadAffiliates = async () => {
    const { data, error } = await supabase
      .from('affiliates')
      .select('id, name, company_name, email, affiliate_code')
      .eq('status', 'active')
      .order('company_name');
    
    if (error) throw error;
    setAffiliates(data || []);
  };

  const loadAssignments = async () => {
    const { data, error } = await supabase
      .from('affiliate_flow_assignments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setAssignments(data || []);
  };

  const handleSaveFlow = async () => {
    if (!flowForm.name || !flowForm.slug) {
      toast.error('Name and slug are required');
      return;
    }

    try {
      setSaving(true);
      
      if (selectedFlow) {
        // Update existing flow
        const { error } = await supabase
          .from('customer_flows')
          .update({
            name: flowForm.name,
            cover_page_id: flowForm.cover_page_id || null,
            delivery_app_id: flowForm.delivery_app_id || null,
            post_checkout_id: flowForm.post_checkout_id || null,
            is_active: flowForm.is_active,
            is_default: flowForm.is_default
          })
          .eq('id', selectedFlow.id);
        
        if (error) throw error;
        toast.success('Customer flow updated successfully');
      } else {
        // Create new flow
        const { error } = await supabase
          .from('customer_flows')
          .insert({
            name: flowForm.name,
            slug: flowForm.slug,
            cover_page_id: flowForm.cover_page_id || null,
            delivery_app_id: flowForm.delivery_app_id || null,
            post_checkout_id: flowForm.post_checkout_id || null,
            is_active: flowForm.is_active,
            is_default: flowForm.is_default
          });
        
        if (error) throw error;
        toast.success('Customer flow created successfully');
      }
      
      loadFlows();
      resetFlowForm();
    } catch (error) {
      console.error('Error saving flow:', error);
      toast.error('Failed to save customer flow');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAssignment = async () => {
    if (!assignmentForm.customer_flow_id || !assignmentForm.affiliate_id || !assignmentForm.share_slug) {
      toast.error('All fields are required');
      return;
    }

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('affiliate_flow_assignments')
        .insert({
          customer_flow_id: assignmentForm.customer_flow_id,
          affiliate_id: assignmentForm.affiliate_id,
          share_slug: assignmentForm.share_slug,
          free_shipping: assignmentForm.free_shipping,
          discount_type: assignmentForm.discount_type || null,
          discount_percentage: assignmentForm.discount_percentage,
          discount_dollar_amount: assignmentForm.discount_dollar_amount
        });
      
      if (error) throw error;
      toast.success('Affiliate assigned to flow successfully');
      
      loadAssignments();
      resetAssignmentForm();
    } catch (error) {
      console.error('Error saving assignment:', error);
      toast.error('Failed to assign affiliate to flow');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFlow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer flow?')) return;

    try {
      const { error } = await supabase
        .from('customer_flows')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Customer flow deleted successfully');
      loadFlows();
      
      if (selectedFlow?.id === id) {
        resetFlowForm();
      }
    } catch (error) {
      console.error('Error deleting flow:', error);
      toast.error('Failed to delete customer flow');
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return;

    try {
      const { error } = await supabase
        .from('affiliate_flow_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Assignment removed successfully');
      loadAssignments();
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast.error('Failed to remove assignment');
    }
  };

  const selectFlow = (flow: CustomerFlow) => {
    setSelectedFlow(flow);
    setFlowForm({
      name: flow.name,
      slug: flow.slug,
      cover_page_id: flow.cover_page_id || '',
      delivery_app_id: flow.delivery_app_id || '',
      post_checkout_id: flow.post_checkout_id || '',
      is_active: flow.is_active,
      is_default: flow.is_default
    });
  };

  const resetFlowForm = () => {
    setSelectedFlow(null);
    setFlowForm({
      name: '',
      slug: '',
      cover_page_id: '',
      delivery_app_id: '',
      post_checkout_id: '',
      is_active: true,
      is_default: false
    });
  };

  const resetAssignmentForm = () => {
    setAssignmentForm({
      customer_flow_id: '',
      affiliate_id: '',
      share_slug: '',
      free_shipping: false,
      discount_type: '',
      discount_percentage: null,
      discount_dollar_amount: null
    });
  };

  const copyFlowURL = (shareSlug: string) => {
    const url = `${CANONICAL_DOMAIN}/flow/${shareSlug}`;
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  };

  const getFlowName = (flowId: string) => {
    const flow = flows.find(f => f.id === flowId);
    return flow?.name || 'Unknown Flow';
  };

  const getAffiliateName = (affiliateId: string) => {
    const affiliate = affiliates.find(a => a.id === affiliateId);
    return affiliate ? `${affiliate.company_name} (${affiliate.name})` : 'Unknown Affiliate';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="flows" className="space-y-6">
        <TabsList>
          <TabsTrigger value="flows">Customer Flows</TabsTrigger>
          <TabsTrigger value="assignments">Affiliate Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="flows" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Flows List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Customer Flows
                  <Button onClick={resetFlowForm} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Flow
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {flows.map((flow) => (
                    <div
                      key={flow.id}
                      className={`p-3 border rounded cursor-pointer hover:bg-accent ${
                        selectedFlow?.id === flow.id ? 'border-primary bg-accent' : ''
                      }`}
                      onClick={() => selectFlow(flow)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{flow.name}</h4>
                          <p className="text-sm text-muted-foreground">{flow.slug}</p>
                          {flow.is_default && (
                            <Badge variant="secondary" className="mt-1">Default</Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFlow(flow.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Flow Editor */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {selectedFlow ? 'Edit Customer Flow' : 'Create Customer Flow'}
                  <Button onClick={handleSaveFlow} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="flowName">Flow Name</Label>
                    <Input
                      id="flowName"
                      value={flowForm.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setFlowForm({ 
                          ...flowForm, 
                          name,
                          slug: selectedFlow ? flowForm.slug : generateSlug(name)
                        });
                      }}
                      placeholder="Party Planning Flow"
                    />
                  </div>
                  <div>
                    <Label htmlFor="flowSlug">Flow Slug</Label>
                    <Input
                      id="flowSlug"
                      value={flowForm.slug}
                      onChange={(e) => setFlowForm({ ...flowForm, slug: e.target.value })}
                      placeholder="party-planning-flow"
                      disabled={!!selectedFlow}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="coverPage">Cover Page</Label>
                  <Select value={flowForm.cover_page_id} onValueChange={(value) => setFlowForm({ ...flowForm, cover_page_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a cover page" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {coverPages.map((page) => (
                        <SelectItem key={page.id} value={page.id}>
                          {page.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="deliveryApp">Delivery App</Label>
                  <Select value={flowForm.delivery_app_id} onValueChange={(value) => setFlowForm({ ...flowForm, delivery_app_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a delivery app" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {deliveryApps.map((app) => (
                        <SelectItem key={app.id} value={app.id}>
                          {app.app_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="postCheckout">Post-Checkout Page</Label>
                  <Select value={flowForm.post_checkout_id} onValueChange={(value) => setFlowForm({ ...flowForm, post_checkout_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a post-checkout page" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {postCheckoutPages.map((page) => (
                        <SelectItem key={page.id} value={page.id}>
                          {page.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={flowForm.is_active}
                      onCheckedChange={(checked) => setFlowForm({ ...flowForm, is_active: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={flowForm.is_default}
                      onCheckedChange={(checked) => setFlowForm({ ...flowForm, is_default: checked })}
                    />
                    <Label>Default Flow</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assignment Form */}
            <Card>
              <CardHeader>
                <CardTitle>Assign Affiliate to Flow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="assignFlow">Customer Flow</Label>
                  <Select value={assignmentForm.customer_flow_id} onValueChange={(value) => setAssignmentForm({ ...assignmentForm, customer_flow_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer flow" />
                    </SelectTrigger>
                    <SelectContent>
                      {flows.filter(f => f.is_active).map((flow) => (
                        <SelectItem key={flow.id} value={flow.id}>
                          {flow.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assignAffiliate">Affiliate</Label>
                  <Select value={assignmentForm.affiliate_id} onValueChange={(value) => setAssignmentForm({ ...assignmentForm, affiliate_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an affiliate" />
                    </SelectTrigger>
                    <SelectContent>
                      {affiliates.map((affiliate) => (
                        <SelectItem key={affiliate.id} value={affiliate.id}>
                          {affiliate.company_name} ({affiliate.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="shareSlug">Custom URL Slug</Label>
                  <Input
                    id="shareSlug"
                    value={assignmentForm.share_slug}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, share_slug: e.target.value })}
                    placeholder="john-party-planner"
                  />
                  {assignmentForm.share_slug && (
                    <p className="text-sm text-muted-foreground mt-1">
                      URL: {CANONICAL_DOMAIN}/flow/{assignmentForm.share_slug}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={assignmentForm.free_shipping}
                    onCheckedChange={(checked) => setAssignmentForm({ ...assignmentForm, free_shipping: checked })}
                  />
                  <Label>Free Shipping</Label>
                </div>

                <div>
                  <Label htmlFor="discountType">Discount Type</Label>
                  <Select value={assignmentForm.discount_type} onValueChange={(value) => setAssignmentForm({ ...assignmentForm, discount_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select discount type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="dollar">Dollar Amount</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(assignmentForm.discount_type === 'percentage' || assignmentForm.discount_type === 'both') && (
                  <div>
                    <Label htmlFor="discountPercentage">Discount Percentage</Label>
                    <Input
                      id="discountPercentage"
                      type="number"
                      value={assignmentForm.discount_percentage || ''}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, discount_percentage: e.target.value ? parseFloat(e.target.value) : null })}
                      placeholder="10"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>
                )}

                {(assignmentForm.discount_type === 'dollar' || assignmentForm.discount_type === 'both') && (
                  <div>
                    <Label htmlFor="discountDollar">Discount Dollar Amount</Label>
                    <Input
                      id="discountDollar"
                      type="number"
                      value={assignmentForm.discount_dollar_amount || ''}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, discount_dollar_amount: e.target.value ? parseFloat(e.target.value) : null })}
                      placeholder="5.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}

                <Button onClick={handleSaveAssignment} disabled={saving} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Create Assignment'}
                </Button>
              </CardContent>
            </Card>

            {/* Assignments List */}
            <Card>
              <CardHeader>
                <CardTitle>Current Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{getFlowName(assignment.customer_flow_id)}</h4>
                          <p className="text-sm text-muted-foreground">{getAffiliateName(assignment.affiliate_id)}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyFlowURL(assignment.share_slug)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(`${CANONICAL_DOMAIN}/flow/${assignment.share_slug}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteAssignment(assignment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm">
                        <p><strong>URL:</strong> /flow/{assignment.share_slug}</p>
                        {assignment.free_shipping && <Badge variant="secondary" className="mr-1">Free Shipping</Badge>}
                        {assignment.discount_percentage && <Badge variant="secondary" className="mr-1">{assignment.discount_percentage}% off</Badge>}
                        {assignment.discount_dollar_amount && <Badge variant="secondary">${assignment.discount_dollar_amount} off</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};