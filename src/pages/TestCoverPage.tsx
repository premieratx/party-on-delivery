import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function TestCoverPage() {
  const [status, setStatus] = useState('Loading...');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const test = async () => {
      try {
        setStatus('Testing Supabase connection...');
        
        const { data, error } = await supabase
          .from('cover_pages')
          .select('*')
          .eq('slug', 'premier-concierge')
          .eq('is_active', true)
          .maybeSingle();

        if (error) {
          setStatus(`ERROR: ${error.message}`);
          return;
        }
        
        if (!data) {
          setStatus('ERROR: No data found');
          return;
        }
        
        setStatus('SUCCESS: Data loaded');
        setData(data);
      } catch (err: any) {
        setStatus(`CATCH ERROR: ${err.message}`);
      }
    };

    test();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Cover Page Test</h1>
      <p><strong>Status:</strong> {status}</p>
      <p><strong>URL:</strong> {window.location.href}</p>
      <p><strong>Pathname:</strong> {window.location.pathname}</p>
      
      {data && (
        <div>
          <h2>Data Found:</h2>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
      
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    </div>
  );
}