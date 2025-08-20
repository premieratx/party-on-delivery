-- Create comprehensive system documentation table
CREATE TABLE IF NOT EXISTS system_documentation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE system_documentation ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage system documentation" 
ON system_documentation 
FOR ALL 
USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

CREATE POLICY "System can read documentation"
ON system_documentation
FOR SELECT
USING (true);

-- Insert comprehensive app architecture documentation
INSERT INTO system_documentation (doc_type, title, content) VALUES 
('app_architecture', 'Complete App Architecture & Flow System', 
jsonb_build_object(
  'overview', 'Modular affiliate marketing platform for delivery/e-commerce with customizable customer journey flows',
  'core_concept', 'Affiliates get custom codes, commission tracking, and personalized customer journey flows composed of modular components',
  'main_features', jsonb_build_array(
    'Affiliate Management - Affiliates get custom codes, commission tracking, and personalized flows',
    'Modular Customer Flows - Pre (cover pages), During (delivery apps), After (post-checkout screens)',
    'Admin Dashboard - Create and assign flow components to affiliates', 
    'Order Processing - Shopify integration with Stripe payments',
    'Analytics & Tracking - Commission tracking, order analytics, affiliate performance'
  ),
  'key_components', jsonb_build_object(
    'cover_pages', 'Landing pages with customizable content, styles, buttons, and font controls',
    'delivery_apps', 'Branded shopping experiences with custom themes, products, and checkout flows',
    'post_checkout_screens', 'Thank you pages with tracking, social links, upsells, and custom messaging',
    'customer_flows', 'Complete journeys linking cover → delivery → post-checkout',
    'affiliate_assignments', 'Affiliates get custom URLs and assigned flow components'
  ),
  'how_it_works', jsonb_build_array(
    '1. Admin creates modular components (cover pages, delivery apps, post-checkout screens)',
    '2. Components are assigned to affiliates via custom flows',
    '3. Customers visit affiliate URLs → guided through personalized journey',
    '4. Orders processed through Shopify, commissions tracked automatically',
    '5. Affiliates monitor performance through dashboard'
  ),
  'database_tables', jsonb_build_object(
    'cover_pages', 'Stores landing page configurations with styles and content',
    'delivery_app_variations', 'Stores delivery app configurations and themes',
    'post_checkout_screens', 'Stores thank you page configurations (NEEDS CREATION)',
    'customer_flows', 'Links components together into complete journeys',
    'affiliates', 'Affiliate partner information and performance metrics',
    'affiliate_flow_assignments', 'Maps specific flows to specific affiliates',
    'customer_orders', 'Order data with affiliate tracking',
    'affiliate_order_tracking', 'Commission and performance tracking'
  ),
  'admin_dashboard_tabs', jsonb_build_object(
    'homepage', 'Configure which delivery app serves as the main homepage',
    'cover_pages', 'Create/edit landing pages with full customization',
    'delivery_apps', 'Create/edit shopping experiences with themes and products',
    'post_checkout', 'Create/edit thank you pages (TO BE IMPLEMENTED)',
    'customer_flows', 'Link components into complete customer journeys',
    'flow_assignments', 'Assign specific flows to specific affiliates',
    'orders', 'View and manage customer orders',
    'affiliates', 'Manage affiliate partners and performance'
  ),
  'url_structure', jsonb_build_object(
    'homepage', '/ - Default delivery app or cover page',
    'affiliate_pages', '/{affiliate_code} - Affiliate-specific landing page',
    'delivery_apps', '/app/{app_slug} - Specific delivery app experience',
    'post_checkout', '/order-complete - Thank you page after purchase',
    'admin', '/admin - Admin dashboard for management'
  ),
  'current_status', jsonb_build_object(
    'working', jsonb_build_array('Cover page creator', 'Delivery app creator', 'Admin dashboard navigation'),
    'needs_completion', jsonb_build_array('Post-checkout screen creator', 'Flow assignment system', 'Affiliate URL routing'),
    'priority_fixes', jsonb_build_array('Scrollable interfaces in admin', 'Form validation', 'Save/edit functionality')
  )
));

-- Insert homepage configuration documentation
INSERT INTO system_documentation (doc_type, title, content) VALUES
('homepage_config', 'Homepage Configuration & Routing Logic',
jsonb_build_object(
  'homepage_logic', 'The homepage (/) displays either a default delivery app or a default cover page based on configuration',
  'priority_order', jsonb_build_array(
    '1. Check for delivery app marked as is_homepage=true',
    '2. If none, check for cover page marked as is_default_homepage=true', 
    '3. Fallback to first active delivery app',
    '4. Ultimate fallback to generic landing page'
  ),
  'configuration_tables', jsonb_build_object(
    'delivery_app_variations', 'Column: is_homepage (boolean) - marks which app serves homepage',
    'cover_pages', 'Column: is_default_homepage (boolean) - marks which cover page serves homepage'
  ),
  'admin_control', 'Admin can set homepage via Homepage tab in admin dashboard using HomepageAppSwitcher component',
  'affiliate_routing', jsonb_build_object(
    'pattern', '/{affiliate_code} routes to affiliate-specific cover page or assigned flow',
    'lookup', 'Checks affiliates table for matching affiliate_code',
    'assignment', 'Uses affiliate_flow_assignments to determine which components to show'
  )
));

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_system_documentation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_documentation_updated_at
  BEFORE UPDATE ON system_documentation
  FOR EACH ROW
  EXECUTE FUNCTION update_system_documentation_updated_at();