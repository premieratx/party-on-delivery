import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const TestTelegramBot = () => {
  const [testing, setTesting] = useState(false);

  const testBot = async () => {
    setTesting(true);
    try {
      console.log('Testing Telegram bot function...');
      
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: {
          action: 'test_connection'
        }
      });

      console.log('Bot test response:', { data, error });
      
      if (error) {
        toast.error(`Bot test failed: ${error.message}`);
      } else {
        toast.success('Bot function is working!');
      }
    } catch (err) {
      console.error('Test error:', err);
      toast.error('Test failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-semibold mb-2">Test Telegram Bot</h3>
      <Button onClick={testBot} disabled={testing}>
        {testing ? 'Testing...' : 'Test Bot Function'}
      </Button>
    </div>
  );
};