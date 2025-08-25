import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export default function AdminBypass() {
  const navigate = useNavigate();

  const handleDirectAccess = async () => {
    try {
      // Set admin context directly for brian@partyondelivery.com
      const { error } = await supabase.functions.invoke('verify-admin-google', {
        body: { email: 'brian@partyondelivery.com' }
      });

      if (!error) {
        navigate('/admin', { replace: true });
      }
    } catch (error) {
      console.error('Direct access error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Bypass</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleDirectAccess} className="w-full">
            Direct Admin Access (Temporary)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}