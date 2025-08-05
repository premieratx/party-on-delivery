-- Fix the shopify sync issue by clearing duplicate product modifications
DELETE FROM product_modifications;