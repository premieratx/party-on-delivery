-- Permanently disable homepage cover modal feature
UPDATE homepage_cover_config SET is_active = false WHERE is_active = true;

-- Add a note in the database about this fix
COMMENT ON TABLE homepage_cover_config IS 'Homepage cover modal feature disabled per user request - causing popup interference with main delivery app';