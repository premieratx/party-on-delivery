import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { X, Trash2, Move } from 'lucide-react';

interface PerformanceData {
  pageLoadTime: number;
  productsLoaded: number;
  cacheStatus: 'hit' | 'miss' | 'none';
  groupToken: string | null;
}

export const PerformanceMonitor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [data, setData] = useState<PerformanceData>({
    pageLoadTime: 0,
    productsLoaded: 0,
    cacheStatus: 'none',
    groupToken: null
  });
  
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });

  // Check if debug mode is enabled
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setIsVisible(urlParams.has('debug') && urlParams.get('debug') === 'true');
  }, []);

  // Calculate page load time
  useEffect(() => {
    if (typeof window !== 'undefined' && window.performance) {
      const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
      setData(prev => ({ ...prev, pageLoadTime: loadTime }));
    }
  }, []);

  // Monitor localStorage for cache status and group token
  useEffect(() => {
    const checkLocalStorage = () => {
      const cachedProducts = localStorage.getItem('cachedProducts');
      const groupToken = localStorage.getItem('currentGroupToken');
      
      let cacheStatus: 'hit' | 'miss' | 'none' = 'none';
      let productsLoaded = 0;

      if (cachedProducts) {
        try {
          const parsed = JSON.parse(cachedProducts);
          productsLoaded = parsed.data?.length || 0;
          cacheStatus = 'hit';
        } catch (e) {
          cacheStatus = 'miss';
        }
      }

      setData(prev => ({
        ...prev,
        cacheStatus,
        productsLoaded,
        groupToken
      }));
    };

    checkLocalStorage();
    const interval = setInterval(checkLocalStorage, 1000);
    return () => clearInterval(interval);
  }, []);

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const clearCache = () => {
    localStorage.removeItem('cachedProducts');
    localStorage.removeItem('currentGroupToken');
    localStorage.removeItem('shopify-collections-cache');
    setData(prev => ({
      ...prev,
      cacheStatus: 'none',
      productsLoaded: 0,
      groupToken: null
    }));
  };

  if (!isVisible) return null;

  return (
    <Card
      ref={dragRef}
      className="fixed z-50 p-3 bg-black/80 text-white text-xs w-64 cursor-move"
      style={{
        left: position.x,
        top: position.y,
        backdropFilter: 'blur(4px)'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold flex items-center gap-1">
          <Move className="w-3 h-3" />
          Performance Monitor
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-white hover:bg-white/20"
          onClick={() => setIsVisible(false)}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Page Load:</span>
          <Badge variant="outline" className="text-xs">
            {data.pageLoadTime > 0 ? `${data.pageLoadTime}ms` : 'Loading...'}
          </Badge>
        </div>

        <div className="flex justify-between">
          <span>Products:</span>
          <Badge variant="outline" className="text-xs">
            {data.productsLoaded}
          </Badge>
        </div>

        <div className="flex justify-between">
          <span>Cache:</span>
          <Badge 
            variant={data.cacheStatus === 'hit' ? 'default' : 'destructive'}
            className="text-xs"
          >
            {data.cacheStatus}
          </Badge>
        </div>

        {data.groupToken && (
          <div className="flex justify-between">
            <span>Group Token:</span>
            <Badge variant="secondary" className="text-xs">
              {data.groupToken.slice(0, 8)}...
            </Badge>
          </div>
        )}

        <Button
          variant="destructive"
          size="sm"
          className="w-full h-6 text-xs"
          onClick={clearCache}
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Clear Cache
        </Button>
      </div>
    </Card>
  );
};