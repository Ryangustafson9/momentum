import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStaffStats } from '@/hooks/useStaffDashboard';

const StatCard = ({ title, value, icon, color, trend, description, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`cursor-pointer ${onClick ? 'hover:shadow-lg' : ''} transition-shadow duration-200`}
  >
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
            {trend && (
              <div className={`flex items-center mt-2 text-xs ${
                trend.positive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.positive ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                <span>{trend.value}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            {React.cloneElement(icon, { className: "h-6 w-6 text-white" })}
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const StaffQuickStats = ({ onNavigate }) => {
  const { data: stats, isLoading, error } = useStaffStats();

  // Default stats if loading or error
  const defaultStats = {
    totalMembers: 0,
    checkInsToday: 0,
    monthlyRevenue: 0,
    upcomingClasses: 0,
    expiringMemberships: 0,
    pendingPayments: 0,
  };

  const currentStats = stats || defaultStats;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2 lg:col-span-3">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Error loading dashboard stats: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title="Total Members"
        value={currentStats.totalMembers.toLocaleString()}
        icon={<Users />}
        color="bg-blue-500"
        description="Active memberships"
        trend={{ positive: true, value: "+12 this month" }}
        onClick={() => onNavigate?.('/staff/members')}
      />

      <StatCard
        title="Check-ins Today"
        value={currentStats.checkInsToday}
        icon={<UserCheck />}
        color="bg-green-500"
        description="Members checked in"
        trend={{ positive: currentStats.checkInsToday > 20, value: `${currentStats.checkInsToday > 20 ? '+' : ''}${currentStats.checkInsToday - 20} vs yesterday` }}
        onClick={() => onNavigate?.('/staff/attendance')}
      />

      <StatCard
        title="Monthly Revenue"
        value={`$${currentStats.monthlyRevenue.toLocaleString()}`}
        icon={<DollarSign />}
        color="bg-emerald-500"
        description="From active memberships"
        trend={{ positive: true, value: "+8% vs last month" }}
        onClick={() => onNavigate?.('/staff/billing')}
      />

      <StatCard
        title="Classes Today"
        value={currentStats.upcomingClasses}
        icon={<Calendar />}
        color="bg-purple-500"
        description="Scheduled sessions"
        onClick={() => onNavigate?.('/staff/classes')}
      />

      <StatCard
        title="Expiring Soon"
        value={currentStats.expiringMemberships}
        icon={<Clock />}
        color="bg-amber-500"
        description="Memberships in 30 days"
        onClick={() => onNavigate?.('/staff/renewals')}
      />

      <StatCard
        title="Pending Issues"
        value={currentStats.pendingPayments + currentStats.expiringMemberships}
        icon={<AlertTriangle />}
        color="bg-red-500"
        description="Requires attention"
        onClick={() => onNavigate?.('/staff/issues')}
      />
    </div>
  );
};

export default StaffQuickStats;
