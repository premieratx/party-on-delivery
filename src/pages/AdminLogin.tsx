import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoImage from '@/assets/party-on-delivery-logo.png';

export const AdminLogin: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verify admin credentials using edge function
      const { data, error } = await supabase.functions.invoke('admin-login', {
        body: {
          email: formData.email,
          password: formData.password
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Welcome!",
          description: "Successfully logged in as admin.",
        });
        navigate('/affiliate/admin');
      } else {
        throw new Error(data.message || 'Invalid credentials');
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      toast({
        title: "Error",
        description: error.message || "Invalid email or password.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <img 
            src={logoImage} 
            alt="Party On Delivery Logo" 
            className="w-20 h-20 mx-auto mb-4"
          />
          <CardTitle className="flex items-center justify-center gap-2">
            <Lock className="w-5 h-5" />
            Admin Login
          </CardTitle>
          <p className="text-muted-foreground">
            Affiliate Program Administration
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="admin@partyondelivery.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
                required
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full"
              size="lg"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Lock className="w-4 w-4 mr-2" />
              )}
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <a 
              href="/affiliate" 
              className="text-sm text-primary hover:underline"
            >
              ← Back to Affiliate Program
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};