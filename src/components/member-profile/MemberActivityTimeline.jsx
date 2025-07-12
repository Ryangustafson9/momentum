import React, { useState, useEffect } from 'react';
import { Clock, UserCheck, CreditCard, Edit, UserPlus, Calendar, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';

const MemberActivityTimeline = ({ memberId, memberData }) => {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (memberId) {
      loadMemberActivities();
    }
  }, [memberId]);

  const loadMemberActivities = async () => {
    try {
      setIsLoading(true);
      
      // Combine multiple activity sources
      const [checkIns, membershipChanges, profileUpdates] = await Promise.all([
        loadCheckInActivities(),
        loadMembershipActivities(),
        loadProfileActivities()
      ]);

      // Combine and sort all activities
      const allActivities = [
        ...checkIns,
        ...membershipChanges,
        ...profileUpdates
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setActivities(allActivities);
    } catch (error) {
      console.error('Error loading member activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCheckInActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('checkin_history')
        .select('*')
        .eq('profile_id', memberId)
        .order('check_in_time', { ascending: false })
        .limit(10);

      if (error) throw error;

      return (data || []).map(checkIn => ({
        id: `checkin-${checkIn.id}`,
        type: 'check_in',
        title: 'Checked In',
        description: checkIn.location_id ? `At location ${checkIn.location_id}` : 'Gym check-in',
        timestamp: checkIn.check_in_time,
        icon: UserCheck,
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      }));
    } catch (error) {
      console.warn('Could not load check-in activities:', error);
      return [];
    }
  };

  const loadMembershipActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('memberships')
        .select(`
          *,
          membership_type:membership_types(name)
        `)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      return (data || []).map(membership => ({
        id: `membership-${membership.id}`,
        type: 'membership',
        title: 'Membership Updated',
        description: `${membership.membership_type?.name || 'Membership'} - ${membership.status}`,
        timestamp: membership.updated_at || membership.created_at,
        icon: CreditCard,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      }));
    } catch (error) {
      console.warn('Could not load membership activities:', error);
      return [];
    }
  };

  const loadProfileActivities = async () => {
    // Create synthetic activities based on profile data
    const activities = [];

    if (memberData?.created_at) {
      activities.push({
        id: 'profile-created',
        type: 'profile_created',
        title: 'Profile Created',
        description: 'Member account was created',
        timestamp: memberData.created_at,
        icon: UserPlus,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100'
      });
    }

    if (memberData?.updated_at && memberData.updated_at !== memberData.created_at) {
      activities.push({
        id: 'profile-updated',
        type: 'profile_updated',
        title: 'Profile Updated',
        description: 'Member information was modified',
        timestamp: memberData.updated_at,
        icon: Edit,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100'
      });
    }

    return activities;
  };

  const getActivityIcon = (activity) => {
    const IconComponent = activity.icon;
    return <IconComponent className={`h-4 w-4 ${activity.color}`} />;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  const displayedActivities = showAll ? activities : activities.slice(0, 5);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
          <Badge variant="secondary" className="ml-auto">
            {activities.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No recent activity found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedActivities.map((activity, index) => (
              <div key={activity.id} className="flex items-start space-x-3">
                {/* Timeline connector */}
                <div className="relative">
                  <div className={`w-8 h-8 rounded-full ${activity.bgColor} flex items-center justify-center`}>
                    {getActivityIcon(activity)}
                  </div>
                  {index < displayedActivities.length - 1 && (
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-0.5 h-6 bg-gray-200"></div>
                  )}
                </div>

                {/* Activity content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.description}
                  </p>
                </div>
              </div>
            ))}

            {/* Show More/Less Button */}
            {activities.length > 5 && (
              <div className="text-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {showAll ? 'Show Less' : `Show ${activities.length - 5} More`}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberActivityTimeline;
