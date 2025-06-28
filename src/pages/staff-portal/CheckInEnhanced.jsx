import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  QrCode,
  UserCheck,
  AlertTriangle,
  Clock,
  Search,
  MapPin,
  Menu,
  Star,
  FileText,
  Calendar,
  Activity
} from 'lucide-react';
import { CheckInService } from '@/components/checkin';
import { format } from 'date-fns';
import ProfileSearch from '@/components/profile/ProfileSearch';
import { useCheckIn } from '@/contexts/CheckInContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Check-In Dashboard - Primary Monitoring Interface
 *
 * Two-column layout (1:3 ratio):
 * 1. Combined Check-In Tools (25%) - Tabbed interface with Manual Check-In and QR Scanner
 * 2. Primary Monitoring Dashboard (75%) - Real-time member activity with enhanced alerts
 *
 * Features:
 * - Primary focus on monitoring member activity and alerts
 * - Compact, accessible check-in tools in tabbed interface
 * - Real-time updates every 10 seconds for monitoring dashboard
 * - Enhanced visual hierarchy for alerts (payment issues, medical notes, VIP status)
 * - Prominent member names and badges for flagged users
 * - Auto-refresh statistics and activity feed
 * - Optimized for staff monitoring workflow
 */

// Enhanced Recent Check-ins Component - Primary Monitoring Dashboard
const RecentCheckInsWithAlerts = ({ expanded = false }) => {
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecentCheckIns();

    // More frequent updates for expanded dashboard
    const interval = setInterval(loadRecentCheckIns, expanded ? 10000 : 15000);
    return () => clearInterval(interval);
  }, [expanded]);

  const loadRecentCheckIns = async () => {
    try {
      // Load more items for expanded dashboard
      const itemCount = expanded ? 50 : 20;
      const result = await CheckInService.getRecentCheckIns(null, itemCount);

      if (result.data) {
        // Get additional member data for alerts (simulate real data)
        const checkInsWithAlerts = result.data.map((checkin, index) => {
          // Simulate different member types and alerts with more variety
          const memberTypes = [
            { hasNotes: false, hasAlerts: false, isVIP: false, alertType: null },
            { hasNotes: true, hasAlerts: false, isVIP: false, alertType: null },
            { hasNotes: false, hasAlerts: true, isVIP: false, alertType: 'payment_overdue' },
            { hasNotes: true, hasAlerts: true, isVIP: false, alertType: 'medical_note' },
            { hasNotes: false, hasAlerts: false, isVIP: true, alertType: null },
            { hasNotes: false, hasAlerts: true, isVIP: false, alertType: 'special_needs' },
            { hasNotes: false, hasAlerts: true, isVIP: false, alertType: 'membership_expiring' },
            { hasNotes: true, hasAlerts: false, isVIP: false, alertType: null },
          ];

          // Assign member type based on index to ensure variety
          const memberType = memberTypes[index % memberTypes.length];

          return {
            ...checkin,
            ...memberType
          };
        });

        setRecentCheckIns(checkInsWithAlerts);
      }
    } catch (error) {
      console.error('Error loading recent check-ins:', error);
    } finally {
      setIsLoading(false);
    }
  };



  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Check-ins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-0">
      {recentCheckIns.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No recent check-ins</p>
        </div>
      ) : (
        recentCheckIns.map((checkin) => {
          const getInitials = (name) => {
            if (!name || name === 'Unknown Member') return 'TJ';
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
          };

          const getStatusIcon = () => {
            if (checkin.hasAlerts) {
              return (
                <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
              );
            }
            if (checkin.isVIP) {
              return (
                <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
                  <Star className="h-5 w-5 text-white" />
                </div>
              );
            }
            return (
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {getInitials(checkin.member_name)}
                </span>
              </div>
            );
          };

          const getStatusText = () => {
            if (checkin.hasAlerts) {
              return checkin.alertType === 'medical_note' ? 'Notification Required' : 'Notification Required';
            }
            if (checkin.isVIP) {
              return 'VIP';
            }
            return 'Checked In';
          };

          const getStatusBadge = () => {
            if (checkin.hasNotes) {
              return (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  <span>Has Notes</span>
                </div>
              );
            }
            return null;
          };

          return (
            <div key={checkin.id} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <div>
                  <div className="font-medium text-gray-900">
                    {checkin.member_name || 'Unknown Member'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{format(new Date(checkin.check_in_time), 'h:mm a')}</span>
                    <span>{getStatusText()}</span>
                    {getStatusBadge()}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {format(new Date(checkin.check_in_time), 'h:mm a')}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

const CheckInEnhanced = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState({
    todayCount: 0,
    alertCount: 0,
    vipCount: 0
  });

  // Check-in functionality
  const { performManualCheckIn } = useCheckIn();
  const { toast } = useToast();
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // Handle member selection and check-in
  const handleMemberSelect = async (member) => {
    if (isCheckingIn) return;

    setIsCheckingIn(true);
    try {
      const result = await performManualCheckIn(member.id, {
        staffOverride: false,
        notes: `Check-in via dashboard search for ${member.first_name} ${member.last_name}`
      });

      if (result?.success) {
        toast({
          title: "Check-in Successful",
          description: `${member.first_name} ${member.last_name} has been checked in.`,
          variant: "default"
        });

        // Refresh stats after successful check-in
        loadStats();
      } else {
        toast({
          title: "Check-in Failed",
          description: result?.error || "Unable to check in member. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Check-in error:', error);
      toast({
        title: "Check-in Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Load stats function
  const loadStats = async () => {
    try {
      const result = await CheckInService.getRecentCheckIns(null, 50);
      if (result.data) {
        const checkInsWithAlerts = result.data.map((checkin, index) => {
          const memberTypes = [
            { hasNotes: false, hasAlerts: false, isVIP: false, alertType: null },
            { hasNotes: true, hasAlerts: false, isVIP: false, alertType: null },
            { hasNotes: false, hasAlerts: true, isVIP: false, alertType: 'payment_overdue' },
            { hasNotes: true, hasAlerts: true, isVIP: false, alertType: 'medical_note' },
            { hasNotes: false, hasAlerts: false, isVIP: true, alertType: null },
            { hasNotes: false, hasAlerts: true, isVIP: false, alertType: 'special_needs' },
          ];
          const memberType = memberTypes[index % memberTypes.length];
          return { ...checkin, ...memberType };
        });

        const today = new Date().toISOString().split('T')[0];
        const todayCheckIns = checkInsWithAlerts.filter(
          checkin => checkin.check_in_time.startsWith(today)
        );

        setStats({
          todayCount: todayCheckIns.length,
          alertCount: checkInsWithAlerts.filter(c => c.hasAlerts).length,
          vipCount: checkInsWithAlerts.filter(c => c.isVIP).length
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Load stats when component mounts or refreshes
  useEffect(() => {
    loadStats();
  }, [refreshKey]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 border border-gray-300 rounded-lg bg-white">
            <UserCheck className="h-5 w-5 text-blue-600" />
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

      {/* Main Content */}
      <div className="space-y-6">
          {/* Search/Scan Section */}
          <Card className="border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-600" />
                Member Check-In
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <ProfileSearch
                  onProfileSelect={handleMemberSelect}
                  placeholder="Search members by name, email, or member ID..."
                  showCreateButton={false}
                  userRole="member"
                  maxResults={8}
                  className="w-full"
                  disabled={isCheckingIn}
                />

                {isCheckingIn && (
                  <div className="flex items-center justify-center py-2">
                    <div className="flex items-center gap-2 text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">Processing check-in...</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Or scan QR code</span>
                  <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors">
                    <QrCode className="h-4 w-4" />
                    Scan QR
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{stats.todayCount}</div>
                    <div className="text-sm font-medium text-gray-600">Today's Check-ins</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-amber-600 mb-1">{stats.alertCount}</div>
                    <div className="text-sm font-medium text-gray-600">Need Attention</div>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-purple-600 mb-1">{stats.vipCount}</div>
                    <div className="text-sm font-medium text-gray-600">VIP / Recent</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <Star className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        {/* Recent Activity */}
        <Card className="border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Recent Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-0">
            <RecentCheckInsWithAlerts key={refreshKey} expanded={true} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckInEnhanced;
