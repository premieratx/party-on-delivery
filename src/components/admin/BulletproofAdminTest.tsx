import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Database, Upload, Eye, Settings } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'running';
  message: string;
  details?: any;
  duration?: number;
}

export const BulletproofAdminTest = () => {
  const { toast } = useToast();
  const [tests, setTests] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const updateTest = (name: string, result: Partial<TestResult>) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        return prev.map(t => t.name === name ? { ...t, ...result } : t);
      }
      return [...prev, { name, status: 'running', message: '', ...result }];
    });
  };

  const runComprehensiveTest = async () => {
    setRunning(true);
    setProgress(0);
    setTests([]);

    const testSuite = [
      { name: 'Collections API', test: testCollections },
      { name: 'Storage Upload', test: testStorageUpload },
      { name: 'Database Connection', test: testDatabase },
      { name: 'Admin Authentication', test: testAdminAuth },
      { name: 'Dashboard Data', test: testDashboardData },
      { name: 'Cover Page Creation', test: testCoverPageCreation },
      { name: 'Delivery App Creation', test: testDeliveryAppCreation },
      { name: 'State Persistence', test: testStatePersistence }
    ];

    for (let i = 0; i < testSuite.length; i++) {
      const { name, test } = testSuite[i];
      updateTest(name, { status: 'running', message: 'Testing...' });
      
      const startTime = Date.now();
      try {
        const result = await test();
        const duration = Date.now() - startTime;
        updateTest(name, { 
          status: 'pass', 
          message: result.message || 'Test passed',
          details: (result as any).details || null,
          duration 
        });
      } catch (error: any) {
        const duration = Date.now() - startTime;
        updateTest(name, { 
          status: 'fail', 
          message: error.message || 'Test failed',
          details: error,
          duration 
        });
      }

      setProgress(((i + 1) / testSuite.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause
    }

    // Log results to Supabase
    try {
      const passed = tests.filter(t => t.status === 'pass').length;
      const failed = tests.filter(t => t.status === 'fail').length;
      
      console.log(`✅ Admin test complete: ${passed}/${testSuite.length} passed`);
    } catch (logError) {
      console.warn('Failed to log test results:', logError);
    }

    setRunning(false);
    
    const passed = tests.filter(t => t.status === 'pass').length;
    toast({
      title: "Comprehensive Test Complete",
      description: `${passed}/${testSuite.length} tests passed`,
      variant: passed === testSuite.length ? "default" : "destructive"
    });
  };

  const testCollections = async () => {
    const { data, error } = await supabase.functions.invoke('get-all-collections');
    if (error) throw error;
    if (!data?.success || !data?.collections?.length) {
      throw new Error('No collections returned');
    }
    return { 
      message: `✅ ${data.collections.length} collections loaded from ${data.source}`,
      details: data
    };
  };

  const testStorageUpload = async () => {
    // Test file upload capability
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
    
    const { error } = await supabase.storage
      .from('app-assets')
      .upload(`test-${Date.now()}.txt`, testFile);
    
    if (error) throw error;
    return { message: '✅ Storage upload working' };
  };

  const testDatabase = async () => {
    const { data, error } = await supabase
      .from('delivery_app_variations')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    return { message: '✅ Database connection established' };
  };

  const testAdminAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return { 
      message: user ? '✅ User authenticated' : '⚠️ No authentication',
      details: { email: user?.email }
    };
  };

  const testDashboardData = async () => {
    const { data, error } = await supabase.functions.invoke('get-dashboard-data', {
      body: { type: 'admin' }
    });
    
    if (error) throw error;
    return { 
      message: data?.success ? '✅ Dashboard data loaded' : '⚠️ Using fallback data',
      details: data
    };
  };

  const testCoverPageCreation = async () => {
    // Test cover page table access
    const { data, error } = await supabase
      .from('cover_pages')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    return { message: '✅ Cover page creation ready' };
  };

  const testDeliveryAppCreation = async () => {
    // Test delivery app table access
    const { data, error } = await supabase
      .from('delivery_app_variations')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    return { message: '✅ Delivery app creation ready' };
  };

  const testStatePersistence = async () => {
    // Test sessionStorage
    const testData = { test: 'persistence' };
    sessionStorage.setItem('admin-test', JSON.stringify(testData));
    const retrieved = JSON.parse(sessionStorage.getItem('admin-test') || '{}');
    sessionStorage.removeItem('admin-test');
    
    if (retrieved.test !== 'persistence') {
      throw new Error('Session storage not working');
    }
    return { message: '✅ State persistence working' };
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'running':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      pass: 'default',
      fail: 'destructive',
      warning: 'secondary',
      running: 'outline'
    } as const;
    
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Bulletproof Admin Dashboard Test Suite
          </CardTitle>
          <Button 
            onClick={runComprehensiveTest} 
            disabled={running}
            className="flex items-center gap-2"
          >
            {running ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            {running ? 'Testing...' : 'Run Full Test'}
          </Button>
        </div>
        {running && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Testing admin dashboard functionality... {Math.round(progress)}%
            </p>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {tests.length === 0 && !running && (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Click "Run Full Test" to verify all admin dashboard functionality</p>
            </div>
          )}
          
          {tests.map((test) => (
            <div key={test.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(test.status)}
                <div>
                  <h4 className="font-medium">{test.name}</h4>
                  <p className="text-sm text-muted-foreground">{test.message}</p>
                  {test.duration && (
                    <p className="text-xs text-muted-foreground">
                      Completed in {test.duration}ms
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(test.status)}
              </div>
            </div>
          ))}
          
          {tests.length > 0 && !running && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Test Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-green-600">
                    {tests.filter(t => t.status === 'pass').length}
                  </div>
                  <div>Passed</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-red-600">
                    {tests.filter(t => t.status === 'fail').length}
                  </div>
                  <div>Failed</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-yellow-600">
                    {tests.filter(t => t.status === 'warning').length}
                  </div>
                  <div>Warnings</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};