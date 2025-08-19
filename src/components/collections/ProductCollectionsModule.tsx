import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, Search, Tag, Plus } from 'lucide-react';

interface Collection {
  id: string;
  title: string;
  handle: string;
  description?: string;
  product_ids: string[];
  is_published: boolean;
  created_at: string;
}

interface ProductCollectionsModuleProps {
  onCollectionSelect?: (collection: Collection) => void;
  selectedCollectionId?: string;
  showManagement?: boolean;
}

export const ProductCollectionsModule: React.FC<ProductCollectionsModuleProps> = ({
  onCollectionSelect,
  selectedCollectionId,
  showManagement = false
}) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('custom_collections')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error('Error loading collections:', error);
      toast({ title: 'Error loading collections', description: 'Please try again', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredCollections = collections.filter(collection =>
    collection.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.handle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCollectionClick = (collection: Collection) => {
    onCollectionSelect?.(collection);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Product Collections Module
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Independent product collections that can be used across different delivery apps
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search collections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCollections.map((collection) => (
                <Card 
                  key={collection.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedCollectionId === collection.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleCollectionClick(collection)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-sm">{collection.title}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {collection.product_ids.length} items
                        </Badge>
                      </div>
                      
                      {collection.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {collection.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Tag className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">/{collection.handle}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredCollections.length === 0 && (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'No collections match your search' : 'No collections available'}
                </p>
                {showManagement && (
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Collection
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedCollectionId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Selected Collection</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {(() => {
              const selectedCollection = collections.find(c => c.id === selectedCollectionId);
              return selectedCollection ? (
                <div className="space-y-2">
                  <p className="font-medium">{selectedCollection.title}</p>
                  <p className="text-sm text-muted-foreground">{selectedCollection.description}</p>
                  <Badge variant="outline">
                    {selectedCollection.product_ids.length} products
                  </Badge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Collection not found</p>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};