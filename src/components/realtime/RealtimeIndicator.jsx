/**
 * 🔴 REAL-TIME CONNECTION INDICATOR
 * Visual indicator for real-time connection status
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const RealtimeIndicator = ({ 
  isConnected, 
  className = '',
  showText = false,
  size = 'sm' 
}) => {
  const sizeClasses = {
    xs: 'h-2 w-2',
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const iconSizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Connection Status Dot */}
      <div className="relative flex items-center">
        <motion.div
          className={cn(
            'rounded-full',
            sizeClasses[size],
            isConnected 
              ? 'bg-green-500' 
              : 'bg-red-500'
          )}
          animate={isConnected ? {
            scale: [1, 1.2, 1],
            opacity: [1, 0.8, 1],
          } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Pulse ring for connected state */}
        {isConnected && (
          <motion.div
            className={cn(
              'absolute rounded-full bg-green-500',
              sizeClasses[size]
            )}
            animate={{
              scale: [1, 2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </div>

      {/* Connection Icon */}
      {isConnected ? (
        <Activity className={cn(
          'text-green-600',
          iconSizeClasses[size]
        )} />
      ) : (
        <WifiOff className={cn(
          'text-red-600',
          iconSizeClasses[size]
        )} />
      )}

      {/* Connection Text */}
      {showText && (
        <span className={cn(
          'text-sm font-medium',
          isConnected 
            ? 'text-green-600' 
            : 'text-red-600'
        )}>
          {isConnected ? 'Live' : 'Offline'}
        </span>
      )}
    </div>
  );
};

export default RealtimeIndicator;

