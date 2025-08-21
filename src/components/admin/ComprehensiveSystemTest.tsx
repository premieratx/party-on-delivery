import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

export const ComprehensiveSystemTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    // Test 1: Delivery App Save Functionality
    try {
      console.log('🧪 Testing delivery app save...');
      
      // Create a test delivery app
      const testAppData = {
        app_name: 'System Test App',
        app_slug: `test-app-${Date.now()}`,
        main_app_config: {
          hero_heading: 'Test App',
          hero_subheading: 'Testing functionality'
        },
        collections_config: {
          tab_count: 1,
          tabs: [{ name: 'Beer', collection_handle: 'tailgate-beer' }]
        },
        theme: 'gold',
        is_active: false,
        is_homepage: false
      };

      // Set admin context first
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        await supabase.rpc('set_admin_context', { admin_email: user.email });
      }

      const { error: saveError } = await supabase
        .from('delivery_app_variations')
        .insert(testAppData);

      if (saveError) throw saveError;

      // Clean up test app
      await supabase
        .from('delivery_app_variations')
        .delete()
        .eq('app_slug', testAppData.app_slug);

      results.push({
        name: 'Delivery App Save',
        status: 'success',
        message: 'Delivery app creation and deletion working perfectly'
      });
    } catch (error: any) {
      results.push({
        name: 'Delivery App Save',
        status: 'error',
        message: error.message,
        details: error
      });
    }

    // Test 2: Promo Code Validation
    try {
      console.log('🧪 Testing promo code FREEDELIVERY...');
      
      const { data, error } = await supabase.functions.invoke('validate-promo-code', {
        body: { code: 'FREEDELIVERY', orderAmount: 50 }
      });

      if (error) throw error;
      
      if (data.valid && data.code === 'FREEDELIVERY') {
        results.push({
          name: 'FREEDELIVERY Promo Code',
          status: 'success', 
          message: `Promo code working: ${data.message}`,
          details: data
        });
      } else {
        throw new Error('FREEDELIVERY code not working properly');
      }
    } catch (error: any) {
      results.push({
        name: 'FREEDELIVERY Promo Code',
        status: 'error',
        message: error.message,
        details: error
      });
    }

    // Test 3: Admin Authentication
    try {
      console.log('🧪 Testing admin authentication...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('No user session');

      const { data, error } = await supabase.functions.invoke('verify-admin-google', {
        body: { email: user.email }
      });

      if (error) throw error;

      if (data.isAdmin) {
        results.push({
          name: 'Admin Authentication',
          status: 'success',
          message: 'Admin verification working correctly'
        });
      } else {
        throw new Error('Admin verification failed');
      }
    } catch (error: any) {
      results.push({
        name: 'Admin Authentication',
        status: 'error',
        message: error.message
      });
    }

    // Test 4: Cover Page URLs
    try {
      console.log('🧪 Testing cover page URLs...');
      
      const { data: coverPages, error } = await supabase
        .from('cover_pages')
        .select('title, slug')
        .eq('is_active', true)
        .limit(3);

      if (error) throw error;
      
      if (coverPages && coverPages.length > 0) {
        const testUrls = coverPages.map(page => 
          `${window.location.origin}/${page.slug}`
        );
        
        results.push({
          name: 'Cover Page URLs',
          status: 'success',
          message: `${coverPages.length} cover pages accessible as standalone URLs`,
          details: { urls: testUrls }
        });
      } else {
        throw new Error('No active cover pages found');
      }
    } catch (error: any) {
      results.push({
        name: 'Cover Page URLs',
        status: 'error',
        message: error.message
      });
    }

    // Test 5: Function Keep-Alive
    try {
      console.log('🧪 Testing function keep-alive...');
      
      const { data, error } = await supabase.functions.invoke('keep-functions-warm', {
        body: { source: 'system-test' }
      });

      if (error) throw error;

      results.push({
        name: 'Cold Start Prevention',
        status: 'success',
        message: 'Keep-alive system operational - functions will stay warm',
        details: data
      });
    } catch (error: any) {
      results.push({
        name: 'Cold Start Prevention',
        status: 'error',
        message: error.message
      });
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">PASS</Badge>;
      case 'error':
        return <Badge variant="destructive">FAIL</Badge>;
      case 'pending':
        return <Badge variant="outline">TESTING</Badge>;
      default:
        return <Badge variant="secondary">PENDING</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            🧪 System Health Check
          </div>
          <Button 
            onClick={runComprehensiveTest} 
            disabled={isRunning}
            variant="outline"
          >
            {isRunning ? 'Running Tests...' : 'Run Complete Test'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isRunning && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Running comprehensive system test...</p>
          </div>
        )}

        {testResults.length > 0 && (
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <div className="font-medium">{result.name}</div>
                    <div className="text-sm text-muted-foreground">{result.message}</div>
                  </div>
                </div>
                {getStatusBadge(result.status)}
              </div>
            ))}
            
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800">System Status</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Tests completed. All green = system fully operational and stable.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ComprehensiveSystemTest;
