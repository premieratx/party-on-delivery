import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/currency';
import { 
  ShoppingCart, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Trash2 
} from 'lucide-react';

interface AbandonedOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  cart_items: any; // Changed from any[] to any to match Json type
  subtotal: number;
  total_amount: number;
  abandoned_at: string;
  last_activity_at: string;
  affiliate_code?: string;
  session_id: string;
}

export const AbandonedOrdersManager: React.FC = () => {
  const [abandonedOrders, setAbandonedOrders] = useState<AbandonedOrder[]>([]);
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const loadAbandonedOrders = async () => {
    try {
      // Use the get-dashboard-data edge function which has proper admin authentication
      const { data, error } = await supabase.functions.invoke('get-dashboard-data', {
        body: {
          type: 'admin',
          includeAbandonedOrders: true
        }
      });

      if (error) throw error;

      if (data?.success && data?.data?.abandonedOrders) {
        setAbandonedOrders(data.data.abandonedOrders as AbandonedOrder[]);
      } else {
        // Fallback: try direct query with proper error handling
        const { data: directData, error: directError } = await supabase
          .from('abandoned_orders')
          .select('*')
          .order('abandoned_at', { ascending: false })
          .limit(50);

        if (directError) {
          console.error('Direct query failed:', directError);
          setAbandonedOrders([]);
        } else {
          setAbandonedOrders((directData || []) as AbandonedOrder[]);
        }
      }
    } catch (error: any) {
      console.error('Error loading abandoned orders:', error);
      toast({
        title: "Error", 
        description: "Failed to load abandoned orders.",
        variant: "destructive",
      });
      setAbandonedOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAbandonedOrders();
  }, []);

  const toggleTracking = async (enabled: boolean) => {
    try {
      // This would enable/disable the AbandonedOrderTracker component
      setIsTrackingEnabled(enabled);
      
      toast({
        title: enabled ? "Tracking Enabled" : "Tracking Disabled",
        description: enabled 
          ? "Abandoned order tracking is now active." 
          : "Abandoned order tracking has been disabled.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update tracking settings.",
        variant: "destructive",
      });
    }
  };

  const clearOldOrders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('admin-cleanup', {
        body: {
          action: 'clear_abandoned'
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.success) {
        await loadAbandonedOrders();
        toast({
          title: "Orders Cleaned",
          description: "All abandoned orders have been removed.",
        });
      } else {
        throw new Error(data?.error || 'Failed to clean orders');
      }
    } catch (error: any) {
      console.error('Error cleaning orders:', error);
      toast({
        title: "Error",
        description: "Failed to clean old orders.",
        variant: "destructive",
      });
    }
  };

  const deleteIndividualOrder = async (orderId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('abandoned_orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      // Remove from local state
      setAbandonedOrders(prev => prev.filter(order => order.id !== orderId));
      
      toast({
        title: "Order Deleted",
        description: "Abandoned order removed successfully.",
      });
    } catch (error: any) {
      console.error('Error deleting order:', error);
      toast({
        title: "Error",
        description: "Failed to delete order.",
        variant: "destructive",
      });
    }
  };

  const refreshOrders = async () => {
    setLoading(true);
    await loadAbandonedOrders();
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    const newSelected = new Set(selectedOrders);
    if (checked) {
      newSelected.add(orderId);
    } else {
      newSelected.delete(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(new Set(abandonedOrders.map(order => order.id)));
    } else {
      setSelectedOrders(new Set());
    }
  };

  const deleteBulkOrders = async () => {
    if (selectedOrders.size === 0) {
      toast({
        title: "No Orders Selected",
        description: "Please select orders to delete.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const orderIds = Array.from(selectedOrders);
      const { error } = await supabase
        .from('abandoned_orders')
        .delete()
        .in('id', orderIds);

      if (error) throw error;

      // Remove from local state
      setAbandonedOrders(prev => prev.filter(order => !selectedOrders.has(order.id)));
      setSelectedOrders(new Set());
      
      toast({
        title: "Orders Deleted",
        description: `Successfully deleted ${orderIds.length} abandoned orders.`,
      });
    } catch (error: any) {
      console.error('Error deleting bulk orders:', error);
      toast({
        title: "Error",
        description: "Failed to delete selected orders.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading abandoned orders...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Abandoned Orders Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Label htmlFor="tracking-toggle">Enable Abandoned Order Tracking</Label>
              <p className="text-sm text-muted-foreground">
                Track customers who abandon their carts during checkout
              </p>
            </div>
            <Switch
              id="tracking-toggle"
              checked={isTrackingEnabled}
              onCheckedChange={toggleTracking}
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={refreshOrders} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={clearOldOrders} variant="outline" size="sm">
              Clean All Orders
            </Button>
            {selectedOrders.size > 0 && (
              <Button onClick={deleteBulkOrders} variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedOrders.size})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Abandoned Orders ({abandonedOrders.length})</span>
            {abandonedOrders.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedOrders.size === abandonedOrders.length && abandonedOrders.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label className="text-sm">Select All</Label>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {abandonedOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No abandoned orders found.
            </div>
          ) : (
            <div className="space-y-4">
              {abandonedOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedOrders.has(order.id)}
                        onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                        className="mt-1"
                      />
                      <div className="space-y-1">
                        <div className="font-medium">{order.customer_name || 'Anonymous'}</div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {order.customer_email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {order.customer_email}
                            </span>
                          )}
                          {order.customer_phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {order.customer_phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="font-bold text-lg">
                        {formatCurrency(order.total_amount || order.subtotal || 0)}
                      </div>
                      <div className="flex items-center gap-2">
                        {order.affiliate_code && (
                          <Badge variant="secondary" className="text-xs">
                            {order.affiliate_code}
                          </Badge>
                        )}
                        <Button
                          onClick={() => deleteIndividualOrder(order.id)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(order.abandoned_at).toLocaleDateString()} {new Date(order.abandoned_at).toLocaleTimeString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <ShoppingCart className="h-3 w-3" />
                      {Array.isArray(order.cart_items) ? order.cart_items.length : 0} items
                    </span>
                  </div>

                  {order.delivery_address && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {typeof order.delivery_address === 'string' 
                        ? order.delivery_address 
                        : JSON.stringify(order.delivery_address)}
                    </div>
                  )}

                  {order.cart_items && Array.isArray(order.cart_items) && order.cart_items.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm font-medium mb-2">Cart Items:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Array.isArray(order.cart_items) && order.cart_items.slice(0, 4).map((item: any, index: number) => (
                          <div key={index} className="text-sm text-muted-foreground">
                            {item.quantity}x {item.title || item.name || 'Unknown Item'}
                          </div>
                        ))}
                        {Array.isArray(order.cart_items) && order.cart_items.length > 4 && (
                          <div className="text-sm text-muted-foreground">
                            +{order.cart_items.length - 4} more items
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};