-- Harden the trigger function created by the last migration
ALTER FUNCTION public.update_updated_at_column()
  SET search_path = public;