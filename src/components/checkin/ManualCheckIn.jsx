import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  User,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Shield,
  Loader2
} from 'lucide-react';
import { ProfileSearch } from '@/components/profile';
import CheckInService from '@/services/checkinService';
import { supabase } from '@/lib/supabaseClient';

/**
 * Manual Check-In Interface for Staff
 */
const ManualCheckIn = ({
  onCheckInSuccess,
  onCheckInFailed,
  locationId = null,
  locationName = 'Main Location',
  staffMemberId = null,
  deviceInfo = {},
  className = ''
}) => {
  const { toast } = useToast();
  
  const [selectedMember, setSelectedMember] = useState(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [staffOverride, setStaffOverride] = useState(false);
  const [validationResult, setValidationResult] = useState(null);


  const handleMemberSelect = async (member) => {
    setSelectedMember(member);
    setValidationResult(null);

    // Pre-validate the member
    if (member) {
      const validation = await CheckInService.validateMemberForCheckIn(
        member.id,
        locationId,
        { staffOverride }
      );
      setValidationResult(validation);
    }
  };

  const handleAutoCheckIn = async (member) => {
    setIsCheckingIn(true);
    try {
      const result = await CheckInService.manualCheckIn(
        member.id,
        staffMemberId,
        {
          locationId,
          deviceInfo: {
            ...deviceInfo,
            interface_type: 'manual_staff_auto',
            auto_checkin: true
          },
          staffOverride: false, // Auto check-in doesn't use staff override
          notes: `Auto check-in via search selection for ${member.first_name} ${member.last_name}`
        }
      );

      if (result.success) {
        handleCheckInSuccess(result);
        // Don't set selected member since this was an auto check-in
      } else {
        handleCheckInFailure(result);
      }
    } catch (error) {
      console.error('Auto check-in error:', error);
      throw error; // Re-throw so ProfileSearch can handle the error display
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedMember) return;

    setIsCheckingIn(true);
    try {
      const result = await CheckInService.manualCheckIn(
        selectedMember.id,
        staffMemberId,
        {
          locationId,
          deviceInfo: {
            ...deviceInfo,
            interface_type: 'manual_staff',
            staff_override: staffOverride
          },
          staffOverride,
          notes: staffOverride ? 'Staff override applied' : null
        }
      );

      if (result.success) {
        handleCheckInSuccess(result);
        setSelectedMember(null);
        setValidationResult(null);
        setStaffOverride(false);
      } else {
        handleCheckInFailure(result);
      }

    } catch (error) {
      console.error('Error during manual check-in:', error);
      toast({
        title: "Check-In Error",
        description: "An error occurred during check-in. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckInSuccess = (result) => {
    const member = result.member;
    const memberName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email;

    toast({
      title: "Check-In Successful",
      description: `${memberName} has been checked in successfully`,
      variant: "default"
    });

    // Dispatch event for real-time UI updates (backup in case service didn't)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('checkin-success', {
        detail: {
          checkinRecord: result.checkinRecord,
          member: result.member,
          membership: result.membership,
          timestamp: new Date().toISOString(),
          source: 'manual-checkin'
        }
      }));
    }

    onCheckInSuccess?.(result);
  };

  const handleCheckInFailure = (result) => {
    const errorMessages = {
      'member_not_found': 'Member not found in system',
      'guest_denied': 'Guest access not permitted',
      'already_checked_in': 'Member already checked in today',
      'suspended': 'Member account is suspended',
      'inactive_member': 'Member account is inactive',
      'no_active_membership': 'No active membership found'
    };

    const message = errorMessages[result.reason] || result.message || 'Check-in failed';

    toast({
      title: "Check-In Failed",
      description: message,
      variant: "destructive"
    });

    onCheckInFailed?.(result);
  };

  const getValidationIcon = () => {
    if (!validationResult) return null;
    
    if (validationResult.valid) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else {
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  const getValidationMessage = () => {
    if (!validationResult) return null;

    if (validationResult.valid) {
      return validationResult.statusWarning
        ? `Check-in allowed with ${validationResult.statusWarning.displayStatus} status`
        : "Member is eligible for check-in";
    } else {
      return validationResult.message || "Member is not eligible for check-in";
    }
  };

  const getValidationStatusClasses = () => {
    if (!validationResult) return 'bg-gray-50 border-gray-200';

    if (validationResult.valid) {
      if (validationResult.statusWarning) {
        const color = validationResult.statusWarning.highlightColor;
        switch (color) {
          case 'yellow':
            return 'bg-yellow-50 border-yellow-200';
          case 'red':
            return 'bg-red-50 border-red-200';
          default:
            return 'bg-green-50 border-green-200';
        }
      }
      return 'bg-green-50 border-green-200';
    } else {
      if (validationResult.statusInfo) {
        const color = validationResult.statusInfo.highlightColor;
        switch (color) {
          case 'yellow':
            return 'bg-yellow-50 border-yellow-200';
          case 'gray':
            return 'bg-gray-50 border-gray-300';
          default:
            return 'bg-red-50 border-red-200';
        }
      }
      return 'bg-red-50 border-red-200';
    }
  };

  const getMemberStatusBadge = (status) => {
    const statusConfig = {
      active: {
        variant: 'default',
        className: 'bg-green-100 text-green-800 border-green-200',
        label: 'Active'
      },
      suspended: {
        variant: 'destructive',
        className: 'bg-red-100 text-red-800 border-red-200',
        label: 'SUSPENDED'
      },
      cancelled: {
        variant: 'destructive',
        className: 'bg-red-100 text-red-800 border-red-200',
        label: 'CANCELLED'
      },
      expired: {
        variant: 'destructive',
        className: 'bg-red-100 text-red-800 border-red-200',
        label: 'EXPIRED'
      },
      frozen: {
        variant: 'secondary',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        label: 'FROZEN'
      },
      guest: {
        variant: 'secondary',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        label: 'GUEST'
      },
      archived: {
        variant: 'outline',
        className: 'bg-gray-100 text-gray-600 border-gray-300',
        label: 'ARCHIVED'
      }
    };

    const config = statusConfig[status?.toLowerCase()] || {
      variant: 'outline',
      className: 'bg-gray-100 text-gray-600 border-gray-300',
      label: status?.toUpperCase() || 'UNKNOWN'
    };

    return (
      <Badge
        variant={config.variant}
        className={`text-xs font-medium ${config.className}`}
      >
        {config.label}
      </Badge>
    );
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Member Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileSearch
            onProfileSelect={handleMemberSelect}
            onAutoCheckIn={handleAutoCheckIn}
            autoCheckIn={true}
            placeholder="Search by name, email, or member ID (click name to check in)..."
            showCreateButton={true}
            userRole="member"
            maxResults={8}
          />
        </CardContent>
      </Card>

      {/* Selected Member Details */}
      {selectedMember && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Selected Member</span>
              {getValidationIcon()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Member Info */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={selectedMember.profile_picture_url} />
                <AvatarFallback>
                  {getInitials(selectedMember.first_name, selectedMember.last_name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold">
                  {selectedMember.first_name} {selectedMember.last_name}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {selectedMember.email}
                  </div>
                  {selectedMember.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {selectedMember.phone}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {getMemberStatusBadge(selectedMember.status)}
                  <Badge variant="outline" className="text-xs capitalize">
                    {selectedMember.role}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Validation Status */}
            <div className={`p-3 rounded-lg border ${getValidationStatusClasses()}`}>
              <div className="flex items-center gap-2">
                {getValidationIcon()}
                <span className="text-sm font-medium">
                  {getValidationMessage()}
                </span>
              </div>
              {validationResult?.statusWarning && (
                <div className="mt-2 text-xs text-gray-600">
                  Status: {validationResult.statusWarning.displayStatus}
                </div>
              )}
            </div>

            {/* Staff Override Option */}
            {!validationResult?.valid && validationResult?.requiresOverride && (
              <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Checkbox
                  id="staff-override"
                  checked={staffOverride}
                  onCheckedChange={setStaffOverride}
                />
                <label htmlFor="staff-override" className="text-sm font-medium cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-yellow-600" />
                    Staff Override - Allow check-in for {validationResult.statusInfo?.displayStatus || 'restricted'} member
                  </div>
                </label>
              </div>
            )}

            {/* Archived members cannot be overridden */}
            {!validationResult?.valid && !validationResult?.requiresOverride && (
              <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Check-in not permitted - {validationResult?.statusInfo?.displayStatus || 'Access denied'}
                  </span>
                </div>
              </div>
            )}

            {/* Check-In Button */}
            <div className="flex gap-2">
              <Button
                onClick={handleCheckIn}
                disabled={isCheckingIn || (!validationResult?.valid && !staffOverride)}
                className="flex-1"
              >
                {isCheckingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking In...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Check In Member
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedMember(null);
                  setValidationResult(null);
                  setStaffOverride(false);
                }}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}


    </div>
  );
};

export default ManualCheckIn;
