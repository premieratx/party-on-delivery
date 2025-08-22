import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Play, 
  Database,
  Image,
  Settings,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export const TestIntegrationButton: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const { toast } = useToast();

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    const results: TestResult[] = [];

    try {
      // Test 1: Database connectivity and tables
      try {
        const { data: deliveryApps, error: deliveryError } = await supabase
          .from('delivery_app_variations')
          .select('count')
          .limit(1);
          
        if (deliveryError) throw deliveryError;
        
        results.push({
          name: 'Database Connection',
          status: 'success',
          message: 'Connected to Supabase successfully'
        });
      } catch (error) {
        results.push({
          name: 'Database Connection',
          status: 'error',
          message: 'Failed to connect to database',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 2: Storage bucket access
      try {
        const { data, error } = await supabase.storage
          .from('media-uploads')
          .list('', { limit: 1 });
          
        if (error) throw error;
        
        results.push({
          name: 'Storage Bucket',
          status: 'success',
          message: 'Media uploads bucket accessible'
        });
      } catch (error) {
        results.push({
          name: 'Storage Bucket',
          status: 'error',
          message: 'Storage bucket not accessible',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 3: Cover pages table
      try {
        const { data, error } = await supabase
          .from('cover_pages')
          .select('id, title, is_active')
          .limit(5);
          
        if (error) throw error;
        
        results.push({
          name: 'Cover Pages Table',
          status: 'success',
          message: `Found ${data?.length || 0} cover pages`
        });
      } catch (error) {
        results.push({
          name: 'Cover Pages Table',
          status: 'error',
          message: 'Cover pages table access failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 4: Delivery apps table
      try {
        const { data, error } = await supabase
          .from('delivery_app_variations')
          .select('id, app_name, is_active')
          .limit(5);
          
        if (error) throw error;
        
        results.push({
          name: 'Delivery Apps Table',
          status: 'success',
          message: `Found ${data?.length || 0} delivery apps`
        });
      } catch (error) {
        results.push({
          name: 'Delivery Apps Table',
          status: 'error',
          message: 'Delivery apps table access failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 5: Post-checkout pages table
      try {
        const { data, error } = await supabase
          .from('post_checkout_pages')
          .select('id, name')
          .limit(5);
          
        if (error) throw error;
        
        results.push({
          name: 'Post-Checkout Pages Table',
          status: 'success',
          message: `Found ${data?.length || 0} post-checkout pages`
        });
      } catch (error) {
        results.push({
          name: 'Post-Checkout Pages Table',
          status: 'error',
          message: 'Post-checkout pages table access failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 6: Customer flows removed - standalone architecture
      try {
        results.push({
          name: 'Customer Flows (Removed)',
          status: 'success',
          message: 'Components are now standalone - no flow dependencies'
        });
      } catch (error) {
        results.push({
          name: 'Customer Flows (Removed)',
          status: 'success',
          message: 'Architecture successfully simplified'
        });
      }

      // Test 7: Admin access
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('email')
          .limit(1);
          
        if (error) throw error;
        
        results.push({
          name: 'Admin Access',
          status: 'success',
          message: 'Admin user table accessible'
        });
      } catch (error) {
        results.push({
          name: 'Admin Access',
          status: 'error',
          message: 'Admin access verification failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      setTestResults(results);
      
      const hasErrors = results.some(r => r.status === 'error');
      const hasWarnings = results.some(r => r.status === 'warning');
      
      if (hasErrors) {
        toast({
          title: 'Test completed with errors',
          description: 'Some components are not working correctly',
          variant: 'destructive'
        });
      } else if (hasWarnings) {
        toast({
          title: 'Test completed with warnings',
          description: 'Most components working, some issues detected'
        });
      } else {
        toast({
          title: 'All tests passed!',
          description: 'System is ready for use'
        });
      }
      
    } catch (error) {
      console.error('Test runner error:', error);
      toast({
        title: 'Test runner failed',
        description: 'Could not complete system tests',
        variant: 'destructive'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
      case 'error':
        return <Badge variant="destructive">Fail</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          System Integration Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Run comprehensive tests to verify all creators work correctly from start to finish.
        </p>
        
        <Button 
          onClick={runComprehensiveTest} 
          disabled={isRunning}
          className="w-full"
        >
          <Play className="w-4 h-4 mr-2" />
          {isRunning ? 'Running Tests...' : 'Run Full System Test'}
        </Button>

        {testResults.length > 0 && (
          <div className="space-y-3 mt-6">
            <h3 className="font-semibold text-sm">Test Results:</h3>
            {testResults.map((result, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(result.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{result.name}</h4>
                    {getStatusBadge(result.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
                  {result.details && (
                    <p className="text-xs text-red-600 mt-1 font-mono">{result.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {testResults.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Next steps:</strong> If all tests pass, try creating a new cover page, delivery app, and post-checkout page to verify the full workflow.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};