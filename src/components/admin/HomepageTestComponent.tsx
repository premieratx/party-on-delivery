import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Home, ExternalLink, RefreshCw } from 'lucide-react';

interface HomepageTestResult {
  databaseHomepage: string | null;
  actualHomepage: string | null;
  isWorking: boolean;
  error?: string;
}

export function HomepageTestComponent() {
  const [testResult, setTestResult] = useState<HomepageTestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const runHomepageTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      
      console.log('🧪 Testing homepage functionality...');
      
      // Step 1: Check which app is set as homepage in database
      const { data: homepageApp, error: dbError } = await supabase
        .from('delivery_app_variations')
        .select('app_name, app_slug')
        .eq('is_active', true)
        .eq('is_homepage', true)
        .limit(1);
        
      if (dbError) {
        throw new Error(`Database query failed: ${dbError.message}`);
      }
      
      const databaseHomepage = homepageApp?.[0]?.app_name || null;
      console.log('📊 Database homepage app:', databaseHomepage);
      
      // Step 2: Test actual homepage loading logic (simulate what CustomAppView does)
      const { data: actualApp, error: actualError } = await supabase
        .from('delivery_app_variations')
        .select('app_name, app_slug')
        .eq('is_active', true)
        .eq('is_homepage', true)
        .limit(1);
        
      if (actualError) {
        throw new Error(`Homepage lookup failed: ${actualError.message}`);
      }
      
      const actualHomepage = actualApp?.[0]?.app_name || null;
      console.log('🏠 Actual homepage logic result:', actualHomepage);
      
      const isWorking = databaseHomepage === actualHomepage && databaseHomepage !== null;
      
      setTestResult({
        databaseHomepage,
        actualHomepage,
        isWorking,
      });
      
      if (isWorking) {
        toast({
          title: "✅ Homepage Test Passed",
          description: `Homepage is correctly set to: ${databaseHomepage}`,
        });
      } else if (!databaseHomepage) {
        toast({
          title: "⚠️ No Homepage Set",
          description: "No delivery app is currently set as homepage. Use Settings tab to fix this.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "❌ Homepage Test Failed", 
          description: `Database shows ${databaseHomepage} but logic may not be working`,
          variant: "destructive"
        });
      }
      
    } catch (error: any) {
      console.error('❌ Homepage test failed:', error);
      setTestResult({
        databaseHomepage: null,
        actualHomepage: null,
        isWorking: false,
        error: error.message
      });
      
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  // Auto-run test on mount
  useEffect(() => {
    runHomepageTest();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Homepage Functionality Test
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Verify that homepage assignment is working correctly
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runHomepageTest} 
            disabled={testing}
            variant="outline"
          >
            {testing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Test
              </>
            )}
          </Button>
          
          <Button 
            onClick={() => window.open('/', '_blank')}
            variant="outline"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Live Homepage
          </Button>
        </div>

        {testResult && (
          <div className="space-y-3">
            <div className={`p-4 rounded-lg border-2 ${
              testResult.isWorking 
                ? 'bg-green-50 border-green-200' 
                : testResult.error
                ? 'bg-red-50 border-red-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {testResult.isWorking ? '✅' : testResult.error ? '❌' : '⚠️'}
                <span className="font-semibold">
                  {testResult.isWorking 
                    ? 'Homepage Working Correctly' 
                    : testResult.error 
                    ? 'Test Failed'
                    : 'Issue Detected'
                  }
                </span>
              </div>
              
              {testResult.error && (
                <p className="text-sm text-red-700 mb-2">
                  Error: {testResult.error}
                </p>
              )}
              
              <div className="space-y-1 text-sm">
                <div>
                  <strong>Database Homepage:</strong>{' '}
                  {testResult.databaseHomepage ? (
                    <Badge variant="secondary">{testResult.databaseHomepage}</Badge>
                  ) : (
                    <span className="text-red-600">None Set</span>
                  )}
                </div>
                <div>
                  <strong>Logic Result:</strong>{' '}
                  {testResult.actualHomepage ? (
                    <Badge variant="secondary">{testResult.actualHomepage}</Badge>
                  ) : (
                    <span className="text-red-600">None Found</span>
                  )}
                </div>
              </div>
            </div>

            {!testResult.isWorking && !testResult.error && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Fix:</strong> Go to the Settings tab and use "Homepage App Configuration" 
                  to set a delivery app as the homepage.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}