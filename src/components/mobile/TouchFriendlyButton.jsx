/**
 * 👆 TOUCH-FRIENDLY BUTTON COMPONENT
 * Enhanced button with mobile-optimized touch targets and feedback
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useMobile } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

const TouchFriendlyButton = ({
  children,
  className = '',
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  hapticFeedback = true,
  rippleEffect = true,
  onClick,
  ...props
}) => {
  const { isMobile, touchDevice } = useMobile();
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState([]);

  // Enhanced touch target sizes for mobile
  const getTouchSize = () => {
    if (!isMobile && !touchDevice) return size;
    
    switch (size) {
      case 'sm':
        return 'default'; // Upgrade small to default on mobile
      case 'default':
        return 'lg'; // Upgrade default to large on mobile
      case 'lg':
        return 'lg'; // Keep large as is
      case 'icon':
        return 'icon'; // Keep icon size but add padding
      default:
        return 'lg';
    }
  };

  // Enhanced padding for touch targets
  const getTouchPadding = () => {
    if (!isMobile && !touchDevice) return '';
    
    switch (size) {
      case 'icon':
        return 'p-3'; // Minimum 44px touch target
      default:
        return 'py-3 px-6'; // Larger touch area
    }
  };

  const handleTouchStart = (e) => {
    setIsPressed(true);
    
    // Haptic feedback for supported devices
    if (hapticFeedback && navigator.vibrate && touchDevice) {
      navigator.vibrate(10); // Short vibration
    }

    // Create ripple effect
    if (rippleEffect) {
      const rect = e.currentTarget.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.touches[0].clientX - rect.left - size / 2;
      const y = e.touches[0].clientY - rect.top - size / 2;
      
      const newRipple = {
        id: Date.now(),
        x,
        y,
        size,
      };
      
      setRipples(prev => [...prev, newRipple]);
      
      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  const handleClick = (e) => {
    if (disabled || loading) return;
    
    // Add click feedback for non-touch devices
    if (!touchDevice && hapticFeedback) {
      // Visual feedback only for non-touch devices
      setIsPressed(true);
      setTimeout(() => setIsPressed(false), 150);
    }
    
    onClick?.(e);
  };

  const touchSize = getTouchSize();
  const touchPadding = getTouchPadding();

  return (
    <motion.div
      className="relative inline-block"
      whileTap={touchDevice ? { scale: 0.95 } : { scale: 0.98 }}
      transition={{ duration: 0.1 }}
    >
      <Button
        variant={variant}
        size={touchSize}
        disabled={disabled || loading}
        className={cn(
          'relative overflow-hidden transition-all duration-200',
          touchPadding,
          // Enhanced focus styles for accessibility
          'focus-visible:ring-4 focus-visible:ring-primary/20',
          // Touch-specific styles
          touchDevice && [
            'active:scale-95',
            'select-none',
            'touch-manipulation',
          ],
          // Pressed state
          isPressed && !disabled && 'brightness-90',
          // Loading state
          loading && 'cursor-wait',
          className
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-inherit">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </div>
        )}

        {/* Button content */}
        <span className={cn('relative z-10', loading && 'opacity-0')}>
          {children}
        </span>

        {/* Ripple effects */}
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            className="absolute rounded-full bg-white/30 pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </Button>
    </motion.div>
  );
};

export default TouchFriendlyButton;

