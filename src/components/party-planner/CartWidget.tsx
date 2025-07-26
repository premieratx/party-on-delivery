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

export const CartWidget = ({ items }: CartWidgetProps) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalCost = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (totalItems === 0) return null;

  return (
    <Card 
      className="fixed right-4 z-50 w-48 bg-primary text-primary-foreground shadow-lg animate-in slide-in-from-right-5"
      style={{ top: '75%', transform: 'translateY(-50%)' }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-2">
          <ShoppingCart className="w-4 h-4 mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold">{totalItems}</div>
            <div className="text-xs opacity-90 mb-1">items</div>
            <div className="text-lg font-semibold">${totalCost.toFixed(2)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};