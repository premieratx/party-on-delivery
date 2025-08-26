import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Search, ExternalLink, RefreshCw } from 'lucide-react';

interface HomepageDiagnostic {
  databaseHomepage: {
    app_name: string;
    app_slug: string;
    is_homepage: boolean;
    is_active: boolean;
  } | null;
  allActiveApps: Array<{
    app_name: string;
    app_slug: string;
    is_homepage: boolean;
    is_active: boolean;
  }>;
  routeInfo: {
    currentUrl: string;
    expectedRoute: string;
    isHomepageRoute: boolean;
  };
  loadingTest: {
    homepageAppFound: string | null;
    fallbackAppFound: string | null;
    error: string | null;
  };
}

export function HomepageDiagnosticTool() {
  const [diagnostic, setDiagnostic] = useState<HomepageDiagnostic | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const runDiagnostic = async () => {
    try {
      setLoading(true);
      setDiagnostic(null);
      
      console.log('🔍 Running comprehensive homepage diagnostic...');
      
      // Step 1: Check current route info
      const routeInfo = {
        currentUrl: window.location.href,
        expectedRoute: window.location.origin + '/',
        isHomepageRoute: window.location.pathname === '/'
      };
      
      console.log('📍 Route Info:', routeInfo);
      
      // Step 2: Get database homepage setting
      const { data: homepageApps, error: homepageError } = await supabase
        .from('delivery_app_variations')
        .select('app_name, app_slug, is_homepage, is_active')
        .eq('is_active', true)
        .eq('is_homepage', true);
        
      if (homepageError) {
        throw new Error(`Homepage query failed: ${homepageError.message}`);
      }
      
      const databaseHomepage = homepageApps?.[0] || null;
      console.log('🗄️ Database Homepage:', databaseHomepage);
      
      // Step 3: Get all active apps for reference
      const { data: allApps, error: allAppsError } = await supabase
        .from('delivery_app_variations')
        .select('app_name, app_slug, is_homepage, is_active')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
        
      if (allAppsError) {
        throw new Error(`All apps query failed: ${allAppsError.message}`);
      }
      
      console.log('📋 All Active Apps:', allApps);
      
      // Step 4: Test the actual loading logic (simulate CustomAppView)
      let homepageAppFound = null;
      let fallbackAppFound = null;
      let loadingError = null;
      
      try {
        // Test homepage lookup
        if (databaseHomepage) {
          homepageAppFound = `${databaseHomepage.app_name} (${databaseHomepage.app_slug})`;
        } else {
          // Test fallback logic
          const fallbackApp = allApps?.[0];
          if (fallbackApp) {
            fallbackAppFound = `${fallbackApp.app_name} (${fallbackApp.app_slug})`;
          }
        }
      } catch (error: any) {
        loadingError = error.message;
      }
      
      setDiagnostic({
        databaseHomepage,
        allActiveApps: allApps || [],
        routeInfo,
        loadingTest: {
          homepageAppFound,
          fallbackAppFound,
          error: loadingError
        }
      });
      
      // Provide user feedback
      if (databaseHomepage) {
        if (routeInfo.isHomepageRoute) {
          toast({
            title: "📊 Diagnostic Complete",
            description: `Homepage should show: ${databaseHomepage.app_name}`,
          });
        } else {
          toast({
            title: "ℹ️ Not on Homepage",
            description: "You're not currently on the homepage route",
          });
        }
      } else {
        toast({
          title: "⚠️ No Homepage Set",
          description: "No delivery app is configured as homepage!",
          variant: "destructive"
        });
      }
      
    } catch (error: any) {
      console.error('❌ Diagnostic failed:', error);
      toast({
        title: "Diagnostic Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-run on mount
  useEffect(() => {
    runDiagnostic();
  }, []);

  const forceHomepageReload = () => {
    window.location.href = '/';
  };

  const testHomepageApp = () => {
    if (diagnostic?.databaseHomepage) {
      window.open(`/app/${diagnostic.databaseHomepage.app_slug}`, '_blank');
    }
  };

  return (
    <Card className="border-2 border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-5 w-5" />
          Homepage Debug Diagnostic
        </CardTitle>
        <p className="text-sm text-orange-600">
          Deep analysis of homepage routing and database configuration
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={runDiagnostic} 
            disabled={loading}
            variant="outline"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Run Diagnostic
              </>
            )}
          </Button>
          
          <Button 
            onClick={forceHomepageReload}
            variant="default"
          >
            Go to Homepage
          </Button>
          
          {diagnostic?.databaseHomepage && (
            <Button 
              onClick={testHomepageApp}
              variant="outline"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Test App Directly
            </Button>
          )}
        </div>

        {diagnostic && (
          <div className="space-y-4">
            {/* Route Information */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">🛣️ Route Analysis</h4>
              <div className="space-y-1 text-sm">
                <div><strong>Current URL:</strong> {diagnostic.routeInfo.currentUrl}</div>
                <div><strong>Homepage URL:</strong> {diagnostic.routeInfo.expectedRoute}</div>
                <div>
                  <strong>Is Homepage Route:</strong>{' '}
                  {diagnostic.routeInfo.isHomepageRoute ? (
                    <Badge className="bg-green-100 text-green-800">YES</Badge>
                  ) : (
                    <Badge variant="destructive">NO</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Database Homepage Setting */}
            <div className={`p-4 rounded-lg border ${
              diagnostic.databaseHomepage 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <h4 className="font-semibold mb-2">
                🗄️ Database Homepage Configuration
              </h4>
              {diagnostic.databaseHomepage ? (
                <div className="space-y-1 text-sm">
                  <div>
                    <strong>App Name:</strong> {diagnostic.databaseHomepage.app_name}
                  </div>
                  <div>
                    <strong>App Slug:</strong> {diagnostic.databaseHomepage.app_slug}
                  </div>
                  <div>
                    <strong>Expected URL:</strong> /app/{diagnostic.databaseHomepage.app_slug}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-red-700">
                  ❌ No delivery app is set as homepage in database!
                </p>
              )}
            </div>

            {/* Loading Logic Test */}
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">🧪 Loading Logic Test</h4>
              <div className="space-y-1 text-sm">
                {diagnostic.loadingTest.homepageAppFound ? (
                  <div>
                    <strong>Homepage App Found:</strong> {diagnostic.loadingTest.homepageAppFound}
                  </div>
                ) : diagnostic.loadingTest.fallbackAppFound ? (
                  <div>
                    <strong>Fallback App:</strong> {diagnostic.loadingTest.fallbackAppFound}
                  </div>
                ) : (
                  <div className="text-red-700">
                    ❌ No app found by loading logic
                  </div>
                )}
                
                {diagnostic.loadingTest.error && (
                  <div className="text-red-700">
                    <strong>Error:</strong> {diagnostic.loadingTest.error}
                  </div>
                )}
              </div>
            </div>

            {/* All Active Apps */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">
                📋 All Active Apps ({diagnostic.allActiveApps.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {diagnostic.allActiveApps.map((app, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex-1">
                      <span className="font-medium">{app.app_name}</span>
                      <span className="text-sm text-gray-500 ml-2">({app.app_slug})</span>
                    </div>
                    <div className="flex gap-1">
                      {app.is_homepage && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          HOMEPAGE
                        </Badge>
                      )}
                      {app.is_active && (
                        <Badge variant="secondary" className="text-xs">
                          ACTIVE
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fix Instructions */}
            {(!diagnostic.databaseHomepage || !diagnostic.routeInfo.isHomepageRoute) && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">🔧 How to Fix</h4>
                <div className="space-y-2 text-sm text-yellow-700">
                  {!diagnostic.databaseHomepage && (
                    <p>
                      <strong>1.</strong> No homepage is set! Use the "Homepage App Configuration" 
                      section above to select a delivery app as homepage.
                    </p>
                  )}
                  {diagnostic.databaseHomepage && !diagnostic.routeInfo.isHomepageRoute && (
                    <p>
                      <strong>2.</strong> You're not on the homepage route. Click "Go to Homepage" 
                      to test the actual homepage.
                    </p>
                  )}
                  <p>
                    <strong>3.</strong> After setting a homepage, the main domain should redirect 
                    to the selected delivery app automatically.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}