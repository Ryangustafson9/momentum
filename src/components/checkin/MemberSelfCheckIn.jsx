import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  QrCode, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  User, 
  Loader2,
  RefreshCw,
  Download
} from 'lucide-react';
import CheckInService from '@/services/checkinService';
import QRCodeService from '@/services/qrCodeService';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Member Self-Service Check-In Component
 * Allows members to check themselves in using their QR code
 */
const MemberSelfCheckIn = ({
  locationId = null,
  deviceInfo = {},
  className = ''
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [memberQRCode, setMemberQRCode] = useState(null);
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState(null);
  const [todayCheckIn, setTodayCheckIn] = useState(null);
  const [memberProfile, setMemberProfile] = useState(null);

  useEffect(() => {
    if (user) {
      loadMemberData();
      loadMemberQRCode();
      checkTodayCheckIn();
    }
  }, [user, locationId]);

  const loadMemberData = async () => {
    try {
      // Get member profile with membership info
      const validation = await CheckInService.validateMemberForCheckIn(user.id, locationId);
      setMemberProfile(validation.profile);
    } catch (error) {
      console.error('Error loading member data:', error);
    }
  };

  const loadMemberQRCode = async () => {
    if (!user) return;
    
    setIsLoadingQR(true);
    try {
      const result = await QRCodeService.getDisplayQRCode(user.id);
      if (result.success) {
        setMemberQRCode(result);
      } else {
        console.error('Error loading QR code:', result.error);
        toast({
          title: "QR Code Error",
          description: "Failed to load your QR code. Please contact staff.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading member QR code:', error);
    } finally {
      setIsLoadingQR(false);
    }
  };

  const checkTodayCheckIn = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await CheckInService.getRecentCheckIns(locationId, 1);
      
      if (result.data && result.data.length > 0) {
        const recentCheckIn = result.data.find(
          checkin => checkin.profile_id === user.id && 
          checkin.check_in_time.startsWith(today)
        );
        
        if (recentCheckIn) {
          setTodayCheckIn(recentCheckIn);
        }
      }
    } catch (error) {
      console.error('Error checking today\'s check-in:', error);
    }
  };

  const handleSelfCheckIn = async () => {
    if (!user || !memberQRCode) return;

    setIsCheckingIn(true);
    setCheckInStatus(null);

    try {
      const result = await CheckInService.checkInByQRCode(memberQRCode.qrCodeData || '', {
        locationId,
        deviceInfo: {
          ...deviceInfo,
          interface_type: 'member_self_service',
          self_checkin: true
        }
      });

      if (result.success) {
        setCheckInStatus({
          success: true,
          message: 'Check-in successful! Welcome to the gym.',
          checkinRecord: result.checkinRecord
        });
        
        setTodayCheckIn(result.checkinRecord);
        
        toast({
          title: "Check-In Successful",
          description: "You have been checked in successfully. Enjoy your workout!",
          variant: "default"
        });
      } else {
        setCheckInStatus({
          success: false,
          message: result.message || 'Check-in failed. Please contact staff for assistance.',
          reason: result.reason
        });
        
        toast({
          title: "Check-In Failed",
          description: result.message || 'Check-in failed. Please contact staff.',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error during self check-in:', error);
      setCheckInStatus({
        success: false,
        message: 'An error occurred during check-in. Please try again or contact staff.',
        reason: 'system_error'
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const downloadQRCode = () => {
    if (!memberQRCode?.qrCodeImage) return;

    const link = document.createElement('a');
    link.download = `momentum-qr-code-${user.email}.png`;
    link.href = memberQRCode.qrCodeImage;
    link.click();
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

  const getMemberStatusBadge = (status) => {
    const variants = {
      active: 'default',
      suspended: 'destructive',
      cancelled: 'destructive',
      expired: 'destructive',
      frozen: 'secondary',
      guest: 'outline',
      archived: 'secondary'
    };

    return (
      <Badge variant={variants[status] || 'outline'} className="text-xs">
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
      </Badge>
    );
  };

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Please Sign In</h3>
          <p className="text-gray-600">You need to be signed in to check in to the gym.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Member Info */}
      {memberProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Welcome Back!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={memberProfile.profile_picture_url} />
                <AvatarFallback>
                  {getInitials(memberProfile.first_name, memberProfile.last_name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold">
                  {memberProfile.first_name} {memberProfile.last_name}
                </h3>
                <p className="text-sm text-gray-600">{memberProfile.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  {getMemberStatusBadge(memberProfile.status)}
                  <Badge variant="outline" className="text-xs capitalize">
                    {memberProfile.role}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Check-In Status */}
      {todayCheckIn ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-green-700 mb-2">
                Already Checked In Today
              </h3>
              <p className="text-gray-600 mb-4">
                You checked in at {formatTime(todayCheckIn.check_in_time)}
              </p>
              <Badge variant="default">
                Method: {todayCheckIn.check_in_method?.replace('_', ' ')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Check-In Interface */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Check In to Gym
              </div>
              {memberQRCode && (
                <Button variant="outline" size="sm" onClick={downloadQRCode}>
                  <Download className="h-4 w-4 mr-2" />
                  Download QR
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code Display */}
            <div className="text-center">
              {isLoadingQR ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-12 w-12 animate-spin text-gray-400 mb-4" />
                  <p className="text-gray-600">Loading your QR code...</p>
                </div>
              ) : memberQRCode ? (
                <div className="space-y-4">
                  <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                    <img 
                      src={memberQRCode.qrCodeImage} 
                      alt="Member QR Code"
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Show this QR code to the scanner or tap the button below
                  </p>
                  {memberQRCode.expiresDate && (
                    <p className="text-xs text-gray-500">
                      Expires: {new Date(memberQRCode.expiresDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500" />
                  <p className="text-gray-600">Unable to load QR code</p>
                  <Button variant="outline" onClick={loadMemberQRCode}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              )}
            </div>

            {/* Check-In Button */}
            {memberQRCode && (
              <div className="text-center">
                <Button
                  onClick={handleSelfCheckIn}
                  disabled={isCheckingIn}
                  size="lg"
                  className="w-full max-w-sm"
                >
                  {isCheckingIn ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Checking In...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Check In Now
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Check-In Status */}
            {checkInStatus && (
              <div className={`p-4 rounded-lg border ${
                checkInStatus.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {checkInStatus.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-sm font-medium">
                    {checkInStatus.message}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">How to Check In</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <div className="flex items-start gap-2">
            <span className="font-semibold text-primary">1.</span>
            <span>Use the "Check In Now" button above for instant check-in</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold text-primary">2.</span>
            <span>Show your QR code to the scanner at the gym entrance</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold text-primary">3.</span>
            <span>Ask staff for manual check-in if you need assistance</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MemberSelfCheckIn;
