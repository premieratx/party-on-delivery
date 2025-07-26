import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Package, Clock, MapPin, User } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { format } from 'date-fns';

interface OrderItem {
  id: string;
  title: string;
  quantity: number;
  price: number;
  image?: string;
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name?: string;
  customer_email?: string;
  total_amount: number;
  subtotal?: number;
  delivery_fee?: number;
  status: string;
  delivery_date?: string;
  delivery_time?: string;
  delivery_address?: any;
  line_items: OrderItem[];
  created_at: string;
  affiliate_code?: string;
}

interface RecentOrdersFeedProps {
  orders: RecentOrder[];
  title?: string;
  maxHeight?: string;
  showCustomerInfo?: boolean;
  refreshInterval?: number;
  onRefresh?: () => void;
}

export const RecentOrdersFeed: React.FC<RecentOrdersFeedProps> = ({
  orders,
  title = "Recent Orders",
  maxHeight = "400px",
  showCustomerInfo = true,
  refreshInterval = 30000,
  onRefresh
}) => {
  const [openOrders, setOpenOrders] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh functionality
  useEffect(() => {
    if (refreshInterval && onRefresh) {
      const interval = setInterval(() => {
        setIsRefreshing(true);
        onRefresh();
        setTimeout(() => setIsRefreshing(false), 1000);
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [refreshInterval, onRefresh]);

  const toggleOrder = (orderId: string) => {
    const newOpenOrders = new Set(openOrders);
    if (newOpenOrders.has(orderId)) {
      newOpenOrders.delete(orderId);
    } else {
      newOpenOrders.add(orderId);
    }
    setOpenOrders(newOpenOrders);
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'default';
      case 'confirmed':
      case 'processing':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (!orders || orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {title}
            {isRefreshing && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No orders yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {title}
          {isRefreshing && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary ml-2"></div>
          )}
          <Badge variant="outline" className="ml-auto">
            {orders.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3" style={{ maxHeight, overflowY: 'auto' }}>
          {orders.map((order) => (
            <Collapsible key={order.id}>
              <div className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full p-0 h-auto justify-between"
                    onClick={() => toggleOrder(order.id)}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="text-left flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">#{order.order_number}</span>
                          <Badge variant={getStatusVariant(order.status)} className="text-xs">
                            {order.status}
                          </Badge>
                          {order.affiliate_code && (
                            <Badge variant="outline" className="text-xs">
                              {order.affiliate_code}
                            </Badge>
                          )}
                        </div>
                        
                        {showCustomerInfo && (order.customer_name || order.customer_email) && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                            <User className="h-3 w-3" />
                            <span>{order.customer_name || order.customer_email}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{getTimeAgo(order.created_at)}</span>
                          </div>
                          <span>{order.line_items?.length || 0} items</span>
                        </div>
                      </div>
                      
                      <div className="text-right ml-4">
                        <div className="font-bold text-lg">
                          {formatCurrency(order.total_amount)}
                        </div>
                        {openOrders.has(order.id) ? (
                          <ChevronUp className="h-4 w-4 mx-auto mt-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 mx-auto mt-1" />
                        )}
                      </div>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="mt-3 pt-3 border-t">
                  <div className="space-y-3">
                    {/* Delivery Info */}
                    {(order.delivery_date || order.delivery_address) && (
                      <div className="space-y-2">
                        {order.delivery_date && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {format(new Date(order.delivery_date), 'EEE, MMM d')}
                              {order.delivery_time && ` at ${order.delivery_time}`}
                            </span>
                          </div>
                        )}
                        
                        {order.delivery_address && (
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span>
                              {order.delivery_address.street}, {order.delivery_address.city}, {order.delivery_address.state}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Order Items */}
                    {order.line_items && order.line_items.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">Items</h5>
                        <div className="space-y-1">
                          {order.line_items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center text-sm bg-muted/30 rounded p-2">
                              <span>{item.quantity}x {item.title}</span>
                              <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Order Summary */}
                    <div className="pt-2 border-t">
                      <div className="space-y-1 text-sm">
                        {order.subtotal && (
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(order.subtotal)}</span>
                          </div>
                        )}
                        {order.delivery_fee !== undefined && (
                          <div className="flex justify-between">
                            <span>Delivery:</span>
                            <span>{order.delivery_fee === 0 ? 'FREE' : formatCurrency(order.delivery_fee)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-medium border-t pt-1">
                          <span>Total:</span>
                          <span>{formatCurrency(order.total_amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};