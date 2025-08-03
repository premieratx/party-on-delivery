-- Create delivery app variations table for custom delivery apps
CREATE TABLE IF NOT EXISTS public.delivery_app_variations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  app_name TEXT NOT NULL,
  app_slug TEXT NOT NULL UNIQUE,
  collections_config JSONB NOT NULL DEFAULT '{"tab_count": 5, "tabs": []}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_app_variations ENABLE ROW LEVEL SECURITY;

-- Admin users can manage delivery app variations
CREATE POLICY "Admin users can manage delivery app variations" 
ON public.delivery_app_variations 
FOR ALL 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.email = auth.email()
));

-- Public can view active delivery app variations
CREATE POLICY "Public can view active delivery app variations" 
ON public.delivery_app_variations 
FOR SELECT 
TO anon, authenticated
USING (is_active = true);

-- Create updated_at trigger
CREATE TRIGGER update_delivery_app_variations_updated_at
  BEFORE UPDATE ON public.delivery_app_variations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create performance optimization table for tracking improvements
CREATE TABLE IF NOT EXISTS public.performance_optimizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  optimization_type TEXT NOT NULL,
  description TEXT NOT NULL,
  target_metric TEXT NOT NULL,
  baseline_value NUMERIC,
  current_value NUMERIC,
  improvement_percentage NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  applied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for performance optimizations
ALTER TABLE public.performance_optimizations ENABLE ROW LEVEL SECURITY;

-- Admin users can manage performance optimizations
CREATE POLICY "Admin users can manage performance optimizations" 
ON public.performance_optimizations 
FOR ALL 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.email = auth.email()
));

-- Create updated_at trigger for performance optimizations
CREATE TRIGGER update_performance_optimizations_updated_at
  BEFORE UPDATE ON public.performance_optimizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();