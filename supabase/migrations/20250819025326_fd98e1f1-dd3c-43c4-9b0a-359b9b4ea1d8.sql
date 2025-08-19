-- Call the collection order function for the main collections
SELECT * FROM supabase.functions.invoke('shopify-collection-order', '{"collection_handle": "beer"}');
SELECT * FROM supabase.functions.invoke('shopify-collection-order', '{"collection_handle": "wine"}'); 
SELECT * FROM supabase.functions.invoke('shopify-collection-order', '{"collection_handle": "spirits"}');
SELECT * FROM supabase.functions.invoke('shopify-collection-order', '{"collection_handle": "mixers"}');
SELECT * FROM supabase.functions.invoke('shopify-collection-order', '{"collection_handle": "party-supplies"}');