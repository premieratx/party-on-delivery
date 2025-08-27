import { useState, useEffect, useCallback, useMemo } from 'react';

interface VirtualizedOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  itemsPerRow?: number;
}

export function useVirtualizedProductList<T>(
  items: T[],
  options: VirtualizedOptions
) {
  const {
    itemHeight,
    containerHeight,
    overscan = 5,
    itemsPerRow = 1
  } = options;

  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = Math.ceil(items.length / itemsPerRow) * itemHeight;
  const visibleItemCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    Math.ceil(items.length / itemsPerRow),
    startIndex + visibleItemCount + overscan * 2
  );

  const visibleItems = useMemo(() => {
    const result: { index: number; items: T[]; offsetY: number }[] = [];
    
    for (let i = startIndex; i < endIndex; i++) {
      const rowItems: T[] = [];
      for (let j = 0; j < itemsPerRow; j++) {
        const itemIndex = i * itemsPerRow + j;
        if (itemIndex < items.length) {
          rowItems.push(items[itemIndex]);
        }
      }
      
      if (rowItems.length > 0) {
        result.push({
          index: i,
          items: rowItems,
          offsetY: i * itemHeight
        });
      }
    }
    
    return result;
  }, [items, startIndex, endIndex, itemHeight, itemsPerRow]);

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    onScroll,
    scrollTop
  };
}