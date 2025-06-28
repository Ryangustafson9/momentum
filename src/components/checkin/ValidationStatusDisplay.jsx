/**
 * Validation Status Display Component
 * Shows detailed validation results with appropriate styling and actions
 */

import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info, 
  Clock,
  CreditCard,
  Shield,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const ValidationStatusDisplay = ({ 
  validationResult, 
  onRetry, 
  onOverride, 
  showOverrideOption = true,
  className = '' 
}) => {
  if (!validationResult) return null;

  const getStatusConfig = () => {
    if (validationResult.valid && !validationResult.warning) {
      return {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        badgeVariant: 'default'
      };
    }

    if (validationResult.valid && validationResult.warning) {
      return {
        icon: AlertTriangle,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        badgeVariant: 'secondary'
      };
    }

    const severity = validationResult.severity || 'error';
    
    switch (severity) {
      case 'info':
        return {
          icon: Info,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          badgeVariant: 'outline'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          badgeVariant: 'secondary'
        };
      case 'error':
      default:
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          badgeVariant: 'destructive'
        };
    }
  };

  const getReasonIcon = (reason) => {
    const iconMap = {
      'member_not_found': AlertCircle,
      'guest_denied': Shield,
      'member_suspended': XCircle,
      'member_cancelled': XCircle,
      'member_inactive': AlertTriangle,
      'no_active_membership': CreditCard,
      'membership_expired': Calendar,
      'membership_expiring_soon': Calendar,
      'payment_overdue': DollarSign,
      'already_checked_in': Clock,
      'outside_operating_hours': Clock,
      'validation_error': AlertCircle
    };
    
    return iconMap[reason] || AlertCircle;
  };

  const getActionButton = () => {
    const { actionRequired } = validationResult;
    
    switch (actionRequired) {
      case 'purchase_membership':
        return (
          <Button size="sm" variant="outline" className="mt-3">
            <CreditCard className="h-4 w-4 mr-2" />
            Purchase Membership
          </Button>
        );
      case 'renew_membership':
        return (
          <Button size="sm" variant="outline" className="mt-3">
            <Calendar className="h-4 w-4 mr-2" />
            Renew Membership
          </Button>
        );
      case 'update_payment':
        return (
          <Button size="sm" variant="outline" className="mt-3">
            <DollarSign className="h-4 w-4 mr-2" />
            Update Payment
          </Button>
        );
      default:
        return null;
    }
  };

  const formatAdditionalInfo = () => {
    const info = [];
    
    if (validationResult.lastCheckIn) {
      info.push(`Last check-in: ${validationResult.lastCheckIn.toLocaleString()}`);
    }
    
    if (validationResult.expiryDate) {
      info.push(`Expires: ${validationResult.expiryDate.toLocaleDateString()}`);
    }
    
    if (validationResult.daysPastDue) {
      info.push(`${validationResult.daysPastDue} days past due`);
    }
    
    if (validationResult.operatingHours) {
      info.push(`Hours: ${validationResult.operatingHours}`);
    }
    
    return info;
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;
  const ReasonIcon = getReasonIcon(validationResult.reason);
  const additionalInfo = formatAdditionalInfo();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className={`border-2 ${config.borderColor} ${config.bgColor}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Status Icon */}
            <div className="flex-shrink-0">
              <StatusIcon className={`h-6 w-6 ${config.color}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={config.badgeVariant} className="text-xs">
                  {validationResult.valid ? 
                    (validationResult.warning ? 'Warning' : 'Valid') : 
                    'Invalid'
                  }
                </Badge>
                
                {validationResult.reason && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <ReasonIcon className="h-3 w-3" />
                    <span className="capitalize">
                      {validationResult.reason.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Message */}
              <p className={`text-sm font-medium ${config.color} mb-2`}>
                {validationResult.message}
              </p>

              {/* Additional Information */}
              {additionalInfo.length > 0 && (
                <div className="text-xs text-gray-600 space-y-1">
                  {additionalInfo.map((info, index) => (
                    <p key={index}>• {info}</p>
                  ))}
                </div>
              )}

              {/* Validation Details */}
              {validationResult.validationDetails && (
                <div className="mt-3 p-2 bg-white/50 rounded border text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium">Membership:</span>{' '}
                      {validationResult.validationDetails.membershipType}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>{' '}
                      {validationResult.validationDetails.membershipStatus}
                    </div>
                    <div>
                      <span className="font-medium">Access Level:</span>{' '}
                      {validationResult.validationDetails.accessLevel}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-3">
                {getActionButton()}
                
                {onRetry && (
                  <Button size="sm" variant="outline" onClick={onRetry}>
                    Retry Validation
                  </Button>
                )}
                
                {!validationResult.valid && showOverrideOption && onOverride && (
                  <Button size="sm" variant="outline" onClick={onOverride}>
                    <Shield className="h-4 w-4 mr-2" />
                    Staff Override
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ValidationStatusDisplay;
