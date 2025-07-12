// 🏠 STAFF HOMEPAGE - Clean dashboard overview for staff users
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Calendar,
  CheckSquare,
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  Plus,
  ArrowRight
} from 'lucide-react';

// Core services and utilities
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import { useNotifications } from '@/contexts/NotificationContext.jsx';
import { formatters } from '@/utils/formatUtils';
import { formatDate } from '@/utils/dateUtils';
import { showToast } from '@/utils/toastUtils';
import { useLoading } from '@/hooks/useLoading';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { storage, STORAGE_KEYS } from '@/utils/storageUtils';

// React Query hooks
import {
  useDashboardStats,
  useTodayCheckIns,
  useRecentActivity,
  useMemberCount,
  useMemberStats
} from '@/hooks/useUnifiedQueries';

// Dashboard components
import StatCard from '@/components/admin/dashboard/StatCard.jsx';
import AddCardDialog from '@/components/admin/dashboard/AddCardDialog.jsx';
import DashboardHeader from '@/components/admin/dashboard/DashboardHeader.jsx';
import QuickStatsCard from '@/components/admin/dashboard/QuickStatsCard.jsx';
import RecentActivityCard from '@/components/admin/dashboard/RecentActivityCard.jsx';
import { ALL_AVAILABLE_CARDS_CONFIG } from '@/components/admin/dashboard/dashboardConfig.jsx';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Sortable StatCard wrapper component
const SortableStatCard = ({ cardConfig, value, trend, navigateTo, description, badgeCount, isEditMode, onRemoveCard }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cardConfig.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <StatCard
      cardConfig={cardConfig}
      value={value}
      trend={trend}
      navigateTo={navigateTo}
      description={description}
      badgeCount={badgeCount}
      isEditMode={isEditMode}
      onRemoveCard={onRemoveCard}
      isDragging={isDragging}
      listeners={listeners}
      attributes={attributes}
      setNodeRef={setNodeRef}
      style={style}
    />
  );
};

