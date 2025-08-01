# Payment and Order Processing - Unified Data Flow

## Overview
This document outlines the standardized process for handling payment and order data consistently across all entry points (individual orders, group orders, affiliate links, admin orders) and ensuring proper logging to all data destinations (Stripe, Shopify, Supabase databases, dashboards).

## Data Flow Architecture

### 1. Payment Initiation (create-payment-intent)
**Entry Points:**
- Individual checkout
- Group order addition
- Affiliate-linked purchases
- Admin-initiated orders

**Process:**
1. **Metadata Standardization**: All order data is stored in Stripe PaymentIntent metadata using consistent field names:
   ```javascript
   metadata: {
     cart_items: JSON.stringify(cartItems),
     customer_name: customerName,
     customer_email: customerEmail, 
     customer_phone: customerPhone,
     delivery_date: deliveryDate,
     delivery_time: deliveryTime,
     delivery_address: fullAddress,
     delivery_instructions: instructions,
     subtotal: subtotal.toString(),
     shipping_fee: deliveryFee.toString(),
     sales_tax: salesTax.toString(),
     tip_amount: tipAmount.toString(),
     total_amount: totalAmount.toString(),
     discount_code: affiliateCode,
     discount_amount: discountAmount.toString(),
     affiliate_code: affiliateCode,
     group_order_token: groupOrderToken, // For group additions
     is_adding_to_order: isAddingToOrder.toString()
   }
   ```

2. **Amount Verification**: Cross-validate that total matches breakdown to prevent 100x errors
3. **Group Order Detection**: Check for `group_order_token` to identify group additions
4. **Return Payment Intent**: Client secret returned for Stripe Elements

### 2. Payment Completion (create-shopify-order)
**Triggered by:** Successful Stripe payment completion

**Process:**
1. **Retrieve Payment Data**: Get PaymentIntent/CheckoutSession from Stripe (authoritative source)
2. **Extract Standardized Metadata**: Parse all order data from Stripe metadata
3. **Group Order Handling**:
   - If `group_order_token` exists, attempt to join existing group order
   - Use `join_group_order` database function for atomic operations
   - Link to original order and update group participants

4. **Shopify Order Creation**:
   - Create/update customer in Shopify
   - Parse cart items with fallback for different metadata formats
   - Create order with exact financial matching to Stripe charge
   - Apply proper tags for order type (group, affiliate, bundle)

5. **Supabase Order Storage**:
   - **ALWAYS** create record in `customer_orders` table (both individual and group)
   - Store standardized order data structure
   - Generate `share_token` for order sharing
   - Link to order groups and affiliate data

### 3. Dashboard Data Synchronization
**Multiple sync points ensure dashboard accuracy:**

**Real-time Sync (sync-customer-order-realtime):**
- Called immediately after Shopify order creation
- Updates dashboard data in real-time
- Broadcasts updates via Supabase Realtime

**Batch Sync (sync-customer-orders):**
- Periodic sync for data consistency
- Handles missed real-time updates
- Reconciles data across all sources

**Dashboard Data Sources:**
- `customer_orders` (primary order data)
- `affiliate_referrals` (commission tracking)
- `order_groups` (group order management)
- `shopify_orders` (Shopify integration data)

### 4. Notification System
**Email Confirmations:**
- Order confirmation with share link
- Group order notifications
- Affiliate commission alerts

**SMS Notifications:**
- Customer order confirmation
- Admin order alerts
- Delivery reminders

## Data Consistency Rules

### 1. Single Source of Truth
- **Payment Data**: Stripe PaymentIntent metadata (authoritative)
- **Order Processing**: Standardized data extraction from Stripe
- **Financial Totals**: Must match exactly between Stripe, Shopify, and Supabase

### 2. Error Handling
- **Non-Critical Failures**: Email, SMS, affiliate tracking failures don't block order creation
- **Critical Failures**: Payment verification, Shopify order creation failures block process
- **Logging**: Comprehensive logging at each step for debugging

### 3. Group Order Special Handling
- **Metadata Preservation**: Group orders store cart items in multiple metadata fields
- **Atomic Operations**: Use database functions for group joins
- **Share Token Management**: Generate and preserve share tokens for order continuity

## Order Type Matrix

| Order Type | Entry Point | Special Handling | Dashboard Visibility |
|------------|-------------|-----------------|-------------------|
| Individual | Direct checkout | Standard flow | Customer + Admin dashboards |
| Group Addition | Share link | Join group, link to original | All dashboards + group view |
| Affiliate | Discount code | Commission tracking | Affiliate + Admin dashboards |
| Bundle | Second order | Free shipping, bundle tags | Enhanced order grouping |

## Troubleshooting Common Issues

### "No cart items found" Error
**Cause**: Group orders may store cart data in different metadata fields
**Solution**: Enhanced parsing with fallbacks (cart_items → line_items → items)

### Orders Not in Dashboard
**Cause**: customer_orders record not created or sync failure
**Solution**: Ensure ALL orders create customer_orders record, check sync functions

### Group Orders Not Linking
**Cause**: group_order_token not properly passed or invalid
**Solution**: Validate token exists and is UUID format, check join_group_order function

### Financial Mismatches
**Cause**: Rounding errors or calculation differences between systems
**Solution**: Use parseFloat() consistently, validate totals match

## Monitoring and Alerts

### Key Metrics
- Order creation success rate
- Payment-to-Shopify conversion rate  
- Dashboard sync success rate
- Group order join success rate

### Alert Conditions
- Order creation failures
- Financial total mismatches
- Missing cart items in group orders
- Sync function failures

## Future Enhancements
- Webhook integration for improved reliability
- Enhanced error recovery mechanisms
- Real-time order tracking
- Advanced group order management