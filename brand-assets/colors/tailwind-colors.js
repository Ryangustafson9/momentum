/**
 * Momentum Gym Brand Colors for Tailwind CSS
 * 
 * Usage:
 * 1. Import this file in your tailwind.config.js
 * 2. Extend the colors in your theme configuration
 * 
 * Example:
 * const momentumColors = require('./brand-assets/colors/tailwind-colors.js');
 * 
 * module.exports = {
 *   theme: {
 *     extend: {
 *       colors: momentumColors
 *     }
 *   }
 * }
 */

const momentumColors = {
  // Primary Brand Colors
  momentum: {
    // Indigo Series - Primary
    indigo: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',  // Primary brand color
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b',
    },
    
    // Purple Series - Secondary
    purple: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c3aed',  // Secondary brand color
      800: '#6b21a8',
      900: '#581c87',
      950: '#3b0764',
    },
    
    // Pink Series - Accent
    pink: {
      50: '#fdf2f8',
      100: '#fce7f3',
      200: '#fbcfe8',
      300: '#f9a8d4',
      400: '#f472b6',
      500: '#ec4899',  // Accent brand color
      600: '#db2777',
      700: '#be185d',
      800: '#9d174d',
      900: '#831843',
      950: '#500724',
    },
    
    // Brand Shortcuts
    primary: '#4f46e5',
    secondary: '#7c3aed',
    accent: '#ec4899',
  },

  // Semantic Colors
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    DEFAULT: '#10b981',
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    DEFAULT: '#f59e0b',
  },

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    DEFAULT: '#ef4444',
  },

  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    DEFAULT: '#3b82f6',
  },
};

// Background Image Gradients for Tailwind
const momentumGradients = {
  'momentum-primary': 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
  'momentum-primary-light': 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
  'momentum-primary-dark': 'linear-gradient(135deg, #4338ca 0%, #6b21a8 100%)',
  'momentum-login': 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)',
  'momentum-avatar': 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
  'momentum-light-blue': 'linear-gradient(135deg, #eef2ff 0%, #faf5ff 100%)',
  'momentum-light-gray': 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
  'momentum-success': 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
  'momentum-warning': 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
  'momentum-error': 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)',
};

// Box Shadow Utilities
const momentumShadows = {
  'momentum-primary': '0 4px 12px rgba(79, 70, 229, 0.15)',
  'momentum-primary-lg': '0 8px 24px rgba(79, 70, 229, 0.2)',
  'momentum-secondary': '0 4px 12px rgba(124, 58, 237, 0.15)',
  'momentum-accent': '0 4px 12px rgba(236, 72, 153, 0.15)',
  'momentum-card': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  'momentum-modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

// Complete Tailwind Configuration Object
const momentumTailwindConfig = {
  colors: momentumColors,
  backgroundImage: momentumGradients,
  boxShadow: momentumShadows,
  fontFamily: {
    'momentum': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
    'momentum-mono': ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
  },
  fontSize: {
    'momentum-xs': ['0.75rem', { lineHeight: '1.25' }],
    'momentum-sm': ['0.875rem', { lineHeight: '1.5' }],
    'momentum-base': ['1rem', { lineHeight: '1.5' }],
    'momentum-lg': ['1.125rem', { lineHeight: '1.625' }],
    'momentum-xl': ['1.25rem', { lineHeight: '1.625' }],
    'momentum-2xl': ['1.5rem', { lineHeight: '1.25' }],
    'momentum-3xl': ['1.875rem', { lineHeight: '1.25' }],
    'momentum-4xl': ['2.25rem', { lineHeight: '1.25' }],
  },
  borderRadius: {
    'momentum-xs': '0.125rem',
    'momentum-sm': '0.25rem',
    'momentum-md': '0.5rem',
    'momentum-lg': '0.75rem',
    'momentum-xl': '1rem',
    'momentum-2xl': '1.5rem',
    'momentum-3xl': '2rem',
  },
  spacing: {
    'momentum-xs': '0.25rem',
    'momentum-sm': '0.5rem',
    'momentum-md': '1rem',
    'momentum-lg': '1.5rem',
    'momentum-xl': '2rem',
    'momentum-2xl': '3rem',
    'momentum-3xl': '4rem',
  },
  transitionDuration: {
    'momentum-fast': '150ms',
    'momentum-normal': '200ms',
    'momentum-slow': '300ms',
  },
};

// Export individual parts for flexibility
module.exports = {
  // Main export - just the colors for simple usage
  ...momentumColors,
  
  // Named exports for specific parts
  colors: momentumColors,
  gradients: momentumGradients,
  shadows: momentumShadows,
  complete: momentumTailwindConfig,
  
  // Utility functions
  getMomentumColor: (colorPath) => {
    const paths = colorPath.split('.');
    let result = momentumColors;
    for (const path of paths) {
      result = result[path];
      if (!result) return null;
    }
    return result;
  },
  
  // Pre-built component classes
  componentClasses: {
    // Button variants
    'btn-momentum-primary': {
      backgroundColor: momentumColors.momentum.primary,
      color: 'white',
      borderRadius: '0.5rem',
      padding: '0.75rem 1.5rem',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: momentumColors.momentum.indigo[700],
        transform: 'translateY(-1px)',
        boxShadow: momentumShadows['momentum-primary'],
      }
    },
    
    'btn-momentum-secondary': {
      backgroundColor: 'transparent',
      color: momentumColors.momentum.primary,
      border: `1px solid ${momentumColors.momentum.indigo[200]}`,
      borderRadius: '0.5rem',
      padding: '0.75rem 1.5rem',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: momentumColors.momentum.indigo[50],
        borderColor: momentumColors.momentum.primary,
      }
    },
    
    // Card component
    'card-momentum': {
      backgroundColor: 'white',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      boxShadow: momentumShadows['momentum-card'],
      border: `1px solid ${momentumColors.momentum.indigo[100]}`,
      transition: 'all 0.2s ease',
      '&:hover': {
        boxShadow: momentumShadows['momentum-primary'],
        transform: 'translateY(-2px)',
      }
    },
    
    // Input field
    'input-momentum': {
      border: `1px solid ${momentumColors.momentum.indigo[200]}`,
      borderRadius: '0.5rem',
      padding: '0.75rem 1rem',
      fontSize: '1rem',
      transition: 'all 0.2s ease',
      '&:focus': {
        borderColor: momentumColors.momentum.primary,
        boxShadow: `0 0 0 2px ${momentumColors.momentum.primary}20`,
        outline: 'none',
      }
    },
  }
};

// Example usage in tailwind.config.js:
/*
const momentumBrand = require('./brand-assets/colors/tailwind-colors.js');

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: momentumBrand.colors,
      backgroundImage: momentumBrand.gradients,
      boxShadow: momentumBrand.shadows,
      fontFamily: momentumBrand.complete.fontFamily,
    }
  },
  plugins: []
}
*/
