import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Upload, Plus, Minus, Search, Filter, X } from 'lucide-react';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { parseProductTitle } from '@/utils/productUtils';
import { ProductSkeleton } from '@/components/common/ProductSkeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  description: string;
  handle: string;
  category: string;
  variants?: any[];
  images?: string[];
}

interface Draft {
  id?: string;
  title: string;
  handle: string;
  description: string;
  selected_product_ids: string[];
}

export const CustomCollectionCreator: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draft');
  const { toast } = useToast();

  // Collection details
  const [collectionTitle, setCollectionTitle] = useState('');
  const [collectionHandle, setCollectionHandle] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');

  // Product selection
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Available categories from collections
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<Record<string, Product[]>>({});
  const [loadedCategories, setLoadedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCategories();
    if (draftId) {
      loadDraft(draftId);
    }
  }, [draftId]);

  useEffect(() => {
    // Load products for selected category if not already loaded
    if (selectedCategory !== 'all' && !loadedCategories.has(selectedCategory) && categories.length > 0) {
      loadCategoryProducts(selectedCategory);
    } else if (selectedCategory === 'all' && !loadedCategories.has('all') && categories.length > 0) {
      loadCategoryProducts('all');
    }
  }, [selectedCategory, categories, loadedCategories]);

  useEffect(() => {
    if (collectionTitle && !collectionHandle) {
      // Auto-generate handle from title
      const handle = collectionTitle
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
      setCollectionHandle(handle);
    }
  }, [collectionTitle]);

  const loadCategories = async () => {
    try {
      console.log('Loading categories...');
      
      const { data: collections, error } = await supabase.functions.invoke('get-all-collections');
      
      if (error) {
        console.error('Error loading collections:', error);
        throw error;
      }

      const availableCategories = new Set<string>();

      if (collections?.collections) {
        collections.collections.forEach((collection: any) => {
          if (collection.products && collection.products.length > 0) {
            const category = mapCollectionToCategory(collection.handle);
            availableCategories.add(category);
          }
        });
      }

      // Create categories array with "All Categories" at the end
      const categoriesArray = [
        ...Array.from(availableCategories).sort().map(cat => ({
          id: cat,
          label: cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        })),
        { id: 'all', label: 'All Categories' }
      ];

      setCategories(categoriesArray);
      
      // Set default to first specific category to avoid loading all products
      if (categoriesArray.length > 0 && categoriesArray[0].id !== 'all') {
        setSelectedCategory(categoriesArray[0].id);
      }
      
      console.log(`Found ${availableCategories.size} categories`);
      setLoading(false);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const loadCategoryProducts = async (category: string) => {
    if (loadedCategories.has(category)) return;
    
    try {
      console.log(`Loading products for category: ${category}`);
      
      const { data: collections, error } = await supabase.functions.invoke('get-all-collections');
      
      if (error) throw error;

      const categoryProductsList: Product[] = [];

      if (collections?.collections) {
        collections.collections.forEach((collection: any) => {
          if (collection.products) {
            collection.products.forEach((product: any) => {
              const productCategory = mapCollectionToCategory(collection.handle);
              
              if (category === 'all' || productCategory === category) {
                categoryProductsList.push({
                  id: product.id,
                  title: product.title,
                  price: parseFloat(product.variants?.[0]?.price || '0'),
                  image: product.featuredImage?.url || product.images?.[0]?.url || '',
                  description: product.description || '',
                  handle: product.handle,
                  category: productCategory,
                  variants: product.variants,
                  images: product.images
                });
              }
            });
          }
        });
      }

      setCategoryProducts(prev => ({
        ...prev,
        [category]: categoryProductsList
      }));

      setLoadedCategories(prev => new Set(prev).add(category));
      
      if (category === 'all') {
        setAllProducts(categoryProductsList);
      }
      
      console.log(`Loaded ${categoryProductsList.length} products for ${category}`);
    } catch (error) {
      console.error('Error loading category products:', error);
      toast({
        title: "Error",
        description: `Failed to load ${category} products. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const mapCollectionToCategory = (handle: string): string => {
    if (handle === 'spirits' || handle === 'gin-rum' || handle === 'tequila-mezcal' || handle === 'liqueurs-cordials-cocktail-ingredients') return 'spirits';
    if (handle === 'tailgate-beer' || handle === 'texas-beer-collection' || handle.includes('beer')) return 'beer';
    if (handle === 'seltzer-collection' || handle.includes('seltzer')) return 'seltzers';
    if (handle === 'cocktail-kits' || handle === 'ready-to-drink-cocktails' || handle.includes('cocktail')) return 'cocktails';
    if (handle === 'mixers-non-alcoholic' || handle.includes('mixer') || handle.includes('non-alcoholic')) return 'mixers';
    if (handle === 'champagne' || handle.includes('wine')) return 'wine';
    if (handle === 'party-supplies' || handle === 'decorations' || handle === 'hats-sunglasses' || handle === 'costumes') return 'party-supplies';
    return 'other';
  };

  const loadDraft = async (draftId: string) => {
    try {
      const { data, error } = await supabase
        .from('collection_drafts')
        .select('*')
        .eq('id', draftId)
        .single();

      if (error) throw error;

      setCollectionTitle(data.title);
      setCollectionHandle(data.handle);
      setCollectionDescription(data.description || '');
      setSelectedProducts(new Set(data.selected_product_ids));

      toast({
        title: "Draft Loaded",
        description: `Resumed collection "${data.title}" with ${data.selected_product_ids.length} products selected.`
      });
    } catch (error) {
      console.error('Error loading draft:', error);
      toast({
        title: "Error",
        description: "Failed to load draft. Starting fresh.",
        variant: "destructive"
      });
    }
  };

  const saveDraft = async () => {
    if (!collectionTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a collection title.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const draftData = {
        title: collectionTitle,
        handle: collectionHandle,
        description: collectionDescription,
        selected_product_ids: Array.from(selectedProducts)
      };

      if (draftId) {
        // Update existing draft
        const { error } = await supabase
          .from('collection_drafts')
          .update(draftData)
          .eq('id', draftId);

        if (error) throw error;
      } else {
        // Create new draft
        const { data, error } = await supabase
          .from('collection_drafts')
          .insert([draftData])
          .select()
          .single();

        if (error) throw error;

        // Update URL with draft ID
        navigate(`/admin/create-collection?draft=${data.id}`, { replace: true });
      }

      toast({
        title: "Draft Saved",
        description: `Collection saved with ${selectedProducts.size} products selected.`
      });
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const publishCollection = async () => {
    if (!collectionTitle.trim() || selectedProducts.size === 0) {
      toast({
        title: "Error",
        description: "Please enter a title and select at least one product.",
        variant: "destructive"
      });
      return;
    }

    setPublishing(true);
    try {
      // First save/create the custom collection
      const { data: collection, error: collectionError } = await supabase
        .from('custom_collections')
        .insert([{
          title: collectionTitle,
          handle: collectionHandle,
          description: collectionDescription,
          product_ids: Array.from(selectedProducts),
          is_published: true
        }])
        .select()
        .single();

      if (collectionError) throw collectionError;

      // Sync with Shopify (via edge function)
      const { data: shopifyData, error: shopifyError } = await supabase.functions.invoke('sync-custom-collection-to-shopify', {
        body: {
          collection_id: collection.id,
          title: collectionTitle,
          handle: collectionHandle,
          description: collectionDescription,
          product_ids: Array.from(selectedProducts)
        }
      });

      if (shopifyError) {
        console.warn('Shopify sync failed, but collection was created locally:', shopifyError);
      } else {
        // Update with Shopify collection ID
        await supabase
          .from('custom_collections')
          .update({ shopify_collection_id: shopifyData.shopify_collection_id })
          .eq('id', collection.id);
      }

      // Clean up draft if it exists
      if (draftId) {
        await supabase
          .from('collection_drafts')
          .delete()
          .eq('id', draftId);
      }

      toast({
        title: "Collection Published",
        description: `"${collectionTitle}" has been created and synced with Shopify!`
      });

      navigate('/admin');
    } catch (error) {
      console.error('Error publishing collection:', error);
      toast({
        title: "Error",
        description: "Failed to publish collection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPublishing(false);
    }
  };

  const toggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else if (newSelected.size < 100) {
      newSelected.add(productId);
    } else {
      toast({
        title: "Limit Reached",
        description: "Maximum 100 products per collection.",
        variant: "destructive"
      });
      return;
    }
    setSelectedProducts(newSelected);
  };

  // Get products for current category
  const currentProducts = useMemo(() => {
    if (selectedCategory === 'all') {
      return allProducts;
    }
    return categoryProducts[selectedCategory] || [];
  }, [selectedCategory, allProducts, categoryProducts]);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return currentProducts.filter(product => {
      const matchesSearch = !searchTerm || 
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [currentProducts, searchTerm]);

  // Handle category change and load products if needed
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    // Load products if needed
    if (!loadedCategories.has(category)) {
      loadCategoryProducts(category);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin')}
              className="text-muted-foreground hover:text-foreground flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Admin Dashboard
            </Button>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{selectedProducts.size}/100 selected</Badge>
              <Button 
                variant="outline"
                onClick={saveDraft}
                disabled={saving || !collectionTitle.trim()}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button 
                onClick={publishCollection}
                disabled={publishing || !collectionTitle.trim() || selectedProducts.size === 0}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {publishing ? 'Publishing...' : 'Publish & Sync w/ Shopify'}
              </Button>
            </div>
          </div>

          {/* Collection Details */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Collection Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Collection Title *</Label>
                  <Input
                    id="title"
                    value={collectionTitle}
                    onChange={(e) => setCollectionTitle(e.target.value)}
                    placeholder="e.g., Austin Party Essentials"
                  />
                </div>
                <div>
                  <Label htmlFor="handle">Handle</Label>
                  <Input
                    id="handle"
                    value={collectionHandle}
                    onChange={(e) => setCollectionHandle(e.target.value)}
                    placeholder="auto-generated from title"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={collectionDescription}
                  onChange={(e) => setCollectionDescription(e.target.value)}
                  placeholder="Describe this collection..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Search and Filters */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search products to add..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-auto"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="flex items-start gap-4 mb-4">
            <span className="text-sm font-medium text-foreground mt-2">Categories:</span>
            <RadioGroup 
              value={selectedCategory} 
              onValueChange={handleCategoryChange}
              className="flex flex-wrap gap-4"
            >
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={category.id} id={category.id} className="w-4 h-4" />
                  <Label htmlFor={category.id} className="text-sm cursor-pointer whitespace-nowrap">
                    {category.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {loading ? "Loading..." : 
               !loadedCategories.has(selectedCategory) ? "Loading products..." : 
               `${filteredProducts.length} products available`}
              {searchTerm && ` matching "${searchTerm}"`}
              {selectedCategory !== "all" && ` in ${categories.find(c => c.id === selectedCategory)?.label}`}
            </span>
            {selectedCategory !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCategoryChange("all")}
                className="text-xs"
              >
                Clear filter
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-6">
        {(loading || !loadedCategories.has(selectedCategory)) ? (
          <div className="grid grid-cols-3 md:grid-cols-8 gap-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No products found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-8 gap-4">
            {filteredProducts.map((product, index) => {
              const isSelected = selectedProducts.has(product.id);
              const { cleanTitle, packageSize } = parseProductTitle(product.title);
              
              return (
                <Card 
                  key={`${product.id}-${index}`} 
                  className={`group transition-all duration-200 cursor-pointer ${
                    isSelected 
                      ? 'ring-2 ring-primary bg-primary/10' 
                      : 'hover:shadow-lg hover:ring-1 hover:ring-primary/20'
                  }`}
                  onClick={() => toggleProduct(product.id)}
                >
                  <CardContent className="p-2">
                    <div className="flex flex-col items-center text-center h-full gap-1">
                      {/* Selection indicator */}
                      <div className="w-full flex justify-between items-start mb-1">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected 
                            ? 'bg-primary border-primary text-primary-foreground' 
                            : 'border-muted-foreground'
                        }`}>
                          {isSelected && (
                            <Plus className="w-3 h-3 rotate-45" />
                          )}
                        </div>
                      </div>
                      
                      {/* Product Image */}
                      <div className="w-full aspect-[3/2] rounded overflow-hidden flex-shrink-0">
                        <OptimizedImage 
                          src={product.image} 
                          alt={product.title}
                          className="w-full h-full"
                          priority={index < 24}
                        />
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1 flex flex-col justify-between min-h-0 w-full">
                        <div>
                          <h4 className="font-medium text-xs leading-tight line-clamp-2 mb-1">
                            {cleanTitle}
                          </h4>
                          {packageSize && (
                            <p className="text-xs text-muted-foreground mb-1">
                              {packageSize}
                            </p>
                          )}
                          <p className="text-sm font-bold text-primary">
                            ${product.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};