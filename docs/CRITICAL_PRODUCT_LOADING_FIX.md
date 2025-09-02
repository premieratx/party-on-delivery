# CRITICAL: Product Loading Fix Documentation

## THE PROBLEM THAT KEEPS BREAKING
The `instant-product-cache` function fails with "malformed array literal" errors when filtering by collection.

## THE EXACT FIX (NEVER CHANGE THIS)
```typescript
// ✅ CORRECT - PostgreSQL array syntax
if (collection_handle && collection_handle !== 'all') {
  query = query.filter('collection_handles', 'cs', `{${collection_handle}}`)
}

// ❌ WRONG - JavaScript array syntax (BREAKS EVERYTHING)
if (collection_handle && collection_handle !== 'all') {
  query = query.contains('collection_handles', [collection_handle])
}
```

## WHY THIS HAPPENS
- PostgreSQL expects array literals in format: `{value1,value2}`
- JavaScript arrays `[value]` cause "malformed array literal" errors
- The `cs` operator means "contains" in PostgREST
- The backtick template literal creates proper PostgreSQL format

## FUNCTION HIERARCHY (USE IN THIS ORDER)
1. **instant-product-cache** - Individual collections in exact Shopify order
2. **get-unified-products** - All products with collection grouping
3. **optimized-product-loader** - Fallback if others fail

## CRITICAL WORKFLOW
1. Click tab → calls `useProductPreloader` 
2. → calls `instant-product-cache` with collection_handle
3. → returns products in exact Shopify `sort_order ASC`
4. → displays in UI preserving order

## NEVER DO THESE THINGS
- ❌ Don't change PostgreSQL array syntax
- ❌ Don't switch to different functions without fixing this first
- ❌ Don't modify the ORDER BY sort_order ASC
- ❌ Don't change collection filtering logic

## IF IT BREAKS AGAIN
1. Check `instant-product-cache` line ~59 for array syntax
2. Ensure it uses `query.filter('collection_handles', 'cs', `{${collection_handle}}`)`
3. Verify `ORDER BY sort_order ASC` is intact
4. Check logs for "malformed array literal" errors