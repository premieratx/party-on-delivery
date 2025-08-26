-- Create table for standard operating procedures
CREATE TABLE IF NOT EXISTS public.system_documentation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT DEFAULT 'system',
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.system_documentation ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage documentation" 
ON public.system_documentation 
FOR ALL 
USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

CREATE POLICY "Documentation is publicly readable" 
ON public.system_documentation 
FOR SELECT 
USING (true);