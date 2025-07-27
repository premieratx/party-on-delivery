import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Save, Trash2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Product {
  id: string;
  handle: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  data: any;
}

interface CustomCategory {
  id: string;
  name: string;
  handle: string;
  products: string[];
  created_at: string;
}

export default function ProductCategoryManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCreateCategory, setShowCreateCategory] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load all products from cache
      const { data: productsData, error: productsError } = await supabase
        .from('shopify_products_cache')
        .select('*')
        .order('title');

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Load custom categories (we'll create this table)
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('custom_product_categories')
        .select('*')
        .order('name');

      if (categoriesError) {
        // Table might not exist yet, that's okay
        console.log('Custom categories table not found:', categoriesError);
        setCategories([]);
      } else {
        setCategories(categoriesData || []);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const createCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const handle = newCategoryName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      const { data, error } = await supabase
        .from('custom_product_categories')
        .insert([{
          name: newCategoryName,
          handle: handle,
          products: []
        }])
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data]);
      setNewCategoryName('');
      setShowCreateCategory(false);
      toast.success('Category created successfully');

    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    }
  };

  const saveCategory = async () => {
    if (!selectedCategory) return;

    try {
      const { error } = await supabase
        .from('custom_product_categories')
        .update({ products: selectedProducts })
        .eq('id', selectedCategory);

      if (error) throw error;

      setCategories(prev => 
        prev.map(cat => 
          cat.id === selectedCategory 
            ? { ...cat, products: selectedProducts }
            : cat
        )
      );

      toast.success('Category updated successfully');

    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase
        .from('custom_product_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      if (selectedCategory === categoryId) {
        setSelectedCategory('');
        setSelectedProducts([]);
      }
      toast.success('Category deleted successfully');

    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const category = categories.find(cat => cat.id === categoryId);
    setSelectedProducts(category?.products || []);
  };

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.handle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Product Category Manager</h1>
          <p className="text-muted-foreground">Create custom categories and organize products</p>
        </div>
        <Button onClick={() => setShowCreateCategory(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Category
        </Button>
      </div>

      {showCreateCategory && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="category-name">Category Name</Label>
                <Input
                  id="category-name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Premium Wines"
                />
              </div>
              <Button onClick={createCategory}>Create</Button>
              <Button variant="outline" onClick={() => setShowCreateCategory(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Select a category to manage its products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categories.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No custom categories yet. Create one to get started.
                </p>
              ) : (
                categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => handleCategorySelect(category.id)}
                    >
                      <p className={`font-medium ${selectedCategory === category.id ? 'text-primary' : ''}`}>
                        {category.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {category.products.length} products
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteCategory(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product Selection Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>
                  {selectedCategory ? 'Manage Products' : 'Select a Category'}
                </CardTitle>
                {selectedCategory && (
                  <CardDescription>
                    Selected: {selectedProducts.length} products
                  </CardDescription>
                )}
              </div>
              {selectedCategory && (
                <Button onClick={saveCategory} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedCategory ? (
              <p className="text-muted-foreground text-center py-8">
                Select a category from the left panel to manage its products.
              </p>
            ) : (
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Selected Products Summary */}
                {selectedProducts.length > 0 && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <h4 className="font-medium mb-2">Selected Products ({selectedProducts.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProducts.slice(0, 10).map((productId) => {
                        const product = products.find(p => p.id === productId);
                        return (
                          <Badge key={productId} variant="secondary">
                            {product?.title || 'Unknown Product'}
                          </Badge>
                        );
                      })}
                      {selectedProducts.length > 10 && (
                        <Badge variant="outline">+{selectedProducts.length - 10} more</Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Product Grid */}
                <div className="max-h-96 overflow-y-auto border rounded-md p-4">
                  <div className="grid grid-cols-1 gap-3">
                    {filteredProducts.map((product) => (
                      <div key={product.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProducts(prev => [...prev, product.id]);
                            } else {
                              setSelectedProducts(prev => prev.filter(id => id !== product.id));
                            }
                          }}
                        />
                        <img 
                          src={product.image_url} 
                          alt={product.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{product.title}</p>
                          <p className="text-sm text-muted-foreground">
                            ${product.price} • {product.handle}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedProducts(filteredProducts.map(p => p.id))}
                  >
                    Select All Visible
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedProducts([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}