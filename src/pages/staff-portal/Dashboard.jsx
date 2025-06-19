import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { showToast } from '@/utils/toastUtils';
import { useLoading } from '@/hooks/useLoading';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { Loader2, Users, Calendar, DollarSign, Activity } from 'lucide-react';

// Dashboard components
import StatCard from '@/components/admin/dashboard/StatCard';
import AddCardDialog from '@/components/admin/dashboard/AddCardDialog';
import DashboardHeader from '@/components/admin/dashboard/DashboardHeader';
import QuickStatsCard from '@/components/admin/dashboard/QuickStatsCard';
import RecentActivityCard from '@/components/admin/dashboard/RecentActivityCard';
import { ALL_AVAILABLE_CARDS_CONFIG } from '@/components/admin/dashboard/dashboardConfig';

// Staff Service Functions
const staffDashboardService = {
  async getStaffStats() {
    try {
      // Get member count
      const { count: memberCount, error: memberError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'member');

      if (memberError) throw memberError;

      // Get active classes today
      const today = new Date().toISOString().split('T')[0];
      const { count: classCount, error: classError } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('day_of_week', new Date().toLocaleDateString('en-US', { weekday: 'long' }))
        .eq('status', 'active');

      if (classError) throw classError;

      return {
        totalMembers: memberCount || 0,
        activeClasses: classCount || 0,
      };
    } catch (error) {
      console.error('Error fetching staff stats:', error);
      return {
        totalMembers: 0,
        activeClasses: 0,
      };
    }
  },

  async getRecentActivity() {
    try {
      // Get recent member signups
      const { data: recentMembers, error: memberError } = await supabase
        .from('profiles')
        .select('name, email, created_at')
        .eq('role', 'member')
        .order('created_at', { ascending: false })
        .limit(5);

      if (memberError) throw memberError;

      // Convert to activity format
      const activities = (recentMembers || []).map((member, index) => ({
        id: `member-${index}`,
        description: `${member.name || member.email} joined as a new member`,
        timestamp: member.created_at,
        type: "member-join",
        user: { name: member.name || member.email, avatar: null }
      }));

      return activities;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }
};

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { withLoading, isLoading } = useLoading();
  const { handleAsyncOperation } = useErrorHandler();

  // Dashboard data state
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeClasses: 0,
    checkInsToday: 15, // Mock data
    monthlyRevenue: '$12,500', // Mock data
    expiringMembershipsCount: 3,
    newSignupsToday: 2,
    pendingPaymentsCount: 5,
    lowCapacityClassesCount: 2,
    pendingSupportTicketsCount: 1,
    unreadSystemNotificationsCount: 0,
    totalMembersTrend: "+0 this month",
    upcomingClassesTrend: "2 new this week",
    revenueTrend: "+8% from last month",
    signupsTrend: "+2 today",
    quickStatsSummary: {
      newMembersThisMonth: 0,
      classAttendanceRate: '85%',
      membershipRenewalRate: '92%',
      averageCheckInsPerDay: 45,
      peakHours: '6-8 PM',
      mostPopularClass: 'HIIT Training'
    },
    membershipInsights: {
      totalMembershipTypes: 6,
      mostPopularPlan: 'Premium Individual',
      averageMonthlyValue: '$65',
      renewalRate: '92%',
      churnRate: '8%',
      lifetimeValue: '$780'
    }
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddCardDialogOpen, setIsAddCardDialogOpen] = useState(false);

  const [visibleCardIds, setVisibleCardIds] = useState([
    'totalMembers', 'activeClasses', 'checkInsToday', 'monthlyRevenue',
    'expiringMemberships', 'newSignups', 'recentActivity', 'quickStats'
  ]);

  const displayedCardsConfig = useMemo(() => {
    return visibleCardIds.map(id => ALL_AVAILABLE_CARDS_CONFIG.find(card => card.id === id)).filter(Boolean);
  }, [visibleCardIds]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    console.log('🔄 Fetching staff dashboard data...');
    
    await withLoading(async () => {
      try {
        const [statsData, activityData] = await Promise.all([
          staffDashboardService.getStaffStats(),
          staffDashboardService.getRecentActivity()
        ]);
        
        console.log('📊 Stats received:', statsData);
        console.log('📋 Activity received:', activityData);
        
        setStats(prev => ({
          ...prev,
          ...statsData,
          totalMembersTrend: `+${Math.floor(statsData.totalMembers * 0.1)} this month`,
          quickStatsSummary: {
            ...prev.quickStatsSummary,
            newMembersThisMonth: Math.floor(statsData.totalMembers * 0.1),
          },
        }));
        
        setRecentActivity(activityData);
        
        console.log('✅ Staff dashboard data loaded successfully');
        
      } catch (error) {
        console.error('❌ Failed to fetch dashboard data:', error);
        toast({
          title: "Dashboard Error",
          description: "Some dashboard data may not be up to date.",
          variant: "destructive"
        });
      }
    }, 'dashboard');
  }, [withLoading, toast]);

  // Load data on mount
  useEffect(() => {
    console.log('🚀 StaffDashboard: Component mounted');
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (isEditMode) { 
      localStorage.setItem('staffDashboardConfig', JSON.stringify(visibleCardIds));
    }
  };

  const handleRemoveCard = useCallback((cardId) => {
    const newVisibleCards = visibleCardIds.filter(id => id !== cardId);
    setVisibleCardIds(newVisibleCards);
    localStorage.setItem('staffDashboardConfig', JSON.stringify(newVisibleCards));
    showToast.success('Card removed', 'Dashboard updated successfully');
  }, [visibleCardIds]);

  const handleAddCard = useCallback((cardId) => {
    const newVisibleCards = [...visibleCardIds, cardId];
    setVisibleCardIds(newVisibleCards);
    localStorage.setItem('staffDashboardConfig', JSON.stringify(newVisibleCards));
    showToast.success('Card added', 'Dashboard updated successfully');
  }, [visibleCardIds]);

  const formatters = {
    number: (value) => {
      if (typeof value === 'number') {
        return value.toLocaleString();
      }
      return value || '0';
    }
  };

  const formatDate = (date, format = 'relative') => {
    if (!date) return 'Unknown';
    
    const dateObj = new Date(date);
    if (format === 'relative') {
      const now = new Date();
      const diffInMinutes = Math.floor((now - dateObj) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
    
    return dateObj.toLocaleDateString();
  };

  if (isLoading('dashboard') && stats.totalMembers === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <DashboardHeader
        isEditMode={isEditMode}
        onToggleEditMode={handleToggleEditMode}
        onOpenAddCardDialog={() => setIsAddCardDialogOpen(true)}
      />

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name || 'Staff Member'}!
            </h2>
            <p className="text-gray-600 mt-1">
              Here's what's happening at your gym today.
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading('dashboard') && (
        <div className="text-center py-2">
          <div className="text-sm text-gray-500">Refreshing data...</div>
        </div>
      )}

      {/* Stats Cards */}
      <motion.div 
        layout 
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <AnimatePresence>
          {displayedCardsConfig.filter(c => c.dataType === 'stat').map(cardConfig => (
            <StatCard 
              key={cardConfig.id}
              cardConfig={cardConfig}
              value={
                cardConfig.dataKey === 'monthlyRevenue' 
                  ? stats[cardConfig.dataKey] 
                  : formatters.number(stats[cardConfig.dataKey] ?? 0)
              }
              trend={stats[cardConfig.trendKey]}
              navigateTo={cardConfig.navigateTo}
              description={cardConfig.description}
              badgeCount={cardConfig.badgeKey ? stats[cardConfig.badgeKey] : 0}
              isEditMode={isEditMode}
              onRemoveCard={handleRemoveCard}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Activity and Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        {visibleCardIds.includes('recentActivity') && (
          <RecentActivityCard
            activities={recentActivity}
            isEditMode={isEditMode}
            onRemoveCard={handleRemoveCard}
          />
        )}

        {/* Quick Stats */}
        {visibleCardIds.includes('quickStats') && (
          <QuickStatsCard
            isEditMode={isEditMode}
            onRemoveCard={handleRemoveCard}
            statsData={stats.quickStatsSummary}
            className="lg:col-span-2"
          />
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/staff/checkin')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium">Check In</span>
          </button>          <button
            onClick={() => navigate('/staff-portal/members')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium">Members</span>
          </button>
          <button
            onClick={() => navigate('/staff-portal/classes')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Calendar className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium">Classes</span>
          </button>
          <button
            onClick={() => navigate('/staff-portal/memberships')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <DollarSign className="h-8 w-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium">Memberships</span>
          </button>
        </div>
      </div>

      {/* Add Card Dialog */}
      <AddCardDialog
        open={isAddCardDialogOpen}
        onOpenChange={setIsAddCardDialogOpen}
        onAddCard={handleAddCard}
        currentVisibleCardIds={visibleCardIds}
      />
    </motion.div>
  );
};

export default StaffDashboard;


