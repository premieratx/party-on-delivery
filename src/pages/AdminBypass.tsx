import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export default function AdminBypass() {
  const navigate = useNavigate();

  const handleDirectAccess = () => {
    console.log('🔥 Direct admin access clicked - navigating to /admin');
    try {
      // Just navigate directly to admin - bypass all auth checks
      navigate('/admin', { replace: true });
      console.log('✅ Navigation successful');
    } catch (error) {
      console.error('❌ Navigation error:', error);
      // Force navigation with window.location as fallback
      window.location.href = '/admin';
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