const QuickActionCard = ({ title, description, icon: Icon, onClick, badge, color = "blue" }) => (
  <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-gray-900">{title}</h3>
            {badge && (
              <Badge variant={badge.type || "default"} className="text-xs">
                {badge.text}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-full bg-${color}-100`}>
            <Icon className={`w-5 h-5 text-${color}-600`} />
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const AlertsCard = ({ alerts }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center">
        <AlertTriangle className="w-5 h-5 mr-2 text-amber-600" />
        Alerts & Notifications
      </CardTitle>
    </CardHeader>
    <CardContent>
      {alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div key={index} className={`p-3 rounded-lg border-l-4 ${
              alert.type === 'urgent' ? 'border-red-500 bg-red-50' :
              alert.type === 'warning' ? 'border-amber-500 bg-amber-50' :
              alert.type === 'promo' ? 'border-green-500 bg-green-50' :
              'border-blue-500 bg-blue-50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{alert.title}</h4>
                  <p className="text-sm text-gray-600">{alert.message}</p>
                </div>
                <Badge variant={
                  alert.type === 'urgent' ? 'destructive' :
                  alert.type === 'promo' ? 'default' :
                  'outline'
                }>
                  {alert.type === 'promo' ? 'PROMO' : alert.type}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <CheckSquare className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">All systems running smoothly</p>
        </div>
      )}
    </CardContent>
  </Card>
);

const StaffHomepage = () => {
  const navigate = useNavigate();
  const { withLoading, isLoading } = useLoading();
  const { handleAsyncOperation } = useErrorHandler();

  // Drag and drop sensors with better configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1, // Very small distance to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // React Query hooks for real-time data
  const { data: dashboardStats, isLoading: dashboardLoading } = useDashboardStats();
  const { data: memberCount, isLoading: memberCountLoading } = useMemberCount();
  const { data: memberStats, isLoading: memberStatsLoading } = useMemberStats();
  const { data: todayCheckIns = [], isLoading: checkInsLoading } = useTodayCheckIns();
  const { data: recentActivity = [], isLoading: activityLoading } = useRecentActivity(5);

  // Computed stats from React Query data
  const stats = useMemo(() => ({
    totalMembers: memberCount || 0,
    activeClasses: dashboardStats?.classes?.total || 8,
    checkInsToday: todayCheckIns.length || 0,
    monthlyRevenue: '$12,500', // Placeholder - billing integration pending
    expiringMembershipsCount: 3, // Placeholder - membership tracking pending
    newSignupsToday: memberStats?.new_this_month || 0,
    pendingPaymentsCount: 5, // Placeholder - billing integration pending
    lowCapacityClassesCount: 2, // Placeholder - class analytics pending
    pendingSupportTicketsCount: 1, // Placeholder - support system pending
    unreadSystemNotificationsCount: 0,
    totalMembersTrend: `+${memberStats?.new_this_month || 0} this month`,
    upcomingClassesTrend: "2 new this week",
    revenueTrend: "+8% from last month",
    signupsTrend: `+${memberStats?.new_this_month || 0} today`,
    quickStatsSummary: {
      newMembersThisMonth: memberStats?.new_this_month || 0,
      classAttendanceRate: '85%',
      membershipRenewalRate: '92%',
      averageCheckInsPerDay: Math.round(todayCheckIns.length * 1.5) || 45,
      peakHours: '6-8 PM',
      mostPopularClass: 'HIIT Training'
    }
  }), [memberCount, dashboardStats, memberStats, todayCheckIns]);


  // Alerts state
  const [alerts, setAlerts] = useState([
    {
      type: 'warning',
      title: 'Low Class Capacity',
      message: '2 classes have low enrollment for tomorrow'
    },
    {
      type: 'info',
      title: 'Membership Renewals',
      message: '3 memberships expiring this week'
    }
  ]);

  const { unreadCount: unreadSystemNotifications } = useNotifications();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddCardDialogOpen, setIsAddCardDialogOpen] = useState(false);

  const [visibleCardIds, setVisibleCardIds] = useState(() => {
    return storage.local.get(STORAGE_KEYS.DASHBOARD_CONFIG, [
      'totalMembers', 'activeClasses', 'checkInsToday', 'monthlyRevenue',
      'expiringMemberships', 'newSignups', 'recentActivity', 'quickStats'
    ]);
  });

  const displayedCardsConfig = useMemo(() => {
    return visibleCardIds.map(id => ALL_AVAILABLE_CARDS_CONFIG.find(card => card.id === id)).filter(Boolean);
  }, [visibleCardIds]);

  // Quick actions configuration
  const quickActions = [
    {
      title: "Check-in Members",
      description: "Process member check-ins and track attendance",
      icon: CheckSquare,
      onClick: () => navigate('/staff-portal/checkin'),
      color: "green"
    },
    {
      title: "Manage Schedule",
      description: "View and manage class schedules and resources",
      icon: Calendar,
      onClick: () => navigate('/staff-portal/schedule'),
      badge: { text: "New Features", type: "default" },
      color: "blue"
    },

    {
      title: "Class Management",
      description: "Create and manage fitness classes",
      icon: Plus,
      onClick: () => navigate('/staff-portal/classes'),
      color: "orange"
    }
  ];

  // Loading state for dashboard
  const isLoadingDashboard = dashboardLoading || memberCountLoading || memberStatsLoading || checkInsLoading;

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

  // Handle drag end for reordering cards
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setVisibleCardIds((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);

        // Save new order to localStorage
        storage.local.set(STORAGE_KEYS.DASHBOARD_CONFIG, newOrder);
        showToast.success('Cards reordered', 'Dashboard layout updated');

        return newOrder;
      });
    }
  }, []);

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

      {/* Loading indicator */}
      {isLoadingDashboard && (
        <div className="text-center py-2">
          <div className="text-sm text-gray-500">Loading dashboard data...</div>
        </div>
      )}

      {/* Edit Mode Indicator */}
      {isEditMode && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">
                Dashboard Edit Mode
              </p>
              <p className="text-xs text-blue-600">
                Drag cards to reorder them or click the × to remove them
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMode(false)}
              className="text-blue-700 border-blue-300 hover:bg-blue-100"
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {/* Stats Cards with Conditional Drag and Drop */}
      {isEditMode ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={displayedCardsConfig.filter(c => c.dataType === 'stat').map(c => c.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence>
                {displayedCardsConfig.filter(c => c.dataType === 'stat').map(cardConfig => (
                  <SortableStatCard
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
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <motion.div
          layout
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
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
      )}

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <QuickActionCard
              key={index}
              title={action.title}
              description={action.description}
              icon={action.icon}
              onClick={action.onClick}
              badge={action.badge}
              color={action.color}
            />
          ))}
        </div>
      </div>

      {/* Dashboard Cards Grid */}
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
            className={`${!visibleCardIds.includes('recentActivity') ? 'lg:col-span-2' : ''}`}
          />
        )}

        <AlertsCard alerts={alerts} />
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

export default StaffHomepage;

