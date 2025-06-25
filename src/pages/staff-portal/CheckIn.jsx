import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { User, BarChart3, Clock, CheckCircle, QrCode } from 'lucide-react';
import { ManualCheckIn, CheckInService } from '@/components/checkin';
import QRBarcodeScanner from '@/components/checkin/QRBarcodeScanner';
import StaffPageHeader from '@/components/staff/StaffPageHeader';
import StaffPageContainer from '@/components/staff/StaffPageContainer';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Enhanced Check-In Page with QR Code Scanning and Manual Check-In
 */
const CheckInPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();


  const [checkInStats, setCheckInStats] = useState({
    todayCheckIns: 0,
    successfulCheckIns: 0,
    failedAttempts: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);

  // Load initial stats and activity
  useEffect(() => {
    loadCheckInStats();
    loadRecentActivity();

    // Set up periodic refresh
    const interval = setInterval(() => {
      loadCheckInStats();
      loadRecentActivity();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadCheckInStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await CheckInService.getRecentCheckIns(null, 100);

      if (result.data) {
        const todayCheckIns = result.data.filter(
          checkin => checkin.check_in_time.startsWith(today)
        );

        const successfulCheckIns = todayCheckIns.filter(
          checkin => checkin.validation_status === 'valid'
        ).length;

        const failedAttempts = todayCheckIns.filter(
          checkin => checkin.validation_status !== 'valid'
        ).length;

        setCheckInStats({
          todayCheckIns: todayCheckIns.length,
          successfulCheckIns,
          failedAttempts
        });
      }
    } catch (error) {
      console.error('Error loading check-in stats:', error);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const result = await CheckInService.getRecentCheckIns(null, 10);
      if (result.data) {
        setRecentActivity(result.data);
      }
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const handleCheckInSuccess = (result) => {
    const member = result.member;
    const memberName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email;

    // Update stats
    setCheckInStats(prev => ({
      ...prev,
      todayCheckIns: prev.todayCheckIns + 1,
      successfulCheckIns: prev.successfulCheckIns + 1
    }));

    // Add to recent activity
    setRecentActivity(prev => [result.checkinRecord, ...prev.slice(0, 9)]);

    toast({
      title: "Check-In Successful",
      description: `${memberName} has been checked in successfully`,
      variant: "default"
    });
  };

  const handleCheckInFailed = (result) => {
    // Update stats
    setCheckInStats(prev => ({
      ...prev,
      failedAttempts: prev.failedAttempts + 1
    }));

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
  };
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <StaffPageContainer className="space-y-6 p-4 md:p-6">
        <div className="flex items-start justify-between">
          <StaffPageHeader
            title="Member Check-In"
            description="Manual check-in system for member access"
          />
          <div className="text-right mt-2">
            <p className="text-sm text-muted-foreground">
              Location: Main Location
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold text-green-600">{checkInStats.todayCheckIns}</p>
              <p className="text-sm text-gray-600">Today's Check-Ins</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold text-blue-600">{checkInStats.successfulCheckIns}</p>
              <p className="text-sm text-gray-600">Successful Check-Ins</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-8 w-8 mx-auto text-orange-500 mb-2" />
              <p className="text-2xl font-bold text-orange-600">{checkInStats.failedAttempts}</p>
              <p className="text-sm text-gray-600">Failed Attempts</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Check-In Interface */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          {/* QR/Barcode Scanner */}
          <div>
            <QRBarcodeScanner
              onCheckInSuccess={handleCheckInSuccess}
              onCheckInFailed={handleCheckInFailed}
              locationId={null}
              staffMemberId={user?.id}
              deviceInfo={{
                interface_type: 'staff_portal',
                device_name: 'Staff Portal Scanner',
                page: 'check_in'
              }}
            />
          </div>

          {/* Manual Check-In */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Manual Check-In
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Search for members and check them in manually
                </p>
              </CardHeader>
              <CardContent>
                <ManualCheckIn
                  onCheckInSuccess={handleCheckInSuccess}
                  onCheckInFailed={handleCheckInFailed}
                  locationName="Main Location"
                  staffMemberId={user?.id}
                  deviceInfo={{
                    interface_type: 'staff_portal',
                    page: 'check_in'
                  }}
                />
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Recent Activity Section */}
        <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Latest member check-ins
                </p>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">
                            {activity.profile?.first_name} {activity.profile?.last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTime(activity.check_in_time)}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={activity.validation_status === 'valid' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {activity.validation_status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
      </StaffPageContainer>
    </motion.div>
  );
};

export default CheckInPage;


