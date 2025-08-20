import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface GoogleAuthButtonProps {
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  redirectTo?: string;
  userType?: 'admin' | 'customer' | 'affiliate';
  children?: React.ReactNode;
  className?: string;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  variant = 'default',
  size = 'default',
  redirectTo,
  userType = 'customer',
  children = 'Continue with Google',
  className
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const handleClick = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await signInWithGoogle(redirectTo, userType);
      
      if (error) {
        console.error('OAuth error:', error);
        toast({
          title: "Authentication Error",
          description: error.message || "Failed to authenticate with Google. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Unexpected error during OAuth:', error);
      toast({
        title: "Authentication Error", 
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        children
      )}
    </Button>
  );
};