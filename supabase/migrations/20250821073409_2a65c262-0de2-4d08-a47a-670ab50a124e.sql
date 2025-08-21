-- Create function to get guidelines by type
CREATE OR REPLACE FUNCTION get_system_guidelines(p_guideline_type TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  guidelines_result JSONB;
BEGIN
  IF p_guideline_type IS NOT NULL THEN
    SELECT jsonb_agg(row_to_json(sg.*))
    INTO guidelines_result
    FROM system_guidelines sg
    WHERE sg.guideline_type = p_guideline_type
      AND sg.is_active = true
    ORDER BY sg.priority DESC, sg.title;
  ELSE
    SELECT jsonb_agg(row_to_json(sg.*))
    INTO guidelines_result  
    FROM system_guidelines sg
    WHERE sg.is_active = true
    ORDER BY sg.priority DESC, sg.guideline_type, sg.title;
  END IF;
  
  RETURN COALESCE(guidelines_result, '[]'::jsonb);
END;
$$;