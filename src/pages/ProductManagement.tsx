import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { parseProductTitle } from '@/utils/productUtils';
import { 
  ArrowLeft, 
  Package, 
  Search, 
  Filter, 
  Edit, 
  Move, 
  Tag,
  ShoppingCart,
  Grid3X3,
  List,
  RefreshCw
} from 'lucide-react';

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  price: number;
  image: string;
  description: string;
  variants: Array<{
    id: string;
    title: string;
    price: number;
    available: boolean;
  }>;
}

interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
  description: string;
  products: ShopifyProduct[];
  products_count?: number;
}

interface ProductCategory {
  id: string;
  shopify_product_id: string;
  product_title: string;
  product_handle: string;
  assigned_category: string;
  subcategory?: string;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

export const ProductManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [collections, setCollections] = useState<ShopifyCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<ShopifyCollection | null>(null);
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isMovingProduct, setIsMovingProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');

  const categoryOptions = [
    'beer',
    'wine', 
    'liquor',
    'cocktails',
    'spirits',
    'mixers',
    'party-supplies',
    'accessories'
  ];

  useEffect(() => {
    loadCollections();
    loadProductCategories();
  }, []);

  const loadCollections = async () => {
    try {
      setLoading(true);
      
      // Fetch collections from Shopify via edge function
      const { data, error } = await supabase.functions.invoke('get-all-collections');
      
      if (error) {
        throw error;
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      const collectionsData = data.collections || [];
      
      // Sort collections alphabetically
      const sortedCollections = collectionsData.sort((a: ShopifyCollection, b: ShopifyCollection) => 
        a.title.localeCompare(b.title)
      );
      
      setCollections(sortedCollections);
      
      toast({
        title: "Success",
        description: `Loaded ${collectionsData.length} collections from Shopify`,
      });
      
    } catch (error: any) {
      console.error('Error loading collections:', error);
      toast({
        title: "Error",
        description: `Failed to load collections: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProductCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('product_title');
        
      if (error) throw error;
      
      setProductCategories(data || []);
    } catch (error: any) {
      console.error('Error loading product categories:', error);
    }
  };

  const selectCollection = (collection: ShopifyCollection) => {
    setSelectedCollection(collection);
    setProducts(collection.products || []);
  };

  const updateProductCategory = async (productId: string, category: string, subcategory?: string) => {
    try {
      setIsMovingProduct(true);
      
      const product = products.find(p => p.id === productId);
      if (!product) return;

      // Update or insert product category
      const { data, error } = await supabase
        .from('product_categories')
        .upsert({
          shopify_product_id: productId,
          product_title: product.title,
          product_handle: product.handle,
          assigned_category: category,
          subcategory: subcategory || null,
          confidence_score: 1.0
        }, {
          onConflict: 'shopify_product_id'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Product "${product.title}" categorized as ${category}${subcategory ? ` (${subcategory})` : ''}`,
      });

      // Refresh product categories
      loadProductCategories();
      
    } catch (error: any) {
      console.error('Error updating product category:', error);
      toast({
        title: "Error",
        description: `Failed to update category: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsMovingProduct(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.handle.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterCategory === 'all') return matchesSearch;
    
    const productCategory = productCategories.find(pc => pc.shopify_product_id === product.id);
    const matchesCategory = productCategory?.assigned_category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getProductCategory = (productId: string) => {
    return productCategories.find(pc => pc.shopify_product_id === productId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading product management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-brand-blue mb-2">
                Product Management
              </h1>
              <p className="text-muted-foreground">
                Organize and categorize your Shopify products
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={loadCollections}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Collections
            </Button>
          </div>
        </div>

        {/* Collections List */}
        {!selectedCollection ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5" />
                Shopify Collections ({collections.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {collections.map((collection) => (
                  <div
                    key={collection.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => selectCollection(collection)}
                  >
                    <div>
                      <h3 className="font-medium">{collection.title}</h3>
                      <p className="text-sm text-muted-foreground">{collection.description}</p>
                      <p className="text-xs text-muted-foreground">Handle: {collection.handle}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">
                        {collection.products?.length || 0} products
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Product Management Interface */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedCollection(null)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Collections
                </Button>
                <div>
                  <h2 className="text-xl font-bold">{selectedCollection.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {products.length} products
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filters and Search */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Search Products</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search by product name or handle..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="w-48">
                    <Label htmlFor="filter">Filter by Category</Label>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {categoryOptions.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products List/Grid */}
            <Card>
              <CardHeader>
                <CardTitle>Products ({filteredProducts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {viewMode === 'list' ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredProducts.map((product) => {
                      const category = getProductCategory(product.id);
                      return (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-4">
                            <img 
                              src={product.image} 
                              alt={product.title}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div>
                              {(() => {
                                const { cleanTitle, packageSize } = parseProductTitle(product.title);
                                return (
                                  <>
                                    <h3 className="font-medium">{cleanTitle}</h3>
                                    {packageSize && (
                                      <p className="text-xs text-muted-foreground">{packageSize}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground">${product.price}</p>
                                    <p className="text-xs text-muted-foreground">Handle: {product.handle}</p>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {category ? (
                              <Badge variant="default">
                                {category.assigned_category}
                                {category.subcategory && ` • ${category.subcategory}`}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Uncategorized</Badge>
                            )}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedProduct(product)}
                                >
                                  <Tag className="h-4 w-4 mr-2" />
                                  Categorize
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Categorize Product</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Product: {product.title}</Label>
                                  </div>
                                  <div>
                                    <Label htmlFor="category">Category</Label>
                                    <Select 
                                      value={newCategory} 
                                      onValueChange={setNewCategory}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {categoryOptions.map(cat => (
                                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="subcategory">Subcategory (Optional)</Label>
                                    <Input
                                      id="subcategory"
                                      placeholder="e.g., IPA, Vodka, Red Wine..."
                                      value={newSubcategory}
                                      onChange={(e) => setNewSubcategory(e.target.value)}
                                    />
                                  </div>
                                  <Button
                                    onClick={() => {
                                      if (newCategory && selectedProduct) {
                                        updateProductCategory(
                                          selectedProduct.id, 
                                          newCategory, 
                                          newSubcategory
                                        );
                                        setNewCategory('');
                                        setNewSubcategory('');
                                      }
                                    }}
                                    disabled={!newCategory || isMovingProduct}
                                    className="w-full"
                                  >
                                    {isMovingProduct ? 'Updating...' : 'Update Category'}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredProducts.map((product) => {
                      const category = getProductCategory(product.id);
                      return (
                        <Card key={product.id} className="overflow-hidden">
                          <div className="aspect-square">
                            <img 
                              src={product.image} 
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <CardContent className="p-3">
                            {(() => {
                              const { cleanTitle, packageSize } = parseProductTitle(product.title);
                              return (
                                <>
                                  <h3 className="font-medium text-sm truncate">{cleanTitle}</h3>
                                  {packageSize && (
                                    <p className="text-xs text-muted-foreground">{packageSize}</p>
                                  )}
                                  <p className="text-sm text-muted-foreground">${product.price}</p>
                                </>
                              );
                            })()}
                            {category ? (
                              <Badge variant="default" className="text-xs mt-2">
                                {category.assigned_category}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs mt-2">
                                Uncategorized
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};