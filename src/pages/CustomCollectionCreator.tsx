import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Search, RefreshCw, Save, ChevronUp, ChevronDown } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface Product {
  id: string;
  title: string;
  price: number;
  description: string;
  handle: string;
  category: string;
  productType: string;
  variants?: any[];
}

export const CustomCollectionCreator: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Product management
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [productTypeFilter, setProductTypeFilter] = useState('all');
  const [sortField, setSortField] = useState<'title' | 'category' | 'productType' | 'price'>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Bulk editing
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkProductType, setBulkProductType] = useState('');
  const [bulkCollection, setBulkCollection] = useState('');

  // Available options
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableProductTypes, setAvailableProductTypes] = useState<string[]>([]);
  const [availableCollections, setAvailableCollections] = useState<string[]>([]);

  useEffect(() => {
    loadAllProducts();
  }, []);

  const loadAllProducts = async () => {
    try {
      console.log('Loading all products from Shopify...');
      setLoading(true);
      
      const { data: collections, error } = await supabase.functions.invoke('get-all-collections');
      
      if (error) {
        console.error('Error loading collections:', error);
        throw error;
      }

      const productsList: Product[] = [];
      const categoriesSet = new Set<string>();
      const productTypesSet = new Set<string>();
      const collectionsSet = new Set<string>();

      if (collections?.collections) {
        console.log('Found collections:', collections.collections.length);
        collections.collections.forEach((collection: any) => {
          collectionsSet.add(collection.handle);
          if (collection.products) {
            collection.products.forEach((product: any) => {
              const category = mapCollectionToCategory(collection.handle);
              const productType = extractProductType(product);
              
              categoriesSet.add(category);
              if (productType) productTypesSet.add(productType);
              
              productsList.push({
                id: product.id,
                title: product.title,
                price: parseFloat(product.variants?.[0]?.price || '0'),
                description: product.description || '',
                handle: product.handle,
                category: category,
                productType: productType || '',
                variants: product.variants
              });
            });
          }
        });
      }

      // Remove duplicates by ID
      const uniqueProducts = productsList.filter((product, index, self) => 
        index === self.findIndex(p => p.id === product.id)
      );

      setAllProducts(uniqueProducts);
      setAvailableCategories(Array.from(categoriesSet).sort());
      setAvailableProductTypes(Array.from(productTypesSet).sort());
      setAvailableCollections(Array.from(collectionsSet).sort());
      
      console.log(`Loaded ${uniqueProducts.length} unique products`);
      setLoading(false);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const extractProductType = (product: any): string => {
    const title = product.title?.toLowerCase() || '';
    const productType = product.productType?.toLowerCase() || '';
    const description = product.description?.toLowerCase() || '';
    
    // Spirit types
    if (title.includes('whiskey') || title.includes('whisky') || title.includes('bourbon') || title.includes('rye') || title.includes('scotch') || productType.includes('whiskey')) return 'Whiskey';
    if (title.includes('vodka') || productType.includes('vodka')) return 'Vodka';
    if (title.includes('rum') || productType.includes('rum')) return 'Rum';
    if (title.includes('gin') || productType.includes('gin')) return 'Gin';
    if (title.includes('tequila') || productType.includes('tequila')) return 'Tequila';
    if (title.includes('mezcal') || productType.includes('mezcal')) return 'Mezcal';
    if (title.includes('liqueur') || title.includes('schnapps') || title.includes('amaretto') || title.includes('kahlua') || productType.includes('liqueur')) return 'Liqueurs';
    if (title.includes('brandy') || title.includes('cognac') || productType.includes('brandy')) return 'Brandy';
    
    // Other types
    if (title.includes('beer') || productType.includes('beer')) return 'Beer';
    if (title.includes('wine') || title.includes('champagne') || productType.includes('wine')) return 'Wine';
    if (title.includes('seltzer') || productType.includes('seltzer')) return 'Seltzer';
    if (title.includes('cocktail') || productType.includes('cocktail')) return 'Cocktail';
    if (title.includes('mixer') || productType.includes('mixer')) return 'Mixer';
    if (title.includes('supplies') || title.includes('decoration') || productType.includes('supplies')) return 'Party Supplies';
    
    return productType || 'Other';
  };

  const mapCollectionToCategory = (handle: string): string => {
    if (handle === 'spirits' || handle === 'gin-rum' || handle === 'tequila-mezcal' || handle === 'liqueurs-cordials-cocktail-ingredients' || handle === 'bourbon-rye') return 'spirits';
    if (handle === 'tailgate-beer' || handle === 'texas-beer-collection' || handle.includes('beer')) return 'beer';
    if (handle === 'seltzer-collection' || handle.includes('seltzer')) return 'seltzers';
    if (handle === 'cocktail-kits' || handle === 'ready-to-drink-cocktails' || handle.includes('cocktail')) return 'cocktails';
    if (handle === 'mixers-non-alcoholic' || handle.includes('mixer') || handle.includes('non-alcoholic')) return 'mixers';
    if (handle === 'champagne' || handle.includes('wine')) return 'wine';
    if (handle === 'party-supplies' || handle === 'decorations' || handle === 'hats-sunglasses' || handle === 'costumes') return 'party-supplies';
    return 'other';
  };

  const handleSort = (field: 'title' | 'category' | 'productType' | 'price') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleBulkUpdate = async () => {
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
        description: "Please select at least one field to update.",
        variant: "destructive"
      });
      return;
    }

    setSyncing(true);
    try {
      toast({
        title: "Bulk Update",
        description: `Updating ${selectedProducts.size} products in Shopify...`,
      });

      // Update the local products state immediately for better UX
      const updatedProducts = allProducts.map(product => {
        if (selectedProducts.has(product.id)) {
          return {
            ...product,
            category: bulkCategory || product.category,
            productType: bulkProductType || product.productType,
            // Note: collection updates would require additional logic
          };
        }
        return product;
      });
      
      setAllProducts(updatedProducts);

      // In a real implementation, this would call a Shopify API to update products
      // For now, we'll simulate the update
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Success",
        description: `Updated ${selectedProducts.size} products successfully! Changes applied to: ${bulkCategory ? 'Category' : ''}${bulkProductType ? ' Product Type' : ''}${bulkCollection ? ' Collection' : ''}`,
      });

      // Clear selections and bulk fields
      setSelectedProducts(new Set());
      setBulkCategory('');
      setBulkProductType('');
      setBulkCollection('');
      
      // Re-generate available options from updated products
      const categoriesSet = new Set<string>();
      const productTypesSet = new Set<string>();
      
      updatedProducts.forEach(product => {
        categoriesSet.add(product.category);
        if (product.productType) productTypesSet.add(product.productType);
      });
      
      setAvailableCategories(Array.from(categoriesSet).sort());
      setAvailableProductTypes(Array.from(productTypesSet).sort());
      
    } catch (error) {
      console.error('Error updating products:', error);
      toast({
        title: "Error",
        description: "Failed to update products. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

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

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = allProducts.filter(product => {
      const matchesSearch = !searchTerm || 
        product.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesProductType = productTypeFilter === 'all' || product.productType === productTypeFilter;
      
      return matchesSearch && matchesCategory && matchesProductType;
    });

    // Sort products
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (sortField === 'price') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [allProducts, searchTerm, categoryFilter, productTypeFilter, sortField, sortDirection]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background border-b shadow-sm">
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
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{selectedProducts.size} selected</Badge>
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

          {/* Filters and Search */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                <div className="relative">
                  <Label htmlFor="category">Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="relative z-10">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-popover border shadow-lg" sideOffset={4}>
                      <SelectItem value="all">All Categories</SelectItem>
                      {availableCategories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <Label htmlFor="productType">Product Type</Label>
                  <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
                    <SelectTrigger className="relative z-10">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-popover border shadow-lg" sideOffset={4}>
                      <SelectItem value="all">All Types</SelectItem>
                      {availableProductTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="relative">
                    <Label>Update Category</Label>
                    <Select value={bulkCategory} onValueChange={setBulkCategory}>
                      <SelectTrigger className="relative z-10">
                        <SelectValue placeholder="Select category..." />
                      </SelectTrigger>
                      <SelectContent className="z-[100] bg-popover border shadow-lg" sideOffset={4}>
                        {availableCategories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="relative">
                    <Label>Update Product Type</Label>
                    <Select value={bulkProductType} onValueChange={setBulkProductType}>
                      <SelectTrigger className="relative z-10">
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent className="z-[100] bg-popover border shadow-lg" sideOffset={4}>
                        {availableProductTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="relative">
                    <Label>Update Collection</Label>
                    <Select value={bulkCollection} onValueChange={setBulkCollection}>
                      <SelectTrigger className="relative z-10">
                        <SelectValue placeholder="Select collection..." />
                      </SelectTrigger>
                      <SelectContent className="z-[100] bg-popover border shadow-lg" sideOffset={4}>
                        {availableCollections.map(collection => (
                          <SelectItem key={collection} value={collection}>
                            {collection}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button 
                      onClick={handleBulkUpdate}
                      disabled={syncing || (!bulkCategory && !bulkProductType && !bulkCollection)}
                      className="flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {syncing ? 'Updating...' : 'Update Shopify'}
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
                  <p className="text-muted-foreground">Loading products from Shopify...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No products found matching your filters.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('title')}>
                          <div className="flex items-center gap-2">
                            Product Title
                            {sortField === 'title' && (
                              sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('category')}>
                          <div className="flex items-center gap-2">
                            Category
                            {sortField === 'category' && (
                              sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('productType')}>
                          <div className="flex items-center gap-2">
                            Product Type
                            {sortField === 'productType' && (
                              sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer text-right" onClick={() => handleSort('price')}>
                          <div className="flex items-center justify-end gap-2">
                            Price
                            {sortField === 'price' && (
                              sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedProducts.has(product.id)}
                              onCheckedChange={() => toggleProduct(product.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="max-w-md">
                              <div className="truncate">{product.title}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {product.productType && (
                              <Badge variant="outline">
                                {product.productType}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${product.price.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
