# Shopify Webhook URLs for Party On Delivery

## Main Webhook Endpoint

Use this URL for all webhook subscriptions in your Shopify Admin:

```
https://acmlfzfliqupwxwoefdq.supabase.co/functions/v1/shopify-webhook-receiver
```

## Setup Instructions

1. Go to your Shopify Admin: `https://[your-store].myshopify.com/admin`
2. Navigate to **Settings** → **Notifications**
3. Scroll down to **Webhooks** section
4. Click **Create webhook**

For each webhook, use:
- **Endpoint URL:** `https://acmlfzfliqupwxwoefdq.supabase.co/functions/v1/shopify-webhook-receiver`
- **Format:** JSON
- **API Version:** 2024-01 (latest stable)

## Required Webhook Topics

Set up webhooks for these events:

### Order Management
- `orders/create` - New order created
- `orders/updated` - Order details changed  
- `orders/paid` - Payment received
- `orders/cancelled` - Order cancelled
- `orders/fulfilled` - Order shipped/delivered

### Product Management  
- `products/create` - New product added
- `products/update` - Product details changed

### Customer Management
- `customers/create` - New customer registration
- `customers/update` - Customer details changed

## Webhook Features

The webhook receiver automatically:
- ✅ Stores order data in `shopify_orders_cache`
- ✅ Sends order confirmations via email
- ✅ Updates order status in real-time
- ✅ Invalidates product cache on product updates
- ✅ Tracks fulfillment status
- ✅ Handles order cancellations
- ✅ Processes driver tips as separate line items
- ✅ Includes delivery fees, sales tax, and tips in total calculations

## Security

The webhook endpoint includes automatic signature verification for security. No additional configuration needed.

## Testing

After setup, create a test order in Shopify to verify webhooks are working:
1. Check Supabase Function logs for webhook receipt
2. Verify order data appears in `shopify_orders_cache` table
3. Confirm email notifications are sent

## Monitoring

Monitor webhook activity in:
- **Shopify Admin:** Settings → Notifications → Webhooks (delivery status)
- **Supabase Logs:** Functions → shopify-webhook-receiver → Logs
- **Database:** `shopify_orders_cache` table for processed orders