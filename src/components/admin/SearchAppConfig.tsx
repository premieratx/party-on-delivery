import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProductType {
  value: string;
  count: number;
}

interface Category {
  id: string;
  label: string;
  productType: string;
  enabled: boolean;
  subcategories?: SubCategory[];
}

interface SubCategory {
  id: string;
  label: string;
  keywords: string[];
}

export default function SearchAppConfig() {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<Category[]>([
    {
      id: 'all',
      label: 'All Products',
      productType: '',
      enabled: true
    },
    {
      id: 'spirits',
      label: 'Spirits',
      productType: 'spirits',
      enabled: true,
      subcategories: [
        { id: 'whiskey', label: 'Whiskey', keywords: ['whiskey', 'whisky', 'bourbon', 'rye', 'scotch'] },
        { id: 'vodka', label: 'Vodka', keywords: ['vodka'] },
        { id: 'gin', label: 'Gin', keywords: ['gin'] },
        { id: 'rum', label: 'Rum', keywords: ['rum'] },
        { id: 'tequila', label: 'Tequila', keywords: ['tequila'] },
        { id: 'mezcal', label: 'Mezcal', keywords: ['mezcal'] },
        { id: 'liqueurs', label: 'Liqueurs', keywords: ['liqueur', 'liqueurs', 'amaro', 'aperitif', 'digestif', 'cordial'] }
      ]
    },
    {
      id: 'beer',
      label: 'Beer',
      productType: 'beer',
      enabled: true
    },
    {
      id: 'wine',
      label: 'Wine',
      productType: 'wine',
      enabled: true
    },
    {
      id: 'seltzer',
      label: 'Seltzer',
      productType: 'seltzer',
      enabled: true
    },
    {
      id: 'mixers',
      label: 'Mixers & N/A',
      productType: 'mixers',
      enabled: true
    }
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProductTypes();
    loadSavedConfig();
  }, []);

  const loadProductTypes = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-unified-products', {
        body: { use_type: 'search', lightweight: false }
      });

      if (error) throw error;

      const products = data?.products || [];
      
      // Extract unique product types and count them
      const typeCount: Record<string, number> = {};
      products.forEach((product: any) => {
        const type = product.product_type?.toLowerCase()?.trim();
        if (type) {
          typeCount[type] = (typeCount[type] || 0) + 1;
        }
      });

      const types = Object.entries(typeCount)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);

      setProductTypes(types);
    } catch (error) {
      console.error('Error loading product types:', error);
      toast({
        title: "Error",
        description: "Failed to load product types",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSavedConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('configuration_templates')
        .select('*')
        .eq('template_type', 'search_app_config')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setCategories((data.configuration as any)?.categories || categories);
      }
    } catch (error) {
      console.warn('No saved config found, using defaults');
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const config = {
        categories: categories,
        lastUpdated: new Date().toISOString()
      };

      const { error } = await supabase
        .from('configuration_templates')
        .upsert({
          template_type: 'search_app_config',
          template_name: 'Search App Configuration',
          description: 'Configuration for product search app categories and filters',
          configuration: config as any,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Search app configuration saved successfully"
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Error", 
        description: "Failed to save configuration",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateCategory = (index: number, updates: Partial<Category>) => {
    const newCategories = [...categories];
    newCategories[index] = { ...newCategories[index], ...updates };
    setCategories(newCategories);
  };

  const addSubcategory = (categoryIndex: number) => {
    const newCategories = [...categories];
    if (!newCategories[categoryIndex].subcategories) {
      newCategories[categoryIndex].subcategories = [];
    }
    newCategories[categoryIndex].subcategories!.push({
      id: `sub_${Date.now()}`,
      label: '',
      keywords: []
    });
    setCategories(newCategories);
  };

  const updateSubcategory = (categoryIndex: number, subIndex: number, updates: Partial<SubCategory>) => {
    const newCategories = [...categories];
    newCategories[categoryIndex].subcategories![subIndex] = {
      ...newCategories[categoryIndex].subcategories![subIndex],
      ...updates
    };
    setCategories(newCategories);
  };

  const removeSubcategory = (categoryIndex: number, subIndex: number) => {
    const newCategories = [...categories];
    newCategories[categoryIndex].subcategories!.splice(subIndex, 1);
    setCategories(newCategories);
  };

  const addCategory = () => {
    setCategories([...categories, {
      id: `cat_${Date.now()}`,
      label: '',
      productType: '',
      enabled: true
    }]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Search App Configuration</h2>
          <p className="text-muted-foreground">Configure product categories and filters for the search app</p>
        </div>
        <Button onClick={saveConfig} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Configuration
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Product Types</CardTitle>
          <p className="text-sm text-muted-foreground">Product types found in your Shopify store</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {productTypes.map((type) => (
              <Badge key={type.value} variant="outline">
                {type.value} ({type.count})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Search Categories</CardTitle>
          <p className="text-sm text-muted-foreground">Configure which categories appear in the search app</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {categories.map((category, categoryIndex) => (
            <div key={category.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={category.enabled}
                  onCheckedChange={(checked) => updateCategory(categoryIndex, { enabled: !!checked })}
                />
                
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category Label</Label>
                    <Input
                      value={category.label}
                      onChange={(e) => updateCategory(categoryIndex, { label: e.target.value })}
                      placeholder="e.g., Spirits"
                    />
                  </div>
                  
                  <div>
                    <Label>Shopify Product Type</Label>
                    <Select
                      value={category.productType}
                      onValueChange={(value) => updateCategory(categoryIndex, { productType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">All Products</SelectItem>
                        {productTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.value} ({type.count} products)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Subcategories */}
              {category.subcategories && (
                <div className="ml-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Subcategories</Label>
                    <Button size="sm" variant="outline" onClick={() => addSubcategory(categoryIndex)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Subcategory
                    </Button>
                  </div>
                  
                  {category.subcategories.map((sub, subIndex) => (
                    <div key={sub.id} className="flex items-center gap-2 bg-muted/50 p-3 rounded">
                      <div className="flex-1">
                        <Input
                          value={sub.label}
                          onChange={(e) => updateSubcategory(categoryIndex, subIndex, { label: e.target.value })}
                          placeholder="Subcategory name"
                          className="mb-2"
                        />
                        <Input
                          value={sub.keywords.join(', ')}
                          onChange={(e) => updateSubcategory(categoryIndex, subIndex, { 
                            keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                          })}
                          placeholder="Keywords (comma separated)"
                        />
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => removeSubcategory(categoryIndex, subIndex)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {category.id !== 'all' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newCategories = [...categories];
                    if (!newCategories[categoryIndex].subcategories) {
                      newCategories[categoryIndex].subcategories = [];
                    }
                    setCategories(newCategories);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Subcategories
                </Button>
              )}
            </div>
          ))}

          <Button onClick={addCategory} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}