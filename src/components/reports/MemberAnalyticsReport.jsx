import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, UserMinus, TrendingUp, Calendar, Download, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast.js';
import { supabase } from '@/lib/supabaseClient';
import { LoadingSpinner } from '@/shared/components/LoadingStates';

const StatCard = ({ title, value, change, changeType, icon, color }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {change && (
            <div className={`flex items-center gap-1 mt-1 ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
              {changeType === 'positive' ? <TrendingUp className="h-3 w-3" /> : <UserMinus className="h-3 w-3" />}
              <span className="text-xs">{change}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'expired': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <Badge className={`${getStatusColor(status)} border-0`}>
      {status || 'Unknown'}
    </Badge>
  );
};

const MemberAnalyticsReport = () => {
  const [analyticsData, setAnalyticsData] = useState({
    membershipDistribution: [],
    statusDistribution: [],
    recentActivity: [],
    summary: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const { toast } = useToast();

  const fetchAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      // Fetch all memberships with member and type data
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('memberships')
        .select(`
          *,
          profiles(id, email, created_at, first_name, last_name),
          membership_types(id, name, category, price)
        `)
        .order('join_date', { ascending: false });

      if (membershipsError) {
        throw new Error(`Failed to fetch analytics data: ${membershipsError.message}`);
      }

      // Process membership distribution by type
      const membershipDistribution = {};
      const statusDistribution = {};
      let totalMembers = 0;
      let activeMembers = 0;
      let newMembersInPeriod = 0;

      (membershipsData || []).forEach(membership => {
        const typeName = membership.membership_types.name;
        const status = membership.status;
        const createdDate = new Date(membership.join_date);

        // Count by membership type
        if (!membershipDistribution[typeName]) {
          membershipDistribution[typeName] = {
            name: typeName,
            category: membership.membership_types.category,
            count: 0,
            revenue: 0
          };
        }
        membershipDistribution[typeName].count += 1;
        membershipDistribution[typeName].revenue += membership.membership_types.price || 0;

        // Count by status
        statusDistribution[status] = (statusDistribution[status] || 0) + 1;

        // Count totals
        totalMembers += 1;
        if (status === 'active') activeMembers += 1;
        if (createdDate >= startDate) newMembersInPeriod += 1;
      });

      // Get recent activity (new memberships in time period)
      const recentActivity = (membershipsData || [])
        .filter(m => new Date(m.join_date) >= startDate)
        .slice(0, 10)
        .map(m => ({
          id: m.id,
          memberEmail: m.profiles?.email || 'N/A',
          memberName: m.profiles?.first_name && m.profiles?.last_name
            ? `${m.profiles.first_name} ${m.profiles.last_name}`
            : m.profiles?.email || 'N/A',
          membershipType: m.membership_types?.name || 'N/A',
          status: m.status,
          joinDate: m.join_date,
          price: m.membership_types?.price || 0
        }));

      setAnalyticsData({
        membershipDistribution: Object.values(membershipDistribution),
        statusDistribution: Object.entries(statusDistribution).map(([status, count]) => ({
          status,
          count
        })),
        recentActivity,
        summary: {
          totalMembers,
          activeMembers,
          newMembersInPeriod,
          retentionRate: totalMembers > 0 ? ((activeMembers / totalMembers) * 100).toFixed(1) : 0
        }
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch analytics data: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, toast]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading member analytics..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Member Analytics
          </h2>
          <p className="text-muted-foreground">
            Comprehensive member statistics and trends analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Members"
          value={analyticsData.summary.totalMembers}
          icon={<Users className="h-5 w-5 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Members"
          value={analyticsData.summary.activeMembers}
          icon={<UserPlus className="h-5 w-5 text-white" />}
          color="bg-green-500"
        />
        <StatCard
          title="New Members"
          value={analyticsData.summary.newMembersInPeriod}
          icon={<TrendingUp className="h-5 w-5 text-white" />}
          color="bg-purple-500"
        />
        <StatCard
          title="Retention Rate"
          value={`${analyticsData.summary.retentionRate}%`}
          icon={<BarChart3 className="h-5 w-5 text-white" />}
          color="bg-orange-500"
        />
      </div>

      {/* Membership Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Membership Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.membershipDistribution.map((item, index) => {
                const percentage = analyticsData.summary.totalMembers > 0 
                  ? ((item.count / analyticsData.summary.totalMembers) * 100).toFixed(1)
                  : 0;
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{item.count} members</p>
                      <p className="text-sm text-muted-foreground">{percentage}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Member Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.statusDistribution.map((item, index) => {
                const percentage = analyticsData.summary.totalMembers > 0 
                  ? ((item.count / analyticsData.summary.totalMembers) * 100).toFixed(1)
                  : 0;
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={item.status} />
                      <span className="font-medium capitalize">{item.status}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{item.count}</p>
                      <p className="text-sm text-muted-foreground">{percentage}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Member Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {analyticsData.recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No recent activity</h3>
              <p className="text-muted-foreground">
                No new member activity in the selected time period.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Membership Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead className="text-right">Monthly Fee</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData.recentActivity.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{activity.memberName}</div>
                          <div className="text-sm text-muted-foreground">{activity.memberEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{activity.membershipType}</TableCell>
                      <TableCell>
                        <StatusBadge status={activity.status} />
                      </TableCell>
                      <TableCell>{formatDate(activity.joinDate)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(activity.price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MemberAnalyticsReport;
