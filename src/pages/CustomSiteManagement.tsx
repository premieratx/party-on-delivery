import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Eye, Trash2, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CustomSite {
  id: string;
  site_slug: string;
  site_name: string;
  business_name: string;
  business_address: any;
  custom_promo_code: string | null;
  is_active: boolean;
  site_type: string;
  affiliate_id: string | null;
  created_at: string;
  affiliates?: {
    name: string;
    email: string;
    affiliate_code: string;
  };
}

interface Collection {
  handle: string;
  title: string;
  products_count: number;
}

export default function CustomSiteManagement() {
  const [sites, setSites] = useState<CustomSite[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSite, setEditingSite] = useState<string | null>(null);
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    site_slug: '',
    site_name: '',
    business_name: '',
    business_address: {
      street: '',
      city: '',
      state: '',
      zip_code: '',
      instructions: ''
    },
    custom_promo_code: '',
    site_type: 'custom',
    affiliate_id: '',
    selected_collections: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load sites
      const { data: sitesData, error: sitesError } = await supabase
        .from('custom_affiliate_sites')
        .select(`
          *,
          affiliates:affiliate_id (
            name,
            email,
            affiliate_code
          )
        `)
        .order('created_at', { ascending: false });

      if (sitesError) throw sitesError;
      setSites(sitesData || []);

      // Load collections
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('shopify_collections_cache')
        .select('handle, title, products_count')
        .order('title');

      if (collectionsError) throw collectionsError;
      setCollections(collectionsData || []);

      // Load affiliates
      const { data: affiliatesData, error: affiliatesError } = await supabase
        .from('affiliates')
        .select('id, name, email, affiliate_code')
        .eq('status', 'active')
        .order('name');

      if (affiliatesError) throw affiliatesError;
      setAffiliates(affiliatesData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSite = async () => {
    try {
      const siteData = {
        site_slug: formData.site_slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        site_name: formData.site_name,
        business_name: formData.business_name,
        business_address: formData.business_address,
        custom_promo_code: formData.custom_promo_code || null,
        site_type: formData.site_type,
        affiliate_id: formData.affiliate_id || null,
        is_active: true
      };

      let siteId: string;

      if (editingSite) {
        const { error } = await supabase
          .from('custom_affiliate_sites')
          .update(siteData)
          .eq('id', editingSite);

        if (error) throw error;
        siteId = editingSite;
        toast.success('Site updated successfully');
      } else {
        const { data, error } = await supabase
          .from('custom_affiliate_sites')
          .insert([siteData])
          .select('id')
          .single();

        if (error) throw error;
        siteId = data.id;
        toast.success('Site created successfully');
      }

      // Update collections
      if (formData.selected_collections.length > 0) {
        // Delete existing collections
        await supabase
          .from('site_product_collections')
          .delete()
          .eq('site_id', siteId);

        // Insert new collections
        const collectionsData = formData.selected_collections.map((handle, index) => ({
          site_id: siteId,
          shopify_collection_handle: handle,
          display_order: index,
          is_enabled: true
        }));

        const { error: collectionsError } = await supabase
          .from('site_product_collections')
          .insert(collectionsData);

        if (collectionsError) throw collectionsError;
      }

      setShowCreateForm(false);
      setEditingSite(null);
      resetForm();
      loadData();

    } catch (error) {
      console.error('Error saving site:', error);
      toast.error('Failed to save site');
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    if (!confirm('Are you sure you want to delete this site?')) return;

    try {
      const { error } = await supabase
        .from('custom_affiliate_sites')
        .delete()
        .eq('id', siteId);

      if (error) throw error;
      toast.success('Site deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting site:', error);
      toast.error('Failed to delete site');
    }
  };

  const handleEditSite = async (site: CustomSite) => {
    // Load site collections
    const { data: siteCollections } = await supabase
      .from('site_product_collections')
      .select('shopify_collection_handle')
      .eq('site_id', site.id);

    setFormData({
      site_slug: site.site_slug,
      site_name: site.site_name,
      business_name: site.business_name,
      business_address: site.business_address || {
        street: '',
        city: '',
        state: '',
        zip_code: '',
        instructions: ''
      },
      custom_promo_code: site.custom_promo_code || '',
      site_type: site.site_type,
      affiliate_id: site.affiliate_id || '',
      selected_collections: siteCollections?.map(c => c.shopify_collection_handle) || []
    });

    setEditingSite(site.id);
    setShowCreateForm(true);
  };

  const resetForm = () => {
    setFormData({
      site_slug: '',
      site_name: '',
      business_name: '',
      business_address: {
        street: '',
        city: '',
        state: '',
        zip_code: '',
        instructions: ''
      },
      custom_promo_code: '',
      site_type: 'custom',
      affiliate_id: '',
      selected_collections: []
    });
  };

  const copyCustomUrl = (slug: string) => {
    const url = `${window.location.origin}/sites/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Custom Affiliate Sites</h1>
          <p className="text-muted-foreground">Manage custom branded delivery sites for your affiliates</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New Site
        </Button>
      </div>

      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingSite ? 'Edit Site' : 'Create New Custom Site'}</CardTitle>
            <CardDescription>Configure a custom delivery site for your affiliate partners</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="address">Business Address</TabsTrigger>
                <TabsTrigger value="products">Product Collections</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="site_name">Site Name</Label>
                    <Input
                      id="site_name"
                      value={formData.site_name}
                      onChange={(e) => setFormData({...formData, site_name: e.target.value})}
                      placeholder="Austin Wedding Planner"
                    />
                  </div>
                  <div>
                    <Label htmlFor="site_slug">URL Slug</Label>
                    <Input
                      id="site_slug"
                      value={formData.site_slug}
                      onChange={(e) => setFormData({...formData, site_slug: e.target.value})}
                      placeholder="austin-wedding-planner"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Will be: /sites/{formData.site_slug || 'your-slug'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="business_name">Business Name</Label>
                    <Input
                      id="business_name"
                      value={formData.business_name}
                      onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                      placeholder="Austin Premier Weddings"
                    />
                  </div>
                  <div>
                    <Label htmlFor="site_type">Site Type</Label>
                    <Select value={formData.site_type} onValueChange={(value) => setFormData({...formData, site_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wedding">Wedding Planner</SelectItem>
                        <SelectItem value="boat_rental">Boat Rental</SelectItem>
                        <SelectItem value="concierge">Concierge Service</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="affiliate">Linked Affiliate</Label>
                    <Select value={formData.affiliate_id} onValueChange={(value) => setFormData({...formData, affiliate_id: value})}>
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
                    <Label htmlFor="promo_code">Custom Promo Code</Label>
                    <Input
                      id="promo_code"
                      value={formData.custom_promo_code}
                      onChange={(e) => setFormData({...formData, custom_promo_code: e.target.value})}
                      placeholder="FREESHIP2025"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="address" className="space-y-4">
                <div>
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={formData.business_address.street}
                    onChange={(e) => setFormData({
                      ...formData,
                      business_address: {...formData.business_address, street: e.target.value}
                    })}
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.business_address.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        business_address: {...formData.business_address, city: e.target.value}
                      })}
                      placeholder="Austin"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.business_address.state}
                      onChange={(e) => setFormData({
                        ...formData,
                        business_address: {...formData.business_address, state: e.target.value}
                      })}
                      placeholder="TX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input
                      id="zip"
                      value={formData.business_address.zip_code}
                      onChange={(e) => setFormData({
                        ...formData,
                        business_address: {...formData.business_address, zip_code: e.target.value}
                      })}
                      placeholder="78701"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="instructions">Delivery Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={formData.business_address.instructions}
                    onChange={(e) => setFormData({
                      ...formData,
                      business_address: {...formData.business_address, instructions: e.target.value}
                    })}
                    placeholder="Special delivery instructions for this location"
                  />
                </div>
              </TabsContent>

              <TabsContent value="products" className="space-y-4">
                <div>
                  <Label>Select Product Collections</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose which Shopify collections will be available on this custom site
                  </p>
                  <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                    {collections.map((collection) => (
                      <div key={collection.handle} className="flex items-center space-x-2">
                        <Checkbox
                          id={collection.handle}
                          checked={formData.selected_collections.includes(collection.handle)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                selected_collections: [...formData.selected_collections, collection.handle]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                selected_collections: formData.selected_collections.filter(h => h !== collection.handle)
                              });
                            }
                          }}
                        />
                        <Label htmlFor={collection.handle} className="flex-1">
                          {collection.title}
                          <span className="text-sm text-muted-foreground ml-2">
                            ({collection.products_count} products)
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => {
                setShowCreateForm(false);
                setEditingSite(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={handleSaveSite}>
                {editingSite ? 'Update Site' : 'Create Site'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {sites.map((site) => (
          <Card key={site.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{site.site_name}</h3>
                    <Badge variant={site.is_active ? "default" : "secondary"}>
                      {site.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">{site.site_type}</Badge>
                  </div>
                  <p className="text-muted-foreground mb-2">{site.business_name}</p>
                  <div className="text-sm text-muted-foreground">
                    <p>URL: /sites/{site.site_slug}</p>
                    {site.custom_promo_code && (
                      <p>Promo Code: {site.custom_promo_code}</p>
                    )}
                    {site.affiliates && (
                      <p>Affiliate: {site.affiliates.name} ({site.affiliates.affiliate_code})</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyCustomUrl(site.site_slug)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/sites/${site.site_slug}`, '_blank')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditSite(site)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSite(site.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}