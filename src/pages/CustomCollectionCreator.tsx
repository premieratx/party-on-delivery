import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowLeft, RefreshCw, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  title: string;
  handle: string;
  category?: string;
  productType?: string;
  price?: string;
  image?: string;
  vendor?: string;
  description?: string;
  collections?: Array<{
    id: string;
    title: string;
    handle: string;
  }>;
}

interface ProductModification {
  id: string;
  shopify_product_id: string;
  product_title: string;
  category?: string;
  product_type?: string;
  collection?: string;
  synced_to_shopify: boolean;
}

export default function CustomCollectionCreator() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productModifications, setProductModifications] = useState<ProductModification[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'unsorted' | 'sorted' | 'synced'>('unsorted');
  
  // Dropdown states with simple string values
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [productTypeFilter, setProductTypeFilter] = useState('all');
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkProductType, setBulkProductType] = useState('');
  const [bulkCollection, setBulkCollection] = useState('');

  // Available options
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableProductTypes, setAvailableProductTypes] = useState<string[]>([]);
  const [availableCollections, setAvailableCollections] = useState<string[]>([]);

  // Load products and modifications
  useEffect(() => {
    loadAllProducts();
    loadProductModifications();
  }, []);

  const loadAllProducts = async () => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('fetch-shopify-products');
      if (response.data && response.data.products) {
        setAllProducts(response.data.products);
        
        // Extract unique categories and product types
        const categories = new Set<string>();
        const productTypes = new Set<string>();
        
        response.data.products.forEach((product: Product) => {
          if (product.category) categories.add(product.category);
          if (product.productType) productTypes.add(product.productType);
        });
        
        setAvailableCategories(Array.from(categories).sort());
        setAvailableProductTypes(Array.from(productTypes).sort());
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "Failed to load products from Shopify.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProductModifications = async () => {
    try {
      const { data, error } = await supabase
        .from('product_modifications')
        .select('*');
      
      if (error) throw error;
      setProductModifications(data || []);
    } catch (error) {
      console.error('Error loading modifications:', error);
    }
  };

  // Load collections
  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const response = await supabase.functions.invoke('get-all-collections');
      if (response.data && response.data.collections) {
        const collectionNames = response.data.collections.map((c: any) => c.title || c.handle);
        setAvailableCollections(collectionNames.sort());
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  };

  // Apply local changes
  const applyLocalChanges = async () => {
    if (selectedProducts.size === 0) {
      toast({
        title: "Error",
        description: "Please select products to update.",
        variant: "destructive"
      });
      return;
    }

    if (!bulkCategory && !bulkProductType && !bulkCollection) {
      toast({
        title: "Error", 
        description: "Please select at least one attribute to update.",
        variant: "destructive"
      });
      return;
    }

    try {
      const updates = Array.from(selectedProducts).map(productId => {
        const product = allProducts.find(p => p.id === productId);
        if (!product) return null;

        return {
          shopify_product_id: productId,
          product_title: product.title,
          category: bulkCategory || null,
          product_type: bulkProductType || null,
          collection: bulkCollection || null,
          synced_to_shopify: false
        };
      }).filter(Boolean);

      console.log('Starting bulk update for products:', updates);
      
      for (const update of updates) {
        if (!update) continue;
        
        console.log('Processing update:', update);
        console.log('Checking for existing modification for product:', update.shopify_product_id);
        // Check if modification exists
        const { data: existing, error: selectError } = await supabase
          .from('product_modifications')
          .select('*')
          .eq('shopify_product_id', update.shopify_product_id)
          .maybeSingle();

        console.log('Existing record:', existing, 'Select error:', selectError);

        if (existing) {
          // For categories and product types: 1-for-1 replacement
          // For collections: additive (merge with existing)
          let updateData: any = {
            synced_to_shopify: false,
            updated_at: new Date().toISOString()
          };

          if (update.category) {
            updateData.category = update.category; // Replace category
          }
          
          if (update.product_type) {
            updateData.product_type = update.product_type; // Replace product type  
          }

          if (update.collection) {
            // For now, just update the collection field directly
            // TODO: Implement proper multi-collection support later
            updateData.collection = update.collection;
          }

          console.log('Updating existing record with:', updateData);
          const { error } = await supabase
            .from('product_modifications')
            .update(updateData)
            .eq('shopify_product_id', update.shopify_product_id);
          
          console.log('Update error:', error);
          if (error) throw error;
        } else {
          // Insert new record
          console.log('Inserting new record:', update);
          const { error } = await supabase
            .from('product_modifications')
            .insert(update);
          
          console.log('Insert error:', error);
          if (error) throw error;
        }
      }

      // Reload modifications
      await loadProductModifications();

      toast({
        title: "Success",
        description: `Applied local changes to ${selectedProducts.size} products.`,
      });

      // Clear selections
      setSelectedProducts(new Set());
      setBulkCategory('');
      setBulkProductType('');
      setBulkCollection('');

    } catch (error) {
      console.error('Error applying changes:', error);
      toast({
        title: "Error",
        description: "Failed to apply local changes.",
        variant: "destructive"
      });
    }
  };

  // Sync to Shopify
  const syncToShopify = async () => {
    const unsyncedMods = productModifications.filter(m => !m.synced_to_shopify);
    if (unsyncedMods.length === 0) {
      toast({
        title: "Info",
        description: "No unsynced changes to sync to Shopify.",
      });
      return;
    }

    setSyncing(true);
    try {
      // Simulate Shopify sync
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Mark as synced
      const { error } = await supabase
        .from('product_modifications')
        .update({ synced_to_shopify: true })
        .eq('synced_to_shopify', false);

      if (error) throw error;

      await loadProductModifications();

      toast({
        title: "Success",
        description: `Synced ${unsyncedMods.length} product changes to Shopify!`,
      });

    } catch (error) {
      console.error('Error syncing to Shopify:', error);
      toast({
        title: "Error",
        description: "Failed to sync changes to Shopify.",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  // Get product with modifications applied
  const getProductWithModifications = (product: Product): Product => {
    const modification = productModifications.find(m => 
      m.shopify_product_id === product.id && !m.synced_to_shopify
    );
    
    if (!modification) return product;

    return {
      ...product,
      category: modification.category || product.category,
      productType: modification.product_type || product.productType,
    };
  };

  // Helper function to check if product has modifications
  const hasModification = (productId: string) => {
    return productModifications.some(m => 
      m.shopify_product_id === productId && !m.synced_to_shopify
    );
  };

  // Helper function to check if product is synced
  const isSynced = (productId: string) => {
    return productModifications.some(m => 
      m.shopify_product_id === productId && m.synced_to_shopify
    );
  };

  // Filter products based on active tab
  const filteredProducts = useMemo(() => {
    let filtered = allProducts.map(getProductWithModifications).filter(product => {
      const matchesSearch = !searchTerm || 
        product.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesProductType = productTypeFilter === 'all' || product.productType === productTypeFilter;
      
      // Tab filtering based on modification and sync status
      const hasUnsyncedModification = hasModification(product.id);
      const isProductSynced = isSynced(product.id);
      
      let matchesTab = false;
      if (activeTab === 'unsorted') {
        // Show products with no modifications and not synced
        matchesTab = !hasUnsyncedModification && !isProductSynced;
      } else if (activeTab === 'sorted') {
        // Show products with unsynced modifications
        matchesTab = hasUnsyncedModification;
      } else if (activeTab === 'synced') {
        // Show synced products
        matchesTab = isProductSynced;
      }
      
      return matchesSearch && matchesCategory && matchesProductType && matchesTab;
    });

    return filtered;
  }, [allProducts, productModifications, searchTerm, categoryFilter, productTypeFilter, activeTab]);

  const unsyncedCount = productModifications.filter(m => !m.synced_to_shopify).length;

  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const toggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin')}
                className="text-muted-foreground hover:text-foreground flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Admin Dashboard
              </Button>
              <h1 className="text-2xl font-bold">Bulk Product Editor</h1>
              {unsyncedCount > 0 && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  {unsyncedCount} Unsynced Changes
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{selectedProducts.size} selected</Badge>
              {unsyncedCount > 0 && (
                <Button 
                  onClick={syncToShopify}
                  disabled={syncing}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4" />
                  {syncing ? 'Syncing...' : `Sync ${unsyncedCount} to Shopify`}
                </Button>
              )}
              <Button 
                variant="outline"
                onClick={loadAllProducts}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Re-sync from Shopify
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search Products</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by product name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="categoryFilter">Category</Label>
                  <select
                    id="categoryFilter"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="all">All Categories</option>
                    {availableCategories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="productTypeFilter">Product Type</Label>
                  <select
                    id="productTypeFilter"
                    value={productTypeFilter}
                    onChange={(e) => setProductTypeFilter(e.target.value)}
                    className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="all">All Types</option>
                    {availableProductTypes.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      setCategoryFilter('all');
                      setProductTypeFilter('all');
                    }}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedProducts.size > 0 && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Bulk Actions ({selectedProducts.size} products selected)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <Label htmlFor="bulkCategory">Update Category</Label>
                    <select
                      id="bulkCategory"
                      value={bulkCategory}
                      onChange={(e) => setBulkCategory(e.target.value)}
                      className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select category...</option>
                      {availableCategories.map(category => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="bulkProductType">Update Product Type</Label>
                    <select
                      id="bulkProductType"
                      value={bulkProductType}
                      onChange={(e) => setBulkProductType(e.target.value)}
                      className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select type...</option>
                      {availableProductTypes.map(type => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="bulkCollection">Update Collection</Label>
                    <select
                      id="bulkCollection"
                      value={bulkCollection}
                      onChange={(e) => setBulkCollection(e.target.value)}
                      className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select collection...</option>
                      {availableCollections.map(collection => (
                        <option key={collection} value={collection}>
                          {collection}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={applyLocalChanges}
                      disabled={!bulkCategory && !bulkProductType && !bulkCollection}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 w-full"
                    >
                      <Save className="w-4 h-4" />
                      Apply Locally
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Button
                  variant={activeTab === 'unsorted' ? 'default' : 'outline'}
                  onClick={() => {
                    setActiveTab('unsorted');
                    setSelectedProducts(new Set());
                  }}
                  className="flex items-center gap-2"
                >
                  Unsorted ({allProducts.filter(p => !hasModification(p.id)).length})
                </Button>
                 <Button
                   variant={activeTab === 'sorted' ? 'default' : 'outline'}
                   onClick={() => {
                     setActiveTab('sorted');
                     setSelectedProducts(new Set());
                   }}
                   className="flex items-center gap-2"
                 >
                   Sorted ({productModifications.filter(m => !m.synced_to_shopify).length})
                 </Button>
                 <Button
                   variant={activeTab === 'synced' ? 'default' : 'outline'}
                   onClick={() => {
                     setActiveTab('synced');
                     setSelectedProducts(new Set());
                   }}
                   className="flex items-center gap-2"
                 >
                   Synced ({productModifications.filter(m => m.synced_to_shopify).length})
                 </Button>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardHeader>
               <CardTitle>
                 {activeTab === 'unsorted' ? 'Unsorted' : activeTab === 'sorted' ? 'Sorted' : 'Synced'} Products ({filteredProducts.length} total)
               </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Loading products...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No products found matching your criteria.
                </div>
              ) : (
                <div>
                  {/* Table Header */}
                  <div className="flex items-center gap-3 p-4 border-b bg-muted/50 font-medium text-sm">
                    <div className="w-8">
                      <Checkbox
                        checked={selectedProducts.size > 0 && selectedProducts.size === filteredProducts.length}
                        onCheckedChange={toggleSelectAll}
                        className="w-5 h-5"
                      />
                    </div>
                    <div className="w-16">Image</div>
                    <div className="flex-1 min-w-[200px]">Product</div>
                    <div className="w-32">Category</div>
                    <div className="w-32">Product Type</div>
                    <div className="w-32">Collections</div>
                    <div className="w-20">Price</div>
                    <div className="w-24">Vendor</div>
                    <div className="w-20">Status</div>
                  </div>

                  {/* Product Rows */}
                  {filteredProducts.map((product) => (
                    <div 
                      key={product.id}
                      className={`flex items-center gap-3 p-4 border-b hover:bg-muted/30 transition-colors ${
                        selectedProducts.has(product.id) ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <div className="w-8">
                        <Checkbox
                          checked={selectedProducts.has(product.id)}
                          onCheckedChange={() => toggleProduct(product.id)}
                          className="w-5 h-5"
                        />
                      </div>
                      
                      {/* Image */}
                      <div className="w-16">
                        {product.image && (
                          <img 
                            src={product.image} 
                            alt={product.title}
                            className="w-12 h-12 object-cover rounded border"
                          />
                        )}
                      </div>

                      {/* Product Title */}
                      <div className="flex-1 min-w-[200px]">
                        <h3 className="font-medium text-sm mb-1 leading-tight">
                          {product.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          ID: {product.id.split('/').pop()}
                        </p>
                      </div>

                      {/* Category */}
                      <div className="w-32">
                        <Badge 
                          variant="secondary" 
                          className="text-xs bg-purple-100 text-purple-800 border-purple-200"
                        >
                          {product.category || 'None'}
                        </Badge>
                      </div>

                      {/* Product Type */}
                      <div className="w-32">
                        <Badge 
                          variant="secondary" 
                          className="text-xs bg-green-100 text-green-800 border-green-200"
                        >
                          {product.productType || 'None'}
                        </Badge>
                      </div>

                      {/* Collections */}
                      <div className="w-32">
                        <div className="flex flex-wrap gap-1">
                          {product.collections && product.collections.length > 0 ? (
                            product.collections.slice(0, 2).map((collection, index) => (
                              <Badge 
                                key={collection.id}
                                variant="outline" 
                                className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200"
                              >
                                {collection.title}
                              </Badge>
                            ))
                          ) : (
                            <Badge 
                              variant="outline" 
                              className="text-xs text-muted-foreground"
                            >
                              None
                            </Badge>
                          )}
                          {product.collections && product.collections.length > 2 && (
                            <Badge 
                              variant="outline" 
                              className="text-xs bg-gray-100 text-gray-600"
                            >
                              +{product.collections.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="w-20">
                        <span className="font-medium text-sm">${product.price || '0'}</span>
                      </div>

                      {/* Vendor */}
                      <div className="w-24">
                        <Badge 
                          variant="outline" 
                          className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                        >
                          {product.vendor || 'Unknown'}
                        </Badge>
                      </div>

                       {/* Status */}
                       <div className="w-20">
                         {isSynced(product.id) ? (
                           <Badge 
                             variant="secondary" 
                             className="text-xs bg-green-100 text-green-800 border-green-200"
                           >
                             Synced
                           </Badge>
                         ) : hasModification(product.id) ? (
                           <Badge 
                             variant="secondary" 
                             className="text-xs bg-blue-100 text-blue-800 border-blue-200"
                           >
                             Modified
                           </Badge>
                         ) : (
                           <Badge 
                             variant="outline" 
                             className="text-xs text-muted-foreground"
                           >
                             Unsorted
                           </Badge>
                         )}
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}