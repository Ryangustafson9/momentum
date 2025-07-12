import React, { useEffect, useRef, useState } from 'react';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout.jsx';

/**
 * ResponsiveContainer - Automatically adjusts layout based on viewport changes
 */
export const ResponsiveContainer = ({ 
  children, 
  className = '', 
  gridCols = 'auto',
  spacing = 'normal',
  enableAutoResize = true,
  ...props 
}) => {
  const layout = useResponsiveLayout();
  const containerRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);

  // Handle resize animations
  useEffect(() => {
    if (!enableAutoResize) return;

    const handleLayoutResize = () => {
      setIsResizing(true);
      setTimeout(() => setIsResizing(false), 300);
    };

    window.addEventListener('layout-resize', handleLayoutResize);
    return () => window.removeEventListener('layout-resize', handleLayoutResize);
  }, [enableAutoResize]);

  // Get responsive grid classes
  const getGridClasses = () => {
    if (gridCols === 'auto') {
      return layout.responsiveClasses.grid;
    }
    
    if (typeof gridCols === 'object') {
      const { xs = 1, sm = 1, md = 2, lg = 3, xl = 4, '2xl': xxl = 4 } = gridCols;
      return `grid-cols-${xs} sm:grid-cols-${sm} md:grid-cols-${md} lg:grid-cols-${lg} xl:grid-cols-${xl} 2xl:grid-cols-${xxl}`;
    }
    
    return `grid-cols-${gridCols}`;
  };

  // Get spacing classes
  const getSpacingClasses = () => {
    const spacingMap = {
      tight: 'gap-2',
      normal: 'gap-4',
      relaxed: 'gap-6',
      loose: 'gap-8'
    };
    
    return spacingMap[spacing] || spacingMap.normal;
  };

  const containerClasses = [
    'responsive-container',
    'transition-all duration-300 ease-in-out',
    layout.responsiveClasses.container,
    getSpacingClasses(),
    isResizing ? 'opacity-95' : 'opacity-100',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      ref={containerRef}
      className={containerClasses}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * ResponsiveGrid - Grid container that automatically adjusts columns
 */
export const ResponsiveGrid = ({ 
  children, 
  className = '', 
  cols = 'auto',
  spacing = 'normal',
  ...props 
}) => {
  const layout = useResponsiveLayout();

  const getGridClasses = () => {
    if (cols === 'auto') {
      return layout.responsiveClasses.grid;
    }
    
    if (typeof cols === 'object') {
      const { xs = 1, sm = 1, md = 2, lg = 3, xl = 4, '2xl': xxl = 4 } = cols;
      return `grid-cols-${xs} sm:grid-cols-${sm} md:grid-cols-${md} lg:grid-cols-${lg} xl:grid-cols-${xl} 2xl:grid-cols-${xxl}`;
    }
    
    return `grid-cols-${cols}`;
  };

  const getSpacingClasses = () => {
    const spacingMap = {
      tight: 'gap-2',
      normal: 'gap-4', 
      relaxed: 'gap-6',
      loose: 'gap-8'
    };
    
    return spacingMap[spacing] || spacingMap.normal;
  };

  const gridClasses = [
    'grid',
    'transition-all duration-300 ease-in-out',
    getGridClasses(),
    getSpacingClasses(),
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={gridClasses} {...props}>
      {children}
    </div>
  );
};

/**
 * ResponsiveCard - Card component that adjusts based on viewport
 */
export const ResponsiveCard = ({ 
  children, 
  className = '', 
  padding = 'normal',
  ...props 
}) => {
  const layout = useResponsiveLayout();

  const getPaddingClasses = () => {
    const paddingMap = {
      tight: layout.isMobile ? 'p-2' : 'p-3',
      normal: layout.isMobile ? 'p-3' : layout.isTablet ? 'p-4' : 'p-6',
      relaxed: layout.isMobile ? 'p-4' : layout.isTablet ? 'p-6' : 'p-8'
    };
    
    return paddingMap[padding] || paddingMap.normal;
  };

  const cardClasses = [
    'bg-white rounded-lg shadow-sm border border-gray-200',
    'transition-all duration-300 ease-in-out',
    getPaddingClasses(),
    layout.isMobile ? 'mx-1' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
};

/**
 * ResponsiveTable - Table wrapper that handles overflow on small screens
 */
export const ResponsiveTable = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  const layout = useResponsiveLayout();

  const tableWrapperClasses = [
    'responsive-table-wrapper',
    'transition-all duration-300 ease-in-out',
    layout.isMobile ? 'overflow-x-auto -mx-2' : 'overflow-hidden',
    layout.isTablet ? 'overflow-x-auto' : '',
    className
  ].filter(Boolean).join(' ');

  const tableClasses = [
    'min-w-full',
    layout.isMobile ? 'text-sm' : 'text-base',
    'transition-all duration-300 ease-in-out'
  ].join(' ');

  return (
    <div className={tableWrapperClasses} {...props}>
      <table className={tableClasses}>
        {children}
      </table>
    </div>
  );
};

/**
 * ResponsiveSidebar - Sidebar that automatically collapses/expands
 */
export const ResponsiveSidebar = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  const layout = useResponsiveLayout();

  const sidebarClasses = [
    'fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-30',
    'transition-all duration-300 ease-in-out',
    layout.getSidebarWidth(),
    layout.sidebarCollapsed || layout.isMobile ? '-translate-x-full lg:translate-x-0' : 'translate-x-0',
    className
  ].filter(Boolean).join(' ');

  return (
    <aside className={sidebarClasses} {...props}>
      {children}
    </aside>
  );
};

/**
 * ResponsiveMainContent - Main content area that adjusts to sidebar state
 */
export const ResponsiveMainContent = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  const layout = useResponsiveLayout();

  const mainClasses = [
    'min-h-screen',
    layout.getMainContentClass(),
    layout.responsiveClasses.container,
    className
  ].filter(Boolean).join(' ');

  return (
    <main className={mainClasses} {...props}>
      {children}
    </main>
  );
};
