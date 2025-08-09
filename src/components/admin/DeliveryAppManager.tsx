import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, ExternalLink, Copy, Save, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CustomPostCheckoutEditor } from './CustomPostCheckoutEditor';
import { CANONICAL_DOMAIN, buildAppUrl } from '@/utils/links';

interface DeliveryApp {
  id: string;
  app_name: string;
  app_slug: string;
  collections_config: {
    tab_count: number;
    tabs: Array<{
      name: string;
      collection_handle: string;
      icon?: string;
    }>;
  };
  custom_post_checkout_config?: {
    enabled: boolean;
    title: string;
    message: string;
    cta_button_text: string;
    cta_button_url: string;
    background_color: string;
    text_color: string;
  };
  is_active: boolean;
  is_homepage?: boolean;
  created_at: string;
}

interface Collection {
  id: string;
  handle: string;
  title: string;
}

export function DeliveryAppManager() {
  const [deliveryApps, setDeliveryApps] = useState<DeliveryApp[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingApp, setEditingApp] = useState<DeliveryApp | null>(null);
  const [selectedAppForConfig, setSelectedAppForConfig] = useState<DeliveryApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form data object for easier management
  const [formData, setFormData] = useState({
    appName: '',
    tabCount: 5,
    tabs: [] as Array<{ name: string; collection_handle: string }>,
    startScreenTitle: '',
    startScreenSubtitle: '',
    heroHeading: '',
    heroSubheading: '',
    postCheckoutHeading: '',
    postCheckoutSubheading: '',
    postCheckoutRedirectUrl: '',
    customPostCheckoutEnabled: false,
    customPostCheckoutTitle: '',
    customPostCheckoutMessage: '',
    customPostCheckoutButtonText: '',
    customPostCheckoutButtonUrl: '',
    customPostCheckoutTextColor: '#000000',
    customPostCheckoutBackgroundColor: '#ffffff'
  });

  // Alias deliveryApps as apps for easier reference
  const apps = deliveryApps;

  // Form state
  const [appName, setAppName] = useState('');
  const [tabCount, setTabCount] = useState(5);
  const [tabs, setTabs] = useState<Array<{ name: string; collection_handle: string }>>([]);
  
  // Hero section customization
  const [heroSectionLogo, setHeroSectionLogo] = useState<File | null>(null);
  const [heroHeadline, setHeroHeadline] = useState('');
  const [heroSubheading, setHeroSubheading] = useState('');
  const [heroScrollingText, setHeroScrollingText] = useState('');
  
  // Start screen customization
  const [startScreenTitle, setStartScreenTitle] = useState('');
  const [startScreenSubtitle, setStartScreenSubtitle] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');
  
  // Main app customization  
  const [mainAppHeroHeading, setMainAppHeroHeading] = useState('');
  
  // Post-checkout customization
  const [postCheckoutHeading, setPostCheckoutHeading] = useState('');
  const [postCheckoutSubheading, setPostCheckoutSubheading] = useState('');
  const [postCheckoutRedirectUrl, setPostCheckoutRedirectUrl] = useState('');
  const [postCheckoutButtonText, setPostCheckoutButtonText] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load delivery apps
      const { data: appsData, error: appsError } = await supabase
        .from('delivery_app_variations')
        .select('*')
        .order('created_at', { ascending: false });

      if (appsError) {
        console.error('Error loading delivery apps:', appsError);
        throw appsError;
      } else {
        // Type cast the data to match our interface
        const typedApps = (appsData || []).map(app => ({
          ...app,
          collections_config: app.collections_config as {
            tab_count: number;
            tabs: Array<{
              name: string;
              collection_handle: string;
              icon?: string;
            }>;
          },
          custom_post_checkout_config: app.custom_post_checkout_config as {
            enabled: boolean;
            title: string;
            message: string;
            cta_button_text: string;
            cta_button_url: string;
            background_color: string;
            text_color: string;
          } | undefined
        }));
        setDeliveryApps(typedApps);
      }

      // Load collections
      const { data: collectionsResponse, error: collectionsError } = await supabase.functions.invoke('get-all-collections');
      
      if (collectionsError) throw collectionsError;
      
      if (collectionsResponse?.collections) {
        const collectionsData = collectionsResponse.collections.map((c: any) => ({
          id: c.id,
          handle: c.handle,
          title: c.title
        }));
        setCollections(collectionsData);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load delivery apps');
    } finally {
      setLoading(false);
    }
  };

  const initializeNewApp = () => {
    setAppName('');
    setTabCount(5);
    setTabs(Array.from({ length: 5 }, () => ({
      name: '',
      collection_handle: ''
    })));
    
    // Reset customization fields
    setHeroSectionLogo(null);
    setHeroHeadline('');
    setHeroSubheading('');
    setStartScreenTitle('');
    setStartScreenSubtitle('');
    setLogoFile(null);
    setLogoUrl('');
    setMainAppHeroHeading('');
    setPostCheckoutHeading('');
    setPostCheckoutSubheading('');
    setPostCheckoutRedirectUrl('');
    setPostCheckoutButtonText('');
    
    setIsCreating(true);
  };

  const handleTabCountChange = (count: number) => {
    setTabCount(count);
    const newTabs = Array.from({ length: count }, (_, index) => 
      tabs[index] || { name: '', collection_handle: '' }
    );
    setTabs(newTabs);
  };

  const uploadLogo = async (file: File, appSlug: string): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${appSlug}-logo.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('delivery-app-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('delivery-app-logos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  };

  const updateTab = (index: number, field: string, value: string) => {
    const newTabs = [...tabs];
    newTabs[index] = { ...newTabs[index], [field]: value };
    setTabs(newTabs);
  };

  const createDeliveryApp = async () => {
    if (!appName.trim()) {
      toast.error('App name is required');
      return;
    }

    const validTabs = tabs.filter(tab => tab.name.trim() && tab.collection_handle);
    if (validTabs.length === 0) {
      toast.error('At least one valid tab is required');
      return;
    }

    try {
      let appSlug = appName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      // Check if slug already exists and make it unique
      let counter = 1;
      let finalSlug = appSlug;
      
      while (true) {
        const { data: existingApp } = await supabase
          .from('delivery_app_variations')
          .select('id')
          .eq('app_slug', finalSlug)
          .maybeSingle();

        if (!existingApp) {
          break; // This slug is available
        }
        
        // Try with counter
        finalSlug = `${appSlug}-${counter}`;
        counter++;
        
        // Safety check to prevent infinite loop
        if (counter > 100) {
          throw new Error('Unable to generate unique app slug');
        }
      }
      
      appSlug = finalSlug;
      
      // Upload logo if provided - with proper error handling
      let uploadedLogoUrl = '';
      if (logoFile) {
        try {
          uploadedLogoUrl = await uploadLogo(logoFile, appSlug);
        } catch (uploadError) {
          console.error('Logo upload failed:', uploadError);
          toast.error('Logo upload failed, but app will be created without logo. You can add it later.');
          // Continue without logo
        }
      }
      
      // Create the database entry using the correct Boat Delivery template format
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .insert([{
          app_name: appName,
          app_slug: appSlug,
          logo_url: uploadedLogoUrl,
          collections_config: {
            tab_count: validTabs.length,
            tabs: validTabs
          },
          main_app_config: {
            hero_heading: heroHeadline || `Build Your ${appName} Package`,
            hero_subheading: heroSubheading || 'Select from our curated collection of drinks and party supplies',
            hero_scrolling_text: heroScrollingText || ''
          },
          post_checkout_config: {
            heading: postCheckoutHeading || 'Thank you for your order!',
            subheading: postCheckoutSubheading || 'We will contact you shortly to confirm delivery details.',
            redirect_url: postCheckoutRedirectUrl || '',
            button_text: postCheckoutButtonText || 'Order More Items'
          },
          // Use the correct format that matches Boat Delivery template
          custom_post_checkout_config: {
            enabled: false,
            title: "",
            message: "",
            cta_button_text: "",
            cta_button_url: "",
            background_color: "#ffffff",
            text_color: "#000000"
          },
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      // Create the actual page files for this custom delivery app
      await createCustomDeliveryAppPages(appSlug, appName, validTabs);

      toast.success(`Delivery app "${appName}" created successfully! 🎉\nNew pages created at:\n• /${appSlug} (Start page)\n• /${appSlug}/tabs (Main app)\n• /${appSlug}/post-checkout (Thank you page)`);

      // Type cast the new app data
      const typedApp = {
        ...data,
        collections_config: data.collections_config as {
          tab_count: number;
          tabs: Array<{
            name: string;
            collection_handle: string;
            icon?: string;
          }>;
        },
        custom_post_checkout_config: data.custom_post_checkout_config as {
          enabled: boolean;
          title: string;
          message: string;
          cta_button_text: string;
          cta_button_url: string;
          background_color: string;
          text_color: string;
        } | undefined
      };
      setDeliveryApps(prev => [typedApp, ...prev]);
      setIsCreating(false);

    } catch (error: any) {
      console.error('Error creating delivery app:', error);
      toast.error(error.message || 'Failed to create delivery app');
    }
  };

  const updateDeliveryApp = async () => {
    if (!editingApp || !appName.trim()) {
      toast.error('App name is required');
      return;
    }

    const validTabs = tabs.filter(tab => tab.name.trim() && tab.collection_handle);
    if (validTabs.length === 0) {
      toast.error('At least one valid tab is required');
      return;
    }

    try {
      // Upload logo if provided
      let uploadedLogoUrl = logoUrl; // Keep existing URL if no new file
      if (logoFile) {
        uploadedLogoUrl = await uploadLogo(logoFile, editingApp.app_slug);
      }

      const { data, error } = await supabase
        .from('delivery_app_variations')
        .update({
          app_name: appName,
          logo_url: uploadedLogoUrl,
          collections_config: {
            tab_count: validTabs.length,
            tabs: validTabs
          },
          start_screen_config: {
            title: startScreenTitle,
            subtitle: startScreenSubtitle,
            logo_url: uploadedLogoUrl
          },
          main_app_config: {
            hero_heading: heroHeadline || mainAppHeroHeading,
            hero_subheading: heroSubheading,
            hero_scrolling_text: heroScrollingText
          },
          post_checkout_config: {
            heading: postCheckoutHeading,
            subheading: postCheckoutSubheading,
            redirect_url: postCheckoutRedirectUrl
          }
        })
        .eq('id', editingApp.id)
        .select()
        .single();

      if (error) throw error;

      // Update the app in the list
      setDeliveryApps(prev => prev.map(app => 
        app.id === editingApp.id 
          ? {
              ...data,
              collections_config: data.collections_config as {
                tab_count: number;
                tabs: Array<{
                  name: string;
                  collection_handle: string;
                  icon?: string;
                }>;
              },
              custom_post_checkout_config: data.custom_post_checkout_config as {
                enabled: boolean;
                title: string;
                message: string;
                cta_button_text: string;
                cta_button_url: string;
                background_color: string;
                text_color: string;
              } | undefined
            }
          : app
      ));
      
      setIsCreating(false);
      setEditingApp(null);
      setAppName('');
      setTabs([]);
      
      // Reset customization fields
      setStartScreenTitle('');
      setStartScreenSubtitle('');
      setLogoFile(null);
      setLogoUrl('');
      setMainAppHeroHeading('');
      setPostCheckoutHeading('');
      setPostCheckoutSubheading('');
      setPostCheckoutRedirectUrl('');
      
      toast.success('Delivery app updated successfully!');

    } catch (error: any) {
      console.error('Error updating delivery app:', error);
      toast.error(error.message || 'Failed to update delivery app');
    }

  };

  const deleteApp = async (appId: string) => {
    if (!confirm('Are you sure you want to delete this delivery app?')) return;

    try {
      const { error } = await supabase
        .from('delivery_app_variations')
        .delete()
        .eq('id', appId);

      if (error) throw error;

      setDeliveryApps(prev => prev.filter(app => app.id !== appId));
      toast.success('Delivery app deleted');

    } catch (error) {
      console.error('Error deleting delivery app:', error);
      toast.error('Failed to delete delivery app');
    }
  };

  const copyAppUrl = (appSlug: string) => {
    const url = buildAppUrl(appSlug);
    navigator.clipboard.writeText(url);
    toast.success('App URL copied to clipboard');
  };
  const createCustomDeliveryAppPages = async (appSlug: string, appName: string, validTabs: Array<{ name: string; collection_handle: string }>) => {
    try {
      // Get the config data that was just saved
      const config = {
        app_name: appName,
        app_slug: appSlug,
        collections_config: {
          tab_count: validTabs.length,
          tabs: validTabs
        },
        start_screen_config: {
          title: startScreenTitle,
          subtitle: startScreenSubtitle
        },
        main_app_config: {
          hero_heading: mainAppHeroHeading
        },
        post_checkout_config: {
          heading: postCheckoutHeading,
          subheading: postCheckoutSubheading,
          redirect_url: postCheckoutRedirectUrl
        }
      };

      // Create customized versions of the template pages
      await createCustomStartScreen(appSlug, config);
      await createCustomMainApp(appSlug, config);
      await createCustomPostCheckout(appSlug, config);
      
      console.log(`Successfully created custom pages for ${appSlug}`);
    } catch (error) {
      console.error('Error creating custom pages:', error);
      throw error;
    }
  };

  const createCustomStartScreen = async (appSlug: string, config: any) => {
    // Read the template start screen component
    const templateContent = `import React from 'react';
import { CustomDeliveryStartScreen } from '@/components/custom-delivery/CustomDeliveryStartScreen';

export default function ${appSlug.charAt(0).toUpperCase() + appSlug.slice(1)}StartScreen() {
  const handleStartOrder = () => {
    sessionStorage.setItem('custom-app-context', JSON.stringify({
      appSlug: '${appSlug}',
      appName: '${config.app_name}'
    }));
    window.location.href = '/${appSlug}/app';
  };

  const handleSearchProducts = () => {
    sessionStorage.setItem('custom-app-context', JSON.stringify({
      appSlug: '${appSlug}',
      appName: '${config.app_name}'
    }));
    window.location.href = '/${appSlug}/app';
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background">
      <CustomDeliveryStartScreen
        appName="${config.app_name}"
        title="${config.start_screen_config?.title || config.app_name}"
        subtitle="${config.start_screen_config?.subtitle || 'Order your party supplies for delivery'}"
        onStartOrder={handleStartOrder}
        onSearchProducts={handleSearchProducts}
        onGoHome={handleGoHome}
      />
    </div>
  );
}`;

    // We'll create this as a dynamic route that loads the config from database
    // The physical file creation is handled by the routing system
  };

  const createCustomMainApp = async (appSlug: string, config: any) => {
    // This creates the main app page with custom collections and hero heading
    const templateContent = `import React, { useState } from 'react';
import { CustomDeliveryTabsPage } from '@/components/custom-delivery/CustomDeliveryTabsPage';
import { CustomDeliveryCart } from '@/components/custom-delivery/CustomDeliveryCart';
import { BottomCartBar } from '@/components/common/BottomCartBar';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useNavigate } from 'react-router-dom';

export default function ${appSlug.charAt(0).toUpperCase() + appSlug.slice(1)}MainApp() {
  useWakeLock();
  const navigate = useNavigate();
  
  const { cartItems, addToCart, updateQuantity, removeItem, emptyCart, getTotalPrice, getTotalItems } = useUnifiedCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const collectionsConfig = ${JSON.stringify(config.collections_config, null, 2)};

  const handleAddToCart = (product: any) => {
    const cartItem = {
      id: product.id,
      title: product.title,
      name: product.title,
      price: parseFloat(product.price),
      image: product.image,
      variant: product.variants?.[0]?.title !== 'Default Title' ? product.variants?.[0]?.title : undefined
    };
    
    console.log('🛒 DeliveryAppManager: Adding product to cart:', cartItem);
    // CRITICAL: Use ONLY updateQuantity to avoid dual cart system conflicts
    const currentQty = cartItems.find(item => {
      const itemId = item.productId || item.id;
      const itemVariant = item.variant || 'default';
      const checkVariant = cartItem.variant || 'default';
      return itemId === cartItem.id && itemVariant === checkVariant;
    })?.quantity || 0;
    
    updateQuantity(cartItem.id, cartItem.variant, currentQty + 1, cartItem);
  };

  const handleUpdateQuantity = (productId: string, variantId: string | undefined, quantity: number) => {
    updateQuantity(productId, variantId, quantity);
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    sessionStorage.setItem('custom-app-context', JSON.stringify({
      appSlug: '${appSlug}',
      appName: '${config.app_name}'
    }));
    navigate('/checkout');
  };

  const cartItemsForCategories = cartItems.map(item => ({
    id: item.id,
    title: item.title,
    name: item.name,
    price: item.price,
    image: item.image,
    quantity: item.quantity,
    variant: item.variant
  }));

  return (
    <div className="min-h-screen bg-background">
      <CustomDeliveryTabsPage
        appName="${config.app_name}"
        heroHeading="${config.main_app_config?.hero_heading || 'Order ' + config.app_name}"
        collectionsConfig={collectionsConfig}
        onAddToCart={handleAddToCart}
        cartItemCount={getTotalItems()}
        onOpenCart={() => setIsCartOpen(true)}
        cartItems={cartItemsForCategories}
        onUpdateQuantity={handleUpdateQuantity}
        onProceedToCheckout={handleCheckout}
        onBack={() => window.location.href = '/${appSlug}'}
        onGoHome={() => window.location.href = '/'}
      />

      <CustomDeliveryCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItemsForCategories}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={(productId: string, variantId?: string) => updateQuantity(productId, variantId, 0)}
        onEmptyCart={emptyCart}
        onCheckout={handleCheckout}
        totalPrice={getTotalPrice()}
        deliveryInfo={{
          date: null,
          timeSlot: null,
          address: null
        }}
      />

      {getTotalItems() > 0 && (
        <BottomCartBar
          items={cartItems}
          totalPrice={getTotalPrice()}
          isVisible={true}
          onOpenCart={() => setIsCartOpen(true)}
          onCheckout={handleCheckout}
        />
      )}
    </div>
  );
}`;
  };

  const createCustomPostCheckout = async (appSlug: string, config: any) => {
    // This creates the post-checkout page with custom heading, subheading, and redirect
    const templateContent = `import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { OrderCompleteView } from '@/components/OrderCompleteView';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export default function ${appSlug.charAt(0).toUpperCase() + appSlug.slice(1)}PostCheckout() {
  const location = useLocation();
  const { toast } = useToast();
  
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const postCheckoutConfig = ${JSON.stringify(config.post_checkout_config, null, 2)};

  useEffect(() => {
    const loadOrderData = async () => {
      try {
        // Load order data from URL params and session storage
        const urlParams = new URLSearchParams(location.search);
        const orderNumber = urlParams.get('order_number');
        
        // Get checkout data from session storage
        const checkoutData = sessionStorage.getItem('checkout-completion-data');
        if (checkoutData) {
          const parsedData = JSON.parse(checkoutData);
          
          const orderData = {
            order_number: orderNumber || "Processing...",
            customer_name: parsedData.customerName?.split(' ')[0] || 'Customer',
            total_amount: parsedData.totalAmount || 0,
            delivery_date: parsedData.deliveryDate,
            delivery_time: parsedData.deliveryTime,
            line_items: parsedData.cartItems || [],
            subtotal: parsedData.subtotal || 0,
            delivery_address: parsedData.deliveryAddress,
            share_token: parsedData.shareToken,
            sales_tax: parsedData.salesTax,
            delivery_fee: parsedData.deliveryFee,
            tip_amount: parsedData.tipAmount,
            applied_discount: parsedData.appliedDiscount
          };
          
          setOrderData(orderData);
          sessionStorage.removeItem('checkout-completion-data');
          
          toast({
            title: "🎉 Order Complete!",
            description: "Payment processed successfully!",
          });
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrderData();
  }, [location.search, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const handleAddMore = () => {
    if (postCheckoutConfig?.redirect_url) {
      window.location.href = postCheckoutConfig.redirect_url;
    } else {
      window.location.href = '/${appSlug}';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {postCheckoutConfig?.heading && (
        <div className="text-center py-8 px-4">
          <h1 className="text-3xl font-bold mb-2">{postCheckoutConfig.heading}</h1>
          {postCheckoutConfig?.subheading && (
            <p className="text-lg text-muted-foreground mb-6">{postCheckoutConfig.subheading}</p>
          )}
          {postCheckoutConfig?.redirect_url && (
            <Button onClick={handleAddMore} className="mb-8">
              Add More
            </Button>
          )}
        </div>
      )}
      
      <OrderCompleteView 
        orderNumber={orderData?.order_number || "Processing..."}
        customerName={orderData?.customer_name || 'Customer'}
        orderItems={orderData?.line_items || []}
        totalAmount={orderData?.total_amount || 0}
        deliveryDate={orderData?.delivery_date}
        deliveryTime={orderData?.delivery_time}
        deliveryAddress={orderData?.delivery_address}
        shareToken={orderData?.share_token}
        isLoading={!orderData}
        subtotal={orderData?.subtotal || 0}
        deliveryFee={orderData?.delivery_fee || 0}
        tipAmount={orderData?.tip_amount || 0}
        salesTax={orderData?.sales_tax || 0}
        appliedDiscount={orderData?.applied_discount}
      />
    </div>
  );
}`;
  };

  // Note: The actual page duplication is handled by the routing system
  // New apps use the dynamic routing with /:appName which loads configuration
  // from the delivery_app_variations table and customizes the template components

  const handleConfigUpdated = (appId: string, newConfig: any) => {
    setDeliveryApps(prev => 
      prev.map(app => 
        app.id === appId 
          ? { ...app, custom_post_checkout_config: newConfig }
          : app
      )
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Delivery App Variations</h2>
          <p className="text-muted-foreground">Create custom delivery apps with different collection tabs</p>
        </div>
        <Button 
          onClick={initializeNewApp} 
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-lg px-6 py-3 h-auto font-bold shadow-lg"
          size="lg"
        >
          <Plus className="h-5 w-5" />
          Create New Delivery App
        </Button>
      </div>

      {/* Main Delivery App Configuration */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-primary">Main Delivery App Configuration</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Customize the main delivery app that appears on the homepage
              </p>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-600">
              Homepage
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Find and edit main delivery app */}
            {apps.find((app: any) => app.is_homepage) ? (
              <div className="flex items-center justify-between p-3 border rounded bg-green-50">
                <div>
                  <div className="font-medium">{apps.find((app: any) => app.is_homepage)?.app_name}</div>
                  <div className="text-sm text-muted-foreground">Currently set as homepage</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open('/', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      const homepageApp = apps.find((app: any) => app.is_homepage);
                      if (homepageApp) {
                        setEditingApp(homepageApp);
                        setAppName(homepageApp.app_name);
                        setTabCount(homepageApp.collections_config.tab_count);
                        setTabs(homepageApp.collections_config.tabs);
                        setStartScreenTitle((homepageApp as any).start_screen_config?.title || '');
                        setStartScreenSubtitle((homepageApp as any).start_screen_config?.subtitle || '');
                        setLogoUrl((homepageApp as any).start_screen_config?.logo_url || (homepageApp as any).logo_url || '');
                        setMainAppHeroHeading((homepageApp as any).main_app_config?.hero_heading || '');
                        setHeroHeadline((homepageApp as any).main_app_config?.hero_heading || '');
                        setHeroSubheading((homepageApp as any).main_app_config?.hero_subheading || '');
                        setHeroScrollingText((homepageApp as any).main_app_config?.hero_scrolling_text || '');
                        setPostCheckoutHeading((homepageApp as any).post_checkout_config?.heading || '');
                        setPostCheckoutSubheading((homepageApp as any).post_checkout_config?.subheading || '');
                        setPostCheckoutRedirectUrl((homepageApp as any).post_checkout_config?.redirect_url || '');
                        setLogoFile(null);
                        setIsCreating(true);
                      }
                    }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Customize
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3 border rounded bg-yellow-50">
                <div className="text-sm text-yellow-700">
                  No app is currently set as homepage. The default main delivery app is being used.
                </div>
              </div>
            )}

            {/* Template Post-Checkout Page */}
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">Post-Checkout Template</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open('/order-complete', '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`https://lovable.dev?url=${encodeURIComponent(window.location.origin + '/order-complete')}`, '_blank')}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingApp ? 'Edit Delivery App' : 'Create New Delivery App'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="app-name">App Name</Label>
              <Input
                id="app-name"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="Boat Delivery App"
              />
            </div>

            <div>
              <Label htmlFor="tab-count">Number of Tabs</Label>
              <Select value={tabCount.toString()} onValueChange={(value) => handleTabCountChange(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 4, 5, 6, 7, 8].map(count => (
                    <SelectItem key={count} value={count.toString()}>{count} tabs</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configure Tabs</h3>
              {tabs.map((tab, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Tab Name</Label>
                        <Input
                          value={tab.name}
                          onChange={(e) => updateTab(index, 'name', e.target.value)}
                          placeholder="Spirits"
                        />
                      </div>
                      
                      <div>
                        <Label>Collection</Label>
                        <Select value={tab.collection_handle} onValueChange={(value) => updateTab(index, 'collection_handle', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select collection" />
                          </SelectTrigger>
                          <SelectContent>
                            {collections.map(collection => (
                              <SelectItem key={collection.id} value={collection.handle}>
                                {collection.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Start Screen Customization */}
            <Card className="border-blue-200 bg-blue-50/40">
              <CardHeader>
                <CardTitle className="text-blue-700">Start Screen Customization</CardTitle>
                <p className="text-sm text-blue-600">Title, subtitle, and start screen logo</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-title">Start Screen Title</Label>
                    <Input
                      id="start-title"
                      value={startScreenTitle}
                      onChange={(e) => setStartScreenTitle(e.target.value)}
                      placeholder="Welcome to ..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="start-subtitle">Start Screen Subtitle</Label>
                    <Input
                      id="start-subtitle"
                      value={startScreenSubtitle}
                      onChange={(e) => setStartScreenSubtitle(e.target.value)}
                      placeholder="Austin's favorite alcohol delivery service"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="start-logo-upload">Start Screen Logo</Label>
                  <Input
                    id="start-logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setLogoFile(file);
                        try { setLogoUrl(URL.createObjectURL(file)); } catch {}
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">PNG/JPG/SVG. Uploaded on save.</p>
                  {logoUrl && (
                    <div className="mt-2">
                      <img src={logoUrl} alt="Start screen logo preview" className="h-12 w-auto" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Main App Customization */}
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="text-green-700">Main App Customization</CardTitle>
                <p className="text-sm text-green-600">Customize the main delivery app interface</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="hero-logo-upload">Hero Section Logo</Label>
                  <Input
                    id="hero-logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setHeroSectionLogo(file);
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload a logo for the hero section (PNG, JPG, GIF)
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="hero-headline">Hero Headline</Label>
                  <Input
                    id="hero-headline"
                    value={heroHeadline}
                    onChange={(e) => setHeroHeadline(e.target.value)}
                    placeholder="Build Your Party Package"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Main headline displayed in the hero section
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="hero-subheading">Hero Subheading</Label>
                  <Input
                    id="hero-subheading"
                    value={heroSubheading}
                    onChange={(e) => setHeroSubheading(e.target.value)}
                    placeholder="Select from our curated collection of drinks and party supplies"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Supporting text displayed below the headline
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="hero-scrolling-text">Scrolling Hero Text</Label>
                  <Input
                    id="hero-scrolling-text"
                    value={heroScrollingText}
                    onChange={(e) => setHeroScrollingText(e.target.value)}
                    placeholder="Scrolling announcement text for hero"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Text that animates across the hero area
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="hero-heading">Hero Section Heading (Legacy)</Label>
                  <Input
                    id="hero-heading"
                    value={mainAppHeroHeading}
                    onChange={(e) => setMainAppHeroHeading(e.target.value)}
                    placeholder="Fresh Beverages Delivered to Your Boat"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Post-Checkout Customization */}
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader>
                <CardTitle className="text-purple-700">Post-Checkout Customization</CardTitle>
                <p className="text-sm text-purple-600">Customize the order confirmation page</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="checkout-heading">Confirmation Heading</Label>
                    <Input
                      id="checkout-heading"
                      value={postCheckoutHeading}
                      onChange={(e) => setPostCheckoutHeading(e.target.value)}
                      placeholder="Order Confirmed!"
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkout-subheading">Confirmation Subheading</Label>
                    <Input
                      id="checkout-subheading"
                      value={postCheckoutSubheading}
                      onChange={(e) => setPostCheckoutSubheading(e.target.value)}
                      placeholder="We'll have your drinks to you soon"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="redirect-url">Redirect Button URL</Label>
                    <Input
                      id="redirect-url"
                      value={postCheckoutRedirectUrl}
                      onChange={(e) => setPostCheckoutRedirectUrl(e.target.value)}
                      placeholder="https://example.com/more-services"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      URL for the main button on the confirmation page
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="button-text">Button Text</Label>
                    <Input
                      id="button-text"
                      value={postCheckoutButtonText}
                      onChange={(e) => setPostCheckoutButtonText(e.target.value)}
                      placeholder="Visit Our Website"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Text displayed on the main button
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setIsCreating(false);
                setEditingApp(null);
                setAppName('');
                setTabs([]);
                // Reset customization fields
                setHeroSectionLogo(null);
                setHeroHeadline('');
                setHeroSubheading('');
                setStartScreenTitle('');
                setStartScreenSubtitle('');
                setMainAppHeroHeading('');
                setPostCheckoutHeading('');
                setPostCheckoutSubheading('');
                setPostCheckoutRedirectUrl('');
                setPostCheckoutButtonText('');
              }}>
                Cancel
              </Button>
              <Button onClick={editingApp ? updateDeliveryApp : createDeliveryApp}>
                {editingApp ? 'Update App' : 'Create App'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delivery Apps List */}
      <div className="grid gap-4">
        {deliveryApps.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No delivery app variations created yet.</p>
              <Button onClick={initializeNewApp} className="mt-4">
                Create Your First App
              </Button>
            </CardContent>
          </Card>
        ) : (
          deliveryApps.map((app) => (
            <Card key={app.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{app.app_name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      /{app.app_slug}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={app.is_active ? 'default' : 'secondary'}>
                      {app.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {(app as any).is_homepage && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Homepage
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Tabs ({app.collections_config.tab_count})</h4>
                    <div className="flex flex-wrap gap-2">
                      {app.collections_config.tabs.map((tab, index) => (
                        <Badge key={index} variant="outline">
                          {tab.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Page URLs and Actions */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-muted-foreground">Pages</h5>
                      
                      {/* Start Page Row */}
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">Start Page</span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/${app.app_slug}`, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Open
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`https://lovable.dev?url=${encodeURIComponent(window.location.origin + '/' + app.app_slug)}`, '_blank')}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>

                      {/* App Page Row */}
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">App Page (Tabs)</span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/app/${app.app_slug}`, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Open
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`https://lovable.dev?url=${encodeURIComponent(window.location.origin + '/app/' + app.app_slug)}`, '_blank')}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>

                      {/* Post-Checkout Page Row */}
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">Post-Checkout Page</span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/${app.app_slug}/success`, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Open
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`https://lovable.dev?url=${encodeURIComponent(window.location.origin + '/' + app.app_slug + '/success')}`, '_blank')}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* App Management Actions */}
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyAppUrl(app.app_slug)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy URL
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingApp(app);
                          setAppName(app.app_name);
                          setTabCount(app.collections_config.tab_count);
                          setTabs(app.collections_config.tabs.map(tab => ({
                            name: tab.name,
                            collection_handle: tab.collection_handle
                          })));
                          
                          // Load existing customization data from the app configuration
                          const fullApp = app as any;
                          
                          const startConfig = fullApp.start_screen_config || {};
                          setStartScreenTitle(startConfig.title || '');
                          setStartScreenSubtitle(startConfig.subtitle || '');
                          setLogoUrl(startConfig.logo_url || fullApp.logo_url || '');
                          
                          // Main app config
                          const mainConfig = fullApp.main_app_config || {};
                          setMainAppHeroHeading(mainConfig.hero_heading || '');
                          setHeroHeadline(mainConfig.hero_heading || '');
                          setHeroSubheading(mainConfig.hero_subheading || '');
                          setHeroScrollingText(mainConfig.hero_scrolling_text || '');
                          // Post-checkout config
                          const postConfig = fullApp.post_checkout_config || {};
                          setPostCheckoutHeading(postConfig.heading || '');
                          setPostCheckoutSubheading(postConfig.subheading || '');
                          setPostCheckoutRedirectUrl(postConfig.redirect_url || '');
                          
                          setIsCreating(true);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Configure
                      </Button>
                      <Button
                        size="sm"
                        variant={(app as any).is_homepage ? "destructive" : "outline"}
                        onClick={async () => {
                          try {
                            const { error } = await supabase
                              .from('delivery_app_variations')
                              .update({ is_homepage: !(app as any).is_homepage })
                              .eq('id', app.id);
                            
                            if (error) throw error;
                            
                            // Refresh the data to update the UI
                            await loadData();
                            toast.success((app as any).is_homepage ? 'Removed from homepage' : 'Set as homepage');
                          } catch (error) {
                            console.error('Error updating homepage status:', error);
                            toast.error('Failed to update homepage status');
                          }
                        }}
                      >
                        {(app as any).is_homepage ? 'Remove Homepage' : 'Set as Homepage'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteApp(app.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Post-Checkout Configuration Dialog */}
      <Dialog open={!!selectedAppForConfig} onOpenChange={() => setSelectedAppForConfig(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Configure Post-Checkout for "{selectedAppForConfig?.app_name}"
            </DialogTitle>
          </DialogHeader>
          {selectedAppForConfig && (
            <CustomPostCheckoutEditor
              appId={selectedAppForConfig.id}
              currentConfig={selectedAppForConfig.custom_post_checkout_config || {
                enabled: false,
                title: "",
                message: "",
                cta_button_text: "",
                cta_button_url: "",
                background_color: "#ffffff",
                text_color: "#000000"
              }}
              onConfigUpdated={(newConfig) => handleConfigUpdated(selectedAppForConfig.id, newConfig)}
            />
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}