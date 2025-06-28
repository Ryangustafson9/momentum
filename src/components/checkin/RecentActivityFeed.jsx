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
  showStats = true 
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

    return () => clearInterval(interval);
  }, [maxItems, refreshInterval, showStats]);

  const loadRecentActivity = async () => {
    try {
      const { data, error } = await supabase
        .from('member_attendance')
        .select(`
          *,
          profile:profiles!profile_id(
            id,
            first_name,
            last_name,
            profile_picture_url,
            system_member_id
          )
        `)
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
        .from('member_attendance')
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

  const getStatusColor = (status) => {
    const colors = {
      valid: 'bg-green-100 text-green-800 border-green-200',
      invalid: 'bg-red-100 text-red-800 border-red-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[status] || colors.invalid;
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
    <Card className={className}>
      <CardHeader className="pb-4">
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
      
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {activities.map((activity, index) => {
                const StatusIcon = getStatusIcon(activity.validation_status);
                
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
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
                        <StatusIcon className={`h-3 w-3 ${
                          activity.validation_status === 'valid' ? 'text-green-500' : 'text-red-500'
                        }`} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          {formatRelativeTime(activity.check_in_time)}
                        </p>
                        <Badge 
                          className={`text-xs ${getStatusColor(activity.validation_status)}`}
                        >
                          {activity.validation_status}
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
