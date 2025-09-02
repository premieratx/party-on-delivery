import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search } from 'lucide-react';

export const TailgateBeerOrderChecker: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const { toast } = useToast();

  const checkTailgateBeerOrder = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-tailgate-beer-order');

      if (error) throw error;

      if (data.success) {
        setProducts(data.products);
        toast({
          title: "Tailgate Beer Order Retrieved",
          description: `Found ${data.products.length} products in correct Shopify order`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error checking order:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get Tailgate Beer order",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Tailgate Beer Collection Order
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={checkTailgateBeerOrder}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Checking...' : 'Get Tailgate Beer Order from Shopify'}
        </Button>

        {products.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <h3 className="font-semibold">Products in Shopify Order (1-{products.length}):</h3>
            {products.map((product, index) => (
              <div key={product.id} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                <span className="font-mono w-8">{index + 1}.</span>
                <span className="flex-1">{product.title}</span>
                <span className="text-xs text-muted-foreground">${product.price}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};