-- Update the main get-dashboard-data function to use the new fixed version
CREATE OR REPLACE FUNCTION get_dashboard_data(dashboard_type text, user_email text DEFAULT NULL, affiliate_code text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN get_dashboard_data_fixed(dashboard_type, user_email, affiliate_code);
END;
$$;