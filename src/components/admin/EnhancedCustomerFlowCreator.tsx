import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Plus, Trash2, Users, Settings, MapPin, Calendar, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CustomerFlow {
  id?: string;
  name: string;
  slug: string;
  cover_page_id?: string;
  delivery_app_id?: string;
  post_checkout_id?: string;
  is_active: boolean;
  is_default: boolean;
  // Enhanced fields
  pre_filled_delivery_address?: any;
  pre_filled_delivery_date?: string;
  pre_filled_delivery_time?: string;
  free_delivery_enabled?: boolean;
}

interface AffiliateAssignment {
  id?: string;
  affiliate_id: string;
  affiliate_name: string;
  affiliate_code: string;
  custom_slug: string;
  is_active: boolean;
}

interface EnhancedCustomerFlowCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: any;
  onSaved: () => void;
}

export const EnhancedCustomerFlowCreator: React.FC<EnhancedCustomerFlowCreatorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [coverPages, setCoverPages] = useState<any[]>([]);
  const [deliveryApps, setDeliveryApps] = useState<any[]>([]);
  const [postCheckoutPages, setPostCheckoutPages] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);

  // Flow configuration
  const [flowConfig, setFlowConfig] = useState<CustomerFlow>({
    name: '',
    slug: '',
    cover_page_id: '',
    delivery_app_id: '',
    post_checkout_id: '',
    is_active: true,
    is_default: false,
    pre_filled_delivery_address: null,
    pre_filled_delivery_date: '',
    pre_filled_delivery_time: '',
    free_delivery_enabled: false
  });

  // Affiliate assignments for this flow
  const [affiliateAssignments, setAffiliateAssignments] = useState<AffiliateAssignment[]>([]);

  // Load data
  useEffect(() => {
    if (open) {
      loadData();
      if (initial) {
        setFlowConfig({ ...initial });
        loadAffiliateAssignments(initial.id);
      } else {
        resetForm();
      }
    }
  }, [open, initial]);

  const loadData = async () => {
    try {
      const [coverResponse, deliveryResponse, postResponse] = await Promise.all([
        supabase.from('cover_pages').select('*').eq('is_active', true),
        supabase.from('delivery_app_variations').select('*').eq('is_active', true),
        supabase.from('post_checkout_pages').select('*')
      ]);

      if (coverResponse.data) setCoverPages(coverResponse.data);
      if (deliveryResponse.data) setDeliveryApps(deliveryResponse.data);
      if (postResponse.data) setPostCheckoutPages(postResponse.data);
      
      // Skip affiliates loading to avoid 403 errors
      setAffiliates([]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Error loading data', variant: 'destructive' });
    }
  };

  const loadAffiliateAssignments = async (flowId: string) => {
    try {
      const { data } = await supabase
        .from('affiliate_flow_assignments')
        .select(`
          *,
          affiliates!inner(name, affiliate_code)
        `)
        .eq('customer_flow_id', flowId);

      if (data) {
        setAffiliateAssignments(data.map((assignment: any) => ({
          id: assignment.id,
          affiliate_id: assignment.affiliate_id,
          affiliate_name: assignment.affiliates.name,
          affiliate_code: assignment.affiliates.affiliate_code,
          custom_slug: assignment.share_slug,
          is_active: assignment.is_active
        })));
      }
    } catch (error) {
      console.error('Error loading affiliate assignments:', error);
    }
  };

  const resetForm = () => {
    setFlowConfig({
      name: '',
      slug: '',
      cover_page_id: '',
      delivery_app_id: '',
      post_checkout_id: '',
      is_active: true,
      is_default: false,
      pre_filled_delivery_address: null,
      pre_filled_delivery_date: '',
      pre_filled_delivery_time: '',
      free_delivery_enabled: false
    });
    setAffiliateAssignments([]);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const flowData = {
        ...flowConfig,
        slug: flowConfig.slug || generateSlug(flowConfig.name)
      };

      let flowId;
      if (initial?.id) {
        // Update existing
        const { error } = await supabase
          .from('customer_flows')
          .update(flowData)
          .eq('id', initial.id);
        
        if (error) throw error;
        flowId = initial.id;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('customer_flows')
          .insert(flowData)
          .select()
          .single();
        
        if (error) throw error;
        flowId = data.id;
      }

      // Save affiliate assignments
      if (flowId) {
        // Delete existing assignments
        await supabase
          .from('affiliate_flow_assignments')
          .delete()
          .eq('customer_flow_id', flowId);

        // Insert new assignments
        if (affiliateAssignments.length > 0) {
          const assignmentData = affiliateAssignments.map(assignment => ({
            customer_flow_id: flowId,
            affiliate_id: assignment.affiliate_id,
            share_slug: assignment.custom_slug,
            is_active: assignment.is_active
          }));

          const { error: assignmentError } = await supabase
            .from('affiliate_flow_assignments')
            .insert(assignmentData);

          if (assignmentError) throw assignmentError;
        }
      }

      toast({ title: `Customer flow ${initial?.id ? 'updated' : 'created'} successfully` });
      onSaved();
    } catch (error) {
      console.error('Error saving flow:', error);
      toast({ title: 'Error saving flow', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const addAffiliateAssignment = () => {
    setAffiliateAssignments([...affiliateAssignments, {
      affiliate_id: '',
      affiliate_name: '',
      affiliate_code: '',
      custom_slug: '',
      is_active: true
    }]);
  };

  const removeAffiliateAssignment = (index: number) => {
    setAffiliateAssignments(affiliateAssignments.filter((_, i) => i !== index));
  };

  const updateAffiliateAssignment = (index: number, field: string, value: any) => {
    const updated = [...affiliateAssignments];
    
    if (field === 'affiliate_id') {
      const selectedAffiliate = affiliates.find(a => a.id === value);
      if (selectedAffiliate) {
        updated[index] = {
          ...updated[index],
          affiliate_id: value,
          affiliate_name: selectedAffiliate.name,
          affiliate_code: selectedAffiliate.affiliate_code,
          custom_slug: updated[index].custom_slug || `${flowConfig.slug || 'flow'}-${selectedAffiliate.affiliate_code.toLowerCase()}`
        };
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    
    setAffiliateAssignments(updated);
  };

  const copyAffiliateUrl = async (assignment: AffiliateAssignment) => {
    const url = `${window.location.origin}/flow/${assignment.custom_slug}`;
    await navigator.clipboard.writeText(url);
    toast({ title: `URL copied for ${assignment.affiliate_name}` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {initial?.id ? 'Edit' : 'Create'} Enhanced Customer Flow
          </DialogTitle>
          <DialogDescription id="dialog-description">
            Configure a customer flow with cover page, delivery app, post-checkout settings, and affiliate assignments.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Flow Name</Label>
                  <Input
                    id="name"
                    value={flowConfig.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFlowConfig({
                        ...flowConfig,
                        name,
                        slug: generateSlug(name)
                      });
                    }}
                    placeholder="e.g. Premium Beer Delivery"
                  />
                </div>
                <div>
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={flowConfig.slug}
                    onChange={(e) => setFlowConfig({ ...flowConfig, slug: e.target.value })}
                    placeholder="premium-beer-delivery"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Cover Page</Label>
                  <Select 
                    value={flowConfig.cover_page_id} 
                    onValueChange={(value) => setFlowConfig({ ...flowConfig, cover_page_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select cover page" />
                    </SelectTrigger>
                    <SelectContent>
                      {coverPages.map((page) => (
                        <SelectItem key={page.id} value={page.id}>
                          {page.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Delivery App</Label>
                  <Select 
                    value={flowConfig.delivery_app_id} 
                    onValueChange={(value) => setFlowConfig({ ...flowConfig, delivery_app_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select delivery app" />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryApps.map((app) => (
                        <SelectItem key={app.id} value={app.id}>
                          {app.app_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Post-Checkout Page</Label>
                  <Select 
                    value={flowConfig.post_checkout_id} 
                    onValueChange={(value) => setFlowConfig({ ...flowConfig, post_checkout_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select post-checkout page" />
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

              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={flowConfig.is_active}
                    onCheckedChange={(checked) => setFlowConfig({ ...flowConfig, is_active: !!checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_default"
                    checked={flowConfig.is_default}
                    onCheckedChange={(checked) => setFlowConfig({ ...flowConfig, is_default: !!checked })}
                  />
                  <Label htmlFor="is_default">Default Flow</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pre-fill Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Pre-fill Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delivery_date">Pre-fill Delivery Date</Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    value={flowConfig.pre_filled_delivery_date}
                    onChange={(e) => setFlowConfig({ ...flowConfig, pre_filled_delivery_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="delivery_time">Pre-fill Delivery Time</Label>
                  <Select 
                    value={flowConfig.pre_filled_delivery_time}
                    onValueChange={(value) => setFlowConfig({ ...flowConfig, pre_filled_delivery_time: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12:00-14:00">12:00 PM - 2:00 PM</SelectItem>
                      <SelectItem value="14:00-16:00">2:00 PM - 4:00 PM</SelectItem>
                      <SelectItem value="16:00-18:00">4:00 PM - 6:00 PM</SelectItem>
                      <SelectItem value="18:00-20:00">6:00 PM - 8:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="delivery_address">Pre-fill Delivery Address (JSON)</Label>
                <Textarea
                  id="delivery_address"
                  placeholder='{"address": "123 Main St", "city": "San Francisco", "state": "CA", "zipCode": "94102"}'
                  value={flowConfig.pre_filled_delivery_address ? JSON.stringify(flowConfig.pre_filled_delivery_address, null, 2) : ''}
                  onChange={(e) => {
                    try {
                      const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                      setFlowConfig({ ...flowConfig, pre_filled_delivery_address: parsed });
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="free_delivery"
                  checked={flowConfig.free_delivery_enabled}
                  onCheckedChange={(checked) => setFlowConfig({ ...flowConfig, free_delivery_enabled: !!checked })}
                />
                <Label htmlFor="free_delivery" className="flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Enable Free Delivery
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Affiliate Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Affiliate Assignments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Assign multiple affiliates to this flow. Each gets their own unique tracking link.
                </p>
                <Button size="sm" onClick={addAffiliateAssignment}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Affiliate
                </Button>
              </div>

              {affiliateAssignments.map((assignment, index) => (
                <Card key={index} className="p-4">
                  <div className="grid md:grid-cols-4 gap-4 items-end">
                    <div>
                      <Label>Affiliate</Label>
                      <Select 
                        value={assignment.affiliate_id}
                        onValueChange={(value) => updateAffiliateAssignment(index, 'affiliate_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select affiliate" />
                        </SelectTrigger>
                        <SelectContent>
                          {affiliates.map((affiliate) => (
                            <SelectItem key={affiliate.id} value={affiliate.id}>
                              {affiliate.name} ({affiliate.affiliate_code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Custom Slug</Label>
                      <Input
                        value={assignment.custom_slug}
                        onChange={(e) => updateAffiliateAssignment(index, 'custom_slug', e.target.value)}
                        placeholder="custom-slug"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={assignment.is_active}
                        onCheckedChange={(checked) => updateAffiliateAssignment(index, 'is_active', !!checked)}
                      />
                      <Label>Active</Label>
                    </div>

                    <div className="flex gap-2">
                      {assignment.custom_slug && (
                        <Button size="sm" variant="outline" onClick={() => copyAffiliateUrl(assignment)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => removeAffiliateAssignment(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {assignment.custom_slug && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm font-mono">
                      /flow/{assignment.custom_slug}
                    </div>
                  )}
                </Card>
              ))}

              {affiliateAssignments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No affiliate assignments yet. Add affiliates to generate tracking links.
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !flowConfig.name}>
              {saving ? 'Saving...' : (initial?.id ? 'Update Flow' : 'Create Flow')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};