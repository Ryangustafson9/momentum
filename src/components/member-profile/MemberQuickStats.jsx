import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CreditCard, 
  Activity, 
  TrendingUp, 
  Clock,
  DollarSign,
  Users,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, differenceInDays, format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';

const MemberQuickStats = ({ memberId, memberData }) => {
  const [stats, setStats] = useState({
    checkInCount: 0,
    lastCheckIn: null,
    membershipDuration: 0,
    totalSpent: 0,
    averageVisitsPerWeek: 0,
    isLoading: true
  });

  useEffect(() => {
    if (memberId) {
      loadMemberStats();
    }
  }, [memberId]);

  const loadMemberStats = async () => {
    try {
      const [checkInStats, billingStats] = await Promise.all([
        loadCheckInStats(),
        loadBillingStats()
      ]);

      const membershipDuration = calculateMembershipDuration();
      const averageVisitsPerWeek = calculateAverageVisits(checkInStats.total, membershipDuration);

      setStats({
        checkInCount: checkInStats.total,
        lastCheckIn: checkInStats.lastCheckIn,
        membershipDuration,
        totalSpent: billingStats.totalSpent,
        averageVisitsPerWeek,
        isLoading: false
      });
    } catch (error) {
      console.error('Error loading member stats:', error);
      setStats(prev => ({ ...prev, isLoading: false }));
    }
  };

  const loadCheckInStats = async () => {
    try {
      const { data, error } = await supabase
        .from('checkin_history')
        .select('check_in_time')
        .eq('profile_id', memberId)
        .order('check_in_time', { ascending: false });

      if (error) throw error;

      return {
        total: data?.length || 0,
        lastCheckIn: data?.[0]?.check_in_time || null
      };
    } catch (error) {
      console.warn('Could not load check-in stats:', error);
      return { total: 0, lastCheckIn: null };
    }
  };

  const loadBillingStats = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('total_amount')
        .eq('customer_id', memberId)
        .eq('status', 'completed');

      if (error) throw error;

      const totalSpent = data?.reduce((sum, transaction) =>
        sum + parseFloat(transaction.total_amount || 0), 0) || 0;

      return { totalSpent };
    } catch (error) {
      console.warn('Could not load billing stats:', error);
      return { totalSpent: 0 };
    }
  };

  const calculateMembershipDuration = () => {
    if (!memberData?.created_at) return 0;
    return differenceInDays(new Date(), new Date(memberData.created_at));
  };

  const calculateAverageVisits = (totalVisits, durationInDays) => {
    if (durationInDays === 0) return 0;
    const weeks = durationInDays / 7;
    return weeks > 0 ? (totalVisits / weeks).toFixed(1) : 0;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getLastCheckInText = () => {
    if (!stats.lastCheckIn) return 'Never';
    
    const daysSince = differenceInDays(new Date(), new Date(stats.lastCheckIn));
    
    if (daysSince === 0) return 'Today';
    if (daysSince === 1) return 'Yesterday';
    if (daysSince < 7) return `${daysSince} days ago`;
    
    return format(new Date(stats.lastCheckIn), 'MMM d, yyyy');
  };

  const getEngagementLevel = () => {
    const visitsPerWeek = parseFloat(stats.averageVisitsPerWeek);
    
    if (visitsPerWeek >= 4) return { level: 'High', color: 'bg-green-100 text-green-800', icon: TrendingUp };
    if (visitsPerWeek >= 2) return { level: 'Medium', color: 'bg-blue-100 text-blue-800', icon: Activity };
    if (visitsPerWeek >= 1) return { level: 'Low', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    return { level: 'Inactive', color: 'bg-gray-100 text-gray-800', icon: Clock };
  };

  const engagement = getEngagementLevel();
  const EngagementIcon = engagement.icon;

  if (stats.isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Check-ins */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Visits</p>
              <p className="text-2xl font-bold text-gray-900">{stats.checkInCount}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">
              {stats.averageVisitsPerWeek}/week avg
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Last Check-in */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Last Visit</p>
              <p className="text-lg font-semibold text-gray-900">{getLastCheckInText()}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="mt-2">
            <Badge variant="outline" className={`text-xs ${engagement.color}`}>
              <EngagementIcon className="h-3 w-3 mr-1" />
              {engagement.level} Engagement
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Membership Duration */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Member Since</p>
              <p className="text-lg font-semibold text-gray-900">
                {stats.membershipDuration} days
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-500">
              {memberData?.created_at ? format(new Date(memberData.created_at), 'MMM d, yyyy') : 'Unknown'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Total Spent */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(stats.totalSpent)}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-500">
              Lifetime value
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MemberQuickStats;
