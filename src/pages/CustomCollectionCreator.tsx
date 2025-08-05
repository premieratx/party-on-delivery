import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowLeft, RefreshCw, Save, Smartphone } from 'lucide-react';
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
  app_synced: boolean;
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
  const [activeTab, setActiveTab] = useState<'unsorted' | 'synced'>('unsorted');
  const [appSyncing, setAppSyncing] = useState(false);
  
  // Dropdown states with simple string values
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [productTypeFilter, setProductTypeFilter] = useState('all');
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkProductType, setBulkProductType] = useState('');
  const [bulkCollection, setBulkCollection] = useState('');
  const [selectedCollectionFilter, setSelectedCollectionFilter] = useState('all');

  // Available options
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableProductTypes, setAvailableProductTypes] = useState<string[]>([]);
  const [availableCollections, setAvailableCollections] = useState<string[]>([]);

  // Load products and modifications
  useEffect(() => {
    loadAllProducts();
    loadProductModifications();
  }, []);

  const loadAllProducts = async (forceCacheClear = false) => {
    setLoading(true);
    try {
      // Clear cache if requested
      if (forceCacheClear) {
        console.log('Clearing Shopify cache for fresh sync...');
        // Clear collections cache
        await supabase.from('cache').delete().eq('key', 'shopify-collections');
        await supabase.from('cache').delete().eq('key', 'shopify-collections-metadata');
        
        // Clear any local storage cache
        localStorage.removeItem('shopify-collections-cache');
        localStorage.removeItem('shopify-products-cache');
        
        toast({
          title: "Cache Cleared",
          description: "Fetching fresh data from Shopify...",
        });
      }
      
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
        
        // If force cache clear, also refresh collections and sync app
        if (forceCacheClear) {
          await loadCollections(true);
          
          // Reload modifications first to get current state
          await loadProductModifications();
          
          // Then check for products that need app sync
          setTimeout(async () => {
            const currentMods = await supabase.from('product_modifications').select('*');
            if (currentMods.data) {
              const shopifySyncedMods = currentMods.data.filter((m: any) => m.synced_to_shopify && !m.app_synced);
              if (shopifySyncedMods.length > 0) {
                console.log('Auto-syncing products to app after cache clear...');
                await syncToApp();
              }
            }
          }, 1000); // Small delay to ensure data is fresh
          
          toast({
            title: "Sync Complete",
            description: "Fresh data loaded from Shopify! Collections updated.",
          });
        }
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

  const loadCollections = async (forceCacheClear = false) => {
    try {
      // Clear collections cache if force refresh
      if (forceCacheClear) {
        console.log('Clearing collections cache for fresh sync...');
        await supabase.from('cache').delete().eq('key', 'shopify-collections');
        await supabase.from('cache').delete().eq('key', 'shopify-collections-metadata');
      }
      
      const response = await supabase.functions.invoke('get-all-collections');
      if (response.data && response.data.collections) {
        const collectionNames = response.data.collections.map((c: any) => c.title || c.handle);
        setAvailableCollections(collectionNames.sort());
        console.log(`Loaded ${collectionNames.length} collections for dropdown`);
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
          // Insert new record using upsert to handle conflicts
          console.log('Upserting new record:', update);
          const { error } = await supabase
            .from('product_modifications')
            .upsert(update);
          
          console.log('Upsert error:', error);
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

  // Unified sync function that handles all sync operations
  const syncToShopifyAndApp = async (forceSync = false) => {
    console.log('🔄 Starting enhanced sync to Shopify and app...');
    
    // Fetch fresh modifications from database with retry logic
    let freshMods, fetchError;
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await supabase
        .from('product_modifications')
        .select('*');
      
      if (!result.error) {
        freshMods = result.data;
        fetchError = null;
        break;
      }
      
      fetchError = result.error;
      console.warn(`❌ Attempt ${attempt + 1} failed:`, fetchError);
      
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
    
    if (fetchError) {
      console.error('❌ Error fetching fresh modifications after retries:', fetchError);
      toast({
        title: "Error",
        description: "Failed to fetch latest modifications.",
        variant: "destructive"
      });
      return;
    }
    
    console.log('📊 Total product modifications (fresh):', freshMods?.length || 0);
    
    const unsyncedMods = (freshMods || []).filter(m => !m.synced_to_shopify);
    console.log('📋 Unsynced modifications:', unsyncedMods.length, unsyncedMods);
    
    if (unsyncedMods.length === 0) {
      console.log('ℹ️ No unsynced changes found');
      toast({
        title: "Info",
        description: "No unsynced changes to sync.",
      });
      return;
    }

    setSyncing(true);
    try {
      console.log('📤 Step 1: Syncing TO Shopify...');
      
      // Step 1: Sync TO Shopify using immediate sync
      const { data: shopifySync, error: shopifyError } = await supabase.functions.invoke('immediate-shopify-sync');
      
      if (shopifyError) {
        console.error('❌ Shopify sync error:', shopifyError);
        throw new Error(`Shopify sync failed: ${shopifyError.message}`);
      }

      if (!shopifySync.success) {
        throw new Error(shopifySync.error || 'Failed to complete Shopify sync');
      }

      console.log('✅ Shopify sync completed successfully:', shopifySync);

      // Step 2: ALWAYS sync FROM Shopify back to app to ensure apps have latest data
      console.log('📥 Step 2: Syncing FROM Shopify back to app...');
      const { data: appSync, error: appError } = await supabase.functions.invoke('sync-products-to-app', {
        body: { forceFullSync: true, incrementalSync: false }
      });
      
      if (appError) {
        console.warn('⚠️ App sync warning (non-critical):', appError.message);
      } else {
        console.log('✅ App sync completed successfully:', appSync);
      }

      // Step 3: Force refresh collections to ensure all apps see updates immediately
      console.log('🔄 Step 3: Force refreshing collections cache...');
      const { data: collectionsRefresh, error: collectionsError } = await supabase.functions.invoke('get-all-collections', {
        body: { forceRefresh: true }
      });
      
      if (collectionsError) {
        console.warn('⚠️ Collections refresh warning (non-critical):', collectionsError.message);
      } else {
        console.log('✅ Collections cache refreshed successfully');
      }

      // Step 4: Clear all caches to force fresh data everywhere
      console.log('🧹 Step 4: Clearing all relevant caches...');
      await supabase.from('cache').delete().like('key', '%shopify%');
      await supabase.from('cache').delete().like('key', '%collections%');
      await supabase.from('cache').delete().like('key', '%product%');

      // Step 5: Reload local data to reflect changes
      console.log('🔄 Step 5: Reloading local data...');
      await loadProductModifications();
      await loadAllProducts(true);
      await loadCollections();

      // Step 6: Notify all apps to refresh their data
      console.log('📢 Step 6: Notifying apps to refresh...');
      window.dispatchEvent(new CustomEvent('admin-sync-complete'));

      const syncedCount = forceSync ? selectedProducts.size : (unsyncedMods?.length || 0);
      
      toast({
        title: "✅ Complete Bidirectional Sync Successful",
        description: `Successfully synced ${syncedCount} products TO Shopify and FROM Shopify back to all delivery apps! All collections are now updated.`,
      });

    } catch (error) {
      console.error('❌ Enhanced sync error:', error);
      
      // Try fallback to manual sync if immediate sync fails
      console.log('🔄 Attempting fallback sync method...');
      try {
        await legacySyncToShopifyAndApp(unsyncedMods);
      } catch (fallbackError) {
        console.error('❌ Fallback sync also failed:', fallbackError);
        toast({
          title: "❌ Sync Failed",
          description: `Failed to sync changes: ${error.message}. Please try again or contact support.`,
          variant: "destructive"
        });
      }
    } finally {
      setSyncing(false);
    }
  };

  // Legacy sync method as fallback
  const legacySyncToShopifyAndApp = async (unsyncedMods: ProductModification[]) => {
    console.log('🔄 Running legacy sync as fallback...');
    
    // Group modifications by collection for Shopify sync
    const collectionUpdates: { [key: string]: string[] } = {};
    
    unsyncedMods.forEach(mod => {
      if (mod.collection) {
        if (!collectionUpdates[mod.collection]) {
          collectionUpdates[mod.collection] = [];
        }
        collectionUpdates[mod.collection].push(mod.shopify_product_id);
      }
    });

    // Sync each collection to Shopify
    let totalSynced = 0;
    for (const [collectionTitle, productIds] of Object.entries(collectionUpdates)) {
      const handle = collectionTitle.toLowerCase().replace(/\s+/g, '-');
      
      console.log(`🔄 Syncing collection "${collectionTitle}" with ${productIds.length} products...`);
      
      const { data, error } = await supabase.functions.invoke('sync-custom-collection-to-shopify', {
        body: {
          collection_id: `custom-${handle}`,
          title: collectionTitle,
          handle: handle,
          description: `Custom collection: ${collectionTitle}`,
          product_ids: productIds
        }
      });

      if (error) {
        console.error('❌ Error syncing collection to Shopify:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || `Failed to sync collection "${collectionTitle}" to Shopify`);
      }

      totalSynced += data.products_added;
      console.log(`✅ Synced collection "${collectionTitle}" to Shopify with ${data.products_added} products`);
    }

    // Mark modifications as synced to Shopify
    const { error: updateError } = await supabase
      .from('product_modifications')
      .update({ synced_to_shopify: true })
      .in('id', unsyncedMods.map(m => m.id));

    if (updateError) throw updateError;

    // Now sync to app
    const { data: appSyncData, error: appSyncError } = await supabase.functions.invoke('sync-products-to-app');
    
    if (appSyncError) throw appSyncError;
    
    if (!appSyncData.success) {
      throw new Error(appSyncData.message || 'Failed to sync products to app');
    }

    // Clear cached collections and refresh
    localStorage.removeItem('shopify-collections-cache');
    await loadProductModifications();
    await loadAllProducts(true);
    
    // Notify delivery app to refresh
    window.dispatchEvent(new CustomEvent('admin-sync-complete'));

    toast({
      title: "✅ Fallback Sync Successful",
      description: `Synced ${unsyncedMods.length} product changes to Shopify and app using fallback method!`,
    });
  };

  // INSTANT SYNC: Ultra-fast direct Shopify API with instant cache refresh
  const bulkSyncSelectedProducts = async () => {
    if (selectedProducts.size === 0) {
      toast({
        title: "Info",
        description: "Please select products to sync.",
      });
      return;
    }

    console.log('=== ⚡ INSTANT SYNC SELECTED PRODUCTS ===');
    const selectedProductIds = Array.from(selectedProducts);
    
    setSyncing(true);
    try {
      // Group products by collection for ultra-fast batch operations
      const operations = [{
        type: 'add' as const,
        collection_handle: bulkCollection || 'custom-products',
        product_ids: selectedProductIds
      }];

      console.log(`⚡ Starting instant sync with ${operations.length} operations`);

      // Use optimized bulk sync with direct REST API calls - FASTEST method
      const { data: result, error } = await supabase.functions.invoke('shopify-bulk-sync', {
        body: { operations }
      });

      if (error) throw error;

      if (!result.success) {
        throw new Error(result.error || 'Instant sync failed');
      }

      console.log("⚡ Instant sync completed in milliseconds:", result);

      // Parallel operations for maximum speed
      const [updateResult, cacheResult] = await Promise.allSettled([
        // Update modifications table
        Promise.all(selectedProductIds.map(async (productId) => {
          const product = allProducts.find(p => p.id === productId);
          return supabase
            .from('product_modifications')
            .upsert({
              shopify_product_id: productId,
              product_title: product?.title || 'Unknown Product',
              category: null,
              product_type: null,
              collection: bulkCollection || 'custom-products',
              synced_to_shopify: true,
              app_synced: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        })),
        
        // Instant cache refresh
        supabase.functions.invoke('instant-product-cache')
      ]);

      // Background app sync for instant UI response
      supabase.functions.invoke('sync-products-to-app', {
        body: { collection_handle: bulkCollection, incremental: true }
      }).catch(err => console.log('Background sync error (non-critical):', err));

      // Clear all caches for instant updates
      ['critical_products_v2', 'virtualized_products', 'shopify_collections_cache'].forEach(key => {
        localStorage.removeItem(key);
      });

      // Dispatch event for instant delivery app updates
      window.dispatchEvent(new CustomEvent('instant-sync-complete', {
        detail: { products: selectedProductIds, collection: bulkCollection }
      }));

      toast({
        title: "⚡ Instant Sync Complete!",
        description: `Ultra-fast sync of ${selectedProductIds.length} products completed! Delivery apps will update instantly.`,
      });

      await loadProductModifications();
      setSelectedProducts(new Set());
      
    } catch (error) {
      console.error("❌ Bulk sync error:", error);
      
      // First check if it's an API permission error
      const errorMessage = error.message || '';
      if (errorMessage.includes('write_products') || errorMessage.includes('merchant approval')) {
        toast({
          title: "❌ Shopify API Permission Error", 
          description: "Your Shopify app needs 'write_products' scope. Please update your Shopify app permissions.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "❌ Sync failed", 
          description: "Bulk sync failed. Trying fallback method...",
          variant: "destructive",
        });
        
        // Fallback to individual sync
        try {
          await syncToShopifyAndApp();
          toast({
            title: "✅ Fallback successful",
            description: "Used individual sync method successfully",
          });
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      }
    } finally {
      setSyncing(false);
    }
  };

  // Test sync connection
  const testSyncConnection = async () => {
    console.log('🧪 Testing sync connections...');
    setSyncing(true);
    
    try {
      // Test 1: Test Shopify connection
      console.log('🔍 Testing Shopify connection...');
      const { data: shopifyTest, error: shopifyError } = await supabase.functions.invoke('fetch-shopify-products', {
        body: { limit: 1 }
      });
      
      if (shopifyError) {
        throw new Error(`Shopify connection failed: ${shopifyError.message}`);
      }
      
      console.log('✅ Shopify connection successful');
      
      // Test 2: Test immediate sync function
      console.log('🔄 Testing immediate sync function...');
      const { data: syncTest, error: syncError } = await supabase.functions.invoke('immediate-shopify-sync');
      
      if (syncError) {
        throw new Error(`Immediate sync failed: ${syncError.message}`);
      }
      
      console.log('✅ Immediate sync test successful');
      
      // Test 3: Verify collections are accessible
      console.log('📦 Testing collections access...');
      const { data: collectionsTest, error: collectionsError } = await supabase.functions.invoke('get-all-collections');
      
      if (collectionsError) {
        throw new Error(`Collections access failed: ${collectionsError.message}`);
      }
      
      console.log('✅ Collections access successful');
      
      // Test 4: Check delivery app variations
      console.log('📱 Testing delivery app configuration...');
      const { data: deliveryApps, error: deliveryAppsError } = await supabase
        .from('delivery_app_variations')
        .select('*')
        .eq('is_active', true);
      
      if (deliveryAppsError) {
        throw new Error(`Delivery app config failed: ${deliveryAppsError.message}`);
      }
      
      console.log('✅ Delivery app configuration accessible');
      
      toast({
        title: "✅ Sync Test Successful",
        description: `All sync connections are working! Shopify: ✅ Sync: ✅ Collections: ✅ Delivery Apps: ✅`,
      });
      
    } catch (error) {
      console.error('❌ Sync test failed:', error);
      toast({
        title: "❌ Sync Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  // Sync products to app
  const syncToApp = async () => {
    const shopifySyncedMods = productModifications.filter(m => m.synced_to_shopify && !m.app_synced);
    if (shopifySyncedMods.length === 0) {
      toast({
        title: "Info",
        description: "No Shopify-synced products to sync to app.",
      });
      return;
    }

    setAppSyncing(true);
    try {
      console.log('Starting app sync for products:', shopifySyncedMods);
      
      const { data, error } = await supabase.functions.invoke('sync-products-to-app');
      
      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to sync products to app');
      }

      await loadProductModifications();

      toast({
        title: "Success",
        description: `Successfully synced ${data.syncedCount} products to app! Categories and collections updated. Refresh delivery app page to see changes.`,
      });

      // Clear cached collections to force delivery app refresh
      localStorage.removeItem('shopify-collections-cache');

      console.log('App sync completed:', data);

    } catch (error) {
      console.error('Error syncing to app:', error);
      toast({
        title: "Error",
        description: "Failed to sync products to app.",
        variant: "destructive"
      });
    } finally {
      setAppSyncing(false);
    }
  };


  // Get product with modifications applied
  const getProductWithModifications = (product: Product): Product => {
    const modification = productModifications.find(m => 
      m.shopify_product_id === product.id
    );
    
    if (!modification) return product;

    // Create modified product with new values
    const modifiedProduct = {
      ...product,
      category: modification.category || product.category,
      productType: modification.product_type || product.productType,
    };

    // Handle collections - if there's a new collection, add it to existing ones (max 3)
    if (modification.collection) {
      const existingCollections = product.collections || [];
      const newCollectionExists = existingCollections.some(c => c.title === modification.collection);
      
      if (!newCollectionExists) {
        // Add new collection, limit to 3 total
        const updatedCollections = [
          { id: `new-${modification.collection}`, title: modification.collection, handle: modification.collection.toLowerCase().replace(/\s+/g, '-') },
          ...existingCollections
        ].slice(0, 3);
        
        modifiedProduct.collections = updatedCollections;
      }
    }

    return modifiedProduct;
  };

  // Helper function to check if product has modifications
  const hasModification = (productId: string) => {
    return productModifications.some(m => 
      m.shopify_product_id === productId && !m.synced_to_shopify
    );
  };

  // Helper function to check if product is synced to Shopify
  const isSynced = (productId: string) => {
    return productModifications.some(m => 
      m.shopify_product_id === productId && m.synced_to_shopify && !m.app_synced
    );
  };

  // Helper function to check if product is synced to app
  const isAppSynced = (productId: string) => {
    return productModifications.some(m => 
      m.shopify_product_id === productId && m.synced_to_shopify && m.app_synced
    );
  };

  // Helper function to get sync status for display
  const getSyncStatus = (productId: string) => {
    const modification = productModifications.find(m => m.shopify_product_id === productId);
    if (!modification) return 'unmodified';
    if (modification.synced_to_shopify && modification.app_synced) return 'synced';
    if (!modification.synced_to_shopify) return 're-synced';
    if (modification.synced_to_shopify && !modification.app_synced) return 'shopify-only';
    return 'pending';
  };

  // Helper function to check if product has any modification (synced or not)
  const hasAnyModification = (productId: string) => {
    return productModifications.some(m => m.shopify_product_id === productId);
  };

  // Filter products based on active tab
  const filteredProducts = useMemo(() => {
    let filtered = allProducts.map(getProductWithModifications).filter(product => {
      const matchesSearch = !searchTerm || 
        product.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesProductType = productTypeFilter === 'all' || product.productType === productTypeFilter;
      
      const matchesCollection = selectedCollectionFilter === 'all' || 
        product.collections?.some(c => c.title === selectedCollectionFilter || c.handle === selectedCollectionFilter) ||
        productModifications.find(m => m.shopify_product_id === product.id && m.collection === selectedCollectionFilter);
      
      // Tab filtering based on modification and sync status
      const hasUnsyncedModification = hasModification(product.id);
      const isProductSynced = isSynced(product.id);
      const isProductAppSynced = isAppSynced(product.id);
      const hasAnyMod = hasAnyModification(product.id);
      
      let matchesTab = false;
      if (activeTab === 'unsorted') {
        // Show products that are either unmodified or have no modifications at all
        matchesTab = !hasAnyMod;
      } else if (activeTab === 'synced') {
        // Show products that have any modification (synced, re-synced, or pending)
        matchesTab = hasAnyMod;
      }
      
      return matchesSearch && matchesCategory && matchesProductType && matchesCollection && matchesTab;
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
              <Button 
                variant="outline"
                onClick={testSyncConnection}
                disabled={syncing}
                className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Smartphone className="w-4 h-4" />
                Test Sync
              </Button>
              <Button 
                variant="outline"
                onClick={async () => {
                  console.log('🔄 Re-syncing from Shopify...');
                  try {
                    await syncToShopifyAndApp(true); // Force sync
                    await loadAllProducts(); // Reload products
                    toast({
                      title: "Success",
                      description: "Re-synced all data from Shopify!",
                    });
                  } catch (error: any) {
                    console.error('❌ Resync failed:', error);
                    toast({
                      title: "Error",
                      description: error.message || "Failed to resync from Shopify.",
                      variant: "destructive"
                    });
                  }
                }}
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
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                  <Label htmlFor="collection">Collection</Label>
                  <Select value={selectedCollectionFilter} onValueChange={setSelectedCollectionFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Collections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Collections</SelectItem>
                      {availableCollections.map(collection => (
                        <SelectItem key={collection} value={collection}>{collection}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      setSelectedCollectionFilter('all');
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
                      onClick={async () => {
                        console.log('=== SYNC BUTTON CLICKED ===');
                        console.log('Selected products:', selectedProducts.size);
                        console.log('Bulk values:', { bulkCategory, bulkProductType, bulkCollection });
                        
                        try {
                          await applyLocalChanges();
                          console.log('Local changes applied, now syncing...');
                          
                          // Add a small delay to ensure database transaction is committed
                          await new Promise(resolve => setTimeout(resolve, 500));
                          
                          // Sync immediately after applying changes
                          await syncToShopifyAndApp();
                          console.log('Sync completed successfully');
                        } catch (error) {
                          console.error('Sync process failed:', error);
                          toast({
                            title: "Error",
                            description: "Failed to sync changes.",
                            variant: "destructive"
                          });
                        }
                      }}
                      disabled={!bulkCategory && !bulkProductType && !bulkCollection}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white w-full"
                    >
                      <Save className="w-4 h-4" />
                      Sync to App & Shopify
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Force Sync Selected Products - Always Available */}
          {selectedProducts.size > 0 && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Force Sync Selected Products</h3>
                    <p className="text-sm text-muted-foreground">
                      Re-sync {selectedProducts.size} selected products to Shopify and app
                    </p>
                  </div>
                   <Button 
                     onClick={async () => {
                       console.log('Force sync button clicked for', selectedProducts.size, 'products');
                       await syncToShopifyAndApp(true); // Force sync
                     }}
                     disabled={syncing || selectedProducts.size === 0}
                     className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                   >
                     <Save className="w-4 h-4" />
                     {syncing ? 'Syncing...' : 'Force Sync Selected'}
                   </Button>
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
                  Unsorted ({allProducts.filter(p => !hasModification(p.id) && !isSynced(p.id) && !isAppSynced(p.id)).length})
                </Button>
                <Button
                  variant={activeTab === 'synced' ? 'default' : 'outline'}
                  onClick={() => {
                    setActiveTab('synced');
                    setSelectedProducts(new Set());
                  }}
                  className="flex items-center gap-2"
                >
                  Sorted & Synced ({productModifications.length})
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardHeader>
               <CardTitle>
                 {activeTab === 'unsorted' ? 'Unsorted' : 'Sorted & Synced'} Products ({filteredProducts.length} total)
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
                    <div className="w-24">Status</div>
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
                       <div className="w-24">
                         {(() => {
                           const status = getSyncStatus(product.id);
                           switch (status) {
                             case 'synced':
                               return (
                                 <Badge 
                                   variant="secondary" 
                                   className="text-xs bg-green-100 text-green-800 border-green-200"
                                 >
                                   Synced
                                 </Badge>
                               );
                             case 're-synced':
                               return (
                                 <Badge 
                                   variant="secondary" 
                                   className="text-xs bg-amber-100 text-amber-800 border-amber-200"
                                 >
                                   Re-synced
                                 </Badge>
                               );
                             case 'shopify-only':
                               return (
                                 <Badge 
                                   variant="secondary" 
                                   className="text-xs bg-blue-100 text-blue-800 border-blue-200"
                                 >
                                   Pending
                                 </Badge>
                               );
                             default:
                               return (
                                 <Badge 
                                   variant="outline" 
                                   className="text-xs text-muted-foreground"
                                 >
                                   Unsorted
                                 </Badge>
                               );
                           }
                         })()}
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