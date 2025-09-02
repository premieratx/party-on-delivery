import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const VisibleSyncFixer = () => {
  const [status, setStatus] = useState('🔄 Starting automatic sync...');
  const [products, setProducts] = useState(0);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const autoFix = async () => {
      try {
        setStep(1);
        setStatus('🔄 Step 1: Clearing old cache...');
        
        // Clear cache first
        await supabase.from('cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('shopify_products_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        setStep(2);
        setStatus('🔄 Step 2: Fetching products from Shopify...');
        
        // Trigger fetch
        const fetchResult = await supabase.functions.invoke('fetch-shopify-products', {
          body: { force: true }
        });
        
        console.log('Fetch result:', fetchResult);
        
        setStep(3);
        setStatus('🔄 Step 3: Processing and storing products...');
        
        // Trigger sync
        const syncResult = await supabase.functions.invoke('execute-sync', {
          body: { force: true }
        });
        
        console.log('Sync result:', syncResult);
        
        setStep(4);
        setStatus('🔄 Step 4: Checking results...');
        
        // Check count
        const { count } = await supabase
          .from('shopify_products_cache')
          .select('*', { count: 'exact', head: true });
        
        setProducts(count || 0);
        
        if (count && count > 0) {
          setStatus(`✅ SUCCESS! ${count} products loaded! Page will reload in 3 seconds...`);
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else {
          setStatus('❌ No products found. There may be an issue with Shopify API connection.');
        }
        
      } catch (error) {
        console.error('Sync error:', error);
        setStatus(`❌ Error: ${error.message}`);
      }
    };

    autoFix();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Fixing Shopify Sync</h2>
          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-2">Step {step} of 4</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
          <div className="text-sm mb-4">{status}</div>
          {products > 0 && (
            <div className="text-green-600 font-semibold">
              🎉 {products} products successfully loaded!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};