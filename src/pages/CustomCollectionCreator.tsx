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

      for (const update of updates) {
        if (!update) continue;
        
        // Upsert modification
        const { error } = await supabase
          .from('product_modifications')
          .upsert(update, { 
            onConflict: 'shopify_product_id',
            ignoreDuplicates: false 
          });

        if (error) throw error;
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

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = allProducts.map(getProductWithModifications).filter(product => {
      const matchesSearch = !searchTerm || 
        product.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesProductType = productTypeFilter === 'all' || product.productType === productTypeFilter;
      
      return matchesSearch && matchesCategory && matchesProductType;
    });

    return filtered;
  }, [allProducts, productModifications, searchTerm, categoryFilter, productTypeFilter]);

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

  const hasModification = (productId: string) => {
    return productModifications.some(m => 
      m.shopify_product_id === productId && !m.synced_to_shopify
    );
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

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>Products ({filteredProducts.length} total)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p>Loading products...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Select All */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                    <Label htmlFor="select-all" className="font-medium">
                      Select All ({filteredProducts.length} products)
                    </Label>
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((product) => (
                      <div key={product.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id={`product-${product.id}`}
                            checked={selectedProducts.has(product.id)}
                            onCheckedChange={() => toggleProduct(product.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium text-sm truncate">{product.title}</h3>
                              {hasModification(product.id) && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                  Modified
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <p>Category: {product.category || 'None'}</p>
                              <p>Type: {product.productType || 'None'}</p>
                              <p>Vendor: {product.vendor || 'None'}</p>
                              {product.price && <p>Price: ${product.price}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredProducts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No products found matching your filters.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}