-- Complete cleanup - final step to ensure standalone architecture

-- Just ensure the basic cleanup is done
UPDATE cover_pages SET buttons = '[]' WHERE buttons IS NULL OR buttons = 'null';

-- Verify all connection columns are gone
SELECT column_name, table_name 
FROM information_schema.columns 
WHERE (column_name LIKE '%cover_page%' OR column_name LIKE '%delivery_app%' OR column_name LIKE '%post_checkout%') 
AND table_schema = 'public';