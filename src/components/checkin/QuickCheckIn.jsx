/**
 * Quick Check-In Component
 * Compact check-in interface for member profiles and quick actions
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Loader2, 
  User,
  Calendar,
  MapPin,
  Zap,
  Shield,
  RefreshCw
} from 'lucide-react';
import { CheckInService } from '@/components/checkin';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';

const QuickCheckIn = ({ 
  memberId, 
  memberName, 
  memberData = null,
  locationId = null,
  locationName = 'Main Location',
  onCheckInSuccess = null,
  onCheckInFailed = null,
  className = '',
  compact = false
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState(null);
  const [todayCheckIn, setTodayCheckIn] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    if (memberId) {
      checkTodayCheckIn();
      validateMember();
    }
  }, [memberId, locationId]);

  const checkTodayCheckIn = async () => {
    if (!memberId) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await CheckInService.getRecentCheckIns(locationId, 50);
      
      if (result.data) {
        const todayCheckIn = result.data.find(
          checkin => checkin.profile_id === memberId && 
          checkin.check_in_time.startsWith(today) &&
          checkin.validation_status === 'valid'
        );
        
        setTodayCheckIn(todayCheckIn || null);
      }
    } catch (error) {
      console.error('Error checking today\'s check-in:', error);
    }
  };

  const validateMember = async () => {
    if (!memberId) return;

    setIsValidating(true);
    try {
      const validation = await CheckInService.validateMemberForCheckIn(memberId, locationId);
      setValidationResult(validation);
    } catch (error) {
      console.error('Error validating member:', error);
      setValidationResult({
        valid: false,
        reason: 'validation_error',
        message: 'Unable to validate member status'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleQuickCheckIn = async () => {
    if (!memberId || !user) return;

    setIsCheckingIn(true);
    setCheckInStatus(null);

    try {
      const result = await CheckInService.performCheckIn(memberId, {
        method: 'manual',
        staffMemberId: user.id,
        locationId: locationId,
        deviceInfo: {
          interface_type: 'staff_portal',
          component: 'quick_checkin',
          location: window.location.pathname
        },
        notes: `Quick check-in by ${user.first_name || user.email} from member profile`
      });

      if (result.success) {
        setCheckInStatus('success');
        setTodayCheckIn(result.checkinRecord);
        
        toast({
          title: "Check-In Successful",
          description: `${memberName} has been checked in successfully`,
          variant: "success"
        });

        if (onCheckInSuccess) {
          onCheckInSuccess(result);
        }
      } else {
        setCheckInStatus('failed');
        
        toast({
          title: "Check-In Failed",
          description: result.message || 'Unable to check in member',
          variant: "destructive"
        });

        if (onCheckInFailed) {
          onCheckInFailed(result);
        }
      }
    } catch (error) {
      console.error('Error during check-in:', error);
      setCheckInStatus('failed');
      
      toast({
        title: "Check-In Error",
        description: "An unexpected error occurred during check-in",
        variant: "destructive"
      });

      if (onCheckInFailed) {
        onCheckInFailed({ success: false, message: error.message });
      }
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleRefresh = () => {
    setLastRefresh(new Date());
    checkTodayCheckIn();
    validateMember();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getValidationIcon = () => {
    if (isValidating) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (!validationResult) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    if (validationResult.valid) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  if (compact) {
    return (
      <div className={`space-y-3 ${className}`}>
        {/* Compact Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getValidationIcon()}
            <span className="text-sm font-medium">
              {todayCheckIn ? 'Checked In' : 'Not Checked In'}
            </span>
          </div>
          <Button
            onClick={todayCheckIn ? handleRefresh : handleQuickCheckIn}
            disabled={isCheckingIn || isValidating || (!validationResult?.valid && !todayCheckIn)}
            size="sm"
            variant={todayCheckIn ? "outline" : "default"}
          >
            {isCheckingIn ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : todayCheckIn ? (
              <RefreshCw className="h-4 w-4" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Compact Details */}
        {todayCheckIn && (
          <div className="text-xs text-gray-600">
            Checked in {formatDistanceToNow(new Date(todayCheckIn.check_in_time), { addSuffix: true })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Quick Check-In
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isValidating}
          >
            <RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Member Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-gray-500" />
            <div>
              <p className="font-medium text-sm">{memberName}</p>
              <p className="text-xs text-gray-600">
                {memberData?.system_member_id && `ID: ${memberData.system_member_id}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getValidationIcon()}
            {memberData?.status && (
              <Badge className={getStatusColor(memberData.status)}>
                {memberData.status}
              </Badge>
            )}
          </div>
        </div>

        {/* Location Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>{locationName}</span>
          <span className="text-xs">•</span>
          <span>{format(lastRefresh, 'HH:mm')}</span>
        </div>

        {/* Check-In Status */}
        <AnimatePresence mode="wait">
          {todayCheckIn ? (
            <motion.div
              key="checked-in"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-green-50 border border-green-200 rounded-lg"
            >
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-green-800">Already Checked In Today</h4>
              </div>
              <div className="space-y-1 text-sm text-green-700">
                <p>Time: {format(new Date(todayCheckIn.check_in_time), 'h:mm a')}</p>
                <p>Method: {todayCheckIn.check_in_method?.replace('_', ' ')}</p>
                {todayCheckIn.staff_member_id && (
                  <p>Staff: {todayCheckIn.staff_member_name || 'Staff Member'}</p>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="not-checked-in"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {/* Validation Status */}
              {validationResult && !validationResult.valid && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Check-In Blocked</span>
                  </div>
                  <p className="text-sm text-red-700">{validationResult.message}</p>
                </div>
              )}

              {/* Check-In Button */}
              <Button
                onClick={handleQuickCheckIn}
                disabled={isCheckingIn || isValidating || !validationResult?.valid}
                className="w-full"
                size="lg"
              >
                {isCheckingIn ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Checking In...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    Check In Member
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success/Error Status */}
        <AnimatePresence>
          {checkInStatus && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-3 rounded-lg border ${
                checkInStatus === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {checkInStatus === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {checkInStatus === 'success' ? 'Check-in successful!' : 'Check-in failed'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default QuickCheckIn;
