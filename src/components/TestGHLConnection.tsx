import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Phone, Mail, CheckCircle, XCircle, AlertTriangle, MessageSquare } from 'lucide-react';

export default function TestGHLConnection() {
  const [testPhone, setTestPhone] = useState('+15125767975');
  const [testEmail, setTestEmail] = useState('brian@partyondelivery.com');
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const { toast } = useToast();

  const runGHLTest = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('test-ghl-integration', {
        body: { 
          testPhone,
          testEmail,
          testType: 'full'
        }
      });

      if (error) {
        throw error;
      }

      setTestResult(data);
      
      if (data.success) {
        toast({
          title: "GHL Integration Test Successful",
          description: "SMS and email functionality is working correctly",
        });
      } else {
        toast({
          title: "GHL Integration Test Failed",
          description: data.message || "Check configuration and try again",
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('GHL test error:', error);
      setTestResult({
        success: false,
        message: error.message || 'Failed to test GHL integration'
      });
      toast({
        title: "Test Failed",
        description: error.message || "Failed to test GHL integration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestSMS = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-ghl-sms', {
        body: {
          phone: testPhone,
          message: `🎉 Test SMS from Party on Delivery Admin Dashboard
          
Time: ${new Date().toLocaleString()}
Status: SMS Integration Active ✅

This confirms your GHL SMS integration is working correctly!`,
          type: 'admin_test'
        }
      });

      if (error) throw error;

      toast({
        title: "Test SMS Sent",
        description: `SMS sent successfully to ${testPhone}`,
      });

    } catch (error: any) {
      console.error('SMS test error:', error);
      toast({
        title: "SMS Test Failed",
        description: error.message || "Failed to send test SMS",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            GHL Integration Testing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-phone">Test Phone Number</Label>
              <Input
                id="test-phone"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+15125767975"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="test-email">Test Email Address</Label>
              <Input
                id="test-email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={runGHLTest} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Phone className="h-4 w-4" />
              {loading ? 'Testing...' : 'Run Full Integration Test'}
            </Button>
            
            <Button 
              onClick={sendTestSMS} 
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Send Test SMS Only
            </Button>
          </div>

          {testResult && (
            <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">
                      {testResult.success ? 'Integration Test Successful' : 'Integration Test Failed'}
                    </p>
                    <p className="text-sm">{testResult.message}</p>
                    
                    {testResult.tests && (
                      <div className="space-y-1">
                        {testResult.tests.sms && (
                          <div className="flex items-center gap-2">
                            <Badge variant={testResult.tests.sms.status === 'success' ? 'default' : 'destructive'}>
                              SMS: {testResult.tests.sms.status}
                            </Badge>
                            {testResult.tests.sms.phone && (
                              <span className="text-xs">→ {testResult.tests.sms.phone}</span>
                            )}
                          </div>
                        )}
                        
                        {testResult.tests.contactSearch && (
                          <div className="flex items-center gap-2">
                            <Badge variant={testResult.tests.contactSearch.status === 'success' ? 'default' : 'destructive'}>
                              Contact Search: {testResult.tests.contactSearch.status}
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </div>
            </Alert>
          )}

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> Make sure your GHL_API_KEY is properly configured in the Supabase secrets.
              This integration allows sending SMS notifications for order confirmations, delivery updates, and customer communications.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}