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
    delivery_address: {
      street: '',
      city: '',
      state: '',
      zip_code: '',
      instructions: ''
    },
    custom_promo_code: '',
    site_type: 'custom',
    affiliate_id: '',
    selected_collections: ['liquor', 'beer', 'seltzers', 'cocktails', 'mixers-and-na'] as string[], // Default collections
    same_address: false,
    // Add fields for affiliate creation
    affiliate_email: '',
    affiliate_phone: '',
    affiliate_venmo: ''
  });

  useEffect(() => {
    console.log('CustomSiteManagement mounted');
    console.log('Initial showCreateForm state:', showCreateForm);
    loadData();
  }, []);

  const loadData = async () => {
    console.log('Loading data...');
    setIsLoading(true);
    try {
      // Load sites
      const { data: sitesData, error: sitesError } = await supabase
        .from('custom_affiliate_sites')
        .select(`
          *,
          affiliates:affiliate_id(name, email, affiliate_code)
        `)
        .order('created_at', { ascending: false });

      if (sitesError) {
        console.error('Error loading sites:', sitesError);
      } else {
        setSites(sitesData || []);
      }

      // Load affiliates
      const { data: affiliatesData, error: affiliatesError } = await supabase
        .from('affiliates')
        .select('id, name, email, affiliate_code')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (affiliatesError) {
        console.error('Error loading affiliates:', affiliatesError);
      } else {
        setAffiliates(affiliatesData || []);
      }

      // Load collections with better error handling
      console.log('Loading collections...');
      try {
        // Try cached collections first for better reliability
        const { data: cachedCollections, error: cacheError } = await supabase
          .from('shopify_collections_cache')
          .select('handle, title, products_count')
          .order('title', { ascending: true });

        if (!cacheError && cachedCollections && cachedCollections.length > 0) {
          setCollections(cachedCollections);
          console.log('Using cached collections:', cachedCollections.length);
        } else {
          // Fallback to fresh collections if cache is empty
          console.log('Cache empty, fetching fresh collections...');
          const collectionsResponse = await supabase.functions.invoke('get-all-collections');
          
          if (collectionsResponse.data?.collections && Array.isArray(collectionsResponse.data.collections)) {
            const collectionsData = collectionsResponse.data.collections.map((collection: any) => ({
              handle: collection.handle,
              title: collection.title || collection.handle,
              products_count: collection.products?.length || 0
            }));
            setCollections(collectionsData);
            console.log('Fresh collections loaded successfully:', collectionsData.length);
          } else {
            console.error('Invalid collections response format');
            setCollections([]);
          }
        }
      } catch (collectionsError) {
        console.error('Error loading collections:', collectionsError);
        setCollections([]);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSite = async () => {
    console.log('handleSaveSite called with formData:', formData);
    try {
      let finalAffiliateId = formData.affiliate_id;

      // If no affiliate is selected but we have affiliate info, create a new affiliate
      if (!finalAffiliateId && formData.affiliate_email) {
        try {
          const { data: createAffiliateData, error: createAffiliateError } = await supabase.functions.invoke('create-affiliate', {
            body: {
              name: formData.business_name, // Use business name as the name
              phone: formData.affiliate_phone,
              companyName: formData.business_name,
              venmoHandle: formData.affiliate_venmo,
              email: formData.affiliate_email,
              isAdminCreated: true // Flag that this was created by admin
            }
          });

          if (createAffiliateError) throw createAffiliateError;
          
          if (createAffiliateData?.affiliate?.id) {
            finalAffiliateId = createAffiliateData.affiliate.id;
            toast.success('New affiliate created and linked to site');
          }
        } catch (affiliateError) {
          console.warn('Could not auto-create affiliate:', affiliateError);
          // Continue with site creation even if affiliate creation fails
        }
      }

      const siteData = {
        site_slug: formData.site_slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        site_name: formData.site_name,
        business_name: formData.business_name,
        delivery_address: formData.delivery_address,
        custom_promo_code: formData.custom_promo_code || null,
        site_type: formData.site_type,
        affiliate_id: finalAffiliateId || null,
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
      delivery_address: (site as any).delivery_address || site.business_address || {
        street: '',
        city: '',
        state: '',
        zip_code: '',
        instructions: ''
      },
      custom_promo_code: site.custom_promo_code || '',
      site_type: site.site_type,
      affiliate_id: site.affiliate_id || '',
      selected_collections: siteCollections?.map(c => c.shopify_collection_handle) || [],
      same_address: false,
      affiliate_email: site.affiliates?.email || '',
      affiliate_phone: '',
      affiliate_venmo: ''
    });

    setEditingSite(site.id);
    setShowCreateForm(true);
  };

  const resetForm = () => {
    setFormData({
      site_slug: '',
      site_name: '',
      business_name: '',
      delivery_address: {
        street: '',
        city: '',
        state: '',
        zip_code: '',
        instructions: ''
      },
      custom_promo_code: '',
      site_type: 'custom',
      affiliate_id: '',
      selected_collections: ['liquor', 'beer', 'seltzers', 'cocktails', 'mixers-and-na'], // Default collections
      same_address: false,
      // Add fields for affiliate creation
      affiliate_email: '',
      affiliate_phone: '',
      affiliate_venmo: ''
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
        <Button onClick={() => {
          console.log('Create New Site button clicked, current showCreateForm:', showCreateForm);
          setShowCreateForm(true);
          setEditingSite(null);
          resetForm();
          
          // Check if we're coming from an affiliate context and prefill data
          const urlParams = new URLSearchParams(window.location.search);
          const affiliateId = urlParams.get('affiliate');
          if (affiliateId) {
            const affiliate = affiliates.find(a => a.id === affiliateId);
            if (affiliate) {
              setFormData(prev => ({
                ...prev,
                business_name: affiliate.company_name || affiliate.name,
                site_name: `${affiliate.company_name || affiliate.name} - Custom Site`,
                site_slug: (affiliate.company_name || affiliate.name).toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                affiliate_id: affiliate.id,
                affiliate_email: affiliate.email,
                affiliate_phone: affiliate.phone || '',
                affiliate_venmo: affiliate.venmo_handle || ''
              }));
            }
          }
          
          console.log('After setting showCreateForm to true');
        }} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New Site
        </Button>
      </div>

      {showCreateForm ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingSite ? 'Edit Site' : 'Create New Custom Site'}</CardTitle>
            <CardDescription>Configure a custom delivery site for your affiliate partners</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="delivery">Delivery Address</TabsTrigger>
                <TabsTrigger value="affiliate">Affiliate Info</TabsTrigger>
                <TabsTrigger value="collections">Collections</TabsTrigger>
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
                     <Select value={formData.affiliate_id || "none"} onValueChange={(value) => setFormData({...formData, affiliate_id: value === "none" ? "" : value})}>
                       <SelectTrigger className="bg-card border z-10">
                         <SelectValue placeholder="Select affiliate to link this site" />
                       </SelectTrigger>
                       <SelectContent className="bg-card border shadow-lg max-h-60 overflow-y-auto z-50">
                         <SelectItem value="none">No affiliate (standalone site)</SelectItem>
                         {affiliates.map((affiliate) => (
                           <SelectItem key={affiliate.id} value={affiliate.id}>
                             <div className="flex flex-col">
                               <span className="font-medium">{affiliate.name}</span>
                               <span className="text-sm text-muted-foreground">
                                 {affiliate.affiliate_code} • {affiliate.email}
                               </span>
                             </div>
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                    <p className="text-sm text-muted-foreground mt-1">
                      Linking to an affiliate will credit them for all sales through this site.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="promo_code">Custom Promo Code (Free Shipping)</Label>
                    <Input
                      id="promo_code"
                      value={formData.custom_promo_code}
                      onChange={(e) => setFormData({...formData, custom_promo_code: e.target.value})}
                      placeholder="FREESHIP2025"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      This code will automatically provide free shipping and be prefilled at checkout.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="delivery" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Delivery Address</h3>
                  <p className="text-sm text-muted-foreground">
                    This is where orders will be delivered. For most sites, this should be the main service area or event location.
                  </p>
                  <div>
                    <Label htmlFor="delivery_street">Street Address</Label>
                    <Input
                      id="delivery_street"
                      value={formData.delivery_address.street}
                      onChange={(e) => setFormData({
                        ...formData,
                        delivery_address: { ...formData.delivery_address, street: e.target.value }
                      })}
                      className="bg-card border"
                      placeholder="123 Event Venue Street"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="delivery_city">City</Label>
                      <Input
                        id="delivery_city"
                        value={formData.delivery_address.city}
                        onChange={(e) => setFormData({
                          ...formData,
                          delivery_address: { ...formData.delivery_address, city: e.target.value }
                        })}
                        className="bg-card border"
                        placeholder="Austin"
                      />
                    </div>
                    <div>
                      <Label htmlFor="delivery_state">State</Label>
                      <Input
                        id="delivery_state"
                        value={formData.delivery_address.state}
                        onChange={(e) => setFormData({
                          ...formData,
                          delivery_address: { ...formData.delivery_address, state: e.target.value }
                        })}
                        className="bg-card border"
                        placeholder="TX"
                      />
                    </div>
                    <div>
                      <Label htmlFor="delivery_zip">ZIP Code</Label>
                      <Input
                        id="delivery_zip"
                        value={formData.delivery_address.zip_code}
                        onChange={(e) => setFormData({
                          ...formData,
                          delivery_address: { ...formData.delivery_address, zip_code: e.target.value }
                        })}
                        className="bg-card border"
                        placeholder="78701"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="delivery_instructions">Delivery Special Instructions</Label>
                    <Textarea
                      id="delivery_instructions"
                      value={formData.delivery_address.instructions}
                      onChange={(e) => setFormData({
                        ...formData,
                        delivery_address: { ...formData.delivery_address, instructions: e.target.value }
                      })}
                      className="bg-card border"
                      placeholder="Building entrance, parking instructions, etc."
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="affiliate" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Affiliate Information</h3>
                    <p className="text-sm text-muted-foreground">
                      If this person isn't already an affiliate, we'll create their account automatically when you save the site.
                    </p>
                  </div>
                  
                  {!formData.affiliate_id && (
                    <>
                      <div>
                        <Label htmlFor="affiliate_email">Email Address *</Label>
                        <Input
                          id="affiliate_email"
                          type="email"
                          value={formData.affiliate_email}
                          onChange={(e) => setFormData({...formData, affiliate_email: e.target.value})}
                          placeholder="partner@company.com"
                          className="bg-card border"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Required to create affiliate account if they don't have one
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="affiliate_phone">Phone Number *</Label>
                        <Input
                          id="affiliate_phone"
                          type="tel"
                          value={formData.affiliate_phone}
                          onChange={(e) => setFormData({...formData, affiliate_phone: e.target.value})}
                          placeholder="(555) 123-4567"
                          className="bg-card border"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Required for affiliate account
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="affiliate_venmo">Venmo Handle (Optional)</Label>
                        <Input
                          id="affiliate_venmo"
                          value={formData.affiliate_venmo}
                          onChange={(e) => setFormData({...formData, affiliate_venmo: e.target.value})}
                          placeholder="@venmo-username"
                          className="bg-card border"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          For faster commission payouts
                        </p>
                      </div>
                    </>
                  )}
                  
                  {formData.affiliate_id && (
                    <div className="p-4 bg-muted/50 rounded-md">
                      <p className="font-medium">Linked to existing affiliate</p>
                      <p className="text-sm text-muted-foreground">
                        This site is linked to an existing affiliate account. Their commissions will be tracked automatically.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="collections" className="space-y-4">
                <div>
                  <Label>Select Product Collections (Maximum 5)</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose up to 5 Shopify collections that will be available on this custom site
                  </p>
                  <div className="mb-4">
                    <p className="text-sm font-medium">
                      Selected: {formData.selected_collections.length}/5
                    </p>
                  </div>
                  <div className="border rounded-md p-4 max-h-80 overflow-y-auto bg-background">
                    <div className="space-y-2">
                      {collections.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                          Loading collections...
                        </p>
                      ) : (
                        collections.map((collection) => (
                          <div key={collection.handle} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                            <Checkbox
                              id={collection.handle}
                              checked={formData.selected_collections.includes(collection.handle)}
                              disabled={
                                !formData.selected_collections.includes(collection.handle) && 
                                formData.selected_collections.length >= 5
                              }
                              onCheckedChange={(checked) => {
                                if (checked && formData.selected_collections.length < 5) {
                                  setFormData({
                                    ...formData,
                                    selected_collections: [...formData.selected_collections, collection.handle]
                                  });
                                } else if (!checked) {
                                  setFormData({
                                    ...formData,
                                    selected_collections: formData.selected_collections.filter(h => h !== collection.handle)
                                  });
                                }
                              }}
                            />
                            <Label htmlFor={collection.handle} className="flex-1 cursor-pointer">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{collection.title}</span>
                                <span className="text-sm text-muted-foreground">
                                  {collection.products_count} products
                                </span>
                              </div>
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  {formData.selected_collections.length > 0 && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-md">
                      <h4 className="font-medium mb-2">Selected Collections:</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.selected_collections.map((handle) => {
                          const collection = collections.find(c => c.handle === handle);
                          return (
                            <Badge key={handle} variant="secondary">
                              {collection?.title || handle}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
      ) : null}

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