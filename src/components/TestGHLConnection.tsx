import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const TestGHLConnection: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleTest = async () => {
    setIsLoading(true);
    try {
      console.log('Testing GHL SMS integration...');
      
      const { data, error } = await supabase.functions.invoke('test-ghl-integration');
      
      console.log('GHL test response:', { data, error });
      
      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success(`✅ GHL SMS integration working!`, {
          description: `Test message sent successfully`
        });
        console.log('GHL test passed:', data);
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      console.error('❌ GHL test failed:', error);
      toast.error('GHL SMS integration failed', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
      <h3 className="text-lg font-semibold mb-2">📱 Test GHL SMS Integration</h3>
      <p className="text-sm text-gray-600 mb-3">
        This will test if your GoHighLevel API key is working correctly for SMS.
      </p>
      
      <Button 
        onClick={handleTest} 
        disabled={isLoading}
        variant="outline"
        className="w-full"
      >
        {isLoading ? '📤 Sending Test SMS...' : '📱 Test GHL SMS'}
      </Button>
    </div>
  );
};