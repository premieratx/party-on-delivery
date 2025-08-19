import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

// Simple, bulletproof homepage component
const Index = () => {
  console.log('🏠 HOMEPAGE v5: ULTRA BULLETPROOF - Starting...');
  
  const navigate = useNavigate();
  
  // Minimal state
  const [appConfig, setAppConfig] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHomepageData();
  }, []);

  const loadHomepageData = async () => {
    try {
      console.log('📋 Loading delivery app...');
      setLoading(true);
      setError(null);

      // Load main delivery app
      const { data: homepageApp, error: configError } = await supabase
        .from('delivery_app_variations')
        .select('*')
        .eq('is_active', true)
        .eq('is_homepage', true)
        .maybeSingle();

      console.log('📋 Config result:', { homepageApp, configError });

      if (configError) {
        throw new Error(`Config error: ${configError.message}`);
      }

      let finalConfig = homepageApp;
      if (!homepageApp) {
        console.log('📋 Getting fallback app...');
        const { data: fallbackApps, error: fallbackError } = await supabase
          .from('delivery_app_variations')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true })
          .limit(1);

        if (fallbackError || !fallbackApps?.length) {
          throw new Error('No delivery apps found');
        }
        finalConfig = fallbackApps[0];
      }

      console.log('📋 Using config:', finalConfig.app_name);
      setAppConfig(finalConfig);

      // Load products
      console.log('🛍️ Loading products...');
      const collectionsConfig = finalConfig.collections_config as any;
      const collections = collectionsConfig?.tabs || [];
      
      if (collections.length > 0) {
        const collectionHandles = collections.slice(0, 3).map((tab: any) => tab.collection_handle);
        console.log('🛍️ Collections:', collectionHandles);

        const { data: productData, error: productError } = await supabase
          .from('shopify_products_cache')
          .select('*')
          .overlaps('collection_handles', collectionHandles)
          .limit(6);

        if (!productError && productData) {
          console.log('✅ Loaded', productData.length, 'products');
          setProducts(productData);
        } else {
          console.log('⚠️ Product error:', productError);
          setProducts([]);
        }
      } else {
        setProducts([]);
      }

    } catch (err: any) {
      console.error('💥 Error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // LOADING
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            Loading Store
          </h3>
          <p style={{ color: '#64748b' }}>Please wait...</p>
        </div>
      </div>
    );
  }

  // ERROR
  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        padding: '16px'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#dc2626', marginBottom: '8px' }}>
            Error Loading Store
          </h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              marginRight: '8px'
            }}
          >
            Reload Page
          </button>
          <button 
            onClick={() => navigate('/admin')}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Admin Panel
          </button>
        </div>
      </div>
    );
  }

  // NO CONFIG
  if (!appConfig) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        padding: '16px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            No Store Configuration
          </h3>
          <p style={{ color: '#64748b', marginBottom: '16px' }}>
            Store not configured yet
          </p>
          <button 
            onClick={() => navigate('/admin')}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Admin Panel
          </button>
        </div>
      </div>
    );
  }

  // SUCCESS - STORE
  console.log('✅ Rendering store with', products.length, 'products');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Hero Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
        color: 'white', 
        padding: '64px 16px' 
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          {appConfig.logo_url && (
            <img 
              src={appConfig.logo_url} 
              alt={appConfig.app_name}
              style={{ height: '64px', margin: '0 auto 24px', display: 'block' }}
              onError={(e) => e.currentTarget.style.display = 'none'}
            />
          )}
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: '700', 
            marginBottom: '16px',
            lineHeight: '1.2'
          }}>
            {appConfig.main_app_config?.hero_heading || appConfig.app_name}
          </h1>
          <p style={{ 
            fontSize: '20px', 
            opacity: '0.9', 
            marginBottom: '32px' 
          }}>
            {appConfig.main_app_config?.hero_subheading || "Premium Delivery Service"}
          </p>
          
          <button 
            style={{
              backgroundColor: 'white',
              color: '#3b82f6',
              fontSize: '18px',
              padding: '12px 32px',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🛒 Cart (0)
          </button>
        </div>
      </div>

      {/* Products Section */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 16px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '32px' 
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700' }}>
            Featured Products
          </h2>
          <button 
            style={{
              backgroundColor: '#f1f5f9',
              color: '#475569',
              padding: '8px 16px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            🛒 View Cart (0)
          </button>
        </div>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px' }}>
            <p style={{ color: '#64748b', marginBottom: '16px' }}>
              No products available
            </p>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>
              Products will appear here once configured
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
            maxWidth: '1000px',
            margin: '0 auto'
          }}>
            {products.map((product) => {
              const price = product.price || product.variants?.[0]?.price || 0;
              const image = product.image || product.image_url;

              return (
                <div 
                  key={product.id} 
                  style={{ 
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    padding: '24px',
                    textAlign: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    transition: 'box-shadow 0.2s'
                  }}
                >
                  <div style={{ 
                    width: '100%', 
                    height: '192px', 
                    backgroundColor: '#f1f5f9',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {image ? (
                      <img 
                        src={image} 
                        alt={product.title}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover' 
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <div style={{ 
                      color: '#64748b',
                      display: image ? 'none' : 'block'
                    }}>
                      📦 {product.title}
                    </div>
                  </div>
                  
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    marginBottom: '8px',
                    lineHeight: '1.4'
                  }}>
                    {product.title}
                  </h3>
                  <p style={{ 
                    fontSize: '24px', 
                    fontWeight: '700', 
                    color: '#3b82f6', 
                    marginBottom: '16px' 
                  }}>
                    ${price}
                  </p>
                  
                  <button 
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Store Info & Admin */}
        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <p style={{ color: '#64748b', marginBottom: '16px' }}>
            Store: {appConfig.app_name} • {products.length} products loaded
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <button 
              onClick={() => navigate('/admin')}
              style={{
                backgroundColor: '#f1f5f9',
                color: '#475569',
                padding: '8px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Admin Panel
            </button>
          </div>
        </div>
      </div>

      {/* CSS for spinner animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }}></style>
    </div>
  );
};

export default Index;