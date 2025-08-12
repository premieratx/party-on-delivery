import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const CleanupUserData = () => {
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [email, setEmail] = useState('ppcaustin@gmail.com');

  const cleanupUserData = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setIsCleaningUp(true);
    try {
      console.log('Attempting to cleanup user data for:', email);
      const { data, error } = await supabase.functions.invoke('cleanup-user-data', {
        body: { email }
      });

      if (error) {
        console.error('Cleanup error:', error);
        toast.error(`Failed to cleanup data: ${error.message}`);
        return;
      }

      console.log('Cleanup result:', data);
      if (data?.success) {
        toast.success(`Successfully cleaned up data for ${email}. Deleted: ${JSON.stringify(data.deletedItems)}`);
      } else {
        toast.error(`Cleanup failed: ${data?.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error during cleanup:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsCleaningUp(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Cleanup Tools</h3>
      <p className="text-sm text-muted-foreground">
        Delete user-specific data by email, or clear abandoned/test data.
      </p>

      <div className="space-y-2">
        <Input
          type="email"
          placeholder="Enter email to cleanup"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button
          onClick={cleanupUserData}
          disabled={isCleaningUp || !email}
          variant="destructive"
          className="w-full"
        >
          {isCleaningUp ? 'Cleaning up...' : 'Cleanup User Data'}
        </Button>
      </div>

      <div className="space-y-2 pt-4 border-t">
        <Button
          onClick={async () => {
            if (!confirm('Delete ALL abandoned orders? This cannot be undone.')) return;
            const { data, error } = await supabase.functions.invoke('admin-cleanup', { body: { action: 'clear_abandoned' } });
            if (error || !data?.success) {
              toast.error('Failed to clear abandoned orders');
            } else {
              toast.success('Abandoned orders cleared');
            }
          }}
          variant="destructive"
          className="w-full"
        >
          Clear Abandoned Orders
        </Button>
        <Button
          onClick={async () => {
            if (!confirm('Delete ALL test data (logs, sessions, abandoned orders)? This cannot be undone.')) return;
            const { data, error } = await supabase.functions.invoke('admin-cleanup', { body: { action: 'delete_all_test_data' } });
            if (error || !data?.success) {
              toast.error('Failed to delete test data');
            } else {
              toast.success('Test data cleared');
            }
          }}
          variant="destructive"
          className="w-full"
        >
          Delete All Test Data
        </Button>
      </div>
    </div>
  );
};

export default CleanupUserData;
