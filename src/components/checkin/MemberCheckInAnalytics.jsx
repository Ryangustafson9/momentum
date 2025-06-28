/**
 * Member Check-In Analytics Component
 * Detailed analytics and insights for individual member check-in patterns
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Target,
  Award,
  RefreshCw,
  CheckCircle,
  Activity,
  Zap
} from 'lucide-react';
import { CheckInService } from '@/components/checkin';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';

const MemberCheckInAnalytics = ({ 
  memberId,
  memberName,
  timeRange = '30days',
  className = ''
}) => {
  const [analytics, setAnalytics] = useState({
    totalCheckIns: 0,
    averagePerWeek: 0,
    peakHours: [],
    peakDays: [],
    streaks: { current: 0, longest: 0 },
    trends: { weekly: 0, monthly: 0 },
    consistency: 0,
    lastVisit: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);

  useEffect(() => {
    if (memberId) {
      loadMemberAnalytics();
    }
  }, [memberId, selectedTimeRange]);

  const loadMemberAnalytics = async () => {
    if (!memberId) return;

    setIsLoading(true);
    try {
      // Calculate date range
      const now = new Date();
      let startDate, endDate = now;
      
      switch (selectedTimeRange) {
        case '7days':
          startDate = subDays(now, 7);
          break;
        case '30days':
          startDate = subDays(now, 30);
          break;
        case '90days':
          startDate = subDays(now, 90);
          break;
        case 'thisWeek':
          startDate = startOfWeek(now);
          endDate = endOfWeek(now);
          break;
        case 'thisMonth':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        default:
          startDate = subDays(now, 30);
      }

      // Get all check-ins for this member
      const result = await CheckInService.getRecentCheckIns(null, 1000);
      
      if (result.data) {
        const memberCheckIns = result.data
          .filter(checkin => 
            checkin.profile_id === memberId && 
            checkin.validation_status === 'valid' &&
            new Date(checkin.check_in_time) >= startDate &&
            new Date(checkin.check_in_time) <= endDate
          )
          .sort((a, b) => new Date(b.check_in_time) - new Date(a.check_in_time));

        calculateMemberAnalytics(memberCheckIns, startDate, endDate);
      }
    } catch (error) {
      console.error('Error loading member analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMemberAnalytics = (checkIns, startDate, endDate) => {
    const totalCheckIns = checkIns.length;
    
    // Calculate average per week
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const weeksDiff = Math.max(1, daysDiff / 7);
    const averagePerWeek = Math.round(totalCheckIns / weeksDiff * 10) / 10;

    // Peak hours analysis
    const hourCounts = {};
    checkIns.forEach(checkin => {
      const hour = new Date(checkin.check_in_time).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const peakHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
        label: format(new Date().setHours(parseInt(hour), 0, 0, 0), 'h:mm a')
      }));

    // Peak days analysis
    const dayCounts = {};
    checkIns.forEach(checkin => {
      const day = new Date(checkin.check_in_time).getDay();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const peakDays = Object.entries(dayCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([day, count]) => ({
        day: parseInt(day),
        count,
        label: dayNames[parseInt(day)]
      }));

    // Calculate streaks
    const checkInDates = [...new Set(checkIns.map(checkin => 
      new Date(checkin.check_in_time).toDateString()
    ))].sort((a, b) => new Date(b) - new Date(a));
    
    let currentStreak = 0;
    let longestStreak = 0;
    
    // Calculate current streak
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    if (checkInDates.includes(today)) {
      currentStreak = 1;
      // Count consecutive days backwards
      for (let i = 1; i < 30; i++) {
        const checkDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toDateString();
        if (checkInDates.includes(checkDate)) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else if (checkInDates.includes(yesterday)) {
      // Streak broken today, but count yesterday's streak
      currentStreak = 1;
      for (let i = 2; i < 30; i++) {
        const checkDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toDateString();
        if (checkInDates.includes(checkDate)) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak (simplified)
    longestStreak = Math.max(currentStreak, Math.ceil(checkInDates.length / 3));

    // Calculate consistency (percentage of days with check-ins)
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const daysWithCheckIns = checkInDates.length;
    const consistency = Math.round((daysWithCheckIns / totalDays) * 100);

    // Last visit
    const lastVisit = checkIns.length > 0 ? checkIns[0].check_in_time : null;

    // Trends (simplified)
    const midPoint = new Date(startDate.getTime() + (endDate - startDate) / 2);
    const firstHalf = checkIns.filter(checkin => new Date(checkin.check_in_time) < midPoint);
    const secondHalf = checkIns.filter(checkin => new Date(checkin.check_in_time) >= midPoint);
    
    const weeklyTrend = firstHalf.length > 0 
      ? Math.round(((secondHalf.length - firstHalf.length) / firstHalf.length) * 100)
      : secondHalf.length > 0 ? 100 : 0;

    setAnalytics({
      totalCheckIns,
      averagePerWeek,
      peakHours,
      peakDays,
      streaks: { current: currentStreak, longest: longestStreak },
      trends: { weekly: weeklyTrend, monthly: weeklyTrend },
      consistency,
      lastVisit
    });
  };

  const getTimeRangeLabel = (range) => {
    switch (range) {
      case '7days': return 'Last 7 Days';
      case '30days': return 'Last 30 Days';
      case '90days': return 'Last 90 Days';
      case 'thisWeek': return 'This Week';
      case 'thisMonth': return 'This Month';
      default: return 'Last 30 Days';
    }
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (trend < 0) return <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />;
    return <TrendingUp className="h-3 w-3 text-gray-600" />;
  };

  const getConsistencyColor = (consistency) => {
    if (consistency >= 80) return 'text-green-600 bg-green-50';
    if (consistency >= 60) return 'text-yellow-600 bg-yellow-50';
    if (consistency >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getConsistencyLabel = (consistency) => {
    if (consistency >= 80) return 'Excellent';
    if (consistency >= 60) return 'Good';
    if (consistency >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Member Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg"></div>
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {memberName} - Analytics
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="thisWeek">This Week</option>
              <option value="thisMonth">This Month</option>
            </select>
            <Button variant="ghost" size="sm" onClick={loadMemberAnalytics}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Total Visits</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{analytics.totalCheckIns}</div>
            <div className="flex items-center gap-1 text-xs text-blue-700">
              {getTrendIcon(analytics.trends.weekly)}
              <span className={getTrendColor(analytics.trends.weekly)}>
                {analytics.trends.weekly > 0 ? '+' : ''}{analytics.trends.weekly}%
              </span>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Weekly Avg</span>
            </div>
            <div className="text-2xl font-bold text-green-900">{analytics.averagePerWeek}</div>
            <div className="text-xs text-green-700">visits per week</div>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Current Streak</span>
            </div>
            <div className="text-2xl font-bold text-orange-900">{analytics.streaks.current}</div>
            <div className="text-xs text-orange-700">consecutive days</div>
          </div>

          <div className={`p-4 rounded-lg ${getConsistencyColor(analytics.consistency)}`}>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">Consistency</span>
            </div>
            <div className="text-2xl font-bold">{analytics.consistency}%</div>
            <div className="text-xs">{getConsistencyLabel(analytics.consistency)}</div>
          </div>
        </div>

        {/* Peak Times */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Favorite Times
            </h4>
            <div className="space-y-2">
              {analytics.peakHours.slice(0, 3).map((peak, index) => (
                <div key={peak.hour} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">{peak.label}</span>
                  <Badge variant="outline">{peak.count} visits</Badge>
                </div>
              ))}
              {analytics.peakHours.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No pattern data available
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Favorite Days
            </h4>
            <div className="space-y-2">
              {analytics.peakDays.slice(0, 3).map((peak, index) => (
                <div key={peak.day} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">{peak.label}</span>
                  <Badge variant="outline">{peak.count} visits</Badge>
                </div>
              ))}
              {analytics.peakDays.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No pattern data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Award className="h-4 w-4" />
            Achievements
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Award className="h-6 w-6 text-purple-600" />
              <div>
                <div className="font-medium text-purple-900">Best Streak</div>
                <div className="text-sm text-purple-700">{analytics.streaks.longest} days</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Zap className="h-6 w-6 text-blue-600" />
              <div>
                <div className="font-medium text-blue-900">Total Visits</div>
                <div className="text-sm text-blue-700">{analytics.totalCheckIns} check-ins</div>
              </div>
            </div>
            
            <div className={`flex items-center gap-3 p-3 rounded-lg ${getConsistencyColor(analytics.consistency)}`}>
              <Target className="h-6 w-6" />
              <div>
                <div className="font-medium">Consistency</div>
                <div className="text-sm">{getConsistencyLabel(analytics.consistency)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-2">Summary for {getTimeRangeLabel(selectedTimeRange)}</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• {analytics.totalCheckIns} total visits with {analytics.averagePerWeek} visits per week on average</p>
            <p>• Current streak of {analytics.streaks.current} days (best: {analytics.streaks.longest} days)</p>
            <p>• {analytics.consistency}% consistency rate - {getConsistencyLabel(analytics.consistency).toLowerCase()}</p>
            {analytics.lastVisit && (
              <p>• Last visit: {format(new Date(analytics.lastVisit), 'MMM d, yyyy \'at\' h:mm a')}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MemberCheckInAnalytics;
