import { ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
interface CartItem {
  id: string;
  productId?: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  eventName?: string;
  category?: string;
}
interface CartWidgetProps {
  items: CartItem[];
}
export const CartWidget = ({
  items
}: CartWidgetProps) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalCost = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <Card className="sticky top-4 bg-card/95 backdrop-blur-sm border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Cart Summary</h3>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Items</span>
            <Badge variant="secondary">{totalItems}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-bold text-lg">${totalCost.toFixed(2)}</span>
          </div>
        </div>

        {totalItems > 0 && (
          <div className="mt-4 space-y-2">
            {items.slice(0, 3).map((item) => (
              <div key={item.id} className="flex justify-between items-center text-xs">
                <span className="truncate flex-1 mr-2">{item.title}</span>
                <span className="font-medium">{item.quantity}x</span>
              </div>
            ))}
            {items.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{items.length - 3} more items
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};