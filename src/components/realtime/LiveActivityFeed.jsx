/**
 * 📊 LIVE ACTIVITY FEED
 * Real-time activity feed showing gym activities
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Activity, 
  UserPlus, 
  Calendar, 
  CreditCard, 
  Clock,
  TrendingUp,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

const LiveActivityFeed = ({ 
  activities = [], 
  maxItems = 10,
  showTimestamps = true,
  className = ''
}) => {
  const [displayActivities, setDisplayActivities] = useState([]);

  useEffect(() => {
    // Sort activities by timestamp and limit display
    const sortedActivities = [...activities]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, maxItems);
    
    setDisplayActivities(sortedActivities);
  }, [activities, maxItems]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'check-in':
      case 'check-out':
        return Activity;
      case 'member-join':
        return UserPlus;
      case 'class-booking':
        return Calendar;
      case 'payment':
        return CreditCard;
      case 'staff-login':
        return Users;
      default:
        return TrendingUp;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'check-in':
        return 'text-green-600 bg-green-100';
      case 'check-out':
        return 'text-blue-600 bg-blue-100';
      case 'member-join':
        return 'text-purple-600 bg-purple-100';
      case 'class-booking':
        return 'text-orange-600 bg-orange-100';
      case 'payment':
        return 'text-emerald-600 bg-emerald-100';
      case 'staff-login':
        return 'text-indigo-600 bg-indigo-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now - activityTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return activityTime.toLocaleDateString();
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <TrendingUp className="h-4 w-4" />
          Live Activity
          <Badge variant="secondary" className="ml-auto">
            {displayActivities.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        {displayActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {displayActivities.map((activity, index) => {
                const IconComponent = getActivityIcon(activity.type);
                const colorClasses = getActivityColor(activity.type);
                
                return (
                  <motion.div
                    key={`${activity.id}-${activity.timestamp}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ 
                      duration: 0.3,
                      delay: index * 0.05 
                    }}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {/* Activity Icon */}
                    <div className={cn(
                      'flex-shrink-0 p-2 rounded-full',
                      colorClasses
                    )}>
                      <IconComponent className="h-4 w-4" />
                    </div>

                    {/* Activity Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          {/* User info */}
                          {activity.user && (
                            <div className="flex items-center gap-2 mb-1">
                              <Avatar className="h-6 w-6">
                                <AvatarImage 
                                  src={activity.user.avatar} 
                                  alt={activity.user.name} 
                                />
                                <AvatarFallback className="text-xs">
                                  {getInitials(activity.user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">
                                {activity.user.name}
                              </span>
                            </div>
                          )}

                          {/* Activity description */}
                          <p className="text-sm text-muted-foreground">
                            {activity.description}
                          </p>

                          {/* Additional details */}
                          {activity.details && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {Object.entries(activity.details).map(([key, value]) => (
                                <Badge 
                                  key={key}
                                  variant="outline" 
                                  className="text-xs"
                                >
                                  {key}: {value}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Timestamp */}
                        {showTimestamps && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(activity.timestamp)}
                          </div>
                        )}
                      </div>
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

export default LiveActivityFeed;

