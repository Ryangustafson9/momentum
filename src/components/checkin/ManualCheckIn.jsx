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
      return "Member is eligible for check-in";
    } else {
      return validationResult.message || "Member is not eligible for check-in";
    }
  };

  const getMemberStatusBadge = (status) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      suspended: 'destructive',
      cancelled: 'destructive'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'} className="text-xs">
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
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
            placeholder="Search by name, email, or member ID..."
            showCreateButton={false}
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
            <div className={`p-3 rounded-lg border ${
              validationResult?.valid 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {getValidationIcon()}
                <span className="text-sm font-medium">
                  {getValidationMessage()}
                </span>
              </div>
            </div>

            {/* Staff Override Option */}
            {!validationResult?.valid && (
              <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Checkbox
                  id="staff-override"
                  checked={staffOverride}
                  onCheckedChange={setStaffOverride}
                />
                <label htmlFor="staff-override" className="text-sm font-medium cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-yellow-600" />
                    Staff Override - Allow check-in despite validation issues
                  </div>
                </label>
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
