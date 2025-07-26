import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const TestWriteMethods: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleTest = async () => {
    setIsLoading(true);
    try {
      console.log('Testing different write methods...');
      
      const { data, error } = await supabase.functions.invoke('test-write-methods');
      
      console.log('Write test response:', { data, error });
      
      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success(`✅ Found working write method!`, {
          description: `Method: ${data.method}`
        });
        console.log('Working method:', data.method);
      } else {
        toast.error('❌ Write permission issue', {
          description: data.solution
        });
        console.error('Write issue:', data.message);
      }
    } catch (error: any) {
      console.error('❌ Write test failed:', error);
      toast.error('Write test failed', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
      <h3 className="text-lg font-semibold mb-2">✍️ Test Write Permissions</h3>
      <p className="text-sm text-gray-600 mb-3">
        This will test different write methods to find one that works.
      </p>
      
      <Button 
        onClick={handleTest} 
        disabled={isLoading}
        variant="outline"
        className="w-full"
      >
        {isLoading ? '✍️ Testing Writes...' : '✍️ Test Write Methods'}
      </Button>
    </div>
  );
};