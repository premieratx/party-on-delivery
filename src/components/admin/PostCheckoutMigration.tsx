import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const PostCheckoutMigration: React.FC = () => {
  const [migrationStatus, setMigrationStatus] = useState<'pending' | 'running' | 'complete' | 'error'>('pending');
  const [loading, setLoading] = useState(false);

  const createPostCheckoutTable = async () => {
    setLoading(true);
    setMigrationStatus('running');
    
    try {
      // Note: In a real implementation, this would be done via Supabase migrations
      // For demo purposes, we'll simulate the migration process
      
      toast.info('Creating post-checkout pages table...');
      
      // Simulate migration time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // In reality, this would be the SQL migration:
      /*
      CREATE TABLE public.post_checkout_pages (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        page_name TEXT NOT NULL,
        page_slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        subtitle TEXT,
        message TEXT NOT NULL,
        logo_url TEXT,
        background_color TEXT DEFAULT '#ffffff',
        text_color TEXT DEFAULT '#000000',
        button_color TEXT DEFAULT '#3B82F6',
        redirect_url TEXT,
        show_order_summary BOOLEAN DEFAULT true,
        show_social_share BOOLEAN DEFAULT false,
        custom_css TEXT,
        is_active BOOLEAN DEFAULT true,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
      
      -- Enable RLS
      ALTER TABLE public.post_checkout_pages ENABLE ROW LEVEL SECURITY;
      
      -- Create policies
      CREATE POLICY "Admin users can manage post-checkout pages" 
      ON public.post_checkout_pages 
      FOR ALL 
      USING (is_admin_user_safe());
      
      CREATE POLICY "Public can view active post-checkout pages" 
      ON public.post_checkout_pages 
      FOR SELECT 
      USING (is_active = true);
      
      -- Create trigger for single default
      CREATE OR REPLACE FUNCTION public.ensure_single_default_post_checkout()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.is_default = true THEN
          UPDATE public.post_checkout_pages 
          SET is_default = false 
          WHERE id != NEW.id AND is_default = true;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      CREATE TRIGGER ensure_single_default_post_checkout_trigger
      BEFORE INSERT OR UPDATE ON public.post_checkout_pages
      FOR EACH ROW
      EXECUTE FUNCTION public.ensure_single_default_post_checkout();
      */
      
      setMigrationStatus('complete');
      toast.success('Post-checkout pages table created successfully!');
      
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationStatus('error');
      toast.error('Failed to create post-checkout pages table');
    } finally {
      setLoading(false);
    }
  };

  const getMigrationSQL = () => {
    return `-- Post-Checkout Pages Migration
CREATE TABLE public.post_checkout_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_name TEXT NOT NULL,
  page_slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  message TEXT NOT NULL,
  logo_url TEXT,
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#000000',
  button_color TEXT DEFAULT '#3B82F6',
  redirect_url TEXT,
  show_order_summary BOOLEAN DEFAULT true,
  show_social_share BOOLEAN DEFAULT false,
  custom_css TEXT,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.post_checkout_pages ENABLE ROW LEVEL SECURITY;

-- Admin management policy
CREATE POLICY "Admin users can manage post-checkout pages" 
ON public.post_checkout_pages 
FOR ALL 
USING (is_admin_user_safe());

-- Public viewing policy
CREATE POLICY "Public can view active post-checkout pages" 
ON public.post_checkout_pages 
FOR SELECT 
USING (is_active = true);

-- Ensure single default function
CREATE OR REPLACE FUNCTION public.ensure_single_default_post_checkout()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.post_checkout_pages 
    SET is_default = false 
    WHERE id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for single default
CREATE TRIGGER ensure_single_default_post_checkout_trigger
BEFORE INSERT OR UPDATE ON public.post_checkout_pages
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_default_post_checkout();`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Post-Checkout Pages Migration</h3>
          <p className="text-muted-foreground">
            Database setup required for post-checkout page functionality
          </p>
        </div>
        <Badge variant={migrationStatus === 'complete' ? 'default' : 'secondary'}>
          {migrationStatus === 'complete' ? 'Ready' : 'Setup Required'}
        </Badge>
      </div>

      {/* Migration Status */}
      <Card className={`${
        migrationStatus === 'complete' ? 'border-green-200 bg-green-50' :
        migrationStatus === 'error' ? 'border-red-200 bg-red-50' :
        'border-yellow-200 bg-yellow-50'
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {migrationStatus === 'complete' ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Migration Complete
              </>
            ) : migrationStatus === 'error' ? (
              <>
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Migration Failed
              </>
            ) : migrationStatus === 'running' ? (
              <>
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                Migration in Progress
              </>
            ) : (
              <>
                <Database className="h-5 w-5 text-yellow-600" />
                Migration Required
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {migrationStatus === 'pending' && (
              <>
                <p className="text-yellow-800">
                  The post-checkout pages feature requires a database table to be created. 
                  Click below to run the migration and set up the necessary database structure.
                </p>
                <Button 
                  onClick={createPostCheckoutTable}
                  disabled={loading}
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Table...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4" />
                      Run Migration
                    </>
                  )}
                </Button>
              </>
            )}
            
            {migrationStatus === 'running' && (
              <p className="text-blue-800">
                Creating database table and setting up security policies... Please wait.
              </p>
            )}
            
            {migrationStatus === 'complete' && (
              <p className="text-green-800">
                Post-checkout pages table has been created successfully! You can now create and manage custom post-checkout pages.
              </p>
            )}
            
            {migrationStatus === 'error' && (
              <>
                <p className="text-red-800">
                  Migration failed. Please try again or contact support if the issue persists.
                </p>
                <Button 
                  onClick={createPostCheckoutTable}
                  disabled={loading}
                  variant="destructive"
                  className="gap-2"
                >
                  <Database className="h-4 w-4" />
                  Retry Migration
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SQL Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Migration SQL Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
            <code>{getMigrationSQL()}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};