import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const TestSheetsConnection: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleTest = async () => {
    setIsLoading(true);
    try {
      console.log('Testing Google Sheets connection...');
      
      const { data, error } = await supabase.functions.invoke('test-sheets-connection');
      
      console.log('Test response:', { data, error });
      
      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success(`✅ Google Sheets connection successful!`, {
          description: `Sheet: ${data.sheetTitle}`
        });
        console.log('Connection test passed:', data);
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      console.error('❌ Connection test failed:', error);
      toast.error('Google Sheets connection failed', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
      <h3 className="text-lg font-semibold mb-2">🔧 Test Google Sheets Connection</h3>
      <p className="text-sm text-gray-600 mb-3">
        This will test if your Google Sheets API key is working correctly.
      </p>
      
      <Button 
        onClick={handleTest} 
        disabled={isLoading}
        variant="outline"
        className="w-full"
      >
        {isLoading ? '🔄 Testing...' : '🧪 Test Connection'}
      </Button>
    </div>
  );
};