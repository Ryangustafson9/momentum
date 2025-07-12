import React, { useEffect, useRef, useState } from 'react';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout.jsx';

/**
 * Higher-Order Component that adds responsive behavior to any component
 */
export const withResponsive = (WrappedComponent, options = {}) => {
  const {
    enableAutoResize = true,
    enableBreakpointProps = true,
    enableDeviceProps = true,
    enableDimensionProps = false,
    className = '',
    ...defaultOptions
  } = options;

  const ResponsiveComponent = React.forwardRef((props, ref) => {
    const layout = useResponsiveLayout();
    const [isResizing, setIsResizing] = useState(false);
    const componentRef = useRef(null);

    // Handle resize events
    useEffect(() => {
      if (!enableAutoResize) return;

      const handleLayoutResize = () => {
        setIsResizing(true);
        
        // Force reflow
        if (componentRef.current) {
          componentRef.current.offsetHeight;
        }

        // Reset resizing state after animation
        setTimeout(() => setIsResizing(false), 300);
      };

      window.addEventListener('layout-resize', handleLayoutResize);
      return () => window.removeEventListener('layout-resize', handleLayoutResize);
    }, []);

    // Build responsive props
    const responsiveProps = {
      ...props,
      ref: ref || componentRef,
      className: [
        props.className || '',
        className,
        'transition-all duration-300 ease-in-out',
        isResizing ? 'resizing' : ''
      ].filter(Boolean).join(' ')
    };

    // Add breakpoint props
    if (enableBreakpointProps) {
      responsiveProps.breakpoint = layout.breakpoint;
      responsiveProps.isXs = layout.breakpoint === 'xs';
      responsiveProps.isSm = layout.breakpoint === 'sm';
      responsiveProps.isMd = layout.breakpoint === 'md';
      responsiveProps.isLg = layout.breakpoint === 'lg';
      responsiveProps.isXl = layout.breakpoint === 'xl';
      responsiveProps.is2Xl = layout.breakpoint === '2xl';
    }

    // Add device props
    if (enableDeviceProps) {
      responsiveProps.isMobile = layout.isMobile;
      responsiveProps.isTablet = layout.isTablet;
      responsiveProps.isDesktop = layout.isDesktop;
      responsiveProps.layoutMode = layout.layoutMode;
    }

    // Add dimension props
    if (enableDimensionProps) {
      responsiveProps.viewportWidth = layout.width;
      responsiveProps.viewportHeight = layout.height;
    }

    // Add responsive utilities
    responsiveProps.responsive = {
      breakpoint: layout.breakpoint,
      isMobile: layout.isMobile,
      isTablet: layout.isTablet,
      isDesktop: layout.isDesktop,
      width: layout.width,
      height: layout.height,
      getGridCols: layout.getGridCols,
      getContainerPadding: layout.getContainerPadding,
      getSidebarWidth: layout.getSidebarWidth,
      getMainContentClass: layout.getMainContentClass
    };

    return <WrappedComponent {...responsiveProps} />;
  });

  ResponsiveComponent.displayName = `withResponsive(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return ResponsiveComponent;
};

/**
 * Hook version of withResponsive for functional components
 */
export const useResponsiveProps = (options = {}) => {
  const {
    enableBreakpointProps = true,
    enableDeviceProps = true,
    enableDimensionProps = false
  } = options;

  const layout = useResponsiveLayout();
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleLayoutResize = () => {
      setIsResizing(true);
      setTimeout(() => setIsResizing(false), 300);
    };

    window.addEventListener('layout-resize', handleLayoutResize);
    return () => window.removeEventListener('layout-resize', handleLayoutResize);
  }, []);

  const responsiveProps = {
    isResizing,
    responsive: {
      breakpoint: layout.breakpoint,
      isMobile: layout.isMobile,
      isTablet: layout.isTablet,
      isDesktop: layout.isDesktop,
      width: layout.width,
      height: layout.height,
      getGridCols: layout.getGridCols,
      getContainerPadding: layout.getContainerPadding,
      getSidebarWidth: layout.getSidebarWidth,
      getMainContentClass: layout.getMainContentClass
    }
  };

  if (enableBreakpointProps) {
    Object.assign(responsiveProps, {
      breakpoint: layout.breakpoint,
      isXs: layout.breakpoint === 'xs',
      isSm: layout.breakpoint === 'sm',
      isMd: layout.breakpoint === 'md',
      isLg: layout.breakpoint === 'lg',
      isXl: layout.breakpoint === 'xl',
      is2Xl: layout.breakpoint === '2xl'
    });
  }

  if (enableDeviceProps) {
    Object.assign(responsiveProps, {
      isMobile: layout.isMobile,
      isTablet: layout.isTablet,
      isDesktop: layout.isDesktop,
      layoutMode: layout.layoutMode
    });
  }

  if (enableDimensionProps) {
    Object.assign(responsiveProps, {
      viewportWidth: layout.width,
      viewportHeight: layout.height
    });
  }

  return responsiveProps;
};

/**
 * Responsive class name generator
 */
export const useResponsiveClasses = (baseClasses = '', responsiveClasses = {}) => {
  const layout = useResponsiveLayout();
  
  const classes = [baseClasses];
  
  // Add breakpoint-specific classes
  if (responsiveClasses.xs && layout.breakpoint === 'xs') classes.push(responsiveClasses.xs);
  if (responsiveClasses.sm && layout.breakpoint === 'sm') classes.push(responsiveClasses.sm);
  if (responsiveClasses.md && layout.breakpoint === 'md') classes.push(responsiveClasses.md);
  if (responsiveClasses.lg && layout.breakpoint === 'lg') classes.push(responsiveClasses.lg);
  if (responsiveClasses.xl && layout.breakpoint === 'xl') classes.push(responsiveClasses.xl);
  if (responsiveClasses['2xl'] && layout.breakpoint === '2xl') classes.push(responsiveClasses['2xl']);
  
  // Add device-specific classes
  if (responsiveClasses.mobile && layout.isMobile) classes.push(responsiveClasses.mobile);
  if (responsiveClasses.tablet && layout.isTablet) classes.push(responsiveClasses.tablet);
  if (responsiveClasses.desktop && layout.isDesktop) classes.push(responsiveClasses.desktop);
  
  return classes.filter(Boolean).join(' ');
};

/**
 * Responsive style generator
 */
export const useResponsiveStyles = (baseStyles = {}, responsiveStyles = {}) => {
  const layout = useResponsiveLayout();
  
  const styles = { ...baseStyles };
  
  // Add breakpoint-specific styles
  if (responsiveStyles.xs && layout.breakpoint === 'xs') Object.assign(styles, responsiveStyles.xs);
  if (responsiveStyles.sm && layout.breakpoint === 'sm') Object.assign(styles, responsiveStyles.sm);
  if (responsiveStyles.md && layout.breakpoint === 'md') Object.assign(styles, responsiveStyles.md);
  if (responsiveStyles.lg && layout.breakpoint === 'lg') Object.assign(styles, responsiveStyles.lg);
  if (responsiveStyles.xl && layout.breakpoint === 'xl') Object.assign(styles, responsiveStyles.xl);
  if (responsiveStyles['2xl'] && layout.breakpoint === '2xl') Object.assign(styles, responsiveStyles['2xl']);
  
  // Add device-specific styles
  if (responsiveStyles.mobile && layout.isMobile) Object.assign(styles, responsiveStyles.mobile);
  if (responsiveStyles.tablet && layout.isTablet) Object.assign(styles, responsiveStyles.tablet);
  if (responsiveStyles.desktop && layout.isDesktop) Object.assign(styles, responsiveStyles.desktop);
  
  return styles;
};

/**
 * Responsive component factory
 */
export const createResponsiveComponent = (tagName = 'div', defaultProps = {}) => {
  const ResponsiveElement = React.forwardRef(({ 
    children, 
    className = '', 
    responsive = {},
    ...props 
  }, ref) => {
    const layout = useResponsiveLayout();
    
    const responsiveClasses = useResponsiveClasses(className, responsive.classes || {});
    const responsiveStyles = useResponsiveStyles(props.style || {}, responsive.styles || {});
    
    const elementProps = {
      ...defaultProps,
      ...props,
      ref,
      className: responsiveClasses,
      style: responsiveStyles,
      'data-breakpoint': layout.breakpoint,
      'data-device': layout.layoutMode
    };
    
    return React.createElement(tagName, elementProps, children);
  });
  
  ResponsiveElement.displayName = `Responsive${tagName.charAt(0).toUpperCase() + tagName.slice(1)}`;
  
  return ResponsiveElement;
};

// Pre-built responsive components
export const ResponsiveDiv = createResponsiveComponent('div');
export const ResponsiveSection = createResponsiveComponent('section');
export const ResponsiveHeader = createResponsiveComponent('header');
export const ResponsiveMain = createResponsiveComponent('main');
export const ResponsiveAside = createResponsiveComponent('aside');
export const ResponsiveNav = createResponsiveComponent('nav');

export default withResponsive;
