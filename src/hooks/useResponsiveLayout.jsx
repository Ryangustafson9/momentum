import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Responsive Layout Hook
 * Handles real-time window resize events and provides layout utilities
 */
export const useResponsiveLayout = () => {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  const [breakpoint, setBreakpoint] = useState('lg');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [layoutMode, setLayoutMode] = useState('desktop');

  const resizeTimeoutRef = useRef(null);
  const lastResizeRef = useRef(Date.now());

  // Tailwind CSS breakpoints
  const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  };

  // Determine current breakpoint
  const getCurrentBreakpoint = useCallback((width) => {
    if (width >= breakpoints['2xl']) return '2xl';
    if (width >= breakpoints.xl) return 'xl';
    if (width >= breakpoints.lg) return 'lg';
    if (width >= breakpoints.md) return 'md';
    if (width >= breakpoints.sm) return 'sm';
    return 'xs';
  }, []);

  // Determine device type
  const getDeviceType = useCallback((width) => {
    if (width < breakpoints.md) return 'mobile';
    if (width < breakpoints.lg) return 'tablet';
    return 'desktop';
  }, []);

  // Handle resize with debouncing
  const handleResize = useCallback(() => {
    const now = Date.now();
    lastResizeRef.current = now;

    // Clear existing timeout
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    // Immediate update for smooth transitions
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    const newBreakpoint = getCurrentBreakpoint(newWidth);
    const deviceType = getDeviceType(newWidth);

    setDimensions({ width: newWidth, height: newHeight });
    setBreakpoint(newBreakpoint);
    setIsMobile(deviceType === 'mobile');
    setIsTablet(deviceType === 'tablet');
    setIsDesktop(deviceType === 'desktop');
    setLayoutMode(deviceType);

    // Auto-collapse sidebar on mobile/tablet
    if (deviceType === 'mobile') {
      setSidebarCollapsed(true);
    } else if (deviceType === 'desktop' && sidebarCollapsed) {
      setSidebarCollapsed(false);
    }

    // Debounced layout adjustments
    resizeTimeoutRef.current = setTimeout(() => {
      // Only proceed if this is the latest resize event
      if (lastResizeRef.current === now) {
        // Trigger custom resize event for components to listen to
        window.dispatchEvent(new CustomEvent('layout-resize', {
          detail: {
            width: newWidth,
            height: newHeight,
            breakpoint: newBreakpoint,
            deviceType,
            isMobile: deviceType === 'mobile',
            isTablet: deviceType === 'tablet',
            isDesktop: deviceType === 'desktop',
          }
        }));

        // Force recalculation of fixed elements
        document.documentElement.style.setProperty('--viewport-width', `${newWidth}px`);
        document.documentElement.style.setProperty('--viewport-height', `${newHeight}px`);
      }
    }, 150);
  }, [getCurrentBreakpoint, getDeviceType, sidebarCollapsed]);

  // Setup resize listener
  useEffect(() => {
    // Initial setup
    handleResize();

    // Add event listeners
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [handleResize]);

  // Layout utilities
  const getGridCols = useCallback((defaultCols = 12) => {
    switch (breakpoint) {
      case 'xs':
      case 'sm':
        return Math.min(defaultCols, 1);
      case 'md':
        return Math.min(defaultCols, 2);
      case 'lg':
        return Math.min(defaultCols, 3);
      case 'xl':
        return Math.min(defaultCols, 4);
      case '2xl':
        return defaultCols;
      default:
        return defaultCols;
    }
  }, [breakpoint]);

  const getContainerPadding = useCallback(() => {
    switch (breakpoint) {
      case 'xs':
      case 'sm':
        return 'px-2 py-2';
      case 'md':
        return 'px-4 py-3';
      case 'lg':
      case 'xl':
      case '2xl':
        return 'px-6 py-4';
      default:
        return 'px-4 py-3';
    }
  }, [breakpoint]);

  const getSidebarWidth = useCallback(() => {
    if (sidebarCollapsed || isMobile) return 'w-0';
    if (isTablet) return 'w-16';
    return 'w-64';
  }, [sidebarCollapsed, isMobile, isTablet]);

  const getMainContentClass = useCallback(() => {
    const baseClass = 'transition-all duration-300 ease-in-out';
    if (sidebarCollapsed || isMobile) {
      return `${baseClass} ml-0`;
    }
    if (isTablet) {
      return `${baseClass} ml-16`;
    }
    return `${baseClass} ml-64`;
  }, [sidebarCollapsed, isMobile, isTablet]);

  return {
    // Dimensions
    width: dimensions.width,
    height: dimensions.height,
    
    // Breakpoint info
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    layoutMode,
    
    // Sidebar state
    sidebarCollapsed,
    setSidebarCollapsed,
    
    // Utility functions
    getGridCols,
    getContainerPadding,
    getSidebarWidth,
    getMainContentClass,
    
    // Responsive classes
    responsiveClasses: {
      container: getContainerPadding(),
      sidebar: getSidebarWidth(),
      mainContent: getMainContentClass(),
      grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-${getGridCols(3)} xl:grid-cols-${getGridCols(4)}`,
    }
  };
};

/**
 * Layout Context for sharing responsive state across components
 */
import { createContext, useContext } from 'react';

const ResponsiveLayoutContext = createContext(null);

export const ResponsiveLayoutProvider = ({ children }) => {
  const layoutState = useResponsiveLayout();
  
  return (
    <ResponsiveLayoutContext.Provider value={layoutState}>
      {children}
    </ResponsiveLayoutContext.Provider>
  );
};

export const useLayoutContext = () => {
  const context = useContext(ResponsiveLayoutContext);
  if (!context) {
    throw new Error('useLayoutContext must be used within ResponsiveLayoutProvider');
  }
  return context;
};
