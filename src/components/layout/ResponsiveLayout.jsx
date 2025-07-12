import React, { useEffect } from 'react';
import { ResponsiveLayoutProvider, useResponsiveLayout } from '../../hooks/useResponsiveLayout.jsx';
import { ResponsiveSidebar, ResponsiveMainContent } from './ResponsiveContainer';

/**
 * ResponsiveLayout - Main layout wrapper with responsive behavior
 */
const ResponsiveLayoutInner = ({ 
  children, 
  sidebar, 
  header,
  className = '',
  enableSidebarToggle = true,
  ...props 
}) => {
  const layout = useResponsiveLayout();

  // Add CSS custom properties for responsive calculations
  useEffect(() => {
    const updateCSSProperties = () => {
      const root = document.documentElement;
      root.style.setProperty('--sidebar-width', layout.sidebarCollapsed || layout.isMobile ? '0px' : layout.isTablet ? '64px' : '256px');
      root.style.setProperty('--viewport-width', `${layout.width}px`);
      root.style.setProperty('--viewport-height', `${layout.height}px`);
      root.style.setProperty('--is-mobile', layout.isMobile ? '1' : '0');
      root.style.setProperty('--is-tablet', layout.isTablet ? '1' : '0');
      root.style.setProperty('--is-desktop', layout.isDesktop ? '1' : '0');
    };

    updateCSSProperties();
    
    // Listen for layout changes
    const handleLayoutChange = () => updateCSSProperties();
    window.addEventListener('layout-resize', handleLayoutChange);
    
    return () => window.removeEventListener('layout-resize', handleLayoutChange);
  }, [layout]);

  // Handle sidebar toggle
  const toggleSidebar = () => {
    if (enableSidebarToggle) {
      layout.setSidebarCollapsed(!layout.sidebarCollapsed);
    }
  };

  // Mobile overlay for sidebar
  const renderMobileOverlay = () => {
    if (!layout.isMobile || layout.sidebarCollapsed) return null;
    
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
        onClick={() => layout.setSidebarCollapsed(true)}
      />
    );
  };

  // Sidebar toggle button
  const renderSidebarToggle = () => {
    if (!enableSidebarToggle) return null;
    
    return (
      <button
        onClick={toggleSidebar}
        className={`
          fixed top-4 z-40 p-2 rounded-md bg-white shadow-md border border-gray-200
          transition-all duration-300 ease-in-out hover:bg-gray-50
          ${layout.sidebarCollapsed || layout.isMobile ? 'left-4' : layout.isTablet ? 'left-20' : 'left-68'}
          ${layout.isMobile ? 'lg:hidden' : ''}
        `}
        aria-label={layout.sidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
      >
        <svg 
          className="w-5 h-5 text-gray-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          {layout.sidebarCollapsed ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          )}
        </svg>
      </button>
    );
  };

  const layoutClasses = [
    'responsive-layout',
    'min-h-screen bg-gray-50',
    'transition-all duration-300 ease-in-out',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={layoutClasses} {...props}>
      {/* Mobile overlay */}
      {renderMobileOverlay()}
      
      {/* Sidebar toggle button */}
      {renderSidebarToggle()}
      
      {/* Sidebar */}
      {sidebar && (
        <ResponsiveSidebar>
          {sidebar}
        </ResponsiveSidebar>
      )}
      
      {/* Header */}
      {header && (
        <header className={`
          fixed top-0 right-0 z-30 bg-white border-b border-gray-200
          transition-all duration-300 ease-in-out
          ${layout.sidebarCollapsed || layout.isMobile ? 'left-0' : layout.isTablet ? 'left-16' : 'left-64'}
        `}>
          {header}
        </header>
      )}
      
      {/* Main content */}
      <ResponsiveMainContent className={header ? 'pt-16' : ''}>
        {children}
      </ResponsiveMainContent>
    </div>
  );
};

/**
 * Main ResponsiveLayout component with provider
 */
export const ResponsiveLayout = (props) => {
  return (
    <ResponsiveLayoutProvider>
      <ResponsiveLayoutInner {...props} />
    </ResponsiveLayoutProvider>
  );
};

/**
 * Hook to access layout context
 */
export { useLayoutContext } from '../../hooks/useResponsiveLayout.jsx';

/**
 * Responsive utilities for manual layout adjustments
 */
export const ResponsiveUtils = {
  // Breakpoint detection
  isBreakpoint: (breakpoint) => {
    const breakpoints = {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536,
    };
    
    return window.innerWidth >= breakpoints[breakpoint];
  },
  
  // Device detection
  isMobile: () => window.innerWidth < 768,
  isTablet: () => window.innerWidth >= 768 && window.innerWidth < 1024,
  isDesktop: () => window.innerWidth >= 1024,
  
  // Viewport dimensions
  getViewportSize: () => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }),
  
  // CSS custom property helpers
  setCSSProperty: (property, value) => {
    document.documentElement.style.setProperty(property, value);
  },
  
  getCSSProperty: (property) => {
    return getComputedStyle(document.documentElement).getPropertyValue(property);
  },
  
  // Force layout recalculation
  forceReflow: (element = document.body) => {
    element.offsetHeight; // Trigger reflow
  },
  
  // Smooth scroll to element with responsive offset
  scrollToElement: (element, offset = 0) => {
    const isMobile = window.innerWidth < 768;
    const headerHeight = isMobile ? 60 : 80;
    const finalOffset = offset + headerHeight;
    
    const elementPosition = element.offsetTop - finalOffset;
    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    });
  }
};

export default ResponsiveLayout;
