## Shopify Webhook Setup Guide

To integrate Shopify webhooks with your Party On Delivery app, follow these steps:

### 1. Create Webhook Endpoints in Shopify Admin

1. Go to your Shopify Admin: `https://[your-store].myshopify.com/admin`
2. Navigate to **Settings** → **Notifications**
3. Scroll down to **Webhooks** section
4. Click **Create webhook**

### 2. Configure Webhook URLs

For each webhook type, use this URL format:
```
https://acmlfzfliqupwxwoefdq.supabase.co/functions/v1/shopify-webhook-receiver
```

### 3. Recommended Webhook Topics

Set up webhooks for these events:

**Order Management:**
- `orders/create` - New order created
- `orders/updated` - Order details changed
- `orders/paid` - Payment received
- `orders/cancelled` - Order cancelled
- `orders/fulfilled` - Order shipped/delivered

**Product Management:**
- `products/create` - New product added
- `products/update` - Product details changed

**Customer Management:**
- `customers/create` - New customer registration
- `customers/update` - Customer details changed

### 4. Webhook Configuration

For each webhook:
- **URL:** `https://acmlfzfliqupwxwoefdq.supabase.co/functions/v1/shopify-webhook-receiver`
- **Format:** JSON
- **API Version:** 2024-01 (latest stable)

### 5. Webhook Security (Optional but Recommended)

1. Generate a webhook secret in Shopify
2. Add it to your Supabase secrets as `SHOPIFY_WEBHOOK_SECRET`
3. The webhook handler will automatically verify signatures

### 6. Test Your Webhooks

1. Create a test order in your Shopify store
2. Check the Supabase Function logs to verify webhooks are received
3. Verify data is stored in your `shopify_orders_cache` table

### 7. Webhook Handler Features

The webhook receiver automatically:
- ✅ Stores order data in `shopify_orders_cache`
- ✅ Sends order confirmations via email
- ✅ Updates order status in real-time
- ✅ Invalidates product cache on product updates
- ✅ Tracks fulfillment status
- ✅ Handles order cancellations

### 8. Monitoring Webhooks

Monitor webhook activity in:
- **Shopify Admin:** Settings → Notifications → Webhooks (shows delivery status)
- **Supabase Logs:** Functions → shopify-webhook-receiver → Logs
- **Database:** Check `shopify_orders_cache` table for processed orders

### 9. Troubleshooting

**Common Issues:**
- **404 errors:** Verify webhook URL is correct
- **Authentication errors:** Check SHOPIFY_WEBHOOK_SECRET is set
- **Missing data:** Verify webhook topics are configured
- **Duplicate processing:** Webhooks may retry - this is handled automatically

**Debug Steps:**
1. Check Supabase function logs for errors
2. Verify webhook URL responds (should return 404 for GET requests)
3. Test with Shopify's webhook testing tool
4. Check database for stored webhook data

The webhook system is now ready to automatically sync your Shopify store with your Party On Delivery app!