/**
 * Check-in Analytics Page
 * Comprehensive analytics dashboard for check-in activity and insights
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  AlertTriangle,
  Download,
  Filter,
  Calendar,
  Target,
  Activity
} from 'lucide-react';
import StaffPageHeader from '@/components/staff/StaffPageHeader';
import StaffPageContainer from '@/components/staff/StaffPageContainer';
import { CheckInAnalyticsDashboard } from '@/components/checkin';
import RecentActivityFeed from '@/components/checkin/RecentActivityFeed';
import { supabase } from '@/lib/supabaseClient';

const CheckinAnalyticsPage = () => {
  const [membershipAnalytics, setMembershipAnalytics] = useState([]);
  const [validationIssues, setValidationIssues] = useState([]);
  const [hourlyPattern, setHourlyPattern] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDetailedAnalytics();
  }, []);

  const loadDetailedAnalytics = async () => {
    try {
      const [membershipData, validationData, hourlyData] = await Promise.all([
        getMembershipAnalytics(),
        getValidationIssues(),
        getHourlyPattern()
      ]);

      setMembershipAnalytics(membershipData);
      setValidationIssues(validationData);
      setHourlyPattern(hourlyData);
    } catch (error) {
      console.error('Error loading detailed analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMembershipAnalytics = async () => {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('checkin_history')
      .select(`
        profile_id,
        profiles!profile_id(
          memberships:memberships!user_id(
            membership_type:membership_types!membership_type_id(
              name,
              category,
              price
            )
          )
        )
      `)
      .gte('check_in_time', `${today}T00:00:00`)
      .lt('check_in_time', `${today}T23:59:59`);

    if (error) throw error;

    const breakdown = {};
    (data || []).forEach(checkin => {
      const membership = checkin.profiles?.memberships?.[0]?.membership_type;
      const type = membership?.name || 'No Membership';
      const category = membership?.category || 'None';
      const price = membership?.price || 0;
      
      if (!breakdown[type]) {
        breakdown[type] = { count: 0, category, price };
      }
      breakdown[type].count++;
    });

    return Object.entries(breakdown).map(([type, data]) => ({
      type,
      count: data.count,
      category: data.category,
      price: data.price,
      percentage: Math.round((data.count / (data?.length || 1)) * 100)
    })).sort((a, b) => b.count - a.count);
  };

  const getValidationIssues = async () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data, error } = await supabase
      .from('member_attendance')
      .select('validation_status, validation_reason, check_in_time')
      .gte('check_in_time', weekAgo.toISOString())
      .neq('validation_status', 'valid');

    if (error) throw error;

    const issues = {};
    (data || []).forEach(checkin => {
      const reason = checkin.validation_reason || 'unknown';
      if (!issues[reason]) {
        issues[reason] = { count: 0, recent: [] };
      }
      issues[reason].count++;
      if (issues[reason].recent.length < 3) {
        issues[reason].recent.push(checkin.check_in_time);
      }
    });

    return Object.entries(issues)
      .map(([reason, data]) => ({
        reason: reason.replace(/_/g, ' '),
        count: data.count,
        recent: data.recent
      }))
      .sort((a, b) => b.count - a.count);
  };

  const getHourlyPattern = async () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('checkin_history')
      .select('check_in_time')
      .gte('check_in_time', weekAgo.toISOString());

    if (error) throw error;

    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const hourCheckins = (data || []).filter(c => {
        const checkInHour = new Date(c.check_in_time).getHours();
        return checkInHour === hour;
      });
      return {
        hour: `${hour}:00`,
        count: hourCheckins.length,
        percentage: 0
      };
    });

    const maxCount = Math.max(...hourlyData.map(h => h.count));
    hourlyData.forEach(h => {
      h.percentage = maxCount > 0 ? (h.count / maxCount) * 100 : 0;
    });

    return hourlyData;
  };

  const exportData = () => {
    // Data export functionality not yet implemented
    alert('Data export feature coming soon!');
  };

  return (
    <StaffPageContainer>
      <StaffPageHeader
        title="Check-in Analytics"
        description="Comprehensive insights into member check-in patterns and facility usage"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Main Analytics Dashboard */}
        <CheckInAnalyticsDashboard showDetailedStats={true} />

        {/* Detailed Analytics Tabs */}
        <Tabs defaultValue="patterns" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="patterns">Usage Patterns</TabsTrigger>
            <TabsTrigger value="memberships">Membership Breakdown</TabsTrigger>
            <TabsTrigger value="issues">Validation Issues</TabsTrigger>
            <TabsTrigger value="activity">Live Activity</TabsTrigger>
          </TabsList>

          {/* Usage Patterns Tab */}
          <TabsContent value="patterns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Hourly Usage Pattern (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {hourlyPattern.map((hour, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-16 text-sm font-medium text-gray-600">
                          {hour.hour}
                        </div>
                        <div className="flex-1 bg-gray-100 rounded-full h-6 relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${hour.percentage}%` }}
                            transition={{ duration: 0.5, delay: index * 0.05 }}
                            className="bg-blue-500 h-full rounded-full flex items-center justify-end pr-2"
                          >
                            {hour.count > 0 && (
                              <span className="text-xs text-white font-medium">
                                {hour.count}
                              </span>
                            )}
                          </motion.div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Membership Breakdown Tab */}
          <TabsContent value="memberships" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Today's Check-ins by Membership Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                      </div>
                    ))}
                  </div>
                ) : membershipAnalytics.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No check-ins today</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {membershipAnalytics.map((membership, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium text-gray-900">
                              {membership.type}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {membership.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            ${membership.price}/month
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">
                            {membership.count}
                          </p>
                          <p className="text-xs text-gray-500">
                            {membership.percentage}% of total
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Validation Issues Tab */}
          <TabsContent value="issues" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Common Validation Issues (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : validationIssues.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No validation issues this week</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {validationIssues.map((issue, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="p-4 border border-red-200 bg-red-50 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-red-900 capitalize">
                            {issue.reason}
                          </h3>
                          <Badge variant="destructive" className="text-xs">
                            {issue.count} occurrences
                          </Badge>
                        </div>
                        <p className="text-sm text-red-700">
                          Most recent: {new Date(issue.recent[0]).toLocaleString()}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <RecentActivityFeed
              maxItems={20}
              refreshInterval={15000}
              showStats={true}
            />
          </TabsContent>
        </Tabs>
      </div>
    </StaffPageContainer>
  );
};

export default CheckinAnalyticsPage;
