import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TestSMS = () => {
  const [isSending, setIsSending] = useState(false);

  const sendTestSMS = async () => {
    setIsSending(true);
    try {
      console.log('Attempting to send test SMS...');
      
      const { data, error } = await supabase.functions.invoke('test-sms', {
        body: {}
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
      setIsSending(false);
    }
  };

  return (
    <div className="p-4">
      <Button 
        onClick={sendTestSMS} 
        disabled={isSending}
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {isSending ? 'Sending...' : 'Send Test SMS'}
      </Button>
    </div>
  );
};

export default TestSMS;