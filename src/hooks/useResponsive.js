/**
 * 📱 RESPONSIVE DESIGN HOOKS
 * Mobile-first responsive utilities and breakpoint detection
 */

import React, { useState, useEffect } from 'react';

// Tailwind CSS breakpoints
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * Hook to detect current screen size and breakpoints
 */
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState('sm');
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const updateBreakpoint = () => {
      const currentWidth = window.innerWidth;
      setWidth(currentWidth);

      if (currentWidth >= BREAKPOINTS['2xl']) {
        setBreakpoint('2xl');
      } else if (currentWidth >= BREAKPOINTS.xl) {
        setBreakpoint('xl');
      } else if (currentWidth >= BREAKPOINTS.lg) {
        setBreakpoint('lg');
      } else if (currentWidth >= BREAKPOINTS.md) {
        setBreakpoint('md');
      } else {
        setBreakpoint('sm');
      }
    };

    // Set initial breakpoint
    updateBreakpoint();

    // Add event listener
    window.addEventListener('resize', updateBreakpoint);

    // Cleanup
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    breakpoint,
    width,
    isMobile: width < BREAKPOINTS.md,
    isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isDesktop: width >= BREAKPOINTS.lg,
    isSmall: width < BREAKPOINTS.sm,
    isMedium: width >= BREAKPOINTS.sm && width < BREAKPOINTS.lg,
    isLarge: width >= BREAKPOINTS.lg,
  };
};

/**
 * Hook for mobile-specific behavior
 */
export const useMobile = () => {
  const { isMobile, isTablet } = useBreakpoint();
  const [touchDevice, setTouchDevice] = useState(false);

  useEffect(() => {
    // Detect touch capability
    const hasTouchScreen = 'ontouchstart' in window || 
                          navigator.maxTouchPoints > 0 || 
                          navigator.msMaxTouchPoints > 0;
    setTouchDevice(hasTouchScreen);
  }, []);

  return {
    isMobile,
    isTablet,
    isMobileOrTablet: isMobile || isTablet,
    touchDevice,
    shouldUseMobileLayout: isMobile || (isTablet && touchDevice),
  };
};

/**
 * Hook for responsive grid columns
 */
export const useResponsiveGrid = (items = [], options = {}) => {
  const { breakpoint } = useBreakpoint();
  const {
    sm = 1,
    md = 2,
    lg = 3,
    xl = 4,
    '2xl': xxl = 4,
  } = options;

  const getColumns = () => {
    switch (breakpoint) {
      case 'sm':
        return sm;
      case 'md':
        return md;
      case 'lg':
        return lg;
      case 'xl':
        return xl;
      case '2xl':
        return xxl;
      default:
        return sm;
    }
  };

  const columns = getColumns();
  const gridClass = `grid grid-cols-${columns} gap-4`;

  return {
    columns,
    gridClass,
    itemsPerRow: columns,
    totalRows: Math.ceil(items.length / columns),
  };
};

/**
 * Hook for responsive font sizes
 */
export const useResponsiveFontSize = (sizes = {}) => {
  const { breakpoint } = useBreakpoint();
  const {
    sm = 'text-sm',
    md = 'text-base',
    lg = 'text-lg',
    xl = 'text-xl',
    '2xl': xxl = 'text-2xl',
  } = sizes;

  const getFontSize = () => {
    switch (breakpoint) {
      case 'sm':
        return sm;
      case 'md':
        return md;
      case 'lg':
        return lg;
      case 'xl':
        return xl;
      case '2xl':
        return xxl;
      default:
        return sm;
    }
  };

  return getFontSize();
};

/**
 * Hook for responsive spacing
 */
export const useResponsiveSpacing = (spacing = {}) => {
  const { breakpoint } = useBreakpoint();
  const {
    sm = 'p-2',
    md = 'p-4',
    lg = 'p-6',
    xl = 'p-8',
    '2xl': xxl = 'p-10',
  } = spacing;

  const getSpacing = () => {
    switch (breakpoint) {
      case 'sm':
        return sm;
      case 'md':
        return md;
      case 'lg':
        return lg;
      case 'xl':
        return xl;
      case '2xl':
        return xxl;
      default:
        return sm;
    }
  };

  return getSpacing();
};

/**
 * Hook for orientation detection
 */
export const useOrientation = () => {
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    const updateOrientation = () => {
      if (window.innerHeight > window.innerWidth) {
        setOrientation('portrait');
      } else {
        setOrientation('landscape');
      }
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  return {
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
  };
};

/**
 * Hook for safe area insets (for mobile devices with notches)
 */
export const useSafeArea = () => {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0'),
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);

    return () => window.removeEventListener('resize', updateSafeArea);
  }, []);

  return safeArea;
};

/**
 * Hook for responsive modal behavior
 */
export const useResponsiveModal = () => {
  const { isMobile } = useMobile();

  return {
    shouldUseFullScreen: isMobile,
    modalClassName: isMobile 
      ? 'fixed inset-0 z-50 bg-background' 
      : 'fixed inset-0 z-50 flex items-center justify-center p-4',
    contentClassName: isMobile
      ? 'h-full w-full overflow-y-auto'
      : 'relative bg-background rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto',
  };
};

