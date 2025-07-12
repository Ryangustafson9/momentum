import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * LogoLoader component that handles loading states for club logos
 * Shows a loading spinner while the logo loads, and handles fallbacks gracefully
 */
export const LogoLoader = ({ 
  src, 
  alt = "Logo", 
  className = "", 
  fallback = null,
  showLoadingSpinner = true,
  onLoad,
  onError,
  ...props 
}) => {
  const [isLoading, setIsLoading] = useState(!!src);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset states when src changes
  useEffect(() => {
    if (src) {
      setIsLoading(true);
      setHasError(false);
      setIsLoaded(false);
    } else {
      setIsLoading(false);
      setHasError(false);
      setIsLoaded(false);
    }
  }, [src]);

  const handleLoad = (e) => {
    setIsLoading(false);
    setIsLoaded(true);
    setHasError(false);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setIsLoading(false);
    setIsLoaded(false);
    setHasError(true);
    onError?.(e);
  };

  // If no src provided, show fallback or nothing
  if (!src) {
    return fallback || null;
  }

  return (
    <div className={cn("relative", className)}>
      {/* Loading Spinner */}
      {isLoading && showLoadingSpinner && (
        <div className="flex items-center justify-center w-full h-full">
          <div className="animate-spin rounded-full border-b-2 border-current w-6 h-6 opacity-60"></div>
        </div>
      )}

      {/* Logo Image */}
      <img
        src={src}
        alt={alt}
        className={cn(
          "transition-opacity duration-200",
          isLoaded ? "opacity-100" : "opacity-0",
          hasError && "hidden"
        )}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />

      {/* Fallback when logo fails to load */}
      {hasError && fallback}
    </div>
  );
};

/**
 * ClubLogo component specifically for club branding
 * Integrates with the branding system and handles loading states
 */
export const ClubLogo = ({ 
  branding, 
  loading: brandingLoading, 
  className = "",
  size = "default",
  fallback,
  ...props 
}) => {
  const sizeClasses = {
    sm: "h-8",
    default: "h-12", 
    lg: "h-16",
    xl: "h-20"
  };

  // Show loading spinner while branding is loading
  if (brandingLoading) {
    return (
      <div className={cn("flex items-center justify-center", sizeClasses[size], className)}>
        <div className="animate-spin rounded-full border-b-2 border-current w-6 h-6 opacity-60"></div>
      </div>
    );
  }

  // If no logo URL after loading, show fallback or nothing
  if (!branding?.logoUrl) {
    return fallback || null;
  }

  return (
    <LogoLoader
      src={branding.logoUrl}
      alt="Club Logo"
      className={cn(sizeClasses[size], "w-auto object-contain", className)}
      fallback={fallback}
      {...props}
    />
  );
};

export default LogoLoader;
