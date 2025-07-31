-- Create comprehensive progress tracking tables

-- User session progress (for guest users and logged-in users)
CREATE TABLE public.user_session_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_email TEXT,
  progress_type TEXT NOT NULL, -- 'cart', 'checkout', 'form', 'preferences'
  progress_data JSONB NOT NULL DEFAULT '{}',
  page_context TEXT, -- which page/component this progress relates to
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast retrieval
CREATE INDEX idx_user_session_progress_session_id ON public.user_session_progress(session_id);
CREATE INDEX idx_user_session_progress_user_id ON public.user_session_progress(user_id);
CREATE INDEX idx_user_session_progress_email ON public.user_session_progress(customer_email);
CREATE INDEX idx_user_session_progress_type ON public.user_session_progress(progress_type);

-- Cart persistence (enhanced)
CREATE TABLE public.saved_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_email TEXT,
  cart_items JSONB NOT NULL DEFAULT '[]',
  delivery_info JSONB DEFAULT '{}',
  customer_info JSONB DEFAULT '{}',
  applied_discounts JSONB DEFAULT '{}',
  affiliate_code TEXT,
  group_order_token TEXT,
  cart_value NUMERIC DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for cart retrieval
CREATE INDEX idx_saved_carts_session_id ON public.saved_carts(session_id);
CREATE INDEX idx_saved_carts_user_id ON public.saved_carts(user_id);
CREATE INDEX idx_saved_carts_email ON public.saved_carts(customer_email);

-- Order drafts (for incomplete orders)
CREATE TABLE public.order_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_email TEXT,
  draft_data JSONB NOT NULL DEFAULT '{}',
  checkout_step TEXT DEFAULT 'datetime', -- 'datetime', 'address', 'customer', 'payment'
  stripe_session_id TEXT,
  total_amount NUMERIC,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for order drafts
CREATE INDEX idx_order_drafts_session_id ON public.order_drafts(session_id);
CREATE INDEX idx_order_drafts_user_id ON public.order_drafts(user_id);
CREATE INDEX idx_order_drafts_email ON public.order_drafts(customer_email);

-- User preferences and settings
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_email TEXT,
  preferences JSONB NOT NULL DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}',
  delivery_preferences JSONB DEFAULT '{}',
  payment_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(customer_email)
);

-- App configuration and state
CREATE TABLE public.app_state_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  snapshot_name TEXT,
  app_state JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.user_session_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_state_snapshots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_session_progress
CREATE POLICY "Users can manage their own session progress" ON public.user_session_progress
  FOR ALL USING (
    user_id = auth.uid() OR 
    customer_email = auth.email() OR
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

-- Create RLS policies for saved_carts
CREATE POLICY "Users can manage their own saved carts" ON public.saved_carts
  FOR ALL USING (
    user_id = auth.uid() OR 
    customer_email = auth.email() OR
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

-- Create RLS policies for order_drafts
CREATE POLICY "Users can manage their own order drafts" ON public.order_drafts
  FOR ALL USING (
    user_id = auth.uid() OR 
    customer_email = auth.email() OR
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

-- Create RLS policies for user_preferences
CREATE POLICY "Users can manage their own preferences" ON public.user_preferences
  FOR ALL USING (user_id = auth.uid() OR customer_email = auth.email());

-- Create RLS policies for app_state_snapshots
CREATE POLICY "Users can manage their own app snapshots" ON public.app_state_snapshots
  FOR ALL USING (user_id = auth.uid());

-- System can manage all progress data
CREATE POLICY "System can manage progress data" ON public.user_session_progress
  FOR ALL USING (true)
  WITH CHECK (true);

CREATE POLICY "System can manage saved carts" ON public.saved_carts
  FOR ALL USING (true)
  WITH CHECK (true);

CREATE POLICY "System can manage order drafts" ON public.order_drafts
  FOR ALL USING (true)
  WITH CHECK (true);

CREATE POLICY "System can manage preferences" ON public.user_preferences
  FOR ALL USING (true)
  WITH CHECK (true);

CREATE POLICY "System can manage app snapshots" ON public.app_state_snapshots
  FOR ALL USING (true)
  WITH CHECK (true);

-- Create function to clean up expired progress data
CREATE OR REPLACE FUNCTION public.cleanup_expired_progress()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Clean up expired session progress
  DELETE FROM public.user_session_progress WHERE expires_at < now();
  
  -- Clean up expired saved carts
  DELETE FROM public.saved_carts WHERE expires_at < now();
  
  -- Clean up expired order drafts
  DELETE FROM public.order_drafts WHERE expires_at < now();
  
  -- Log cleanup
  INSERT INTO public.optimization_logs (task_id, log_level, message, details)
  VALUES ('cleanup-progress', 'info', 'Cleaned up expired progress data', jsonb_build_object('timestamp', now()));
END;
$$;

-- Create trigger for updating timestamps
CREATE TRIGGER update_user_session_progress_updated_at
  BEFORE UPDATE ON public.user_session_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saved_carts_updated_at
  BEFORE UPDATE ON public.saved_carts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_order_drafts_updated_at
  BEFORE UPDATE ON public.order_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();