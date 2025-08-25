import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  url?: string;
}

export const DeliveryAppIntegrationTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    const results: TestResult[] = [];

    // 1. Test Collection Names Loading
    try {
      console.log('🧪 Testing collection names loading...');
      const { data } = await supabase.functions.invoke('get-all-collections');
      console.log('📊 Collections data received:', data);
      
      if (data?.success && data?.collections?.length > 0) {
        const hasNames = data.collections.every((c: any) => c.title || c.name);
        const sampleCollection = data.collections[0];
        console.log('📝 Sample collection:', sampleCollection);
        
        results.push({
          name: 'Collection Names Loading',
          passed: hasNames,
          message: hasNames ? 
            `✅ ${data.collections.length} collections loaded with names (Sample: "${sampleCollection.title || sampleCollection.name}")` : 
            `❌ Collections missing names (Sample: ${JSON.stringify(sampleCollection)})`
        });
      } else {
        results.push({
          name: 'Collection Names Loading',
          passed: false,
          message: data ? `❌ Failed to load collections - Data: ${JSON.stringify(data)}` : '❌ No data received'
        });
      }
    } catch (error) {
      console.error('❌ Collection loading error:', error);
      results.push({
        name: 'Collection Names Loading',
        passed: false,
        message: `❌ Error: ${error}`
      });
    }

    // 2. Test Cover Page Creation & Viewability
    try {
      console.log('🧪 Testing cover page creation...');
      const testSlug = `test-cover-${Date.now()}`;
      const { error } = await supabase
        .from('cover_pages')
        .insert({
          slug: testSlug,
          title: 'Integration Test Cover Page',
          subtitle: 'Testing standalone URLs',
          is_active: true,
          checklist: ['Test Item 1', 'Test Item 2'],
          buttons: [],
          styles: {}
        });

      if (!error) {
        results.push({
          name: 'Cover Page Creation',
          passed: true,
          message: '✅ Cover page created successfully',
          url: `/cover/${testSlug}`
        });

        // Test if it's viewable
        const { data: coverData } = await supabase
          .from('cover_pages')
          .select('*')
          .eq('slug', testSlug)
          .eq('is_active', true)
          .maybeSingle();

        results.push({
          name: 'Cover Page Viewability',
          passed: !!coverData,
          message: coverData ? '✅ Cover page is viewable at standalone URL' : '❌ Cover page not found',
          url: coverData ? `/cover/${testSlug}` : undefined
        });

        // Clean up test data
        await supabase.from('cover_pages').delete().eq('slug', testSlug);
      } else {
        results.push({
          name: 'Cover Page Creation',
          passed: false,
          message: `❌ Error: ${error.message}`
        });
      }
    } catch (error) {
      results.push({
        name: 'Cover Page Creation',
        passed: false,
        message: `❌ Error: ${error}`
      });
    }

    // 3. Test Delivery App Creation
    try {
      console.log('🧪 Testing delivery app creation...');
      const testAppSlug = `test-app-${Date.now()}`;
      const { error } = await supabase
        .from('delivery_app_variations')
        .insert({
          app_name: 'Integration Test App',
          app_slug: testAppSlug,
          main_app_config: {
            hero_heading: 'Test Heading',
            hero_subheading: 'Test Subheading'
          },
          collections_config: {
            tab_count: 2,
            tabs: [
              { name: 'Beer', collection_handle: 'tailgate-beer', icon: '🍺' },
              { name: 'Spirits', collection_handle: 'spirits', icon: '🥃' }
            ]
          },
          theme: 'gold',
          is_active: true
        });

      if (!error) {
        results.push({
          name: 'Delivery App Creation',
          passed: true,
          message: '✅ Delivery app created successfully',
          url: `/app/${testAppSlug}`
        });

        // Test persistence by loading it back
        const { data: appData } = await supabase
          .from('delivery_app_variations')
          .select('*')
          .eq('app_slug', testAppSlug)
          .maybeSingle();

        const tabsPersisted = appData?.collections_config && 
          typeof appData.collections_config === 'object' && 
          'tabs' in appData.collections_config &&
          Array.isArray(appData.collections_config.tabs) &&
          appData.collections_config.tabs.length === 2;
        results.push({
          name: 'Delivery App Persistence',
          passed: tabsPersisted,
          message: tabsPersisted ? '✅ Collection assignments persisted correctly' : '❌ Collection assignments lost'
        });

        // Clean up test data
        await supabase.from('delivery_app_variations').delete().eq('app_slug', testAppSlug);
      } else {
        results.push({
          name: 'Delivery App Creation',
          passed: false,
          message: `❌ Error: ${error.message}`
        });
      }
    } catch (error) {
      results.push({
        name: 'Delivery App Creation',
        passed: false,
        message: `❌ Error: ${error}`
      });
    }

    setTestResults(results);
    setTesting(false);

    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;

    toast({
      title: 'Integration Tests Complete',
      description: `${passedCount}/${totalCount} tests passed`,
      variant: passedCount === totalCount ? 'default' : 'destructive'
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Delivery App Integration Tests
          <Badge variant="secondary">Automated Testing</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTests} 
          disabled={testing}
          className="w-full"
        >
          {testing ? 'Running Tests...' : 'Run Integration Tests'}
        </Button>

        {testResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Test Results:</h3>
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {result.passed ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-medium">{result.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{result.message}</span>
                  {result.url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(result.url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};