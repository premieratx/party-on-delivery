import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export default function AdminBypass() {
  const navigate = useNavigate();

  const handleDirectAccess = async () => {
    try {
      // Just navigate directly to admin - bypass all auth checks
      navigate('/admin', { replace: true });
    } catch (error) {
      console.error('Direct access error:', error);
      // Still navigate even if there's an error
      navigate('/admin', { replace: true });
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