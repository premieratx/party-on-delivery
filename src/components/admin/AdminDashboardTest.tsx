import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const AdminDashboardTest = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard - Working!</h1>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>✅ Basic Dashboard Loaded</CardTitle>
            </CardHeader>
            <CardContent>
              <p>The admin dashboard is functioning correctly. All core components are accessible.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🔧 Test Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                onClick={() => alert('Cover page creator would open here')} 
                className="mr-2"
              >
                Test Cover Page Creator
              </Button>
              <Button 
                onClick={() => alert('Delivery app creator would open here')} 
                className="mr-2"
              >
                Test Delivery App Creator
              </Button>
              <Button 
                onClick={() => alert('Post-checkout creator would open here')} 
              >
                Test Post-Checkout Creator
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};