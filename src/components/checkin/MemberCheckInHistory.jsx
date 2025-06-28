/**
 * Member Check-In History Component
 * Displays recent check-in activity for a specific member
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Calendar, 
  MapPin, 
  User, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Eye
} from 'lucide-react';
import { CheckInService } from '@/components/checkin';
import { format, formatDistanceToNow, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

const MemberCheckInHistory = ({ 
  memberId, 
  memberName,
  maxItems = 10,
  showStats = true,
  className = '',
  onViewAll = null
}) => {
  const [checkIns, setCheckIns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    thisWeek: 0,
    thisMonth: 0,
    averagePerWeek: 0,
    lastVisit: null
  });

  useEffect(() => {
    if (memberId) {
      loadCheckInHistory();
    }
  }, [memberId, maxItems]);

  const loadCheckInHistory = async () => {
    if (!memberId) return;

    setIsLoading(true);
    try {
      // Get recent check-ins for this member
      const result = await CheckInService.getRecentCheckIns(null, 100);
      
      if (result.data) {
        // Filter for this specific member and successful check-ins
        const memberCheckIns = result.data
          .filter(checkin => 
            checkin.profile_id === memberId && 
            checkin.validation_status === 'valid'
          )
          .slice(0, maxItems);
        
        setCheckIns(memberCheckIns);
        calculateStats(result.data.filter(checkin => 
          checkin.profile_id === memberId && 
          checkin.validation_status === 'valid'
        ));
      }
    } catch (error) {
      console.error('Error loading check-in history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (allCheckIns) => {
    if (!allCheckIns.length) {
      setStats({ thisWeek: 0, thisMonth: 0, averagePerWeek: 0, lastVisit: null });
      return;
    }

    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // This week's check-ins
    const thisWeekCheckIns = allCheckIns.filter(checkin => 
      isWithinInterval(new Date(checkin.check_in_time), { start: weekStart, end: weekEnd })
    );

    // This month's check-ins
    const thisMonthCheckIns = allCheckIns.filter(checkin => 
      new Date(checkin.check_in_time) >= monthStart
    );

    // Calculate average per week (last 4 weeks)
    const fourWeeksAgo = new Date(now.getTime() - (4 * 7 * 24 * 60 * 60 * 1000));
    const recentCheckIns = allCheckIns.filter(checkin => 
      new Date(checkin.check_in_time) >= fourWeeksAgo
    );
    const averagePerWeek = Math.round(recentCheckIns.length / 4);

    // Last visit
    const lastVisit = allCheckIns.length > 0 ? allCheckIns[0].check_in_time : null;

    setStats({
      thisWeek: thisWeekCheckIns.length,
      thisMonth: thisMonthCheckIns.length,
      averagePerWeek,
      lastVisit
    });
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'qr_code': return '📱';
      case 'access_card': return '💳';
      case 'manual': return '👤';
      default: return '✓';
    }
  };

  const getMethodColor = (method) => {
    switch (method) {
      case 'qr_code': return 'bg-blue-100 text-blue-800';
      case 'access_card': return 'bg-green-100 text-green-800';
      case 'manual': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Check-In History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
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
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Check-In History
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadCheckInHistory}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {onViewAll && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewAll}
              >
                <Eye className="h-4 w-4 mr-1" />
                View All
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats Summary */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{stats.thisWeek}</div>
              <div className="text-xs text-gray-600">This Week</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{stats.thisMonth}</div>
              <div className="text-xs text-gray-600">This Month</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{stats.averagePerWeek}</div>
              <div className="text-xs text-gray-600">Avg/Week</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {stats.lastVisit ? formatDistanceToNow(new Date(stats.lastVisit), { addSuffix: true }).replace('about ', '') : 'Never'}
              </div>
              <div className="text-xs text-gray-600">Last Visit</div>
            </div>
          </div>
        )}

        {/* Check-In List */}
        {checkIns.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No Check-Ins Found</p>
            <p className="text-sm">This member hasn't checked in recently</p>
          </div>
        ) : (
          <div className="space-y-3">
            {checkIns.map((checkin, index) => (
              <motion.div
                key={checkin.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* Method Icon */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg">{getMethodIcon(checkin.check_in_method)}</span>
                  </div>
                </div>

                {/* Check-In Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">
                      {format(new Date(checkin.check_in_time), 'MMM d, yyyy')}
                    </p>
                    <Badge className={getMethodColor(checkin.check_in_method)}>
                      {checkin.check_in_method?.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(checkin.check_in_time), 'h:mm a')}</span>
                    </div>
                    
                    {checkin.location_name && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{checkin.location_name}</span>
                      </div>
                    )}
                    
                    {checkin.staff_member_name && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{checkin.staff_member_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* View More */}
        {checkIns.length >= maxItems && (
          <div className="text-center pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewAll}
              className="text-xs"
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              View Complete History
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberCheckInHistory;
