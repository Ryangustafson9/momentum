import React, { useEffect, useRef } from 'react';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';

/**
 * ResponsiveWrapper - Wraps existing components to make them responsive
 * This component can be used to retrofit existing components with responsive behavior
 */
export const ResponsiveWrapper = ({ 
  children, 
  className = '', 
  enableAutoResize = true,
  onResize = null,
  ...props 
}) => {
  const layout = useResponsiveLayout();
  const wrapperRef = useRef(null);

  // Handle resize events
  useEffect(() => {
    if (!enableAutoResize) return;

    const handleLayoutResize = (event) => {
      const { detail } = event;
      
      // Force reflow for wrapped components
      if (wrapperRef.current) {
        // Trigger reflow
        wrapperRef.current.offsetHeight;
        
        // Add temporary class to prevent transition flicker
        wrapperRef.current.classList.add('resizing');
        setTimeout(() => {
          if (wrapperRef.current) {
            wrapperRef.current.classList.remove('resizing');
          }
        }, 300);
      }

      // Call custom resize handler if provided
      if (onResize) {
        onResize(detail);
      }
    };

    window.addEventListener('layout-resize', handleLayoutResize);
    return () => window.removeEventListener('layout-resize', handleLayoutResize);
  }, [enableAutoResize, onResize]);

  const wrapperClasses = [
    'responsive-wrapper',
    'transition-all duration-300 ease-in-out',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      ref={wrapperRef}
      className={wrapperClasses}
      data-breakpoint={layout.breakpoint}
      data-device-type={layout.layoutMode}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * ResponsiveTableWrapper - Specifically for making tables responsive
 */
export const ResponsiveTableWrapper = ({ 
  children, 
  className = '', 
  enableHorizontalScroll = true,
  ...props 
}) => {
  const layout = useResponsiveLayout();

  const tableWrapperClasses = [
    'responsive-table-wrapper',
    'transition-all duration-300 ease-in-out',
    layout.isMobile && enableHorizontalScroll ? 'overflow-x-auto -mx-2' : 'overflow-hidden',
    layout.isTablet && enableHorizontalScroll ? 'overflow-x-auto' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={tableWrapperClasses} {...props}>
      {children}
    </div>
  );
};

/**
 * ResponsiveModalWrapper - Makes modals responsive
 */
export const ResponsiveModalWrapper = ({ 
  children, 
  className = '', 
  isOpen = false,
  ...props 
}) => {
  const layout = useResponsiveLayout();

  if (!isOpen) return null;

  const modalClasses = [
    'responsive-modal',
    'fixed inset-0 z-50 flex items-center justify-center',
    layout.isMobile ? 'p-2' : 'p-4',
    className
  ].filter(Boolean).join(' ');

  const contentClasses = [
    'responsive-modal-content',
    'bg-white rounded-lg shadow-xl',
    'w-full max-h-full overflow-y-auto',
    layout.isMobile ? 'max-w-full' : 'max-w-2xl',
    'transition-all duration-300 ease-in-out'
  ].join(' ');

  return (
    <div className={modalClasses} {...props}>
      <div className="fixed inset-0 bg-black bg-opacity-50" />
      <div className={contentClasses}>
        {children}
      </div>
    </div>
  );
};

/**
 * ResponsiveGridWrapper - Converts existing grid layouts to responsive
 */
export const ResponsiveGridWrapper = ({ 
  children, 
  className = '', 
  defaultCols = 3,
  ...props 
}) => {
  const layout = useResponsiveLayout();

  const getResponsiveCols = () => {
    if (layout.isMobile) return 1;
    if (layout.isTablet) return Math.min(defaultCols, 2);
    return defaultCols;
  };

  const gridClasses = [
    'grid gap-4 transition-all duration-300 ease-in-out',
    `grid-cols-${getResponsiveCols()}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={gridClasses} {...props}>
      {children}
    </div>
  );
};

/**
 * ResponsiveCardWrapper - Makes cards responsive
 */
export const ResponsiveCardWrapper = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  const layout = useResponsiveLayout();

  const cardClasses = [
    'bg-white rounded-lg shadow-sm border border-gray-200',
    'transition-all duration-300 ease-in-out',
    layout.isMobile ? 'p-3 mx-1' : layout.isTablet ? 'p-4' : 'p-6',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
};

/**
 * ResponsiveSidebarWrapper - Makes sidebars responsive
 */
export const ResponsiveSidebarWrapper = ({ 
  children, 
  className = '', 
  isCollapsed = false,
  ...props 
}) => {
  const layout = useResponsiveLayout();

  const sidebarClasses = [
    'transition-all duration-300 ease-in-out',
    'fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-30',
    isCollapsed || layout.isMobile ? 'w-0 -translate-x-full' : layout.isTablet ? 'w-16' : 'w-64',
    layout.isDesktop && !isCollapsed ? 'translate-x-0' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <aside className={sidebarClasses} {...props}>
      <div className="overflow-hidden h-full">
        {children}
      </div>
    </aside>
  );
};

/**
 * ResponsiveContentWrapper - Adjusts main content based on sidebar state
 */
export const ResponsiveContentWrapper = ({ 
  children, 
  className = '', 
  sidebarCollapsed = false,
  ...props 
}) => {
  const layout = useResponsiveLayout();

  const getMarginLeft = () => {
    if (sidebarCollapsed || layout.isMobile) return 'ml-0';
    if (layout.isTablet) return 'ml-16';
    return 'ml-64';
  };

  const contentClasses = [
    'transition-all duration-300 ease-in-out',
    'min-h-screen',
    getMarginLeft(),
    className
  ].filter(Boolean).join(' ');

  return (
    <main className={contentClasses} {...props}>
      {children}
    </main>
  );
};

/**
 * ResponsiveFormWrapper - Makes forms responsive
 */
export const ResponsiveFormWrapper = ({ 
  children, 
  className = '', 
  columns = 'auto',
  ...props 
}) => {
  const layout = useResponsiveLayout();

  const getFormLayout = () => {
    if (columns === 'auto') {
      if (layout.isMobile) return 'grid-cols-1';
      if (layout.isTablet) return 'grid-cols-1 sm:grid-cols-2';
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    }
    return `grid-cols-${columns}`;
  };

  const formClasses = [
    'responsive-form',
    'grid gap-4 transition-all duration-300 ease-in-out',
    getFormLayout(),
    className
  ].filter(Boolean).join(' ');

  return (
    <form className={formClasses} {...props}>
      {children}
    </form>
  );
};

export default ResponsiveWrapper;
