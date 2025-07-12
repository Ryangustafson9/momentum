/**
 * Recent Activity Feed Component
 * Real-time check-in activity sidebar with member photos and status
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Clock, 
  User, 
  CheckCircle, 
  AlertTriangle, 
  Activity,
  TrendingUp,
  Users
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const RecentActivityFeed = ({
  className = '',
  maxItems = 10,
  refreshInterval = 30000,
  showStats = true,
  showHeader = true
}) => {
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({
    todayTotal: 0,
    successRate: 0,
    peakHour: null
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecentActivity();

    if (showStats) {
      loadTodayStats();
    }

    // Set up periodic refresh
    const interval = setInterval(() => {
      loadRecentActivity();
      if (showStats) loadTodayStats();
    }, refreshInterval);

    // Listen for real-time check-in events
    const handleCheckInUpdate = (event) => {
      console.log('Check-in event received:', event.detail);

      // Optimistic update - add the new check-in immediately
      const newActivity = {
        id: event.detail.checkinRecord?.id || `temp-${Date.now()}`,
        profile_id: event.detail.member?.id,
        check_in_time: event.detail.timestamp || new Date().toISOString(),
        check_in_method: 'manual',
        validation_status: 'valid',
        profile: {
          id: event.detail.member?.id,
          first_name: event.detail.member?.first_name,
          last_name: event.detail.member?.last_name,
          profile_picture_url: event.detail.member?.profile_picture_url,
          system_member_id: event.detail.member?.system_member_id
        }
      };

      // Add to the beginning of the activities list
      setActivities(prev => [newActivity, ...prev.slice(0, maxItems - 1)]);

      // Also refresh from database to ensure consistency
      setTimeout(() => {
        loadRecentActivity();
        if (showStats) loadTodayStats();
      }, 1000);
    };

    // Add event listener for check-in updates
    window.addEventListener('checkin-success', handleCheckInUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('checkin-success', handleCheckInUpdate);
    };
  }, [maxItems, refreshInterval, showStats]);

  const loadRecentActivity = async () => {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('checkin_history')
        .select(`
          *,
          profile:profiles!profile_id(
            id,
            first_name,
            last_name,
            profile_picture_url,
            system_member_id,
            status,
            memberships(
              status
            )
          )
        `)
        .gte('check_in_time', `${today}T00:00:00`)
        .lt('check_in_time', `${today}T23:59:59`)
        .order('check_in_time', { ascending: false })
        .limit(maxItems);

      if (error) throw error;

      setActivities(data || []);
    } catch (error) {
      console.error('Error loading recent activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('checkin_history')
        .select('*')
        .gte('check_in_time', `${today}T00:00:00`)
        .lt('check_in_time', `${today}T23:59:59`);

      if (error) throw error;

      const todayCheckIns = data || [];
      const successful = todayCheckIns.filter(a => a.validation_status === 'valid').length;
      const successRate = todayCheckIns.length > 0 ? (successful / todayCheckIns.length) * 100 : 0;

      // Calculate peak hour
      const hourCounts = {};
      todayCheckIns.forEach(activity => {
        const hour = new Date(activity.check_in_time).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      const peakHour = Object.keys(hourCounts).reduce((a, b) => 
        hourCounts[a] > hourCounts[b] ? a : b, null
      );

      setStats({
        todayTotal: todayCheckIns.length,
        successRate: Math.round(successRate),
        peakHour: peakHour ? `${peakHour}:00` : null
      });
    } catch (error) {
      console.error('Error loading today stats:', error);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return formatTime(timestamp);
  };

  const getStatusColor = (userStatus, memberships) => {
    // Check if user has any active memberships
    const hasActiveMembership = memberships && memberships.length > 0 &&
      memberships.some(m => m.status === 'active');

    // If no active membership, treat as guest regardless of user status
    if (!hasActiveMembership) {
      return 'bg-gray-100 text-gray-800 border-gray-200'; // Guest styling
    }

    // Get the first active membership status, or first membership status
    const activeMembership = memberships.find(m => m.status === 'active');
    const membershipStatus = activeMembership ? activeMembership.status : memberships[0].status;

    // For members, use membership status; for non-members, always guest
    const primaryStatus = membershipStatus;

    const colors = {
      // User statuses
      'active': 'bg-green-100 text-green-800 border-green-200',
      'suspended': 'bg-red-100 text-red-800 border-red-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200',
      'expired': 'bg-red-100 text-red-800 border-red-200',
      'frozen': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'guest': 'bg-gray-100 text-gray-800 border-gray-200',
      'archived': 'bg-gray-100 text-gray-800 border-gray-200',

      // Membership statuses
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'on hold': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'staff': 'bg-blue-100 text-blue-800 border-blue-200',

      // Validation statuses (fallback)
      'valid': 'bg-green-100 text-green-800 border-green-200',
      'invalid': 'bg-red-100 text-red-800 border-red-200',
      'warning': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };

    return colors[primaryStatus.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getActivityItemColor = (userStatus, memberships, isNew) => {
    if (isNew) return 'bg-green-50 border border-green-200 shadow-sm';

    // Check if user has any active memberships
    const hasActiveMembership = memberships && memberships.length > 0 &&
      memberships.some(m => m.status === 'active');

    // If no active membership, treat as guest regardless of user status
    if (!hasActiveMembership) {
      return 'bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300'; // Guest styling
    }

    // Get the first active membership status, or first membership status
    const activeMembership = memberships.find(m => m.status === 'active');
    const membershipStatus = activeMembership ? activeMembership.status : memberships[0].status;
    const primaryStatus = membershipStatus;

    const colors = {
      'active': 'bg-green-50 hover:bg-green-100 border border-green-200 hover:border-green-300',
      'suspended': 'bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300',
      'cancelled': 'bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300',
      'expired': 'bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300',
      'frozen': 'bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 hover:border-yellow-300',
      'on hold': 'bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 hover:border-yellow-300',
      'pending': 'bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 hover:border-yellow-300',
      'staff': 'bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300',
      'guest': 'bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300',
      'archived': 'bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300'
    };

    return colors[primaryStatus.toLowerCase()] || 'bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-200';
  };

  const getStatusIconColor = (userStatus, memberships) => {
    // Check if user has any active memberships
    const hasActiveMembership = memberships && memberships.length > 0 &&
      memberships.some(m => m.status === 'active');

    // If no active membership, treat as guest regardless of user status
    if (!hasActiveMembership) {
      return 'text-gray-500'; // Guest styling
    }

    // Get the first active membership status, or first membership status
    const activeMembership = memberships.find(m => m.status === 'active');
    const membershipStatus = activeMembership ? activeMembership.status : memberships[0].status;
    const primaryStatus = membershipStatus;

    const colors = {
      'active': 'text-green-500',
      'suspended': 'text-red-500',
      'cancelled': 'text-red-500',
      'expired': 'text-red-500',
      'frozen': 'text-yellow-500',
      'on hold': 'text-yellow-500',
      'pending': 'text-yellow-500',
      'staff': 'text-blue-500',
      'guest': 'text-gray-500',
      'archived': 'text-gray-500'
    };

    return colors[primaryStatus.toLowerCase()] || 'text-gray-500';
  };

  const getStatusIcon = (status) => {
    return status === 'valid' ? CheckCircle : AlertTriangle;
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
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
    <Card className={`${className} border border-gray-200`}>
      {showHeader && (
        <CardHeader className="pb-4 border-b border-gray-200">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>

          {/* Quick Stats */}
          {showStats && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center p-2 bg-blue-50 rounded">
                <p className="text-lg font-bold text-blue-600">{stats.todayTotal}</p>
                <p className="text-xs text-blue-700">Today</p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <p className="text-lg font-bold text-green-600">{stats.successRate}%</p>
                <p className="text-xs text-green-700">Success</p>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded">
                <p className="text-lg font-bold text-purple-600">{stats.peakHour || '--'}</p>
                <p className="text-xs text-purple-700">Peak</p>
              </div>
            </div>
          )}
        </CardHeader>
      )}
      
      <CardContent className={`${showHeader ? "pt-4" : "pt-6"} pb-4`}>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No check-ins today</p>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto border border-gray-100 rounded-lg p-3 bg-gray-50/30" style={{ maxHeight: '400px' }}>
            <AnimatePresence>
              {activities.map((activity, index) => {
                const StatusIcon = getStatusIcon(activity.validation_status);
                const isNew = activity.id?.toString().startsWith('temp-');

                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.95 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 300,
                      damping: 25
                    }}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                      getActivityItemColor(activity.profile?.status, activity.profile?.memberships, isNew)
                    }`}
                  >
                    {/* Member Avatar */}
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                      <AvatarImage src={activity.profile?.profile_picture_url} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(activity.profile?.first_name, activity.profile?.last_name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Activity Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate">
                          {activity.profile?.first_name} {activity.profile?.last_name}
                        </p>
                        <StatusIcon className={`h-3 w-3 ${getStatusIconColor(activity.profile?.status, activity.profile?.memberships)}`} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          {formatRelativeTime(activity.check_in_time)}
                        </p>
                        <Badge
                          className={`text-xs ${getStatusColor(activity.profile?.status, activity.profile?.memberships)}`}
                        >
                          {(() => {
                            const memberships = activity.profile?.memberships;
                            const hasActiveMembership = memberships && memberships.length > 0 &&
                              memberships.some(m => m.status === 'active');

                            if (!hasActiveMembership) {
                              return 'Guest';
                            }

                            const activeMembership = memberships.find(m => m.status === 'active');
                            return activeMembership ? activeMembership.status : memberships[0].status;
                          })()}
                        </Badge>
                      </div>
                      
                      {activity.profile?.system_member_id && (
                        <p className="text-xs text-gray-400 font-mono">
                          #{activity.profile.system_member_id}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivityFeed;
