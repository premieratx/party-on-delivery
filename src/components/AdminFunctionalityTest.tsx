import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TestResult {
  component: string;
  success: boolean;
  message: string;
  details?: any;
}

export const AdminFunctionalityTest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runAdminTests = async () => {
    setTesting(true);
    setResults([]);
    const testResults: TestResult[] = [];

    try {
      // Test 1: Cover Page Creation
      console.log('[ADMIN-TEST] Testing cover page creation...');
      const testCoverPage = {
        title: 'Test Cover Page',
        subtitle: 'Testing functionality',
        slug: `test-cover-${Date.now()}`,
        buttons: JSON.stringify([{
          text: 'Test Button',
          bgColor: '#3B82F6',
          textColor: '#FFFFFF'
        }]),
        checklist: JSON.stringify(['Test Item 1', 'Test Item 2']),
        is_active: true
      };
      
      const { data: coverData, error: coverError } = await supabase
        .from('cover_pages')
        .insert(testCoverPage)
        .select()
        .single();
      
      if (coverError) {
        testResults.push({
          component: 'Cover Page Creation',
          success: false,
          message: 'Failed to create cover page',
          details: coverError
        });
      } else {
        testResults.push({
          component: 'Cover Page Creation',
          success: true,
          message: 'Cover page created successfully',
          details: { id: coverData.id }
        });
        
        // Test 2: Cover Page Update
        console.log('[ADMIN-TEST] Testing cover page update...');
        const { error: updateError } = await supabase
          .from('cover_pages')
          .update({ title: 'Updated Test Cover Page' })
          .eq('id', coverData.id);
        
        if (updateError) {
          testResults.push({
            component: 'Cover Page Update',
            success: false,
            message: 'Failed to update cover page',
            details: updateError
          });
        } else {
          testResults.push({
            component: 'Cover Page Update',
            success: true,
            message: 'Cover page updated successfully'
          });
        }
        
        // Cleanup test cover page
        await supabase.from('cover_pages').delete().eq('id', coverData.id);
      }
      
      // Test 3: Delivery App Creation
      console.log('[ADMIN-TEST] Testing delivery app creation...');
      const testDeliveryApp = {
        app_name: 'Test Delivery App',
        app_slug: `test-app-${Date.now()}`,
        is_active: true,
        collections_config: JSON.stringify({
          tab_count: 3,
          tabs: [
            { name: 'Beer', collection_handle: 'beer' },
            { name: 'Wine', collection_handle: 'wine' },
            { name: 'Spirits', collection_handle: 'spirits' }
          ]
        }),
        main_app_config: JSON.stringify({
          hero_heading: 'Test App',
          hero_subheading: 'Testing functionality'
        })
      };
      
      const { data: appData, error: appError } = await supabase
        .from('delivery_app_variations')
        .insert(testDeliveryApp)
        .select()
        .single();
      
      if (appError) {
        testResults.push({
          component: 'Delivery App Creation',
          success: false,
          message: 'Failed to create delivery app',
          details: appError
        });
      } else {
        testResults.push({
          component: 'Delivery App Creation',
          success: true,
          message: 'Delivery app created successfully',
          details: { id: appData.id }
        });
        
        // Test 4: Delivery App Update
        console.log('[ADMIN-TEST] Testing delivery app update...');
        const { error: appUpdateError } = await supabase
          .from('delivery_app_variations')
          .update({ app_name: 'Updated Test Delivery App' })
          .eq('id', appData.id);
        
        if (appUpdateError) {
          testResults.push({
            component: 'Delivery App Update',
            success: false,
            message: 'Failed to update delivery app',
            details: appUpdateError
          });
        } else {
          testResults.push({
            component: 'Delivery App Update',
            success: true,
            message: 'Delivery app updated successfully'
          });
        }
        
        // Cleanup test delivery app
        await supabase.from('delivery_app_variations').delete().eq('id', appData.id);
      }
      
      // Test 5: Admin Access Check
      console.log('[ADMIN-TEST] Testing admin access...');
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('email')
        .limit(1);
      
      if (adminError) {
        testResults.push({
          component: 'Admin Access',
          success: false,
          message: 'Failed to access admin users table',
          details: adminError
        });
      } else {
        testResults.push({
          component: 'Admin Access',
          success: true,
          message: `Admin table accessible (${adminData?.length || 0} users)`
        });
      }
      
    } catch (error) {
      console.error('[ADMIN-TEST] Test execution failed:', error);
      testResults.push({
        component: 'Test Execution',
        success: false,
        message: 'Test execution failed',
        details: error
      });
    }
    
    setResults(testResults);
    setTesting(false);
  };

  const successCount = results.filter(r => r.success).length;
  const totalTests = results.length;

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Admin Functionality Testing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={runAdminTests} 
            disabled={testing}
            variant="outline"
          >
            {testing ? 'Running Tests...' : '🔧 Test Admin Functions'}
          </Button>
          
          {results.length > 0 && (
            <Badge variant={successCount === totalTests ? 'default' : 'destructive'}>
              {successCount}/{totalTests} Passed
            </Badge>
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((result, index) => (
              <div 
                key={index} 
                className={`p-3 rounded border-l-4 ${
                  result.success 
                    ? 'bg-green-50 border-green-400 text-green-800' 
                    : 'bg-red-50 border-red-400 text-red-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{result.success ? '✅' : '❌'}</span>
                  <span className="font-medium">{result.component}</span>
                </div>
                <p className="text-sm mt-1">{result.message}</p>
                {result.details && (
                  <pre className="text-xs mt-2 p-2 bg-black/10 rounded overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded">
          Tests cover page creation/editing, delivery app creation/editing, and admin access permissions.
        </div>
      </CardContent>
    </Card>
  );
};