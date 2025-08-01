import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { OrderCompleteView } from '@/components/OrderCompleteView';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const OrderComplete = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrderData = async () => {
      const urlParams = new URLSearchParams(location.search);
      const sessionId = urlParams.get('session_id');
      const paymentIntentId = urlParams.get('payment_intent');
      const orderNumber = urlParams.get('order_number');
      const errorParam = urlParams.get('error');
      
      // Also check localStorage for recent session tracking
      const storedSessionId = localStorage.getItem('lastOrderSessionId');
      const storedPaymentIntent = localStorage.getItem('lastPaymentIntent');
      
      console.log("🔥 ORDER COMPLETE - COMPREHENSIVE DEBUG:", {
        fromUrl: { sessionId, paymentIntentId, orderNumber, errorParam },
        fromStorage: { storedSessionId, storedPaymentIntent },
        fullUrl: window.location.href,
        search: location.search,
        timestamp: new Date().toISOString(),
        allParams: Object.fromEntries(urlParams.entries())
      });
      
      if (errorParam) {
        console.log("🔥 ERROR IN URL - ABORTING");
        setIsLoading(false);
        toast({
          title: "Order Processing Error",
          description: "There was an issue creating your order. Please contact support.",
          variant: "destructive",
        });
        return;
      }
      
      try {
        let foundOrder = null;
        
        // Build comprehensive search terms - include partial matches
        const searchTerms = [
          sessionId,
          paymentIntentId,
          storedSessionId,
          storedPaymentIntent
        ].filter(Boolean);
        
        console.log("🔥 SEARCH TERMS:", searchTerms);
        
        // STRATEGY 1: Direct search by session/payment ID with broader matching
        for (const searchTerm of searchTerms) {
          if (foundOrder) break;
          
          console.log(`🔥 SEARCHING BY ID: ${searchTerm}`);
          
          // Search in both session_id and shopify_order_id fields
          const { data: orders, error } = await supabase
            .from('customer_orders')
            .select(`
              *,
              customer:customers(first_name, last_name, email)
            `)
            .or(`session_id.eq.${searchTerm},shopify_order_id.eq.${searchTerm}`)
            .order('created_at', { ascending: false })
            .limit(10);
          
          console.log(`🔥 SEARCH RESULT for ${searchTerm}:`, { orders, error, count: orders?.length });
          
          if (!error && orders?.length > 0) {
            // Prefer order with customer_id over NULL customer_id
            foundOrder = orders.find(o => o.customer_id) || orders[0];
            console.log(`🔥 ✅ FOUND BY ID ${searchTerm}: Order #${foundOrder.order_number}`, foundOrder);
            break;
          } else {
            console.log(`🔥 ❌ NO ORDER FOUND BY ID: ${searchTerm}`, error);
          }
        }
        
        // STRATEGY 2: Direct lookup by order_number
        if (!foundOrder && orderNumber) {
          console.log(`🔥 SEARCHING BY ORDER_NUMBER: ${orderNumber}`);
          const { data: orderNumberOrders, error: orderError } = await supabase
            .from('customer_orders')
            .select(`
              *,
              customer:customers(first_name, last_name, email)
            `)
            .eq('order_number', orderNumber)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (!orderError && orderNumberOrders?.length > 0) {
            foundOrder = orderNumberOrders[0];
            console.log(`🔥 ✅ FOUND BY ORDER_NUMBER: Order #${foundOrder.order_number}`);
          } else {
            console.log("🔥 ❌ NO ORDER FOUND BY ORDER_NUMBER");
          }
        }
        
        // STRATEGY 3: Recent orders search with improved matching
        if (!foundOrder) {
          console.log("🔥 SEARCHING RECENT ORDERS (last 30 minutes)");
          const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
          
          const { data: recentOrders, error: recentError } = await supabase
            .from('customer_orders')
            .select(`
              *,
              customer:customers(first_name, last_name, email)
            `)
            .gte('created_at', thirtyMinutesAgo)
            .order('created_at', { ascending: false })
            .limit(50);
          
          console.log(`🔥 RECENT ORDERS FOUND:`, recentOrders?.length || 0);
          
          if (!recentError && recentOrders?.length > 0) {
            // Prefer orders with customer_id over NULL customer_id
            const ordersWithCustomer = recentOrders.filter(o => o.customer_id);
            const ordersToSearch = ordersWithCustomer.length > 0 ? ordersWithCustomer : recentOrders;
            
            // Try to match by stored cart data
            const cartTotal = localStorage.getItem('lastCartTotal');
            if (cartTotal && !foundOrder) {
              const targetAmount = parseFloat(cartTotal);
              const matchingOrder = ordersToSearch.find(order => 
                Math.abs(order.total_amount - targetAmount) < 0.01
              );
              
              if (matchingOrder) {
                foundOrder = matchingOrder;
                console.log(`🔥 ✅ MATCHED BY CART TOTAL: Order #${matchingOrder.order_number}`);
              }
            }
            
            // Try to match with localStorage order data
            if (!foundOrder) {
              const storedOrder = localStorage.getItem('partyondelivery_last_order');
              if (storedOrder) {
                try {
                  const parsed = JSON.parse(storedOrder);
                  console.log("🔥 COMPARING WITH STORED ORDER:", parsed);
                  
                  // Match by total amount or customer email
                  const matchedOrder = ordersToSearch.find(order => 
                    Math.abs(parseFloat(order.total_amount.toString()) - parseFloat(parsed.totalAmount || 0)) < 0.01
                  );
                  
                  if (matchedOrder) {
                    foundOrder = matchedOrder;
                    console.log(`🔥 ✅ MATCHED WITH STORED ORDER: Order #${foundOrder.order_number}`);
                  }
                } catch (e) {
                  console.log("🔥 Could not parse stored order data:", e);
                }
              }
            }
            
            // If still no match, take the most recent order as fallback
            if (!foundOrder && ordersToSearch.length > 0) {
              foundOrder = ordersToSearch[0];
              console.log(`🔥 ⚠️  USING MOST RECENT ORDER AS FALLBACK: Order #${foundOrder.order_number}`);
            }
          } else {
            console.log("🔥 ❌ NO RECENT ORDERS FOUND", recentError);
          }
        }
        
        // STRATEGY 4: If still nothing found, get the absolute most recent order
        if (!foundOrder) {
          console.log("🔥 LAST RESORT: Getting most recent order");
          const { data: lastOrder, error: lastError } = await supabase
            .from('customer_orders')
            .select(`
              *,
              customer:customers(first_name, last_name, email)
            `)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          if (!lastError && lastOrder) {
            foundOrder = lastOrder;
            console.log(`🔥 ⚠️  USING ABSOLUTE LAST ORDER: Order #${foundOrder.order_number}`);
          }
        }
        
        if (foundOrder) {
          console.log("🔥 ✅ FINAL ORDER FOUND:", {
            orderNumber: foundOrder.order_number,
            orderId: foundOrder.id,
            sessionId: foundOrder.session_id,
            shopifyId: foundOrder.shopify_order_id,
            createdAt: foundOrder.created_at
          });
          
          // Generate group order name if missing
          if (!foundOrder.group_order_name && foundOrder.customer) {
            const groupName = `${foundOrder.customer.first_name || 'Customer'}'s ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Order`;
            
            try {
              await supabase
                .from('customer_orders')
                .update({ group_order_name: groupName })
                .eq('id', foundOrder.id);
              
              foundOrder.group_order_name = groupName;
              console.log(`🔥 UPDATED GROUP ORDER NAME: ${groupName}`);
            } catch (updateErr) {
              console.log("🔥 Could not update group order name:", updateErr);
            }
          }

          setOrderData(foundOrder);
          
          // Clean up localStorage
          localStorage.removeItem('lastOrderSessionId');
          localStorage.removeItem('lastPaymentIntent');
          localStorage.removeItem('lastCartTotal');

          // Cache for future reference
          localStorage.setItem('lastCompletedOrder', JSON.stringify({
            orderNumber: foundOrder.order_number,
            sessionId: foundOrder.session_id,
            customerName: foundOrder.customer?.first_name || 'Customer',
            customerEmail: foundOrder.customer?.email,
            line_items: foundOrder.line_items,
            total_amount: foundOrder.total_amount,
            delivery_date: foundOrder.delivery_date,
            delivery_time: foundOrder.delivery_time,
            delivery_address: foundOrder.delivery_address,
            share_token: foundOrder.share_token,
            group_order_name: foundOrder.group_order_name
          }));

          // Send confirmation email (don't wait for this)
          supabase.functions.invoke('send-order-confirmation-email', {
            body: {
              orderNumber: foundOrder.order_number,
              stripeSessionId: sessionId,
              customerEmail: foundOrder.customer?.email,
            }
          }).catch(emailError => {
            console.log('🔥 Email send failed (non-blocking):', emailError);
          });
          
          toast({
            title: "🎉 Order Complete!",
            description: `Order #${foundOrder.order_number} has been confirmed.`,
          });
          
        } else {
          console.log("🔥 ❌ NO ORDER FOUND ANYWHERE - SHOWING ERROR");
          setOrderData(null);
        }
        
      } catch (error: any) {
        console.error('🔥 CRITICAL ERROR in loadOrderData:', error);
        setOrderData(null);
        toast({
          title: "Error Loading Order",
          description: "There was a problem loading your order details. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadOrderData();
  }, [location.search, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-muted-foreground">Loading your order details...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="text-muted-foreground mb-6">
            We couldn't locate your order details. If you just placed an order, 
            your payment was likely processed successfully.
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact support with your payment confirmation for assistance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <OrderCompleteView 
      orderNumber={orderData.order_number}
      customerName={orderData.customer?.first_name || 'Customer'}
      orderItems={orderData.line_items || []}
      totalAmount={parseFloat(orderData.total_amount) || 0}
      deliveryDate={orderData.delivery_date}
      deliveryTime={orderData.delivery_time}
      deliveryAddress={orderData.delivery_address}
      shareToken={orderData.share_token}
      groupOrderName={orderData.group_order_name}
    />
  );
};

export default OrderComplete;