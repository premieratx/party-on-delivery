import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const CheckSheetTabs: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheck = async () => {
    setIsLoading(true);
    try {
      console.log('Checking Google Sheet tabs...');
      
      const { data, error } = await supabase.functions.invoke('check-sheet-tabs');
      
      console.log('Check tabs response:', { data, error });
      
      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success(`✅ Sheet checked successfully!`, {
          description: `Found tabs: ${data.availableTabs.join(', ')}`
        });
        console.log('Available tabs:', data.availableTabs);
        console.log('Test write result:', data.testWriteResult);
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      console.error('❌ Check failed:', error);
      toast.error('Sheet check failed', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
      <h3 className="text-lg font-semibold mb-2">🔍 Check What Tabs Exist</h3>
      <p className="text-sm text-gray-600 mb-3">
        This will show us exactly what tabs are in your Google Sheet and test writing data.
      </p>
      
      <Button 
        onClick={handleCheck} 
        disabled={isLoading}
        variant="outline"
        className="w-full"
      >
        {isLoading ? '🔍 Checking...' : '🔍 Check Sheet Tabs'}
      </Button>
    </div>
  );
};