// Step 4: Test hooks imports
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';

const Home = () => {
  console.log('Home component with hooks rendering...');
  useWakeLock();
  const { cartItems, updateQuantity, removeItem, emptyCart, getTotalPrice, getTotalItems } = useUnifiedCart();
  const navigate = useNavigate();
  const [homepageConfig, setHomepageConfig] = useState<any>(null);

  useEffect(() => {
    const loadHomepageConfig = async () => {
      try {
        const { data } = await supabase
          .from('delivery_app_variations')
          .select('*')
          .eq('is_homepage', true)
          .eq('is_active', true)
          .maybeSingle();
        
        if (data) setHomepageConfig(data);
        console.log('Homepage config loaded:', data);
      } catch (error) {
        console.error('Failed to load homepage config:', error);
      }
    };

    loadHomepageConfig();
  }, []);
  
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-4xl font-bold mb-4">Step 4: Hooks Import Test</h1>
      <p>If you see this, hooks imports work...</p>
      <p>Cart items: {getTotalItems()}</p>
      <button onClick={() => navigate('/home-test')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
        Test Navigation
      </button>
    </div>
  );
};

export default Home;