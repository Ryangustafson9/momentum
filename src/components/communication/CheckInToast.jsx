import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, User, Crown, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

/**
 * CheckInToast Component
 * 
 * Non-blocking toast notification for global check-ins
 * Shows member info, status, and auto-dismisses
 * 
 * Features:
 * - Profile photo or initials
 * - Member name and status
 * - Success/Warning/Error states
 * - Auto-dismiss after 3-5 seconds
 * - Slide-in animation
 * - VIP member indicators
 * - Alert badges for special conditions
 */

const CheckInToast = ({ 
  checkInResult, 
  isVisible, 
  onDismiss,
  duration = 4000,
  position = 'top-right' 
}) => {
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (isVisible && checkInResult) {
      setIsShowing(true);
      
      // Auto-dismiss after duration
      const timer = setTimeout(() => {
        setIsShowing(false);
        setTimeout(() => {
          if (onDismiss) onDismiss();
        }, 300); // Wait for exit animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, checkInResult, duration, onDismiss]);

  if (!checkInResult) return null;

  const { status, message, member, alerts = [] } = checkInResult;

  // Determine status styling
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600',
          textColor: 'text-green-800'
        };
      case 'blocked':
        return {
          icon: XCircle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          textColor: 'text-red-800'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
          textColor: 'text-yellow-800'
        };
      default:
        return {
          icon: AlertTriangle,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          iconColor: 'text-gray-600',
          textColor: 'text-gray-800'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  // Get member initials for avatar fallback
  const getInitials = (member) => {
    if (!member) return 'GM'; // Guest Member
    const first = member.first_name?.[0] || '';
    const last = member.last_name?.[0] || '';
    return (first + last).toUpperCase() || 'M';
  };

  // Check if member is VIP
  const isVIP = member?.membership?.membership_types?.category === 'VIP' || 
               member?.role === 'vip' ||
               alerts.some(alert => alert.type === 'vip');

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  return (
    <AnimatePresence>
      {isShowing && (
        <motion.div
          initial={{ opacity: 0, x: position.includes('right') ? 100 : -100, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: position.includes('right') ? 100 : -100, scale: 0.95 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.3 
          }}
          className={`
            fixed z-50 ${positionClasses[position] || positionClasses['top-right']}
            max-w-sm w-full pointer-events-auto
          `}
        >
          <div 
            className={`
              ${statusConfig.bgColor} ${statusConfig.borderColor} ${statusConfig.textColor}
              border-2 rounded-lg shadow-lg p-4 cursor-pointer
              hover:shadow-xl transition-shadow duration-200
            `}
            onClick={() => {
              setIsShowing(false);
              setTimeout(() => {
                if (onDismiss) onDismiss();
              }, 300);
            }}
          >
            {/* Header with status icon and close indicator */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <StatusIcon className={`h-5 w-5 ${statusConfig.iconColor}`} />
                <span className="font-semibold text-sm">
                  {status === 'success' ? 'Check-In Successful' : 
                   status === 'blocked' ? 'Check-In Blocked' : 
                   status === 'warning' ? 'Check-In Warning' : 'Check-In'}
                </span>
              </div>
              <div className="text-xs opacity-60">
                <Clock className="h-3 w-3" />
              </div>
            </div>

            {/* Member info section */}
            <div className="flex items-center gap-3 mb-3">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                  <AvatarImage 
                    src={member?.profile_picture_url} 
                    alt={member ? `${member.first_name} ${member.last_name}` : 'Member'} 
                  />
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                    {getInitials(member)}
                  </AvatarFallback>
                </Avatar>
                {isVIP && (
                  <Crown className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 bg-white rounded-full p-0.5" />
                )}
              </div>

              {/* Member details */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-base truncate">
                  {member ? `${member.first_name} ${member.last_name}` : 'Guest Member'}
                </div>
                {member?.membership && (
                  <div className="text-xs opacity-75 truncate">
                    {member.membership.membership_types?.name || 'Member'}
                  </div>
                )}
              </div>
            </div>

            {/* Message */}
            <div className="text-sm font-medium mb-2">
              {message}
            </div>

            {/* Alerts/Badges */}
            {alerts.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {alerts.slice(0, 3).map((alert, index) => (
                  <Badge 
                    key={index}
                    variant={alert.severity === 'high' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {alert.message || alert.type}
                  </Badge>
                ))}
                {alerts.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{alerts.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Timestamp */}
            <div className="text-xs opacity-60 text-right">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CheckInToast;
