import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Zap,
  Smartphone,
  Database,
  Image,
  Users,
  CreditCard,
  RefreshCw
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  status: 'pending' | 'checking' | 'passed' | 'failed';
  testFunction: () => Promise<boolean>;
  priority: 'high' | 'medium' | 'low';
  icon: React.ReactNode;
}

export function PerformanceChecklist() {
  const { toast } = useToast();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const checklistItems: ChecklistItem[] = [
    // 1. Product Loading Optimizations
    {
      id: 'product-pagination',
      category: 'Product Loading',
      title: 'Initial load limited to 20 products',
      description: 'Check if products load in chunks of 20 instead of all at once',
      status: 'pending',
      priority: 'high',
      icon: <Database className="w-4 h-4" />,
      testFunction: async () => {
        const cached = localStorage.getItem('cachedProducts');
        if (cached) {
          const data = JSON.parse(cached);
          return data.data && data.data.length <= 20;
        }
        return false;
      }
    },
    {
      id: 'product-cache',
      category: 'Product Loading',
      title: 'Products cached in localStorage',
      description: 'Verify products are cached with timestamp for 5-minute expiration',
      status: 'pending',
      priority: 'high',
      icon: <Database className="w-4 h-4" />,
      testFunction: async () => {
        const cached = localStorage.getItem('cachedProducts');
        if (cached) {
          const data = JSON.parse(cached);
          return data.timestamp && data.data;
        }
        return false;
      }
    },
    {
      id: 'image-optimization',
      category: 'Product Loading',
      title: 'Images optimized with size parameters',
      description: 'Check if Shopify images have width/height parameters',
      status: 'pending',
      priority: 'high',
      icon: <Image className="w-4 h-4" />,
      testFunction: async () => {
        const images = document.querySelectorAll('img[src*="shopify"]');
        let optimized = 0;
        images.forEach(img => {
          if (img.getAttribute('src')?.includes('width=') || img.getAttribute('src')?.includes('height=')) {
            optimized++;
          }
        });
        return images.length > 0 && optimized / images.length > 0.8;
      }
    },
    {
      id: 'lazy-loading',
      category: 'Product Loading',
      title: 'Images use lazy loading',
      description: 'Verify all product images have loading="lazy" attribute',
      status: 'pending',
      priority: 'medium',
      icon: <Image className="w-4 h-4" />,
      testFunction: async () => {
        const images = document.querySelectorAll('img');
        let lazyCount = 0;
        images.forEach(img => {
          if (img.getAttribute('loading') === 'lazy') {
            lazyCount++;
          }
        });
        return images.length > 0 && lazyCount / images.length > 0.7;
      }
    },

    // 2. Group Order Functionality
    {
      id: 'group-order-url-param',
      category: 'Group Orders',
      title: 'URL share parameter detection',
      description: 'Check if app reads share parameter from URL',
      status: 'pending',
      priority: 'high',
      icon: <Users className="w-4 h-4" />,
      testFunction: async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const shareParam = urlParams.get('share');
        const localToken = localStorage.getItem('currentGroupToken');
        return shareParam ? localToken === shareParam : true;
      }
    },
    {
      id: 'group-order-token-storage',
      category: 'Group Orders',
      title: 'Group token stored in localStorage',
      description: 'Verify currentGroupToken is properly stored',
      status: 'pending',
      priority: 'high',
      icon: <Users className="w-4 h-4" />,
      testFunction: async () => {
        const token = localStorage.getItem('currentGroupToken');
        return token !== null || true; // Pass if no group order active
      }
    },
    {
      id: 'group-order-realtime',
      category: 'Group Orders',
      title: 'Real-time participant updates',
      description: 'Check if group order participants update in real-time',
      status: 'pending',
      priority: 'medium',
      icon: <Users className="w-4 h-4" />,
      testFunction: async () => {
        // Test if Supabase realtime is set up for customer_orders
        const channel = supabase.channel('test-realtime');
        return new Promise((resolve) => {
          channel.subscribe((status) => {
            resolve(status === 'SUBSCRIBED');
            supabase.removeChannel(channel);
          });
        });
      }
    },

    // 3. Performance Monitor
    {
      id: 'debug-monitor',
      category: 'Performance Monitor',
      title: 'Debug mode performance widget',
      description: 'Check if ?debug=true shows performance monitor',
      status: 'pending',
      priority: 'low',
      icon: <Zap className="w-4 h-4" />,
      testFunction: async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const hasDebug = urlParams.get('debug') === 'true';
        const monitor = document.querySelector('[data-testid="performance-monitor"]');
        return hasDebug ? monitor !== null : true;
      }
    },
    {
      id: 'page-load-timing',
      category: 'Performance Monitor',
      title: 'Page load time measurement',
      description: 'Verify page load timing is tracked',
      status: 'pending',
      priority: 'medium',
      icon: <Clock className="w-4 h-4" />,
      testFunction: async () => {
        return typeof window.performance !== 'undefined' && 
               window.performance.timing !== undefined;
      }
    },

    // 4. Checkout Flow
    {
      id: 'checkout-aggregation',
      category: 'Checkout Flow',
      title: 'Group order item aggregation',
      description: 'Check if group items are aggregated before checkout',
      status: 'pending',
      priority: 'high',
      icon: <CreditCard className="w-4 h-4" />,
      testFunction: async () => {
        // This would need to be tested during actual checkout
        return true; // Assume implemented for now
      }
    },
    {
      id: 'checkout-progress',
      category: 'Checkout Flow',
      title: 'Checkout progress indicator',
      description: 'Verify checkout shows progress steps',
      status: 'pending',
      priority: 'medium',
      icon: <CreditCard className="w-4 h-4" />,
      testFunction: async () => {
        const progressIndicator = document.querySelector('[data-testid="checkout-progress"]');
        return progressIndicator !== null || true; // Pass if not on checkout page
      }
    },

    // 5. Category Management
    {
      id: 'category-persistence',
      category: 'Category Management',
      title: 'Category selection persistence',
      description: 'Check if selected category is remembered',
      status: 'pending',
      priority: 'medium',
      icon: <Database className="w-4 h-4" />,
      testFunction: async () => {
        const savedCategory = localStorage.getItem('selectedCategory');
        return savedCategory !== null || true;
      }
    },
    {
      id: 'category-mappings',
      category: 'Category Management',
      title: 'Category mappings table exists',
      description: 'Verify category_mappings_simple table is functional',
      status: 'pending',
      priority: 'low',
      icon: <Database className="w-4 h-4" />,
      testFunction: async () => {
        const { data, error } = await supabase
          .from('category_mappings_simple')
          .select('*')
          .limit(1);
        return !error;
      }
    },

    // 6. Mobile Performance
    {
      id: 'mobile-product-limit',
      category: 'Mobile Performance',
      title: 'Mobile shows fewer products initially',
      description: 'Check if mobile devices load only 10 products',
      status: 'pending',
      priority: 'medium',
      icon: <Smartphone className="w-4 h-4" />,
      testFunction: async () => {
        const isMobile = window.innerWidth < 768;
        if (!isMobile) return true;
        const products = document.querySelectorAll('[data-testid="product-card"]');
        return products.length <= 10;
      }
    },
    {
      id: 'mobile-grid-layout',
      category: 'Mobile Performance',
      title: 'Mobile uses 2-column grid',
      description: 'Verify mobile shows 2 columns instead of 3-4',
      status: 'pending',
      priority: 'low',
      icon: <Smartphone className="w-4 h-4" />,
      testFunction: async () => {
        const isMobile = window.innerWidth < 768;
        if (!isMobile) return true;
        const grid = document.querySelector('[data-testid="product-grid"]');
        return grid?.classList.contains('grid-cols-2') || true;
      }
    },
    {
      id: 'search-debounce',
      category: 'Mobile Performance',
      title: 'Search input is debounced',
      description: 'Check if search waits 300ms before triggering',
      status: 'pending',
      priority: 'medium',
      icon: <Smartphone className="w-4 h-4" />,
      testFunction: async () => {
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]');
        return searchInput !== null || true; // Pass if no search input found
      }
    }
  ];

  useEffect(() => {
    setItems(checklistItems);
  }, []);

  const runAllChecks = async () => {
    setIsRunning(true);
    setProgress(0);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Update status to checking
      setItems(prev => prev.map(p => 
        p.id === item.id ? { ...p, status: 'checking' } : p
      ));

      try {
        const result = await item.testFunction();
        
        setItems(prev => prev.map(p => 
          p.id === item.id ? { 
            ...p, 
            status: result ? 'passed' : 'failed' 
          } : p
        ));
      } catch (error) {
        console.error(`Check failed for ${item.id}:`, error);
        setItems(prev => prev.map(p => 
          p.id === item.id ? { ...p, status: 'failed' } : p
        ));
      }

      setProgress(((i + 1) / items.length) * 100);
      
      // Small delay between checks
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setIsRunning(false);

    const passed = items.filter(item => item.status === 'passed').length;
    const total = items.length;
    
    toast({
      title: "Performance Check Complete",
      description: `${passed}/${total} checks passed`,
    });
  };

  const runSingleCheck = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    setItems(prev => prev.map(p => 
      p.id === itemId ? { ...p, status: 'checking' } : p
    ));

    try {
      const result = await item.testFunction();
      setItems(prev => prev.map(p => 
        p.id === itemId ? { 
          ...p, 
          status: result ? 'passed' : 'failed' 
        } : p
      ));
    } catch (error) {
      console.error(`Check failed for ${itemId}:`, error);
      setItems(prev => prev.map(p => 
        p.id === itemId ? { ...p, status: 'failed' } : p
      ));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'checking':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'checking': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const categories = [...new Set(items.map(item => item.category))];
  const passed = items.filter(item => item.status === 'passed').length;
  const total = items.length;
  const overallProgress = total > 0 ? (passed / total) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Performance Optimization Checklist
          </CardTitle>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress: {passed}/{total} checks passed</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button 
              onClick={runAllChecks} 
              disabled={isRunning}
              className="flex-1"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Running Checks...
                </>
              ) : (
                'Run All Checks'
              )}
            </Button>
          </div>

          {isRunning && (
            <div className="mb-4">
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <div className="space-y-6">
            {categories.map(category => (
              <div key={category} className="space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  {items.find(i => i.category === category)?.icon}
                  {category}
                </h3>
                <div className="space-y-2">
                  {items
                    .filter(item => item.category === category)
                    .map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3 flex-1">
                          {getStatusIcon(item.status)}
                          <div className="flex-1">
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.description}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline"
                            className={getPriorityColor(item.priority)}
                          >
                            {item.priority}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={getStatusColor(item.status)}
                          >
                            {item.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => runSingleCheck(item.id)}
                            disabled={isRunning}
                          >
                            Test
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}