import React from 'react';

interface CheckoutIsolationProps {
  children: React.ReactNode;
}

export const CheckoutIsolation: React.FC<CheckoutIsolationProps> = ({ children }) => {
  React.useEffect(() => {
    // Simple checkout isolation - prevent dashboard interference
    const checkoutFlag = 'checkout-active';
    sessionStorage.setItem(checkoutFlag, 'true');
    
    // Add a class to body to indicate checkout mode
    document.body.classList.add('checkout-mode');
    
    return () => {
      // Cleanup
      sessionStorage.removeItem(checkoutFlag);
      document.body.classList.remove('checkout-mode');
    };
  }, []);
  
  return <>{children}</>;
};