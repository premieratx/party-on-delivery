UPDATE cover_pages 
SET slug = 'cover/' || slug 
WHERE slug NOT LIKE 'cover/%';