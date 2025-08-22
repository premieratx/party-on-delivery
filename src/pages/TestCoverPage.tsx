import React from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function TestCoverPage() {
  const [result, setResult] = React.useState<any>(null);
  
  React.useEffect(() => {
    async function test() {
      console.log('Testing direct query...');
      const { data, error } = await supabase
        .from('cover_pages')
        .select('*')
        .eq('slug', 'premier-concierge')
        .eq('is_active', true)
        .maybeSingle();
      
      console.log('Direct query result:', { data, error });
      setResult({ data, error: error?.message });
    }
    test();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Cover Page Test</h1>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(result, null, 2)}
      </pre>
      <div className="mt-4">
        <p>URL: {window.location.href}</p>
        <p>Pathname: {window.location.pathname}</p>
      </div>
    </div>
  );
}