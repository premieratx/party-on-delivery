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

  // Always show the widget, even with 0 items to show budget info
  return (
    <Card 
      className="fixed right-4 z-50 w-52 bg-primary text-primary-foreground shadow-lg animate-in slide-in-from-right-5"
      style={{ top: '70%', transform: 'translateY(-50%)' }}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <ShoppingCart className="w-4 h-4 mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xl font-bold">{totalItems}</div>
            <div className="text-xs opacity-90 mb-1">items selected</div>
            <div className="text-base font-semibold">${totalCost.toFixed(2)}</div>
            <div className="text-xs opacity-90">total cost</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};