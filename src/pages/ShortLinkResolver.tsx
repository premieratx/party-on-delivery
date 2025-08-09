import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function ShortLinkResolver() {
  const { shortPath } = useParams<{ shortPath: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const resolve = async () => {
      if (!shortPath) return;
      try {
        const { data, error } = await supabase
          .from('delivery_app_variations')
          .select('app_slug')
          .eq('short_path', shortPath)
          .eq('is_active', true)
          .maybeSingle();

        if (error) throw error;

        if (data?.app_slug) {
          navigate(`/app/${data.app_slug}`, { replace: true });
        } else {
          navigate('/404', { replace: true });
        }
      } catch (e) {
        navigate('/404', { replace: true });
      }
    };
    resolve();
  }, [shortPath, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
        <p>Redirecting…</p>
      </div>
    </div>
  );
}
