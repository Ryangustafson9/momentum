import React from 'react';
import { Users, Calendar, TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemberStats } from '@/hooks/useMembers';
import { StatsLoading } from '@/shared/components/LoadingStates';
import { QueryErrorBoundary } from '@/shared/components/ErrorBoundary';

const StatCard = ({ title, value, description, icon: Icon, trend, trendValue }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className={`flex items-center text-xs mt-1 ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            <TrendingUp className={`h-3 w-3 mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
            {trendValue}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const DashboardStats = () => {
  const { data: memberStats, isLoading, error } = useMemberStats();

  if (isLoading) {
    return <StatsLoading />;
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="text-center text-red-600">
                <p className="text-sm">Failed to load stats</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Total Members",
      value: memberStats?.totalMembers?.toLocaleString() || '0',
      description: "Active gym members",
      icon: Users,
      trend: "up",
      trendValue: "+12% from last month"
    },
    {
      title: "Active Members",
      value: memberStats?.activeMembers?.toLocaleString() || '0',
      description: "Currently active",
      icon: Activity,
      trend: "up",
      trendValue: "+5% from last month"
    },
    {
      title: "New This Month",
      value: memberStats?.newMembersThisMonth?.toLocaleString() || '0',
      description: "New member signups",
      icon: TrendingUp,
      trend: "up",
      trendValue: "+8% from last month"
    },
    {
      title: "Renewal Rate",
      value: memberStats?.membershipRenewalRate || '0%',
      description: "Membership renewals",
      icon: Calendar,
      trend: "up",
      trendValue: "+2% from last month"
    }
  ];

  return (
    <QueryErrorBoundary>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    </QueryErrorBoundary>
  );
};

export default DashboardStats;
