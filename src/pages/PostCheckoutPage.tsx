import React from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const PostCheckoutPage = () => {
  const { slug } = useParams<{ slug: string }>();
  
  const { data: postCheckoutPage, isLoading, error } = useQuery({
    queryKey: ['post-checkout-page', slug],
    queryFn: async () => {
      if (!slug) throw new Error('No slug provided');
      
      const { data, error } = await supabase
        .from('post_checkout_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !postCheckoutPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Page Not Found</h1>
          <p className="text-muted-foreground">The post-checkout page doesn't exist or has been disabled.</p>
        </div>
      </div>
    );
  }

  const content = typeof postCheckoutPage.content === 'string' ? 
    JSON.parse(postCheckoutPage.content) : postCheckoutPage.content;

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ backgroundColor: content.background_color || '#ffffff' }}>
      <div className="text-center space-y-6 max-w-2xl mx-auto">
        {content.logo_url && (
          <img src={content.logo_url} alt="Logo" className="h-16 w-auto mx-auto" />
        )}
        
        <div className="space-y-4">
          <h1 className="text-4xl font-bold" style={{ color: content.text_color || '#000000' }}>
            {postCheckoutPage.title}
          </h1>
          <p className="text-xl" style={{ color: content.text_color || '#666666' }}>
            {postCheckoutPage.subtitle}
          </p>
        </div>

        {content.custom_message && (
          <p className="text-lg opacity-90" style={{ color: content.text_color || '#666666' }}>
            {content.custom_message}
          </p>
        )}

        <div className="flex gap-4 justify-center">
          {content.primary_button_text && content.primary_button_url && (
            <a 
              href={content.primary_button_url}
              className="px-6 py-3 rounded-lg font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {content.primary_button_text}
            </a>
          )}
          
          {content.secondary_button_text && content.secondary_button_url && (
            <a 
              href={content.secondary_button_url}
              className="px-6 py-3 rounded-lg font-medium border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {content.secondary_button_text}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCheckoutPage;