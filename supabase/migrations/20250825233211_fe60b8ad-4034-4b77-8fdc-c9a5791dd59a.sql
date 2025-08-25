-- Remove restrictive policies and make delivery_app_variations fully accessible
DROP POLICY IF EXISTS "Public can read active delivery apps" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "Service role can manage delivery apps" ON public.delivery_app_variations;

-- Create completely open policies for delivery app management
CREATE POLICY "Anyone can read delivery apps" 
ON public.delivery_app_variations 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create delivery apps" 
ON public.delivery_app_variations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update delivery apps" 
ON public.delivery_app_variations 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete delivery apps" 
ON public.delivery_app_variations 
FOR DELETE 
USING (true);

-- Also ensure cover_pages table is fully accessible
DROP POLICY IF EXISTS "cover_pages_unrestricted" ON public.cover_pages;

CREATE POLICY "Cover pages fully accessible" 
ON public.cover_pages 
FOR ALL 
USING (true)
WITH CHECK (true);