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

  // Always show the widget, even with 0 items to show budget info
  return;
};