# Shopify Sync System Documentation

## CRITICAL: WORKING STATE - DO NOT MODIFY

**Status**: ✅ WORKING PERFECTLY - Products display in exact Shopify collection order
**Date**: January 2025
**Last Verified**: January 2025

## Overview

This system synchronizes products from Shopify and maintains their exact collection order as defined in Shopify admin. Products appear in delivery app tabs in the EXACT same order they are arranged in Shopify collections.

## Core Components

### 1. Product Fetching (`fetch-shopify-products`)
- **Purpose**: Fetches ALL products from Shopify using GraphQL API
- **Key**: Does NOT handle ordering - only gets product data
- **Location**: `supabase/functions/fetch-shopify-products/index.ts`
- **Critical**: Uses pagination to get all 1000+ products

### 2. Emergency Product Sync (`emergency-product-sync`) 
- **Purpose**: Rate-limit-safe product fetching and storage
- **Key**: Stores products in `shopify_products_cache` table
- **Location**: `supabase/functions/emergency-product-sync/index.ts`
- **Critical**: This is the main sync function that actually stores products

### 3. Collection Order Sync (`shopify-collection-order`)
- **Purpose**: Gets products from specific collections in EXACT Shopify order
- **Key**: Updates `sort_order` field in `shopify_products_cache`
- **Location**: `supabase/functions/shopify-collection-order/index.ts`
- **Critical**: This function preserves Shopify collection ordering

### 4. Instant Product Cache (`instant-product-cache`)
- **Purpose**: Fast product retrieval for delivery apps
- **Key**: Orders by `sort_order ASC` - PRESERVES SHOPIFY ORDER
- **Location**: `supabase/functions/instant-product-cache/index.ts`
- **Critical**: Uses `ORDER BY sort_order ASC` to maintain order

## Database Schema

### `shopify_products_cache` Table
```sql
-- Key fields for ordering:
- id: Product ID
- sort_order: INTEGER - Position within collection (1, 2, 3...)
- collection_handles: ARRAY - Which collections product belongs to
- updated_at: Timestamp
```

### `cache` Table
```sql
-- Temporary caching for performance:
- key: Cache identifier (e.g., 'instant_products_tailgate-beer')
- data: Cached product data
- expires_at: Cache expiration timestamp
```

## Critical Order Flow

### 1. Product Sync Process
```
1. ForceProductSync button clicked
2. Calls 'emergency-product-sync' → Stores all products
3. Calls 'shopify-collection-order' for each key collection:
   - tailgate-beer
   - seltzer-collection  
   - cocktail-kits
   - spirits
   - mixers-non-alcoholic
4. Updates sort_order field based on Shopify position
5. Clears cache to force fresh data
6. Page reloads with correct order
```

### 2. Product Display Process
```
1. User switches to tab (e.g., "Beer" tab)
2. Calls 'instant-product-cache' with collection_handle='tailgate-beer'
3. Queries: ORDER BY sort_order ASC, updated_at DESC, id ASC
4. Products display in exact Shopify order
```

## Key Collections (NEVER MODIFY THESE HANDLES)

```javascript
const keyCollections = [
  'tailgate-beer',           // Beer tab
  'seltzer-collection',      // Seltzers tab  
  'cocktail-kits',           // Cocktail Kits tab
  'spirits',                 // Liquor tab
  'mixers-non-alcoholic'     // Mixers/NA tab
];
```

## Force Sync Component

**Location**: `src/components/ForceProductSync.tsx`

**Process**:
1. Emergency product sync (gets all products)
2. Collection order sync (sets correct sort_order)
3. Cache clearing (forces fresh data)
4. Page reload (shows correct order)

## CRITICAL RULES - NEVER BREAK THESE

### ❌ DO NOT:
1. **Modify sort_order calculation** in `shopify-collection-order`
2. **Change ORDER BY** in `instant-product-cache` 
3. **Add custom sorting** that overrides sort_order
4. **Cache products without clearing** after order updates
5. **Modify collection handles** in keyCollections array

### ✅ ALWAYS:
1. **Use ORDER BY sort_order ASC** for product queries
2. **Clear cache** after updating sort_order
3. **Test with "tailgate-beer"** collection (main test case)
4. **Preserve 1-based indexing** (sort_order starts at 1)
5. **Update all key collections** during sync

## Maintenance Commands

### Manual Collection Order Fix
```javascript
// In browser console:
const { data } = await supabase.functions.invoke('shopify-collection-order', {
  body: { collection_handle: 'tailgate-beer' }
});
```

### Force Full Sync
```javascript
// Use the Force Sync button in UI
// Or call emergency-product-sync + collection order sync
```

### Check Product Order
```sql
-- In Supabase SQL editor:
SELECT title, sort_order, collection_handles 
FROM shopify_products_cache 
WHERE 'tailgate-beer' = ANY(collection_handles)
ORDER BY sort_order ASC;
```

## Debugging Guide

### If Products Are Out of Order:
1. Check `sort_order` values in database
2. Run Force Sync button
3. Verify cache is cleared
4. Check ORDER BY in instant-product-cache

### If No Products Load:
1. Check emergency-product-sync logs
2. Verify Shopify API credentials
3. Check rate limiting

### If Some Collections Wrong:
1. Run shopify-collection-order for specific collection
2. Clear cache for that collection
3. Reload page

## System Dependencies

### Required Shopify Permissions:
- `read_products`
- `read_collections`

### Required Environment Variables:
- `SHOPIFY_STORE_URL`
- `SHOPIFY_ADMIN_API_ACCESS_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Performance Notes

- Product cache expires every 30 minutes
- Collection order sync runs only when triggered
- Emergency sync handles 1000+ products efficiently
- Rate limiting prevents Shopify API issues

## Version History

**v1.0 (January 2025)**: Working perfectly - products in exact Shopify order
- ✅ Emergency product sync storing products
- ✅ Collection order sync updating sort_order  
- ✅ Instant cache ordering by sort_order
- ✅ Force sync clearing cache properly
- ✅ All key collections working correctly

---

**⚠️ WARNING**: This system is currently working perfectly. Any modifications to the core ordering logic could break the Shopify order preservation. Always test with "tailgate-beer" collection first.