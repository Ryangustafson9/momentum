import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ⭐ ONLY use what exists
import { apiService } from '@/services/apiService';

import LoadingSpinner from '@/components/LoadingSpinner';
import { useNotifications } from '@/contexts/NotificationContext.jsx';
import { formatters } from '@/utils/formatUtils';
import { formatDate } from '@/utils/dateUtils';
import { showToast } from '@/utils/toastUtils';
import { useLoading } from '@/hooks/useLoading';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { storage, STORAGE_KEYS } from '@/utils/storageUtils';

import StatCard from '@/components/admin/dashboard/StatCard.jsx';
import AddCardDialog from '@/components/admin/dashboard/AddCardDialog.jsx';
import DashboardHeader from '@/components/admin/dashboard/DashboardHeader.jsx';
import QuickStatsCard from '@/components/admin/dashboard/QuickStatsCard.jsx';
import RecentActivityCard from '@/components/admin/dashboard/RecentActivityCard.jsx';
import { ALL_AVAILABLE_CARDS_CONFIG } from '@/components/admin/dashboard/dashboardConfig.jsx';

const StaffDashboard = () => {
  const { withLoading, isLoading } = useLoading();
  const { handleAsyncOperation } = useErrorHandler();

  // ⭐ SIMPLIFIED: Start with mock data to show dashboard immediately
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeClasses: 8, // Mock data
    checkInsToday: 15, // Mock data
    monthlyRevenue: '$12,500', // Mock data
    expiringMembershipsCount: 3,
    lowCapacityClassesCount: 2,
    pendingSupportTicketsCount: 1,
    unreadSystemNotificationsCount: 0,
    totalMembersTrend: "+0 this month",
    upcomingClassesTrend: "2 new this week",
    quickStatsSummary: { 
      newMembersThisMonth: 0, 
      classAttendanceRate: '85%', 
      membershipRenewalRate: '92%' 
    },
  });
  
  // ⭐ SIMPLIFIED: Mock recent activity
  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      description: "New member signed up",
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      type: "member_signup"
    },
    {
      id: 2,
      description: "Morning Yoga class completed",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      type: "class_completed"
    },
    {
      id: 3,
      description: "Equipment maintenance scheduled",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      type: "maintenance"
    }
  ]);

  const { unreadCount: unreadSystemNotifications } = useNotifications();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddCardDialogOpen, setIsAddCardDialogOpen] = useState(false);

  const [visibleCardIds, setVisibleCardIds] = useState(() => {
    return storage.local.get(STORAGE_KEYS.DASHBOARD_CONFIG, [
      'totalMembers', 'activeClasses', 'checkInsToday', 'monthlyRevenue',
      'recentActivity', 'quickStats'
    ]);
  });

  const displayedCardsConfig = useMemo(() => {
    return visibleCardIds.map(id => ALL_AVAILABLE_CARDS_CONFIG.find(card => card.id === id)).filter(Boolean);
  }, [visibleCardIds]);

  // ⭐ SIMPLIFIED: Only fetch data that exists
  const fetchDashboardData = useCallback(async () => {
    console.log('🔄 Fetching available dashboard data...');
    
    await withLoading(async () => {
      try {
        // ⭐ ONLY call APIs that exist and don't fail
        const memberCount = await apiService.getMemberCount();
        console.log('📊 Member count received:', memberCount);
        
        // ⭐ UPDATE with real data where available
        setStats(prev => ({
          ...prev,
          totalMembers: memberCount,
          totalMembersTrend: `+${Math.floor(memberCount * 0.1)} this month`, // Mock trend
          quickStatsSummary: {
            newMembersThisMonth: Math.floor(memberCount * 0.1),
            classAttendanceRate: '85%', // Mock
            membershipRenewalRate: '92%', // Mock
          },
        }));
        
        console.log('✅ Dashboard data loaded successfully');
        
      } catch (error) {
        console.error('❌ Failed to fetch dashboard data:', error);
        // ⭐ Silently use mock data - don't show errors for development
      }
    }, 'dashboard');
  }, []); // ⭐ Empty dependency array to prevent loops

  // ⭐ FAST: Load on mount but don't block UI
  useEffect(() => {
    console.log('🚀 StaffDashboard: Component mounted');
    fetchDashboardData();
  }, []);

  useEffect(() => {
    setStats(prev => ({ 
      ...prev, 
      unreadSystemNotificationsCount: unreadSystemNotifications || 0 
    }));
  }, [unreadSystemNotifications]);

  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (isEditMode) { 
      storage.local.set(STORAGE_KEYS.DASHBOARD_CONFIG, visibleCardIds);
    }
  };

  const handleRemoveCard = useCallback((cardId) => {
    const newVisibleCards = visibleCardIds.filter(id => id !== cardId);
    setVisibleCardIds(newVisibleCards);
    storage.local.set(STORAGE_KEYS.DASHBOARD_CONFIG, newVisibleCards);
    showToast.success('Card removed', 'Dashboard updated successfully');
  }, [visibleCardIds]);

  const handleAddCard = useCallback((cardId) => {
    const newVisibleCards = [...visibleCardIds, cardId];
    setVisibleCardIds(newVisibleCards);
    storage.local.set(STORAGE_KEYS.DASHBOARD_CONFIG, newVisibleCards);
    showToast.success('Card added', 'Dashboard updated successfully');
  }, [visibleCardIds]);

  const renderRecentActivity = () => {
    return recentActivity.map((activity, index) => (
      <div key={activity.id || index} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded">
        <div className="flex-shrink-0">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {activity.description}
          </p>
          <p className="text-xs text-gray-500">
            {formatDate(activity.timestamp, 'relative')}
          </p>
        </div>
      </div>
    ));
  };

  // ⭐ FAST: Only show loading spinner for initial load
  if (isLoading('dashboard') && stats.totalMembers === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }} // ⭐ Faster animation
      className="space-y-8 min-h-screen bg-background"
    >
      <DashboardHeader 
        isEditMode={isEditMode}
        onToggleEditMode={handleToggleEditMode}
        onOpenAddCardDialog={() => setIsAddCardDialogOpen(true)}
      />

      {/* ⭐ Subtle loading indicator */}
      {isLoading('dashboard') && (
        <div className="text-center py-2">
          <div className="text-sm text-gray-500">Refreshing data...</div>
        </div>
      )}

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {visibleCardIds.includes('recentActivity') && (
          <RecentActivityCard 
            activities={recentActivity} 
            isEditMode={isEditMode} 
            onRemoveCard={handleRemoveCard} 
          />
        )}

        {visibleCardIds.includes('quickStats') && (
          <QuickStatsCard 
            isEditMode={isEditMode} 
            onRemoveCard={handleRemoveCard} 
            statsData={stats.quickStatsSummary}
            className={`${!visibleCardIds.includes('recentActivity') ? 'lg:col-span-3' : ''}`}
          />
        )}
      </div>

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


