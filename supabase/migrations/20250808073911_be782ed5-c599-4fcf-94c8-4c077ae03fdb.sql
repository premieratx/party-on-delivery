-- Create performance_optimizations table to support the performance-optimizer edge function
CREATE TABLE IF NOT EXISTS public.performance_optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  optimization_type TEXT NOT NULL,
  description TEXT NOT NULL,
  target_metric TEXT,
  baseline_value NUMERIC,
  current_value NUMERIC,
  improvement_percentage NUMERIC,
  status TEXT NOT NULL DEFAULT 'applied',
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.performance_optimizations ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow service role (edge functions) full access
DROP POLICY IF EXISTS "Service role can manage performance optimizations" ON public.performance_optimizations;
CREATE POLICY "Service role can manage performance optimizations"
ON public.performance_optimizations
FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- Allow admin users to view data
DROP POLICY IF EXISTS "Admin users can view performance optimizations" ON public.performance_optimizations;
CREATE POLICY "Admin users can view performance optimizations"
ON public.performance_optimizations
FOR SELECT
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = auth.email()));

-- Trigger to keep updated_at fresh
DROP TRIGGER IF EXISTS update_performance_optimizations_updated_at ON public.performance_optimizations;
CREATE TRIGGER update_performance_optimizations_updated_at
BEFORE UPDATE ON public.performance_optimizations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful indexes for reporting
CREATE INDEX IF NOT EXISTS idx_performance_optimizations_type ON public.performance_optimizations(optimization_type);
CREATE INDEX IF NOT EXISTS idx_performance_optimizations_applied_at ON public.performance_optimizations(applied_at);
