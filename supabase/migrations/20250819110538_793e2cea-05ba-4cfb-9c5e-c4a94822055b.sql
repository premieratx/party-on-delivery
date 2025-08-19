-- Deactivate all active cover pages to prevent old homepage from loading
UPDATE public.cover_pages 
SET is_active = false, updated_at = now()
WHERE is_active = true;

-- Deactivate custom affiliate sites that might be redirecting
UPDATE public.custom_affiliate_sites 
SET is_active = false, updated_at = now()
WHERE is_active = true;

-- Ensure the default delivery app is properly set as homepage
UPDATE public.delivery_app_variations 
SET is_homepage = true, is_active = true, updated_at = now()
WHERE app_slug = 'main-delivery-app';

-- Make sure no other delivery apps are set as homepage
UPDATE public.delivery_app_variations 
SET is_homepage = false, updated_at = now()
WHERE app_slug != 'main-delivery-app' AND is_homepage = true;

-- Log the deactivation
INSERT INTO public.optimization_logs (task_id, log_level, message, details)
VALUES (
  'deactivate-old-homepage',
  'info',
  'Deactivated old cover pages and custom sites to restore default delivery app homepage',
  jsonb_build_object(
    'timestamp', now(),
    'action', 'Deactivated cover pages and custom affiliate sites',
    'reason', 'User requested to show default delivery app instead of old cover screen'
  )
);