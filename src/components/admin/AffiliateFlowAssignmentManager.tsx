import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, ExternalLink, Eye, Users, Workflow, Percent, DollarSign } from 'lucide-react';

interface CustomerFlow {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  cover_pages?: { title: string; slug: string } | null;
  delivery_app_variations?: { app_name: string; app_slug: string } | null;
}

interface Affiliate {
  id: string;
  name: string;
  company_name: string;
  affiliate_code: string;
  email: string;
}

interface FlowAssignment {
  id: string;
  share_slug: string;
  is_active: boolean;
  created_at: string;
  affiliate_id: string;
  customer_flow_id: string;
  free_shipping: boolean;
  discount_type: 'percentage' | 'dollar' | 'both' | null;
  discount_percentage: number | null;
  discount_dollar_amount: number | null;
  affiliates: Affiliate | null;
  customer_flows: Pick<CustomerFlow, 'id' | 'name' | 'slug' | 'is_active'> | null;
}

export const AffiliateFlowAssignmentManager: React.FC = () => {
  const [customerFlows, setCustomerFlows] = useState<CustomerFlow[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [assignments, setAssignments] = useState<FlowAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [selectedFlow, setSelectedFlow] = useState('');
  const [selectedAffiliate, setSelectedAffiliate] = useState('');
  const [shareSlug, setShareSlug] = useState('');
  const [freeShipping, setFreeShipping] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'dollar' | 'both' | ''>('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [discountDollarAmount, setDiscountDollarAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load customer flows without relations first to avoid foreign key issues
      const { data: flows, error: flowsError } = await supabase
        .from('customer_flows')
        .select('id, name, slug, is_active, cover_page_id, delivery_app_id')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (flowsError) throw flowsError;

      // For each flow, get the related cover page and delivery app data
      const flowsWithDetails: CustomerFlow[] = [];
      for (const flow of flows || []) {
        const flowDetail: CustomerFlow = {
          id: flow.id,
          name: flow.name,
          slug: flow.slug,
          is_active: flow.is_active,
          cover_pages: null,
          delivery_app_variations: null
        };

        if (flow.cover_page_id) {
          const { data: coverPage } = await supabase
            .from('cover_pages')
            .select('title, slug')
            .eq('id', flow.cover_page_id)
            .single();
          flowDetail.cover_pages = coverPage;
        }

        if (flow.delivery_app_id) {
          const { data: deliveryApp } = await supabase
            .from('delivery_app_variations')
            .select('app_name, app_slug')
            .eq('id', flow.delivery_app_id)
            .single();
          flowDetail.delivery_app_variations = deliveryApp;
        }

        flowsWithDetails.push(flowDetail);
      }
      
      // Load existing assignments without complex relations
      const { data: assignmentData, error: assignmentsError } = await supabase
        .from('affiliate_flow_assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (assignmentsError) {
        console.error('❌ Error loading assignments:', assignmentsError);
        // Don't throw error, just set empty assignments
        setAssignments([]);
        return;
      }

      // Skip affiliate loading to avoid 403 errors
      setAffiliates([]);

      // For each assignment, get the related affiliate and flow data
      const assignmentsWithDetails: FlowAssignment[] = [];
      for (const assignment of assignmentData || []) {
        const assignmentDetail: FlowAssignment = {
          ...assignment,
          discount_type: assignment.discount_type as 'percentage' | 'dollar' | 'both' | null,
          affiliates: null,
          customer_flows: null
        };

        // Get affiliate data
        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('id, name, company_name, affiliate_code, email')
          .eq('id', assignment.affiliate_id)
          .single();
        assignmentDetail.affiliates = affiliate;

        // Get flow data
        const { data: flow } = await supabase
          .from('customer_flows')
          .select('id, name, slug, is_active')
          .eq('id', assignment.customer_flow_id)
          .single();
        assignmentDetail.customer_flows = flow;

        assignmentsWithDetails.push(assignmentDetail);
      }
      
      setCustomerFlows(flowsWithDetails);
      setAssignments(assignmentsWithDetails);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Error loading data', description: 'Please try again', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!selectedFlow || !selectedAffiliate || !shareSlug) {
      toast({ title: 'Missing fields', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      
      // Check if share slug already exists
      const { data: existing } = await supabase
        .from('affiliate_flow_assignments')
        .select('id')
        .eq('share_slug', shareSlug)
        .single();
      
      if (existing) {
        toast({ title: 'Share slug already exists', description: 'Please choose a different slug', variant: 'destructive' });
        return;
      }
      
      // Check if affiliate already has this flow assigned
      const { data: existingAssignment } = await supabase
        .from('affiliate_flow_assignments')
        .select('id')
        .eq('affiliate_id', selectedAffiliate)
        .eq('customer_flow_id', selectedFlow)
        .single();
      
      if (existingAssignment) {
        toast({ title: 'Assignment already exists', description: 'This affiliate already has this flow assigned', variant: 'destructive' });
        return;
      }
      
      const { error } = await supabase
        .from('affiliate_flow_assignments')
        .insert({
          customer_flow_id: selectedFlow,
          affiliate_id: selectedAffiliate,
          share_slug: shareSlug,
          free_shipping: freeShipping,
          discount_type: discountType || null,
          discount_percentage: discountPercentage ? parseFloat(discountPercentage) : null,
          discount_dollar_amount: discountDollarAmount ? parseFloat(discountDollarAmount) : null
        });
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Flow assignment created successfully!' });
      
      // Reset form
      setSelectedFlow('');
      setSelectedAffiliate('');
      setShareSlug('');
      setFreeShipping(false);
      setDiscountType('');
      setDiscountPercentage('');
      setDiscountDollarAmount('');
      
      // Reload data
      await loadData();
      
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({ title: 'Error', description: 'Failed to create assignment', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this flow assignment?')) return;

    try {
      const { error } = await supabase
        .from('affiliate_flow_assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Assignment deleted successfully!' });
      await loadData();
      
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast({ title: 'Error', description: 'Failed to delete assignment', variant: 'destructive' });
    }
  };

  const toggleAssignmentStatus = async (assignmentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('affiliate_flow_assignments')
        .update({ is_active: !currentStatus })
        .eq('id', assignmentId);
      
      if (error) throw error;
      
      toast({ title: 'Success', description: `Assignment ${!currentStatus ? 'activated' : 'deactivated'}` });
      await loadData();
      
    } catch (error) {
      console.error('Error updating assignment status:', error);
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="w-5 h-5" />
            Affiliate Flow Assignment Manager
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Assign complete customer flows (cover page → delivery app → post-checkout) to affiliates with custom tracking URLs.
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assign">Create Assignment</TabsTrigger>
          <TabsTrigger value="manage">Manage Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="w-5 h-5" />
                  Active Customer Flows
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customerFlows.length}</div>
                <p className="text-sm text-muted-foreground">Complete customer journeys available</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Active Affiliates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{affiliates.length}</div>
                <p className="text-sm text-muted-foreground">Affiliates ready for assignments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                  Flow Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assignments.filter(a => a.is_active).length}</div>
                <p className="text-sm text-muted-foreground">Active affiliate flow assignments</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assign" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Flow Assignment</CardTitle>
              <p className="text-sm text-muted-foreground">
                Assign a complete customer flow to an affiliate with a custom shareable URL.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerFlow">Customer Flow</Label>
                  <Select value={selectedFlow} onValueChange={setSelectedFlow}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer flow" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerFlows.map((flow) => (
                        <SelectItem key={flow.id} value={flow.id}>
                          {flow.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="affiliate">Affiliate</Label>
                  <Select value={selectedAffiliate} onValueChange={setSelectedAffiliate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select affiliate" />
                    </SelectTrigger>
                    <SelectContent>
                      {affiliates.map((affiliate) => (
                        <SelectItem key={affiliate.id} value={affiliate.id}>
                          {affiliate.company_name} ({affiliate.affiliate_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shareSlug">Share Slug</Label>
                  <Input
                    id="shareSlug"
                    value={shareSlug}
                    onChange={(e) => setShareSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    placeholder="e.g., bachelor-party-flow"
                  />
                  {shareSlug && (
                    <p className="text-xs text-muted-foreground">
                      URL: /{shareSlug}
                    </p>
                  )}
                </div>
              </div>

              {/* Shipping and Discount Options */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-sm">Shipping & Discount Options</h4>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="freeShipping" 
                    checked={freeShipping}
                    onCheckedChange={(checked) => setFreeShipping(checked === true)}
                  />
                  <Label htmlFor="freeShipping" className="text-sm">
                    Enable free shipping for this flow
                  </Label>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Discount Options</Label>
                  <Select value={discountType} onValueChange={(value) => setDiscountType(value as 'percentage' | 'dollar' | 'both' | '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select discount type (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No discount</SelectItem>
                      <SelectItem value="percentage">Percentage discount</SelectItem>
                      <SelectItem value="dollar">Dollar amount discount</SelectItem>
                      <SelectItem value="both">Both percentage and dollar discount</SelectItem>
                    </SelectContent>
                  </Select>

                  {(discountType === 'percentage' || discountType === 'both') && (
                    <div className="space-y-2">
                      <Label htmlFor="discountPercentage" className="text-sm flex items-center gap-1">
                        <Percent className="w-3 h-3" />
                        Percentage Discount
                      </Label>
                      <Input
                        id="discountPercentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={discountPercentage}
                        onChange={(e) => setDiscountPercentage(e.target.value)}
                        placeholder="e.g., 15.00"
                      />
                    </div>
                  )}

                  {(discountType === 'dollar' || discountType === 'both') && (
                    <div className="space-y-2">
                      <Label htmlFor="discountDollarAmount" className="text-sm flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Dollar Amount Discount
                      </Label>
                      <Input
                        id="discountDollarAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={discountDollarAmount}
                        onChange={(e) => setDiscountDollarAmount(e.target.value)}
                        placeholder="e.g., 25.00"
                      />
                    </div>
                  )}
                </div>
              </div>

              <Button 
                onClick={handleCreateAssignment}
                disabled={saving || !selectedFlow || !selectedAffiliate || !shareSlug}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                {saving ? 'Creating...' : 'Create Flow Assignment'}
              </Button>
            </CardContent>
          </Card>

          {selectedFlow && (
            <Card>
              <CardHeader>
                <CardTitle>Preview Selected Customer Flow</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const flow = customerFlows.find(f => f.id === selectedFlow);
                  if (!flow) return null;
                  
                  return (
                    <div className="space-y-4">
                      <h3 className="font-semibold">{flow.name}</h3>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 p-3 border rounded-lg bg-primary/5">
                          <div className="font-medium text-sm">Cover Page</div>
                          <div className="text-xs text-muted-foreground">
                            {flow.cover_pages?.title || 'No cover page'} 
                            {flow.cover_pages?.slug && `(/${flow.cover_pages.slug})`}
                          </div>
                        </div>
                        <div className="text-muted-foreground">→</div>
                        <div className="flex-1 p-3 border rounded-lg bg-primary/5">
                          <div className="font-medium text-sm">Delivery App</div>
                          <div className="text-xs text-muted-foreground">
                            {flow.delivery_app_variations?.app_name || 'No delivery app'}
                            {flow.delivery_app_variations?.app_slug && `(/app/${flow.delivery_app_variations.app_slug})`}
                          </div>
                        </div>
                        <div className="text-muted-foreground">→</div>
                        <div className="flex-1 p-3 border rounded-lg bg-muted">
                          <div className="font-medium text-sm">Post-Checkout</div>
                          <div className="text-xs text-muted-foreground">Default completion page</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Flow Assignments ({assignments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-8">
                  <Workflow className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No flow assignments created yet.</p>
                  <Button variant="outline" onClick={() => {
                    const tabsList = document.querySelector('[role="tablist"]');
                    const assignTab = tabsList?.querySelector('[value="assign"]') as HTMLElement;
                    assignTab?.click();
                  }}>
                    Create First Assignment
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <Card key={assignment.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={assignment.is_active ? "default" : "secondary"}>
                                {assignment.is_active ? "Active" : "Inactive"}
                              </Badge>
                              <span className="font-medium">
                                {assignment.customer_flows?.name || 'Unknown Flow'}
                              </span>
                            </div>
                            
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div><strong>Affiliate:</strong> {assignment.affiliates?.company_name} ({assignment.affiliates?.affiliate_code})</div>
                              <div><strong>Share URL:</strong> /{assignment.share_slug}</div>
                              <div><strong>Created:</strong> {new Date(assignment.created_at).toLocaleDateString()}</div>
                              
                              {/* Display shipping and discount info */}
                              <div className="flex flex-wrap gap-2 mt-2">
                                {assignment.free_shipping && (
                                  <Badge variant="outline" className="text-xs">
                                    Free Shipping
                                  </Badge>
                                )}
                                {assignment.discount_type === 'percentage' && assignment.discount_percentage && (
                                  <Badge variant="outline" className="text-xs">
                                    {assignment.discount_percentage}% Off
                                  </Badge>
                                )}
                                {assignment.discount_type === 'dollar' && assignment.discount_dollar_amount && (
                                  <Badge variant="outline" className="text-xs">
                                    ${assignment.discount_dollar_amount} Off
                                  </Badge>
                                )}
                                {assignment.discount_type === 'both' && (
                                  <div className="flex gap-1">
                                    {assignment.discount_percentage && (
                                      <Badge variant="outline" className="text-xs">
                                        {assignment.discount_percentage}% Off
                                      </Badge>
                                    )}
                                    {assignment.discount_dollar_amount && (
                                      <Badge variant="outline" className="text-xs">
                                        ${assignment.discount_dollar_amount} Off
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/${assignment.share_slug}`, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleAssignmentStatus(assignment.id, assignment.is_active)}
                            >
                              {assignment.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                            
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteAssignment(assignment.id)}
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};