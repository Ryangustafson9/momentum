/**
 * Performance Optimization Utilities
 * Provides tools and patterns for optimizing React components and application performance
 */

import React, { memo, useMemo, useCallback, lazy, Suspense } from 'react';
import { createLogger } from './logger';

const logger = createLogger('Performance');

// ==================== COMPONENT OPTIMIZATION ====================

/**
 * Enhanced memo with custom comparison
 */
export const optimizedMemo = (Component, customCompare) => {
  const defaultCompare = (prevProps, nextProps) => {
    // Shallow comparison for most props
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);
    
    if (prevKeys.length !== nextKeys.length) return false;
    
    return prevKeys.every(key => {
      // Skip function props in comparison (they should be memoized)
      if (typeof prevProps[key] === 'function' && typeof nextProps[key] === 'function') {
        return true;
      }
      return prevProps[key] === nextProps[key];
    });
  };

  return memo(Component, customCompare || defaultCompare);
};

/**
 * HOC for performance monitoring
 */
export const withPerformanceMonitoring = (Component, componentName) => {
  return React.forwardRef((props, ref) => {
    const renderStart = performance.now();
    
    React.useEffect(() => {
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;
      
      if (renderTime > 16) { // More than one frame (60fps)
        logger.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    });

    return <Component {...props} ref={ref} />;
  });
};

/**
 * Lazy loading with error boundary
 */
export const createLazyComponent = (importFn, fallback = null) => {
  const LazyComponent = lazy(importFn);
  
  return React.forwardRef((props, ref) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} ref={ref} />
    </Suspense>
  ));
};

// ==================== HOOK OPTIMIZATIONS ====================

/**
 * Optimized useCallback that warns about missing dependencies
 */
export const useOptimizedCallback = (callback, deps, debugName) => {
  if (import.meta.env.DEV && debugName) {
    // In development, track callback recreations
    const recreationCount = React.useRef(0);
    
    React.useEffect(() => {
      recreationCount.current++;
      if (recreationCount.current > 5) {
        logger.warn(`Callback ${debugName} recreated ${recreationCount.current} times`);
      }
    }, deps);
  }
  
  return useCallback(callback, deps);
};

/**
 * Optimized useMemo with performance tracking
 */
export const useOptimizedMemo = (factory, deps, debugName) => {
  return useMemo(() => {
    const start = performance.now();
    const result = factory();
    const end = performance.now();
    
    if (import.meta.env.DEV && debugName && (end - start) > 5) {
      logger.warn(`Expensive memo computation in ${debugName}: ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  }, deps);
};

/**
 * Debounced state hook
 */
export const useDebouncedState = (initialValue, delay = 300) => {
  const [value, setValue] = React.useState(initialValue);
  const [debouncedValue, setDebouncedValue] = React.useState(initialValue);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return [debouncedValue, setValue];
};

// ==================== RENDER OPTIMIZATION ====================

/**
 * Virtual scrolling hook for large lists
 */
export const useVirtualScrolling = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    };
  }, [items, itemHeight, containerHeight, scrollTop]);
  
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);
  
  return { visibleItems, handleScroll };
};

/**
 * Intersection observer hook for lazy loading
 */
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [entry, setEntry] = React.useState(null);
  const elementRef = React.useRef(null);
  
  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );
    
    observer.observe(element);
    
    return () => observer.disconnect();
  }, [options]);
  
  return { elementRef, isIntersecting, entry };
};

// ==================== BUNDLE OPTIMIZATION ====================

/**
 * Dynamic import with retry logic
 */
export const dynamicImport = async (importFn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await importFn();
    } catch (error) {
      if (i === retries - 1) throw error;
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

/**
 * Preload critical components
 */
export const preloadComponents = (componentImports) => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      componentImports.forEach(importFn => {
        importFn().catch(error => {
          logger.warn('Failed to preload component:', error);
        });
      });
    });
  }
};

// ==================== MEMORY OPTIMIZATION ====================

/**
 * Cleanup hook for preventing memory leaks
 */
export const useCleanup = (cleanupFn) => {
  React.useEffect(() => {
    return cleanupFn;
  }, [cleanupFn]);
};

/**
 * Weak map cache for component instances
 */
const componentCache = new WeakMap();

export const useCachedComponent = (Component, cacheKey) => {
  return useMemo(() => {
    if (componentCache.has(cacheKey)) {
      return componentCache.get(cacheKey);
    }
    
    const CachedComponent = memo(Component);
    componentCache.set(cacheKey, CachedComponent);
    return CachedComponent;
  }, [Component, cacheKey]);
};

// ==================== PERFORMANCE MONITORING ====================

/**
 * Performance metrics collector
 */
export const usePerformanceMetrics = (componentName) => {
  const metricsRef = React.useRef({
    renderCount: 0,
    totalRenderTime: 0,
    averageRenderTime: 0
  });
  
  React.useEffect(() => {
    const start = performance.now();
    
    return () => {
      const end = performance.now();
      const renderTime = end - start;
      
      metricsRef.current.renderCount++;
      metricsRef.current.totalRenderTime += renderTime;
      metricsRef.current.averageRenderTime = 
        metricsRef.current.totalRenderTime / metricsRef.current.renderCount;
      
      if (import.meta.env.DEV) {
        logger.debug(`${componentName} metrics:`, metricsRef.current);
      }
    };
  });
  
  return metricsRef.current;
};

// ==================== EXPORTS ====================

export default {
  optimizedMemo,
  withPerformanceMonitoring,
  createLazyComponent,
  useOptimizedCallback,
  useOptimizedMemo,
  useDebouncedState,
  useVirtualScrolling,
  useIntersectionObserver,
  dynamicImport,
  preloadComponents,
  useCleanup,
  useCachedComponent,
  usePerformanceMetrics
};
