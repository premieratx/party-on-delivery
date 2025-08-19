-- CRITICAL SECURITY FIXES - Fix exposed customer data and business intelligence
-- Phase 1: Remove ALL existing problematic policies first

-- 1. Clean up ORDER DRAFTS policies completely
DO $$ 
DECLARE
    policy_name TEXT;
BEGIN
    -- Get all policies for order_drafts and drop them
    FOR policy_name IN 
        SELECT pol.policyname 
        FROM pg_policies pol 
        WHERE pol.tablename = 'order_drafts' AND pol.schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.order_drafts';
    END LOOP;
END $$;

-- 2. Clean up OPTIMIZATION LOGS policies  
DO $$ 
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT pol.policyname 
        FROM pg_policies pol 
        WHERE pol.tablename = 'optimization_logs' AND pol.schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.optimization_logs';
    END LOOP;
END $$;

-- 3. Clean up AUTOMATION SESSIONS policies
DO $$ 
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT pol.policyname 
        FROM pg_policies pol 
        WHERE pol.tablename = 'automation_sessions' AND pol.schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.automation_sessions';
    END LOOP;
END $$;

-- 4. Clean up other sensitive tables
DO $$ 
DECLARE
    policy_name TEXT;
BEGIN
    -- Clean master_automation_sessions if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'master_automation_sessions') THEN
        FOR policy_name IN 
            SELECT pol.policyname 
            FROM pg_policies pol 
            WHERE pol.tablename = 'master_automation_sessions' AND pol.schemaname = 'public'
        LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.master_automation_sessions';
        END LOOP;
    END IF;
    
    -- Clean product_modifications if exists  
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_modifications') THEN
        FOR policy_name IN 
            SELECT pol.policyname 
            FROM pg_policies pol 
            WHERE pol.tablename = 'product_modifications' AND pol.schemaname = 'public'
        LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.product_modifications';
        END LOOP;
    END IF;
END $$;