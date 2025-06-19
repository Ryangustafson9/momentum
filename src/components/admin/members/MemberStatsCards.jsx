import React from 'react';
import { Users, UserCheck, UserX, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const StatCard = ({ icon, title, count, subtitle, color, trend }) => (
  <Card className="hover:shadow-lg transition-shadow duration-200">
    <CardContent className="p-6">
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-xl ${color} shadow-sm`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">{count}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">{trend}</span>
            </div>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

const MemberStatsCards = ({ members, isLoading }) => {
  const stats = React.useMemo(() => {
    if (!Array.isArray(members)) return { total: 0, active: 0, inactive: 0, expired: 0 };

    const total = members.length;
    const active = members.filter(m => m.status === 'active').length;
    const inactive = members.filter(m => m.status === 'inactive').length;
    const expired = members.filter(m => m.status === 'expired' || m.status === 'cancelled').length;

    return { total, active, inactive, expired };
  }, [members]);

  const StatsCardSkeleton = () => (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
          <div className="flex-1">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20 mb-2"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-12 mb-2"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <StatCard
        icon={<Users className="h-6 w-6 text-white" />}
        title="Total Members"
        count={stats.total}
        subtitle="All registered members"
        color="bg-gradient-to-br from-blue-500 to-blue-600"
      />
      <StatCard
        icon={<UserCheck className="h-6 w-6 text-white" />}
        title="Active Members"
        count={stats.active}
        subtitle="Currently active subscriptions"
        color="bg-gradient-to-br from-green-500 to-green-600"
      />
      <StatCard
        icon={<Clock className="h-6 w-6 text-white" />}
        title="Inactive Members"
        count={stats.inactive}
        subtitle="No active subscription"
        color="bg-gradient-to-br from-yellow-500 to-yellow-600"
      />
      <StatCard
        icon={<UserX className="h-6 w-6 text-white" />}
        title="Expired/Cancelled"
        count={stats.expired}
        subtitle="Expired or cancelled memberships"
        color="bg-gradient-to-br from-red-500 to-red-600"
      />
    </div>
  );
};

export default MemberStatsCards;
