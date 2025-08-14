import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Phone, Mail } from 'lucide-react';

const TestGHLConnection = () => {
  const [testPhone, setTestPhone] = useState('5125767975');
  const [testEmail, setTestEmail] = useState('ppcaustin@gmail.com');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const runGHLTest = async () => {
    if (!testPhone || !testEmail) {
      toast.error('Please enter both phone and email');
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      console.log('Running GHL integration test...');
      
      const { data, error } = await supabase.functions.invoke('test-ghl-integration', {
        body: {
          phone: testPhone,
          email: testEmail
        }
      });

      if (error) {
        console.error('GHL test error:', error);
        setTestResult({ success: false, error: error.message });
        toast.error(`Test failed: ${error.message}`);
      } else {
        console.log('GHL test response:', data);
        setTestResult(data);
        if (data.success) {
          toast.success('GHL integration test completed successfully!');
        } else {
          toast.error(`Test failed: ${data.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setTestResult({ success: false, error: 'Unexpected error occurred' });
      toast.error('Unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestSMS = async () => {
    if (!testPhone) {
      toast.error('Please enter a phone number');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Sending test SMS...');
      
      const { data, error } = await supabase.functions.invoke('send-ghl-sms', {
        body: {
          phone: testPhone,
          message: `Test SMS from Party On Delivery! Time: ${new Date().toLocaleTimeString()}`
        }
      });

      if (error) {
        console.error('SMS error:', error);
        toast.error(`Failed to send SMS: ${error.message}`);
      } else {
        console.log('SMS response:', data);
        toast.success('Test SMS sent successfully!');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Unexpected error sending SMS');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Go High Level Test
          </CardTitle>
          <CardDescription>
            Test the GHL integration by sending a test email and SMS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4" />
              Phone Number
            </label>
            <Input
              type="tel"
              placeholder="+1234567890"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4" />
              Email Address
            </label>
            <Input
              type="email"
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={runGHLTest} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Testing...' : 'Test Full Integration'}
            </Button>
            
            <Button 
              onClick={sendTestSMS} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Test SMS Only'}
            </Button>
          </div>
          
          {testResult && (
            <Alert className={testResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <AlertDescription>
                  <strong>Test Result:</strong><br />
                  {testResult.success ? 'Success!' : `Error: ${testResult.error}`}
                  {testResult.details && (
                    <div className="mt-2 text-xs">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(testResult.details, null, 2)}</pre>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}
          
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
            <strong>Note:</strong> Make sure your GHL API key is configured in the Edge Functions secrets.
            This test will verify the integration and help debug any issues.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestGHLConnection;