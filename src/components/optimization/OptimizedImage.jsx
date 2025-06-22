/**
 * 🖼️ OPTIMIZED IMAGE COMPONENT
 * Advanced image optimization with lazy loading, WebP support, and responsive sizing
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { trackComponentRender } from '@/lib/performance';

const OptimizedImage = ({
  src,
  alt = '',
  className = '',
  width,
  height,
  sizes = '100vw',
  priority = false,
  quality = 80,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
  lazy = true,
  webpSupport = true,
  responsive = true,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');
  const imgRef = useRef(null);
  const observerRef = useRef(null);
  const startTime = useRef(Date.now());

  // ⭐ PERFORMANCE: WebP support detection
  const [supportsWebP, setSupportsWebP] = useState(false);

  useEffect(() => {
    if (!webpSupport) return;

    const checkWebPSupport = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const dataURL = canvas.toDataURL('image/webp');
      setSupportsWebP(dataURL.indexOf('data:image/webp') === 0);
    };

    checkWebPSupport();
  }, [webpSupport]);

  // ⭐ PERFORMANCE: Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
      observerRef.current = observer;
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [lazy, priority, isInView]);

  // ⭐ PERFORMANCE: Generate optimized image sources
  const generateSources = useCallback(() => {
    if (!src) return { src: '', srcSet: '' };

    const baseSrc = src;
    const sources = [];

    // Generate responsive sizes if width is provided
    if (responsive && width) {
      const sizes = [0.5, 1, 1.5, 2]; // Different density ratios
      sizes.forEach(ratio => {
        const scaledWidth = Math.round(width * ratio);
        let optimizedSrc = baseSrc;

        // Add query parameters for optimization services (like Cloudinary, ImageKit, etc.)
        if (baseSrc.includes('cloudinary.com')) {
          optimizedSrc = baseSrc.replace('/upload/', `/upload/w_${scaledWidth},q_${quality},f_auto/`);
        } else if (baseSrc.includes('imagekit.io')) {
          optimizedSrc = `${baseSrc}?tr=w-${scaledWidth},q-${quality}`;
        } else {
          // For other services or custom optimization
          const separator = baseSrc.includes('?') ? '&' : '?';
          optimizedSrc = `${baseSrc}${separator}w=${scaledWidth}&q=${quality}`;
        }

        sources.push(`${optimizedSrc} ${scaledWidth}w`);
      });
    }

    // WebP version
    let webpSrc = baseSrc;
    if (supportsWebP && webpSupport) {
      if (baseSrc.includes('cloudinary.com')) {
        webpSrc = baseSrc.replace('/upload/', `/upload/f_webp,q_${quality}/`);
      } else if (baseSrc.includes('imagekit.io')) {
        webpSrc = `${baseSrc}?tr=f-webp,q-${quality}`;
      }
    }

    return {
      src: baseSrc,
      srcSet: sources.join(', '),
      webpSrc: supportsWebP ? webpSrc : null,
    };
  }, [src, width, quality, supportsWebP, webpSupport, responsive]);

  // ⭐ PERFORMANCE: Handle image load
  const handleLoad = useCallback((event) => {
    const loadTime = Date.now() - startTime.current;
    setIsLoaded(true);
    
    // Track performance
    trackComponentRender('OptimizedImage', loadTime);
    
    onLoad?.(event);
  }, [onLoad]);

  // ⭐ PERFORMANCE: Handle image error
  const handleError = useCallback((event) => {
    setHasError(true);
    onError?.(event);
  }, [onError]);

  // ⭐ PERFORMANCE: Generate placeholder
  const getPlaceholder = () => {
    if (placeholder === 'blur' && blurDataURL) {
      return blurDataURL;
    }
    
    if (placeholder === 'blur') {
      // Generate a simple blur placeholder
      const canvas = document.createElement('canvas');
      canvas.width = 10;
      canvas.height = 10;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, 10, 10);
      return canvas.toDataURL();
    }

    return null;
  };

  // Don't render anything if not in view and lazy loading
  if (!isInView && lazy && !priority) {
    return (
      <div
        ref={imgRef}
        className={cn('bg-gray-200 animate-pulse', className)}
        style={{ width, height }}
        {...props}
      />
    );
  }

  const { src: optimizedSrc, srcSet, webpSrc } = generateSources();
  const placeholderSrc = getPlaceholder();

  // ⭐ PERFORMANCE: Error fallback
  if (hasError) {
    return (
      <div
        className={cn(
          'bg-gray-200 flex items-center justify-center text-gray-500 text-sm',
          className
        )}
        style={{ width, height }}
        {...props}
      >
        Failed to load image
      </div>
    );
  }

  return (
    <picture className={cn('block', className)}>
      {/* WebP source for supported browsers */}
      {webpSrc && (
        <source
          srcSet={webpSrc}
          type="image/webp"
          sizes={sizes}
        />
      )}
      
      {/* Fallback image */}
      <img
        ref={imgRef}
        src={isInView ? optimizedSrc : placeholderSrc}
        srcSet={isInView && srcSet ? srcSet : undefined}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          !isLoaded && placeholderSrc && 'bg-gray-200',
          className
        )}
        style={{
          filter: !isLoaded && placeholder === 'blur' ? 'blur(10px)' : 'none',
          ...props.style,
        }}
        {...props}
      />
    </picture>
  );
};

// ⭐ PERFORMANCE: Memoized component to prevent unnecessary re-renders
export default React.memo(OptimizedImage, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  const keysToCompare = ['src', 'alt', 'width', 'height', 'quality', 'priority'];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

// ⭐ PERFORMANCE: Preload utility for critical images
export const preloadImage = (src, options = {}) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => resolve(img);
    img.onerror = reject;
    
    // Set attributes
    if (options.crossOrigin) img.crossOrigin = options.crossOrigin;
    if (options.referrerPolicy) img.referrerPolicy = options.referrerPolicy;
    
    img.src = src;
  });
};

// ⭐ PERFORMANCE: Batch image preloader
export const preloadImages = async (imageSrcs, options = {}) => {
  const { concurrency = 3 } = options;
  const results = [];
  
  for (let i = 0; i < imageSrcs.length; i += concurrency) {
    const batch = imageSrcs.slice(i, i + concurrency);
    const batchPromises = batch.map(src => 
      preloadImage(src, options).catch(error => ({ error, src }))
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
};

// ⭐ PERFORMANCE: Image optimization utilities
export const imageUtils = {
  // Calculate optimal image dimensions
  calculateOptimalSize: (originalWidth, originalHeight, maxWidth, maxHeight) => {
    const aspectRatio = originalWidth / originalHeight;
    
    let width = originalWidth;
    let height = originalHeight;
    
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }
    
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
    
    return { width: Math.round(width), height: Math.round(height) };
  },

  // Generate responsive image sizes
  generateSizes: (breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280 }) => {
    const sizes = [];
    
    Object.entries(breakpoints).forEach(([key, value]) => {
      sizes.push(`(max-width: ${value}px) 100vw`);
    });
    
    sizes.push('100vw');
    return sizes.join(', ');
  },

  // Check if image format is supported
  supportsFormat: (format) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    try {
      const dataURL = canvas.toDataURL(`image/${format}`);
      return dataURL.indexOf(`data:image/${format}`) === 0;
    } catch {
      return false;
    }
  },
};

