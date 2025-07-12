import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  QrCode,
  MapPin,
  UserCheck
} from 'lucide-react';
import { ManualCheckIn, CheckInService } from '@/components/checkin';
import QRBarcodeScanner from '@/components/checkin/QRBarcodeScanner';
import RecentActivityFeed from '@/components/checkin/RecentActivityFeed';
import { useAuth } from '@/contexts/AuthContext';
import { ResponsiveContainer } from '@/components/layout/ResponsiveContainer';

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
  // Load initial stats
  useEffect(() => {
    loadCheckInStats();

    // Set up periodic refresh
    const interval = setInterval(() => {
      loadCheckInStats();
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

  const handleCheckInSuccess = (result) => {
    const member = result.member;
    const memberName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email;

    // Update stats
    setCheckInStats(prev => ({
      ...prev,
      todayCheckIns: prev.todayCheckIns + 1,
      successfulCheckIns: prev.successfulCheckIns + 1
    }));

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <ResponsiveContainer className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 border border-gray-300 rounded-lg bg-white">
              <UserCheck className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Check-In Dashboard</h1>
              <p className="text-gray-600">Monitor member activity and manage check-ins</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600 bg-white px-3 py-2 rounded-lg border">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">Main Location</span>
            </div>
          </div>
        </div>

        {/* Two-Column Layout: Check-in Interface (Left) + Activity Feed (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[calc(100vh-12rem)]">
          {/* Left Column - Check-in Interface (25% width on desktop) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Mobile Quick Stats - Only show on mobile */}
            <div className="lg:hidden grid grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-3">
                  <div className="text-center">
                    <p className="text-xs font-medium text-green-700">Today</p>
                    <p className="text-xl font-bold text-green-900">{checkInStats.todayCheckIns}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                <CardContent className="p-3">
                  <div className="text-center">
                    <p className="text-xs font-medium text-orange-700">Alerts</p>
                    <p className="text-xl font-bold text-orange-900">{checkInStats.failedAttempts}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile Activity Feed - Compact version for mobile */}
            <div className="lg:hidden">
              <RecentActivityFeed
                maxItems={8}
                refreshInterval={15000}
                showStats={false}
                showHeader={true}
                className="max-h-80"
              />
            </div>

            {/* Member Search/Scanner */}
            <Card className="border-2 border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardHeader className="border-b-2 border-indigo-100 bg-gradient-to-r from-indigo-100 to-purple-100">
                <CardTitle className="flex items-center gap-2 text-indigo-900">
                  <QrCode className="h-5 w-5" />
                  Member Check-In
                </CardTitle>
                <p className="text-sm text-indigo-700">
                  Search members by name, email, or member ID
                </p>
              </CardHeader>
              <CardContent className="p-4">
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

            {/* QR/Barcode Scanner */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QR Scanner
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Or scan QR code
                </p>
              </CardHeader>
              <CardContent className="pt-0">
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
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Today's Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Check-ins</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{checkInStats.todayCheckIns}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Need Attention</span>
                  </div>
                  <span className="text-2xl font-bold text-orange-600">{checkInStats.failedAttempts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">VIP / Recent</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">2</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Monitoring Dashboard (75% width) - Desktop Only */}
          <div className="hidden lg:flex lg:flex-col lg:col-span-3 space-y-6 order-1 lg:order-2">
            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">Today's Check-ins</p>
                      <p className="text-2xl font-bold text-green-900">{checkInStats.todayCheckIns}</p>
                    </div>
                    <div className="p-2 bg-green-100 rounded-full">
                      <UserCheck className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Success Rate</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {checkInStats.todayCheckIns > 0
                          ? Math.round((checkInStats.successfulCheckIns / checkInStats.todayCheckIns) * 100)
                          : 0}%
                      </p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-full">
                      <QrCode className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Current Occupancy</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {Math.max(0, checkInStats.todayCheckIns - Math.floor(checkInStats.todayCheckIns * 0.3))}
                      </p>
                    </div>
                    <div className="p-2 bg-purple-100 rounded-full">
                      <MapPin className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Real-time Activity Feed - Desktop */}
            <RecentActivityFeed
              maxItems={25}
              refreshInterval={15000}
              showStats={false}
              showHeader={true}
              className="flex-1 min-h-96"
            />
          </div>
        </div>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default CheckInPage;


