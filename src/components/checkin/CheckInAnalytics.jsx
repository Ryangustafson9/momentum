import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Note: DatePickerWithRange and recharts removed to avoid dependencies
// Using simple date inputs and basic charts instead
import { 
  TrendingUp, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  Download,
  Filter
} from 'lucide-react';
import CheckInService from '@/services/checkinService';
// Using basic date functions instead of date-fns

/**
 * Check-In Analytics Dashboard
 * Comprehensive analytics and reporting for check-in data
 */
const CheckInAnalytics = ({
  locationId = null,
  className = ''
}) => {
  // Helper function to get date 30 days ago
  const getDateDaysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  };

  const [dateRange, setDateRange] = useState({
    from: getDateDaysAgo(30),
    to: new Date().toISOString().split('T')[0]
  });
  const [selectedMetric, setSelectedMetric] = useState('daily');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [summaryStats, setSummaryStats] = useState({
    totalCheckIns: 0,
    uniqueMembers: 0,
    averageDaily: 0,
    successRate: 0
  });

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, locationId]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const startDate = dateRange.from;
      const endDate = dateRange.to;

      // Get detailed check-in data for calculations
      const checkInsResult = await CheckInService.getRecentCheckIns(locationId, 1000);

      if (checkInsResult.data) {
        // Calculate summary statistics
        const checkIns = checkInsResult.data.filter(checkin => {
          const checkinDate = checkin.check_in_time.split('T')[0]; // Get date part
          return checkinDate >= startDate && checkinDate <= endDate;
        });

        const uniqueMembers = new Set(checkIns.map(c => c.profile_id)).size;
        const totalCheckIns = checkIns.length;
        const validCheckIns = checkIns.filter(c => c.validation_status === 'valid').length;

        // Calculate days difference
        const fromDate = new Date(startDate);
        const toDate = new Date(endDate);
        const daysDiff = Math.max(1, Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)));

        setSummaryStats({
          totalCheckIns,
          uniqueMembers,
          averageDaily: Math.round(totalCheckIns / daysDiff),
          successRate: totalCheckIns > 0 ? Math.round((validCheckIns / totalCheckIns) * 100) : 0
        });

        // Group data by method for simple analytics
        const methodCounts = checkIns.reduce((acc, checkin) => {
          const method = checkin.check_in_method || 'manual';
          acc[method] = (acc[method] || 0) + 1;
          return acc;
        }, {});

        setAnalyticsData(methodCounts);
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = () => {
    if (!analyticsData) return;

    // Create simple CSV content
    const headers = ['Check-in Method', 'Count'];
    const csvContent = [
      headers.join(','),
      ...Object.entries(analyticsData).map(([method, count]) => [
        method.replace('_', ' '),
        count
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checkin-analytics-${dateRange.from}-to-${dateRange.to}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getMethodDistribution = () => {
    if (!analyticsData) return [];

    return Object.entries(analyticsData).map(([method, count]) => ({
      name: method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
      percentage: Math.round((count / summaryStats.totalCheckIns) * 100)
    }));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Check-In Analytics
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportData} disabled={!analyticsData}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="px-3 py-2 border rounded-md"
                />
                <span className="self-center">to</span>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily Check-ins</SelectItem>
                <SelectItem value="unique">Unique Members</SelectItem>
                <SelectItem value="success_rate">Success Rate</SelectItem>
                <SelectItem value="methods">Check-in Methods</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold text-green-600">{summaryStats.totalCheckIns}</p>
            <p className="text-sm text-gray-600">Total Check-ins</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-blue-600">{summaryStats.uniqueMembers}</p>
            <p className="text-sm text-gray-600">Unique Members</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-purple-600">{summaryStats.averageDaily}</p>
            <p className="text-sm text-gray-600">Daily Average</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto text-orange-500 mb-2" />
            <p className="text-2xl font-bold text-orange-600">{summaryStats.successRate}%</p>
            <p className="text-sm text-gray-600">Success Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Check-in Methods Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Check-in Methods Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-32 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : analyticsData ? (
            <div className="space-y-4">
              {getMethodDistribution().map((method, index) => (
                <div key={method.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index] }}
                    ></div>
                    <span className="font-medium">{method.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold">{method.value}</span>
                    <span className="text-sm text-gray-500 ml-2">({method.percentage}%)</span>
                  </div>
                </div>
              ))}
              {getMethodDistribution().length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <BarChart className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No check-in data available for selected period</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Information */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Date Range</h4>
              <p className="text-sm text-gray-600">
                From: {dateRange.from}<br />
                To: {dateRange.to}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Performance Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <Badge variant={summaryStats.successRate >= 90 ? 'default' : 'secondary'}>
                    {summaryStats.successRate}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Daily Average:</span>
                  <span className="font-medium">{summaryStats.averageDaily} check-ins</span>
                </div>
                <div className="flex justify-between">
                  <span>Member Engagement:</span>
                  <span className="font-medium">
                    {summaryStats.totalCheckIns > 0
                      ? Math.round((summaryStats.uniqueMembers / summaryStats.totalCheckIns) * 100)
                      : 0
                    }% unique visitors
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckInAnalytics;
