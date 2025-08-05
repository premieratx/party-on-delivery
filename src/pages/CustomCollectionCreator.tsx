import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Search, X, Save, RefreshCw, Package, RotateCcw, Filter } from 'lucide-react';

// Interfaces
interface Product {
  id: string;
  title: string;
  handle: string;
  category?: string;
  type?: string;
  price: string;
  image_url?: string;
  vendor?: string;
  description?: string;
  collections: Array<{ id: string; title: string; handle: string }>;
}

interface ProductModification {
  id: string;
  shopify_product_id: string;
  product_title: string;
  category?: string;
  type?: string;
  collection?: string;
  action?: string;
  synced_to_shopify: boolean;
  app_synced: boolean;
  created_at: string;
  updated_at: string;
}

export default function CustomCollectionCreator() {
  // State
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [modifications, setModifications] = useState<ProductModification[]>([]);
  const [collections, setCollections] = useState<Array<{ id: string; title: string; handle: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [collectionFilter, setCollectionFilter] = useState<string>('all');

  // Load data
  const loadAllProducts = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      console.log('📦 Loading products...');
      
      if (forceRefresh) {
        localStorage.removeItem('shopify-products-cache');
        localStorage.removeItem('shopify-collections-cache');
      }

      const { data, error } = await supabase.functions.invoke('fetch-shopify-products');
      
      if (error) throw error;
      
      if (!data.success || !data.products) {
        console.warn('⚠️ No products returned from Shopify');
        setAllProducts([]);
        return;
      }

      const processedProducts = data.products.map((product: any) => ({
        id: product.id,
        title: product.title,
        handle: product.handle,
        category: product.category || 'other',
        type: product.product_type || 'unknown',
        price: product.variants?.[0]?.price || '0.00',
        image_url: product.image?.src || product.images?.[0]?.src,
        vendor: product.vendor || 'Unknown',
        description: product.body_html || '',
        collections: product.collections || []
      }));

      setAllProducts(processedProducts);
      console.log(`✅ Loaded ${processedProducts.length} products`);
      
    } catch (error) {
      console.error('❌ Error loading products:', error);
      toast({
        title: "❌ Error",
        description: "Failed to load products from Shopify",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProductModifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('product_modifications')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      setModifications(data || []);
      console.log(`📋 Loaded ${data?.length || 0} product modifications`);
      
    } catch (error) {
      console.error('❌ Error loading modifications:', error);
    }
  }, []);

  const loadCollections = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-all-collections');
      
      if (error) throw error;
      
      if (data && data.collections) {
        const collectionsArray = Array.isArray(data.collections) ? data.collections : Object.values(data.collections);
        setCollections(collectionsArray);
        console.log(`📚 Loaded ${collectionsArray.length} collections`);
      }
    } catch (error) {
      console.error('❌ Error loading collections:', error);
    }
  }, []);

  // Sync function - collection-specific sync with app sync
  const syncAll = async () => {
    setSyncing(true);
    try {
      console.log('🔄 Starting collection sync to Shopify...');
      
      // Group modifications by collection
      const modsByCollection = new Map<string, any[]>();
      modifications.forEach(mod => {
        if (mod.collection && !mod.synced_to_shopify) {
          if (!modsByCollection.has(mod.collection)) {
            modsByCollection.set(mod.collection, []);
          }
          modsByCollection.get(mod.collection)!.push(mod);
        }
      });

      if (modsByCollection.size === 0) {
        toast({
          title: "⚠️ No Changes to Sync",
          description: "No collection changes found to sync to Shopify.",
        });
        return;
      }

      // Sync each collection to Shopify
      let totalSynced = 0;
      const syncedModIds: string[] = [];
      
      for (const [collectionHandle, mods] of modsByCollection) {
        try {
          console.log(`🔄 Syncing collection: ${collectionHandle} with ${mods.length} products`);
          
          const productIds = mods.map(mod => mod.shopify_product_id);
          
          const { data, error } = await supabase.functions.invoke('sync-custom-collection-to-shopify', {
            body: {
              collection_id: `custom-${collectionHandle}`,
              title: collectionHandle.charAt(0).toUpperCase() + collectionHandle.slice(1).replace(/-/g, ' '),
              handle: collectionHandle,
              description: `Custom collection for ${collectionHandle}`,
              product_ids: productIds
            }
          });

          if (error) {
            console.error(`❌ Error syncing collection ${collectionHandle}:`, error);
            continue;
          }

          if (data?.success) {
            // Mark modifications as synced to Shopify
            syncedModIds.push(...mods.map(mod => mod.id));
            totalSynced += mods.length;
            console.log(`✅ Synced collection ${collectionHandle} with ${mods.length} products`);
          }
          
        } catch (error) {
          console.error(`❌ Error syncing collection ${collectionHandle}:`, error);
        }
      }

      // Mark all successfully synced modifications as synced_to_shopify
      if (syncedModIds.length > 0) {
        const { error: updateError } = await supabase
          .from('product_modifications')
          .update({ 
            synced_to_shopify: true,
            app_synced: false, // Reset this so it gets picked up by app sync
            updated_at: new Date().toISOString()
          })
          .in('id', syncedModIds);

        if (updateError) {
          console.warn('⚠️ Error marking modifications as synced:', updateError);
        } else {
          console.log(`✅ Marked ${syncedModIds.length} modifications as synced to Shopify`);
        }
      }

      // Now sync back to the delivery apps
      console.log('🔄 Syncing updates back to delivery apps...');
      const { data: appSyncResult, error: appSyncError } = await supabase.functions.invoke('sync-products-to-app', {
        body: { incrementalSync: true }
      });

      if (appSyncError) {
        console.warn('⚠️ App sync error:', appSyncError);
      } else {
        console.log('✅ Successfully synced back to delivery apps:', appSyncResult);
      }

      // Reload data
      await loadProductModifications();
      
      toast({
        title: "🎉 Sync Complete",
        description: `Successfully synced ${totalSynced} products across ${modsByCollection.size} collections to Shopify and back to delivery apps!`,
      });
      
    } catch (error) {
      console.error('❌ Sync error:', error);
      toast({
        title: "❌ Sync Failed",
        description: `Failed to complete sync: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  // Remove product from collection
  const removeFromCollection = async (productIds: string[], collectionHandle: string) => {
    try {
      setSyncing(true);
      console.log(`🗑️ Removing ${productIds.length} products from collection: ${collectionHandle}`);
      
      const { data, error } = await supabase.functions.invoke('sync-custom-collection-to-shopify', {
        body: {
          action: 'remove_products',
          collection_handle: collectionHandle,
          product_ids: productIds
        }
      });

      if (error || !data.success) {
        throw new Error(data?.error || 'Failed to remove products from collection');
      }

      toast({
        title: "✅ Removed from Collection",
        description: `Removed ${productIds.length} product(s) from ${collectionHandle}`,
      });
      
      // Mark products as modified
      await Promise.all(productIds.map(async (productId) => {
        const product = allProducts.find(p => p.id === productId);
        return supabase
          .from('product_modifications')
          .upsert({
            shopify_product_id: productId,
            product_title: product?.title || 'Unknown Product',
            action: 'removed_from_collection',
            collection: collectionHandle,
            synced_to_shopify: true,
            app_synced: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }));
      
      await loadProductModifications();
      await loadAllProducts(true);
      
    } catch (error) {
      console.error('Error removing from collection:', error);
      toast({
        title: "❌ Error",
        description: "Failed to remove products from collection",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  // Apply collection change to selected products
  const applyCollectionToSelected = async () => {
    if (selectedProducts.size === 0 || !selectedCollection) {
      toast({
        title: "⚠️ Selection Required",
        description: "Please select products and a collection.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSyncing(true);
      const productIds = Array.from(selectedProducts);
      
      // Create modifications for each product
      await Promise.all(productIds.map(async (productId) => {
        const product = allProducts.find(p => p.id === productId);
        return supabase
          .from('product_modifications')
          .upsert({
            shopify_product_id: productId,
            product_title: product?.title || 'Unknown Product',
            action: 'added_to_collection',
            collection: selectedCollection,
            synced_to_shopify: false,
            app_synced: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }));

      toast({
        title: "✅ Collection Applied",
        description: `Added ${productIds.length} products to ${selectedCollection}`,
      });
      
      setSelectedProducts(new Set());
      await loadProductModifications();
      
    } catch (error) {
      console.error('Error applying collection:', error);
      toast({
        title: "❌ Error",
        description: "Failed to apply collection to products",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  // Filter products based on search, category, type, and collection
  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.handle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesType = typeFilter === 'all' || product.type === typeFilter;
    const matchesCollection = collectionFilter === 'all' || 
                             product.collections.some(col => col.handle === collectionFilter);
    
    return matchesSearch && matchesCategory && matchesType && matchesCollection;
  });

  // Get unique categories and types for filters
  const categories = Array.from(new Set(allProducts.map(p => p.category).filter(Boolean)));
  const types = Array.from(new Set(allProducts.map(p => p.type).filter(Boolean)));

  // Load data on mount
  useEffect(() => {
    loadAllProducts();
    loadProductModifications();
    loadCollections();
  }, [loadAllProducts, loadProductModifications, loadCollections]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Product Collection Manager</h1>
        <p className="text-muted-foreground">
          Manage product collections and sync changes to Shopify and delivery apps
        </p>
      </div>

      {/* Main Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Collection Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={collectionFilter} onValueChange={setCollectionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by collection" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Collections</SelectItem>
                {collections.map(collection => (
                  <SelectItem key={collection.handle} value={collection.handle}>
                    {collection.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setTypeFilter('all');
                setCollectionFilter('all');
                setSelectedProducts(new Set());
              }}
              variant="outline"
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>

          {/* Collection Assignment */}
          {selectedProducts.size > 0 && (
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="collection-select">
                    Assign {selectedProducts.size} selected products to collection:
                  </Label>
                  <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select a collection" />
                    </SelectTrigger>
                    <SelectContent>
                      {collections.map(collection => (
                        <SelectItem key={collection.handle} value={collection.handle}>
                          {collection.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={applyCollectionToSelected}
                  disabled={!selectedCollection || syncing}
                  className="mt-6"
                >
                  Apply Collection
                </Button>
              </div>
            </div>
          )}

          {/* Sync Controls */}
          <div className="flex gap-4">
            <Button
              onClick={syncAll}
              disabled={syncing}
              className="flex items-center gap-2"
            >
              <RotateCcw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync All Changes'}
            </Button>
            
            <Button
              onClick={() => loadAllProducts(true)}
              disabled={syncing}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Products
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">
                    <Checkbox
                      checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
                        } else {
                          setSelectedProducts(new Set());
                        }
                      }}
                    />
                  </th>
                  <th className="text-left p-2">Product</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Price</th>
                  <th className="text-left p-2">Collections</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(selectedProducts);
                          if (checked) {
                            newSelected.add(product.id);
                          } else {
                            newSelected.delete(product.id);
                          }
                          setSelectedProducts(newSelected);
                        }}
                      />
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-3">
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.title}
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium">{product.title}</div>
                          <div className="text-sm text-muted-foreground">{product.handle}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge variant="outline">{product.category}</Badge>
                    </td>
                    <td className="p-2">
                      <Badge variant="secondary">{product.type}</Badge>
                    </td>
                    <td className="p-2">${product.price}</td>
                    <td className="p-2">
                      <CollectionDisplay
                        collections={product.collections}
                        productId={product.id}
                        onRemove={removeFromCollection}
                        syncing={syncing}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Collection Display Component
interface CollectionDisplayProps {
  collections: Array<{ id: string; title: string; handle: string }>;
  productId: string;
  onRemove: (productIds: string[], collectionHandle: string) => void;
  syncing: boolean;
}

function CollectionDisplay({ collections, productId, onRemove, syncing }: CollectionDisplayProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const maxVisible = 2;
  const visibleCollections = collections.slice(0, maxVisible);
  const hiddenCollections = collections.slice(maxVisible);

  if (collections.length === 0) {
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground">
        None
      </Badge>
    );
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1">
        {/* Always visible collections */}
        {visibleCollections.map((collection) => (
          <div key={collection.id} className="flex items-center gap-1 mb-1">
            <Badge 
              variant="outline" 
              className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200"
            >
              {collection.title}
            </Badge>
            <button
              onClick={() => onRemove([productId], collection.handle)}
              className="text-red-500 hover:text-red-700 transition-colors ml-1"
              title="Remove from collection"
              disabled={syncing}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        
        {/* Dropdown for overflow collections */}
        {hiddenCollections.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="text-xs bg-gray-100 text-gray-600 border border-gray-300 rounded px-2 py-1 hover:bg-gray-200 transition-colors"
            >
              +{hiddenCollections.length}
            </button>
            
            {showDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 min-w-[200px]">
                {hiddenCollections.map((collection) => (
                  <div key={collection.id} className="flex items-center justify-between p-2 hover:bg-gray-50 border-b">
                    <span className="text-xs text-gray-700 flex-1 mr-2">
                      {collection.title}
                    </span>
                    <button
                      onClick={() => {
                        onRemove([productId], collection.handle);
                        setShowDropdown(false);
                      }}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Remove from collection"
                      disabled={syncing}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}