/**
 * ⚡ PERFORMANCE MONITORING & OPTIMIZATION
 * Advanced performance tracking and optimization utilities
 */

import { logger } from '@/lib/logger';

// ⭐ PERFORMANCE: Performance metrics collector
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isEnabled = typeof window !== 'undefined' && 'performance' in window;
    
    if (this.isEnabled) {
      this.initializeObservers();
    }
  }

  // Initialize performance observers
  initializeObservers() {
    try {
      // ⭐ PERFORMANCE: Navigation timing
      if ('PerformanceObserver' in window) {
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('navigation', {
              type: entry.entryType,
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navObserver);

        // ⭐ PERFORMANCE: Resource timing
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 100) { // Only track slow resources
              this.recordMetric('resource', {
                name: entry.name,
                duration: entry.duration,
                size: entry.transferSize,
                type: entry.initiatorType,
              });
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);

        // ⭐ PERFORMANCE: Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('lcp', {
              value: entry.startTime,
              element: entry.element?.tagName,
            });
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);

        // ⭐ PERFORMANCE: First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('fid', {
              value: entry.processingStart - entry.startTime,
              name: entry.name,
            });
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);

        // ⭐ PERFORMANCE: Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          if (clsValue > 0) {
            this.recordMetric('cls', { value: clsValue });
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      }
    } catch (error) {
      logger.warn('Performance observers not supported:', error);
    }
  }

  // Record a performance metric
  recordMetric(type, data) {
    const timestamp = Date.now();
    const metric = {
      type,
      data,
      timestamp,
    };

    if (!this.metrics.has(type)) {
      this.metrics.set(type, []);
    }

    this.metrics.get(type).push(metric);

    // Keep only last 100 metrics per type
    const typeMetrics = this.metrics.get(type);
    if (typeMetrics.length > 100) {
      typeMetrics.shift();
    }

    // Log critical performance issues
    this.checkPerformanceThresholds(type, data);
  }

  // Check performance thresholds and warn about issues
  checkPerformanceThresholds(type, data) {
    const thresholds = {
      lcp: 2500, // 2.5 seconds
      fid: 100,  // 100ms
      cls: 0.1,  // 0.1
      resource: 1000, // 1 second
    };

    const threshold = thresholds[type];
    if (!threshold) return;

    const value = data.value || data.duration;
    if (value > threshold) {
      logger.warn(`Performance threshold exceeded for ${type}:`, {
        value,
        threshold,
        data,
      });
    }
  }

  // Get performance summary
  getSummary() {
    const summary = {};
    
    for (const [type, metrics] of this.metrics.entries()) {
      const values = metrics.map(m => m.data.value || m.data.duration).filter(Boolean);
      
      if (values.length > 0) {
        summary[type] = {
          count: values.length,
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          latest: values[values.length - 1],
        };
      }
    }

    return summary;
  }

  // Cleanup observers
  cleanup() {
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
    this.metrics.clear();
  }
}

// ⭐ PERFORMANCE: Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// ⭐ PERFORMANCE: Component performance tracking
export const trackComponentRender = (componentName, renderTime) => {
  performanceMonitor.recordMetric('component-render', {
    component: componentName,
    duration: renderTime,
  });
};

// ⭐ PERFORMANCE: Query performance tracking
export const trackQueryPerformance = (queryKey, duration, cacheHit = false) => {
  performanceMonitor.recordMetric('query-performance', {
    queryKey: Array.isArray(queryKey) ? queryKey.join('.') : queryKey,
    duration,
    cacheHit,
  });
};

// ⭐ PERFORMANCE: Bundle size tracking
export const trackBundleSize = () => {
  if (typeof window === 'undefined') return;

  const scripts = document.querySelectorAll('script[src]');
  let totalSize = 0;
  let loadedScripts = 0;

  scripts.forEach(script => {
    if (script.src.includes('chunk') || script.src.includes('vendor')) {
      fetch(script.src, { method: 'HEAD' })
        .then(response => {
          const size = parseInt(response.headers.get('content-length') || '0');
          totalSize += size;
          loadedScripts++;

          if (loadedScripts === scripts.length) {
            performanceMonitor.recordMetric('bundle-size', {
              totalSize,
              scriptCount: scripts.length,
              averageSize: totalSize / scripts.length,
            });
          }
        })
        .catch(() => {
          // Ignore errors for bundle size tracking
        });
    }
  });
};

// ⭐ PERFORMANCE: Memory usage tracking
export const trackMemoryUsage = () => {
  if (typeof window === 'undefined' || !performance.memory) return;

  const memoryInfo = performance.memory;
  performanceMonitor.recordMetric('memory-usage', {
    used: memoryInfo.usedJSHeapSize,
    total: memoryInfo.totalJSHeapSize,
    limit: memoryInfo.jsHeapSizeLimit,
    percentage: (memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100,
  });
};

// ⭐ PERFORMANCE: Network performance tracking
export const trackNetworkPerformance = () => {
  if (typeof navigator === 'undefined' || !navigator.connection) return;

  const connection = navigator.connection;
  performanceMonitor.recordMetric('network-performance', {
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData,
  });
};

// ⭐ PERFORMANCE: Performance optimization utilities
export const optimizeImages = {
  // Lazy load images with intersection observer
  lazyLoad: (imageSelector = 'img[data-src]') => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });

    document.querySelectorAll(imageSelector).forEach(img => {
      imageObserver.observe(img);
    });
  },

  // Preload critical images
  preload: (imageSrcs) => {
    imageSrcs.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  },
};

// ⭐ PERFORMANCE: React performance utilities
export const reactOptimizations = {
  // Debounce function for expensive operations
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function for frequent events
  throttle: (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Memoization helper
  memoize: (fn) => {
    const cache = new Map();
    return (...args) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn(...args);
      cache.set(key, result);
      return result;
    };
  },
};

// ⭐ PERFORMANCE: Initialize performance tracking
export const initializePerformanceTracking = () => {
  if (typeof window === 'undefined') return;

  // Track initial metrics
  setTimeout(() => {
    trackBundleSize();
    trackMemoryUsage();
    trackNetworkPerformance();
  }, 1000);

  // Track memory usage periodically
  setInterval(trackMemoryUsage, 30000); // Every 30 seconds

  // Track network changes
  if (navigator.connection) {
    navigator.connection.addEventListener('change', trackNetworkPerformance);
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    performanceMonitor.cleanup();
  });
};

// ⭐ PERFORMANCE: Performance report generator
export const generatePerformanceReport = () => {
  const summary = performanceMonitor.getSummary();
  const report = {
    timestamp: new Date().toISOString(),
    summary,
    recommendations: [],
  };

  // Generate recommendations based on metrics
  if (summary.lcp && summary.lcp.avg > 2500) {
    report.recommendations.push('Consider optimizing Largest Contentful Paint (LCP)');
  }

  if (summary.fid && summary.fid.avg > 100) {
    report.recommendations.push('Consider optimizing First Input Delay (FID)');
  }

  if (summary.cls && summary.cls.avg > 0.1) {
    report.recommendations.push('Consider reducing Cumulative Layout Shift (CLS)');
  }

  if (summary['memory-usage'] && summary['memory-usage'].latest > 50000000) {
    report.recommendations.push('High memory usage detected - consider optimization');
  }

  return report;
};

export default performanceMonitor;
