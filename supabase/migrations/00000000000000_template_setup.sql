-- Template Setup Migration
-- This file contains the complete database schema for the Party on Delivery template
-- Run this migration in a new Supabase project to recreate the entire database structure

-- Create update_updated_at_column function first (required by triggers)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create cache table for 30-day data persistence
CREATE TABLE IF NOT EXISTS public.cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  expires_at BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cache_key ON public.cache(key);
CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON public.cache(expires_at);

-- Create customer_profiles table
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create delivery_addresses table
CREATE TABLE IF NOT EXISTS public.delivery_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_email TEXT NOT NULL,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  instructions TEXT,
  is_primary BOOLEAN DEFAULT false,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create order_groups table for delivery bundling
CREATE TABLE IF NOT EXISTS public.order_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  delivery_address TEXT,
  delivery_city TEXT,
  delivery_state TEXT,
  delivery_zip TEXT,
  delivery_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create shopify_orders table
CREATE TABLE IF NOT EXISTS public.shopify_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_group_id UUID REFERENCES public.order_groups(id) ON DELETE CASCADE,
  shopify_order_id TEXT NOT NULL,
  shopify_order_number TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create recent_orders table
CREATE TABLE IF NOT EXISTS public.recent_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_email TEXT NOT NULL,
  shopify_order_id TEXT,
  order_number TEXT,
  total_amount NUMERIC,
  delivery_address_id UUID,
  delivery_date DATE,
  delivery_time TEXT,
  order_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + '30 days'::interval),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create shopify_collections_cache table
CREATE TABLE IF NOT EXISTS public.shopify_collections_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_collection_id TEXT NOT NULL UNIQUE,
  handle TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  products_count INTEGER DEFAULT 0,
  data JSONB NOT NULL,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create shopify_products_cache table
CREATE TABLE IF NOT EXISTS public.shopify_products_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_product_id TEXT NOT NULL UNIQUE,
  handle TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  image_url TEXT,
  collection_id UUID,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create collection_rules table for sharing rules between builds
CREATE TABLE IF NOT EXISTS public.collection_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_collections_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_products_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_rules ENABLE ROW LEVEL SECURITY;

-- Cache table policies
CREATE POLICY "Allow public read access" ON public.cache FOR SELECT USING (true);
CREATE POLICY "Allow service role insert/update" ON public.cache FOR ALL USING (true);

-- Customer profiles policies
CREATE POLICY "Users can view their own profile" ON public.customer_profiles FOR SELECT USING (true);
CREATE POLICY "Users can create profiles" ON public.customer_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own profile" ON public.customer_profiles FOR UPDATE USING (true);

-- Delivery addresses policies
CREATE POLICY "Users can view addresses by email" ON public.delivery_addresses FOR SELECT USING (true);
CREATE POLICY "Users can create addresses" ON public.delivery_addresses FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update addresses by email" ON public.delivery_addresses FOR UPDATE USING (true);

-- Order groups policies
CREATE POLICY "Users can view their own order groups" ON public.order_groups FOR SELECT USING ((user_id = auth.uid()) OR (customer_email = auth.email()));
CREATE POLICY "Users can create their own order groups" ON public.order_groups FOR INSERT WITH CHECK ((user_id = auth.uid()) OR (user_id IS NULL));
CREATE POLICY "Users can update their own order groups" ON public.order_groups FOR UPDATE USING ((user_id = auth.uid()) OR (customer_email = auth.email()));

-- Shopify orders policies
CREATE POLICY "Users can view orders in their groups" ON public.shopify_orders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.order_groups 
    WHERE id = order_group_id 
    AND (user_id = auth.uid() OR customer_email = auth.email())
  )
);
CREATE POLICY "Edge functions can insert shopify orders" ON public.shopify_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Edge functions can update shopify orders" ON public.shopify_orders FOR UPDATE USING (true);

-- Recent orders policies
CREATE POLICY "Users can view orders by email" ON public.recent_orders FOR SELECT USING (expires_at > now());
CREATE POLICY "Users can create orders" ON public.recent_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their orders" ON public.recent_orders FOR UPDATE USING (expires_at > now());

-- Shopify collections cache policies
CREATE POLICY "Collections are publicly readable" ON public.shopify_collections_cache FOR SELECT USING (true);
CREATE POLICY "Edge functions can manage collections cache" ON public.shopify_collections_cache FOR ALL USING (true);

-- Shopify products cache policies
CREATE POLICY "Products are publicly readable" ON public.shopify_products_cache FOR SELECT USING (true);
CREATE POLICY "Edge functions can manage products cache" ON public.shopify_products_cache FOR ALL USING (true);

-- Collection rules policies
CREATE POLICY "Rules are publicly readable" ON public.collection_rules FOR SELECT USING (true);
CREATE POLICY "Service role can manage rules" ON public.collection_rules FOR ALL USING (true);

-- Create triggers for updated_at columns
CREATE TRIGGER update_cache_updated_at
  BEFORE UPDATE ON public.cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_profiles_updated_at
  BEFORE UPDATE ON public.customer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_addresses_updated_at
  BEFORE UPDATE ON public.delivery_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_order_groups_updated_at
  BEFORE UPDATE ON public.order_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shopify_collections_cache_updated_at
  BEFORE UPDATE ON public.shopify_collections_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shopify_products_cache_updated_at
  BEFORE UPDATE ON public.shopify_products_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collection_rules_updated_at
  BEFORE UPDATE ON public.collection_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create utility functions
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.cache WHERE expires_at < EXTRACT(EPOCH FROM now()) * 1000;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_orders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.recent_orders WHERE expires_at < now();
END;
$$;

-- Insert initial collection rule
INSERT INTO public.collection_rules (rule_number, title, description) VALUES 
(1, 'Auto-refresh on addition', 'All collections in use should be refreshed as soon as they are added to ensure up-to-date contents, newly re-synced with Shopify.');