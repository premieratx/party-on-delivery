import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, ExternalLink, Save, Settings, Link, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CustomerFlow {
  id?: string;
  name: string;
  description: string;
  slug: string;
  cover_page_id: string;
  post_checkout_page_id: string;
  affiliate_slug?: string;
  affiliate_id?: string;
  button_configs: Array<{
    button_index: number;
    target_url: string;
    target_type: 'delivery_app' | 'collection' | 'external_url';
    delivery_app_slug?: string;
    collection_slug?: string;
    pass_affiliate: boolean;
  }>;
  is_active: boolean;
  analytics_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

interface CoverPage {
  id: string;
  title: string;
  slug: string;
  buttons: any[];
}

interface PostCheckoutPage {
  id: string;
  name: string;
  slug: string;
}

interface Affiliate {
  id: string;
  name: string;
  affiliate_code: string;
  custom_handle?: string;
}

interface DeliveryApp {
  id: string;
  app_name: string;
  app_slug: string;
}

export default function CustomerFlowConfigurator() {
  const [flows, setFlows] = useState<CustomerFlow[]>([]);
  const [coverPages, setCoverPages] = useState<CoverPage[]>([]);
  const [postCheckoutPages, setPostCheckoutPages] = useState<PostCheckoutPage[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [deliveryApps, setDeliveryApps] = useState<DeliveryApp[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<CustomerFlow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CustomerFlow>({
    name: '',
    description: '',
    slug: '',
    cover_page_id: '',
    post_checkout_page_id: '',
    affiliate_slug: '',
    affiliate_id: '',
    button_configs: [],
    is_active: true,
    analytics_enabled: true
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [flowsRes, coverRes, postCheckoutRes, affiliatesRes, appsRes] = await Promise.all([
        supabase.from('customer_flows').select('*').order('created_at', { ascending: false }),
        supabase.from('cover_pages').select('id, title, slug, buttons').eq('is_active', true),
        supabase.from('post_checkout_pages').select('id, name, slug').eq('is_active', true),
        supabase.from('affiliates').select('id, name, affiliate_code, custom_handle').eq('status', 'active'),
        supabase.from('delivery_app_variations').select('id, app_name, app_slug').eq('is_active', true)
      ]);

      // Transform data to match our interfaces
      if (flowsRes.data) {
        const transformedFlows = flowsRes.data.map((flow: any) => ({
          id: flow.id,
          name: flow.name,
          description: flow.description || '',
          slug: flow.slug,
          cover_page_id: flow.cover_page_id || '',
          post_checkout_page_id: flow.post_checkout_id || '',
          affiliate_slug: flow.affiliate_slug || '',
          affiliate_id: flow.affiliate_id || '',
          button_configs: typeof flow.button_configs === 'string' ? 
            JSON.parse(flow.button_configs || '[]') : flow.button_configs || [],
          is_active: flow.is_active,
          analytics_enabled: flow.analytics_enabled || true,
          created_at: flow.created_at,
          updated_at: flow.updated_at
        }));
        setFlows(transformedFlows);
      }

      if (coverRes.data) {
        const transformedCovers = coverRes.data.map((page: any) => ({
          id: page.id,
          title: page.title,
          slug: page.slug,
          buttons: typeof page.buttons === 'string' ? JSON.parse(page.buttons || '[]') : page.buttons || []
        }));
        setCoverPages(transformedCovers);
      }

      if (postCheckoutRes.data) setPostCheckoutPages(postCheckoutRes.data);
      if (affiliatesRes.data) setAffiliates(affiliatesRes.data);
      if (appsRes.data) setDeliveryApps(appsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load configuration data');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleCoverPageSelect = (coverPageId: string) => {
    const coverPage = coverPages.find(cp => cp.id === coverPageId);
    if (coverPage) {
      // Initialize button configs based on cover page buttons
      const buttonConfigs = coverPage.buttons.map((_, index) => ({
        button_index: index,
        target_url: '',
        target_type: 'delivery_app' as const,
        delivery_app_slug: '',
        collection_slug: '',
        pass_affiliate: true
      }));

      setFormData(prev => ({
        ...prev,
        cover_page_id: coverPageId,
        button_configs: buttonConfigs
      }));
    }
  };

  const updateButtonConfig = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      button_configs: prev.button_configs.map((config, i) =>
        i === index ? { ...config, [field]: value } : config
      )
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Flow name is required');
      return;
    }

    if (!formData.cover_page_id) {
      toast.error('Please select a cover page');
      return;
    }

    if (!formData.post_checkout_page_id) {
      toast.error('Please select a post-checkout page');
      return;
    }

    try {
      const flowData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.name),
      };

      let result;
      if (isEditing && selectedFlow?.id) {
        result = await supabase
          .from('customer_flows')
          .update(flowData)
          .eq('id', selectedFlow.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('customer_flows')
          .insert([flowData])
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast.success(isEditing ? 'Customer flow updated!' : 'Customer flow created!');
      await loadAllData();
      handleReset();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving customer flow:', error);
      toast.error('Failed to save customer flow');
    }
  };

  const handleEdit = (flow: CustomerFlow) => {
    setSelectedFlow(flow);
    setFormData(flow);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer flow?')) return;

    try {
      const { error } = await supabase
        .from('customer_flows')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setFlows(prev => prev.filter(flow => flow.id !== id));
      toast.success('Customer flow deleted');
    } catch (error: any) {
      console.error('Error deleting customer flow:', error);
      toast.error('Failed to delete customer flow');
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      slug: '',
      cover_page_id: '',
      post_checkout_page_id: '',
      affiliate_slug: '',
      affiliate_id: '',
      button_configs: [],
      is_active: true,
      analytics_enabled: true
    });
    setSelectedFlow(null);
    setIsEditing(false);
  };

  const getFlowUrl = (flow: CustomerFlow) => {
    const coverPage = coverPages.find(cp => cp.id === flow.cover_page_id);
    if (flow.affiliate_slug && coverPage) {
      return `/${flow.affiliate_slug}/${coverPage.slug}`;
    } else if (coverPage) {
      return `/cover/${coverPage.slug}`;
    }
    return '#';
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Customer Flow Configurator</h2>
          <p className="text-muted-foreground">Create complete customer journeys from cover page to post-checkout</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleReset}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Flow
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {isEditing ? 'Edit Customer Flow' : 'Create New Customer Flow'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Flow Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Flow Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Premium Delivery Experience"
                      />
                    </div>
                    <div>
                      <Label htmlFor="slug">Custom Slug (optional)</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="Auto-generated from name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Complete customer journey for premium alcohol delivery..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Page Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Page Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Cover Page *</Label>
                      <Select
                        value={formData.cover_page_id}
                        onValueChange={handleCoverPageSelect}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select cover page" />
                        </SelectTrigger>
                        <SelectContent>
                          {coverPages.map((page) => (
                            <SelectItem key={page.id} value={page.id}>
                              {page.title} (/{page.slug})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Post-Checkout Page *</Label>
                      <Select
                        value={formData.post_checkout_page_id}
                        onValueChange={(value) => setFormData({ ...formData, post_checkout_page_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select post-checkout page" />
                        </SelectTrigger>
                        <SelectContent>
                          {postCheckoutPages.map((page) => (
                            <SelectItem key={page.id} value={page.id}>
                              {page.name} (/{page.slug})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Affiliate Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Affiliate Tracking</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Affiliate</Label>
                      <Select
                        value={formData.affiliate_id}
                        onValueChange={(value) => {
                          const affiliate = affiliates.find(a => a.id === value);
                          setFormData({ 
                            ...formData, 
                            affiliate_id: value,
                            affiliate_slug: affiliate?.custom_handle || affiliate?.affiliate_code || ''
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select affiliate (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No Affiliate</SelectItem>
                          {affiliates.map((affiliate) => (
                            <SelectItem key={affiliate.id} value={affiliate.id}>
                              {affiliate.name} ({affiliate.affiliate_code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Custom Affiliate Slug</Label>
                      <Input
                        value={formData.affiliate_slug}
                        onChange={(e) => setFormData({ ...formData, affiliate_slug: e.target.value })}
                        placeholder="custom-partner-slug"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Button Configuration */}
              {formData.cover_page_id && (
                <Card>
                  <CardHeader>
                    <CardTitle>Button Link Configuration</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Configure where each button on your cover page should lead
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.button_configs.map((config, index) => {
                      const coverPage = coverPages.find(cp => cp.id === formData.cover_page_id);
                      const button = coverPage?.buttons[index];
                      
                      return (
                        <Card key={index} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="font-medium">
                                Button {index + 1}: "{button?.text || 'Button'}"
                              </Label>
                              <Badge variant={config.pass_affiliate ? 'default' : 'secondary'}>
                                {config.pass_affiliate ? 'Affiliate Tracking ON' : 'No Tracking'}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <Label className="text-xs">Target Type</Label>
                                <Select
                                  value={config.target_type}
                                  onValueChange={(value) => updateButtonConfig(index, 'target_type', value)}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="delivery_app">Delivery App</SelectItem>
                                    <SelectItem value="collection">Collection</SelectItem>
                                    <SelectItem value="external_url">External URL</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              {config.target_type === 'delivery_app' && (
                                <div>
                                  <Label className="text-xs">Delivery App</Label>
                                  <Select
                                    value={config.delivery_app_slug}
                                    onValueChange={(value) => updateButtonConfig(index, 'delivery_app_slug', value)}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue placeholder="Select app" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {deliveryApps.map((app) => (
                                        <SelectItem key={app.id} value={app.app_slug}>
                                          {app.app_name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                              
                              {config.target_type === 'external_url' && (
                                <div>
                                  <Label className="text-xs">Target URL</Label>
                                  <Input
                                    className="h-8"
                                    value={config.target_url}
                                    onChange={(e) => updateButtonConfig(index, 'target_url', e.target.value)}
                                    placeholder="https://example.com"
                                  />
                                </div>
                              )}
                              
                              {config.target_type === 'collection' && (
                                <div>
                                  <Label className="text-xs">Collection Slug</Label>
                                  <Input
                                    className="h-8"
                                    value={config.collection_slug}
                                    onChange={(e) => updateButtonConfig(index, 'collection_slug', e.target.value)}
                                    placeholder="premium-spirits"
                                  />
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`affiliate-${index}`}
                                  checked={config.pass_affiliate}
                                  onChange={(e) => updateButtonConfig(index, 'pass_affiliate', e.target.checked)}
                                  className="rounded border-gray-300"
                                />
                                <Label htmlFor={`affiliate-${index}`} className="text-xs">
                                  Pass Affiliate
                                </Label>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update Flow' : 'Create Flow'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Flows List */}
      <div className="grid gap-4">
        {flows.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No customer flows created yet.</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                Create Your First Flow
              </Button>
            </CardContent>
          </Card>
        ) : (
          flows.map((flow) => {
            const coverPage = coverPages.find(cp => cp.id === flow.cover_page_id);
            const postCheckoutPage = postCheckoutPages.find(pcp => pcp.id === flow.post_checkout_page_id);
            const affiliate = affiliates.find(a => a.id === flow.affiliate_id);
            
            return (
              <Card key={flow.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle>{flow.name}</CardTitle>
                        {flow.affiliate_slug && (
                          <Badge variant="secondary">
                            <Users className="w-3 h-3 mr-1" />
                            {affiliate?.name || flow.affiliate_slug}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{flow.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Cover: {coverPage?.title}</span>
                        <span>•</span>
                        <span>Post-Checkout: {postCheckoutPage?.name}</span>
                        <span>•</span>
                        <span>{flow.button_configs?.length || 0} button(s) configured</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={flow.is_active ? 'default' : 'secondary'}>
                        {flow.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(getFlowUrl(flow), '_blank')}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View Live
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(flow)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(flow.id!)}>
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(window.location.origin + getFlowUrl(flow))}
                    >
                      <Link className="h-3 w-3 mr-1" />
                      Copy URL
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}