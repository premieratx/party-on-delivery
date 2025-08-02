-- Add app_synced column to product_modifications table
ALTER TABLE public.product_modifications 
ADD COLUMN app_synced boolean DEFAULT false;