/**
 * ⚡ PERFORMANCE OPTIMIZATION HOOKS
 * Advanced React hooks for performance optimization
 */

import { 
  useState, 
  useEffect, 
  useRef, 
  useCallback, 
  useMemo,
  useLayoutEffect 
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { CACHE_CONFIG, trackQueryPerformance } from '@/lib/queryClient';
import { reactOptimizations } from '@/lib/performance';

// ⭐ PERFORMANCE: Debounced state hook
export const useDebouncedState = (initialValue, delay = 300) => {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return [debouncedValue, setValue, value];
};

// ⭐ PERFORMANCE: Throttled callback hook
export const useThrottledCallback = (callback, delay = 100) => {
  const throttledFn = useMemo(
    () => reactOptimizations.throttle(callback, delay),
    [callback, delay]
  );

  return throttledFn;
};

// ⭐ PERFORMANCE: Debounced callback hook
export const useDebouncedCallback = (callback, delay = 300) => {
  const debouncedFn = useMemo(
    () => reactOptimizations.debounce(callback, delay),
    [callback, delay]
  );

  return debouncedFn;
};

// ⭐ PERFORMANCE: Intersection observer hook
export const useIntersectionObserver = (
  elementRef,
  options = {},
  callback = null
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);
        
        if (callback) {
          callback(entry);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options, callback]);

  return { isIntersecting, entry };
};

// ⭐ PERFORMANCE: Optimized query hook with performance tracking
export const useOptimizedQuery = (
  queryKey,
  queryFn,
  options = {},
  cacheType = 'DYNAMIC'
) => {
  const startTime = useRef(Date.now());
  
  const cacheConfig = CACHE_CONFIG[cacheType] || CACHE_CONFIG.DYNAMIC;
  
  const result = useQuery({
    queryKey,
    queryFn: async (...args) => {
      startTime.current = Date.now();
      const data = await queryFn(...args);
      const duration = Date.now() - startTime.current;
      
      // Track query performance
      trackQueryPerformance(queryKey, duration, false);
      
      return data;
    },
    ...cacheConfig,
    ...options,
    onSuccess: (data) => {
      const duration = Date.now() - startTime.current;
      trackQueryPerformance(queryKey, duration, true);
      options.onSuccess?.(data);
    },
  });

  return result;
};

// ⭐ PERFORMANCE: Virtual scrolling hook
export const useVirtualScrolling = (
  items,
  itemHeight,
  containerHeight,
  overscan = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1)
      .map((item, index) => ({
        ...item,
        index: visibleRange.startIndex + index,
        top: (visibleRange.startIndex + index) * itemHeight,
      }));
  }, [items, visibleRange, itemHeight]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((event) => {
    setScrollTop(event.target.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    visibleRange,
  };
};

// ⭐ PERFORMANCE: Memoized selector hook
export const useMemoizedSelector = (selector, dependencies = []) => {
  return useMemo(selector, dependencies);
};

// ⭐ PERFORMANCE: Stable callback hook
export const useStableCallback = (callback, dependencies = []) => {
  return useCallback(callback, dependencies);
};

// ⭐ PERFORMANCE: Previous value hook
export const usePrevious = (value) => {
  const ref = useRef();
  
  useEffect(() => {
    ref.current = value;
  });
  
  return ref.current;
};

// ⭐ PERFORMANCE: Component did update hook
export const useComponentDidUpdate = (callback, dependencies) => {
  const hasMount = useRef(false);
  
  useEffect(() => {
    if (hasMount.current) {
      callback();
    } else {
      hasMount.current = true;
    }
  }, dependencies);
};

// ⭐ PERFORMANCE: Render count hook (for debugging)
export const useRenderCount = (componentName = 'Component') => {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    
    if (process.env.NODE_ENV === 'development') {
      
    }
  });
  
  return renderCount.current;
};

// ⭐ PERFORMANCE: Why did you update hook (for debugging)
export const useWhyDidYouUpdate = (name, props) => {
  const previousProps = useRef();
  
  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps = {};
      
      allKeys.forEach(key => {
        if (previousProps.current[key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current[key],
            to: props[key],
          };
        }
      });
      
      if (Object.keys(changedProps).length && process.env.NODE_ENV === 'development') {
        
      }
    }
    
    previousProps.current = props;
  });
};

// ⭐ PERFORMANCE: Async state hook with loading and error handling
export const useAsyncState = (asyncFunction, dependencies = []) => {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (...args) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await asyncFunction(...args);
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      setState({ data: null, loading: false, error });
      throw error;
    }
  }, dependencies);

  return { ...state, execute };
};

// ⭐ PERFORMANCE: Local storage hook with performance optimization
export const useOptimizedLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      // Use requestIdleCallback for non-critical localStorage writes
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        });
      } else {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};

// ⭐ PERFORMANCE: Window size hook with throttling
export const useOptimizedWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = reactOptimizations.throttle(() => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }, 100);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

// ⭐ PERFORMANCE: Idle callback hook
export const useIdleCallback = (callback, dependencies = []) => {
  useEffect(() => {
    if (window.requestIdleCallback) {
      const id = window.requestIdleCallback(callback);
      return () => window.cancelIdleCallback(id);
    } else {
      const id = setTimeout(callback, 0);
      return () => clearTimeout(id);
    }
  }, dependencies);
};

export default {
  useDebouncedState,
  useThrottledCallback,
  useDebouncedCallback,
  useIntersectionObserver,
  useOptimizedQuery,
  useVirtualScrolling,
  useMemoizedSelector,
  useStableCallback,
  usePrevious,
  useComponentDidUpdate,
  useRenderCount,
  useWhyDidYouUpdate,
  useAsyncState,
  useOptimizedLocalStorage,
  useOptimizedWindowSize,
  useIdleCallback,
};

