import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, CheckSquare, UserCircle, Bell, BarChart3,
  Sparkles, CreditCard, DollarSign, Menu, X, Home, User,
  Calendar, History, Settings, LogOut, ChevronRight,
  AlertTriangle, ChevronLeft, Search, Zap, Target,
  TrendingUp, Award, Clock, Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import SampleDataSetup from '@/components/SampleDataSetup';
import FamilyMembershipManager from '@/components/FamilyMembershipManager';

// ⭐ NEW: Real-time enhancements
import { useRealtimeClasses, useRealtimeAttendance, useRealtimeBilling } from '@/hooks/useRealtimeSubscription';
import { useMemberPresence } from '@/hooks/useRealtimePresence';
import RealtimeIndicator from '@/components/realtime/RealtimeIndicator';
import { useNotifications } from '@/contexts/NotificationContext';

// ⭐ PERFORMANCE: Performance optimization imports (temporarily disabled)
// import { useOptimizedQuery, useDebouncedState, useStableCallback } from '@/hooks/usePerformanceOptimization';
// import { optimizedQueries } from '@/lib/databaseOptimization';
// import { cacheManager } from '@/lib/advancedCaching';
// import OptimizedImage from '@/components/optimization/OptimizedImage';

// ==================== ENHANCED COMPONENTS ====================

const CollapsibleSidebar = ({ sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed, firstName, user, handleLogout, navigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const sidebarSections = [
    {
      title: "Navigation",
      items: [
        { icon: Home, label: 'Dashboard', path: '/member/memberdashboard', active: true, badge: null },
        { icon: Calendar, label: 'My Classes', path: '/member/classes', badge: '3' },
        { icon: History, label: 'Attendance', path: '/member/attendance' },
      ]
    },
    {
      title: "Account",
      items: [
        { icon: CreditCard, label: 'Billing', path: '/member/billing', badge: '!' },
        { icon: User, label: 'Profile', path: '/member/profile' },
        { icon: Settings, label: 'Settings', path: '/member/settings' },
      ]
    }
  ];

  const filteredSections = sidebarSections.map(section => ({
    ...section,
    items: section.items.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  return (
    <>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 ${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white shadow-xl transform transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0 flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50`}>
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <div className="ml-3">
                  <h1 className="text-lg font-bold text-gray-900">Momentum</h1>
                  <p className="text-xs text-gray-500">Fitness Club</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Toggle Buttons */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex hover:bg-white/50 p-2"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden hover:bg-white/50 p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>



        {/* Search - Only show when expanded */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 bg-gray-50 border-0 focus:bg-white transition-colors"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {filteredSections.map((section, sectionIndex) => (
            <div key={section.title} className={sectionIndex > 0 ? 'mt-6' : ''}>
              {!sidebarCollapsed && (
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1 px-2">
                {section.items.map((item) => (
                  <motion.button
                    key={item.path}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group relative ${
                      item.active
                        ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    title={sidebarCollapsed ? item.label : ''}
                  >
                    <item.icon className={`h-5 w-5 ${item.active ? 'text-indigo-700' : 'text-gray-400 group-hover:text-gray-600'} ${!sidebarCollapsed ? 'mr-3' : ''}`} />
                    
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <Badge 
                            variant={item.badge === '!' ? 'destructive' : 'secondary'} 
                            className="ml-2 h-5 min-w-5 text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                    
                    {sidebarCollapsed && item.badge && (
                      <div className="absolute -top-1 -right-1">
                        <Badge 
                          variant={item.badge === '!' ? 'destructive' : 'secondary'} 
                          className="h-4 min-w-4 text-xs p-0 flex items-center justify-center"
                        >
                          {item.badge}
                        </Badge>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Sign Out Button - Bottom */}
        <div className="p-3 border-t border-gray-200 bg-gray-50/50">
          {!sidebarCollapsed ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

const EnhancedStatCard = ({ title, value, icon, color, action, description, trend, sparklineData, comparison }) => (
  <Card className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
      <div className="flex items-center space-x-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        {comparison && (
          <Badge variant={comparison.positive ? "default" : "secondary"} className="text-xs">
            {comparison.positive ? '+' : ''}{comparison.value}%
          </Badge>
        )}
      </div>
      <div className={`p-2 rounded-lg bg-gradient-to-br ${color} shadow-sm`}>
        {React.cloneElement(icon, { className: "h-4 w-4 text-white" })}
      </div>
    </CardHeader>
    
    <CardContent className="relative z-10">
      <div className="flex items-end justify-between mb-2">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {sparklineData && (
          <div className="w-16 h-8">
            {/* Simple sparkline visualization */}
            <svg className="w-full h-full">
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-indigo-500"
                points={sparklineData.map((point, index) => 
                  `${(index / (sparklineData.length - 1)) * 60},${32 - (point / Math.max(...sparklineData)) * 24}`
                ).join(' ')}
              />
            </svg>
          </div>
        )}
      </div>
      
      {description && <p className="text-xs text-gray-500 mb-2">{description}</p>}
      {trend && (
        <div className="flex items-center space-x-1 mb-2">
          <TrendingUp className="h-3 w-3 text-green-600" />
          <p className="text-xs text-green-600 font-medium">{trend}</p>
        </div>
      )}
      
      {action && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="mt-2 text-gray-600 hover:text-gray-900 p-0 h-auto font-medium hover:bg-transparent group-hover:text-indigo-600"
          onClick={action.onClick}
        >
          {action.label} <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
        </Button>
      )}
    </CardContent>
  </Card>
);

const SkeletonCard = () => (
  <Card className="border-0 shadow-sm">
    <CardHeader>
      <div className="flex justify-between items-center">
        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="h-8 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
      <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
    </CardContent>
  </Card>
);

const SmartRecommendations = () => {
  const recommendations = [
    {
      icon: <Target className="h-5 w-5" />,
      title: "Weekly Goal",
      description: "Attend 3 more classes this week to maintain your streak!",
      action: "View Classes",
      color: "bg-blue-50 border-blue-200 text-blue-800"
    },
    {
      icon: <Award className="h-5 w-5" />,
      title: "Achievement Ready",
      description: "You're 2 classes away from earning your Consistency Badge!",
      action: "See Progress",
      color: "bg-purple-50 border-purple-200 text-purple-800"
    }
  ];

  return (
    <Card className="bg-white border-0 shadow-sm">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="flex items-center text-gray-900">
          <Zap className="mr-3 h-5 w-5 text-yellow-500" />
          Smart Recommendations
        </CardTitle>
        <CardDescription>Personalized suggestions for you</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={index} className={`p-4 rounded-xl border ${rec.color}`}>
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">{rec.icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{rec.title}</h4>
                  <p className="text-sm opacity-90 mb-3">{rec.description}</p>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    {rec.action}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ==================== MAIN COMPONENT ====================

const MemberDashboard = () => {
  console.log('🔍 MemberDashboard: Component rendering');
  const navigate = useNavigate();
  const { user, logout, refreshUserProfile } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  console.log('🔍 MemberDashboard: User:', user?.email, 'Role:', user?.role);

  // ⭐ NEW: Real-time subscriptions
  const classesRealtime = useRealtimeClasses(true);
  const attendanceRealtime = useRealtimeAttendance(user?.id, true);
  const billingRealtime = useRealtimeBilling(user?.id, true);
  const memberPresence = useMemberPresence('gym', true);
  
  // Enhanced state management with real-time features
  const [state, setState] = useState({
    memberProfile: null,
    upcomingClasses: [],
    attendanceSummary: { present: 0, total: 0 },
    billingInfo: { nextPaymentDate: null, amountDue: 0 },
    membership: null,
    membershipTypes: [],
    addons: [],
    greeting: '',
    error: null,
    loading: true,
    sidebarOpen: false,
    sidebarCollapsed: false,
    refreshing: false,
    showFamilyManager: false,
    // ⭐ NEW: Real-time state
    liveUpdates: true,
    lastActivity: new Date(),
    connectionStatus: 'connecting'
  });

  // ==================== DATA FETCHING ====================

  // ⭐ PERFORMANCE: Optimized data fetching with caching (temporarily disabled)
  const fetchDashboardData = async (showRefreshing = false) => {
    if (!user?.id) {
      setState(prev => ({ ...prev, error: 'User not authenticated', loading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: !showRefreshing, refreshing: showRefreshing, error: null }));

      // Simulate some loading time for better UX
      if (showRefreshing) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Fetch user profile (using existing profiles table)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('Profile not found, using auth user data:', profileError);
        // Use auth user data as fallback
      }

      // Fetch data with graceful error handling (using existing table structure)
      const [attendanceResult, classesResult, membershipResult, membershipTypeResult, addonsResult] = await Promise.allSettled([
        supabase.from('attendance').select('*').eq('member_id', user.id),
        supabase.from('classes').select('*, instructor:instructor_id(first_name, last_name)').order('start_time', { ascending: true }),
        supabase.from('memberships').select(`
          *,
          membership_type:membership_types!current_membership_type_id(*)
        `).eq('auth_user_id', user.id).maybeSingle(),
        supabase.from('membership_types').select('*'),
        supabase.from('addon_memberships').select(`
          *,
          addon_type:membership_types!addon_type_id(*)
        `).eq('member_id', user.id)
      ]);

      // Process data using existing schema structure
      const attendance = attendanceResult.status === 'fulfilled' ? attendanceResult.value.data || [] : [];
      const classes = classesResult.status === 'fulfilled' ? classesResult.value.data || [] : [];
      const membership = membershipResult.status === 'fulfilled' ? membershipResult.value.data : null;
      const membershipTypes = membershipTypeResult.status === 'fulfilled' ? membershipTypeResult.value.data || [] : [];
      const addons = addonsResult.status === 'fulfilled' ? addonsResult.value.data || [] : [];

      // Calculate attendance stats (using existing 'Present' status)
      const present = attendance.filter(a => a.status === 'Present').length;
      const attendedIds = attendance.map(a => a.class_id);

      // Get upcoming classes (filter out past classes and those already attended)
      const now = new Date();
      const upcoming = classes
        .filter(c => {
          const classTime = new Date(c.start_time);
          return classTime > now && !attendedIds.includes(c.id);
        })
        .slice(0, 3);

      // Process billing info using existing membership structure
      let billingInfo = { nextPaymentDate: null, amountDue: 0 };
      if (membership) {
        // Use existing membership fields
        const monthlyFee = membership.monthly_fee || membership.price || 49.99;
        const joinDate = new Date(membership.start_date || membership.created_at || new Date());
        const nextPayment = new Date(joinDate);
        nextPayment.setMonth(nextPayment.getMonth() + 1);
        billingInfo = {
          nextPaymentDate: nextPayment.toLocaleDateString(),
          amountDue: monthlyFee
        };
      }

      const hour = new Date().getHours();
      const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

      setState(prev => ({
        ...prev,
        memberProfile: profile || {
          id: user.id,
          email: user.email,
          first_name: user.first_name || user.user_metadata?.first_name,
          role: user.role || 'member',
          created_at: user.created_at
        },
        upcomingClasses: upcoming,
        attendanceSummary: { present, total: attendance.length },
        billingInfo,
        membership,
        membershipTypes,
        addons,
        greeting,
        loading: false,
        refreshing: false,
        error: null
      }));

    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setState(prev => ({
        ...prev,
        error: err.message || 'Failed to load dashboard data',
        loading: false,
        refreshing: false
      }));
    }
  };

  // Pull-to-refresh functionality
  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  // Handle role updates after membership changes
  const handleMembershipUpdate = async () => {
    console.log('🔄 MemberDashboard: Refreshing user profile after membership change');
    try {
      await refreshUserProfile();
      await fetchDashboardData(true);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  // ==================== EFFECTS ====================

  useEffect(() => {
    console.log('🔍 MemberDashboard useEffect: User check', {
      user: user?.email,
      role: user?.role,
      hasUser: !!user
    });

    if (!user) {
      console.log('❌ MemberDashboard: No user, redirecting to login');
      navigate('/login');
      return;
    }

    // Allow member, staff, and admin to access member dashboard
    const allowedRoles = ['member', 'staff', 'admin'];
    if (!allowedRoles.includes(user.role)) {
      console.log('❌ MemberDashboard: Invalid role, redirecting to dashboard', { role: user.role });
      navigate('/dashboard');
      return;
    }

    console.log('✅ MemberDashboard: User authorized, fetching data');
    fetchDashboardData();
  }, [user, navigate]);

  // ⭐ NEW: Real-time connection monitoring
  useEffect(() => {
    const isConnected = classesRealtime.isConnected && attendanceRealtime.isConnected && billingRealtime.isConnected;

    setState(prev => ({
      ...prev,
      connectionStatus: isConnected ? 'connected' : 'connecting',
      lastActivity: new Date()
    }));

    if (isConnected) {
      console.log('✅ Member Dashboard: All real-time connections established');
    }
  }, [classesRealtime.isConnected, attendanceRealtime.isConnected, billingRealtime.isConnected]);

  // ⭐ NEW: Auto-refresh data when real-time updates occur
  useEffect(() => {
    if (classesRealtime.isConnected || attendanceRealtime.isConnected) {
      // Refresh dashboard data when real-time updates are received
      const refreshTimer = setTimeout(() => {
        fetchDashboardData(true);
      }, 1000); // Small delay to batch updates

      return () => clearTimeout(refreshTimer);
    }
  }, [classesRealtime.isConnected, attendanceRealtime.isConnected]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault();
            setState(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
            break;
          case 'r':
            e.preventDefault();
            handleRefresh();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // ==================== HANDLERS ====================
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // ==================== COMPUTED VALUES ====================
  
  const attendancePercent = state.attendanceSummary.total > 0
    ? (state.attendanceSummary.present / state.attendanceSummary.total) * 100
    : 0;

  const firstName = user?.first_name || user?.display_name?.split(' ')[0] || 'Member';

  // Mock data for enhanced features
  const sparklineData = [65, 72, 68, 75, 82, 78, 85, 88];
  const attendanceComparison = { positive: true, value: 12 };

  // ==================== RENDER CONDITIONS ====================
  
  if (state.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{state.error}</p>
          <Button onClick={() => fetchDashboardData()} className="bg-indigo-600 hover:bg-indigo-700">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // ==================== MAIN RENDER ====================
  
  return (
    // CRITICAL: This wrapper ensures complete isolation from parent layouts
    <div className="fixed inset-0 bg-gray-50 flex overflow-hidden z-50">
      {/* Enhanced Sidebar */}
      <CollapsibleSidebar 
        sidebarOpen={state.sidebarOpen}
        setSidebarOpen={(open) => setState(prev => ({ ...prev, sidebarOpen: open }))}
        sidebarCollapsed={state.sidebarCollapsed}
        setSidebarCollapsed={(collapsed) => setState(prev => ({ ...prev, sidebarCollapsed: collapsed }))}
        firstName={firstName}
        user={user}
        handleLogout={handleLogout}
        navigate={navigate}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop Header - Only on desktop */}
        <div className="hidden lg:block bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome back, {firstName}!</p>
            </div>

            {/* User Menu for Desktop */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">{firstName?.charAt(0) || 'U'}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-gray-900">{firstName || 'User'}</p>
                    <p className="text-xs leading-none text-gray-500">
                      {user?.email || 'No email'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/member/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/member/billing')}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Billing</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/member/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {/* Mobile Header - Only on mobile */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setState(prev => ({ ...prev, sidebarOpen: true }))}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-gray-900">Dashboard</span>

          {/* User Menu for Mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">{firstName?.charAt(0) || 'U'}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-gray-900">{firstName || 'User'}</p>
                  <p className="text-xs leading-none text-gray-500">
                    {user?.email || 'No email'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/member/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/member/billing')}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/member/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-7xl mx-auto space-y-6 lg:space-y-8"
            >
              {/* Welcome Header with Real-time Status */}
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                <div>
                  <div className="flex items-center space-x-3">
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                      {state.greeting}, {firstName}!
                    </h1>
                    {state.refreshing && (
                      <Sparkles className="h-5 w-5 animate-spin text-indigo-600" />
                    )}
                    {/* ⭐ NEW: Real-time indicator */}
                    <RealtimeIndicator
                      isConnected={state.connectionStatus === 'connected'}
                      showText={false}
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-gray-600">Welcome back to your fitness journey.</p>
                    {/* ⭐ NEW: Connection status */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Live updates:</span>
                      <span className={state.connectionStatus === 'connected' ? 'text-green-600' : 'text-yellow-600'}>
                        {state.connectionStatus === 'connected' ? 'Active' : 'Connecting...'}
                      </span>
                    </div>
                    {/* ⭐ NEW: Notification indicator */}
                    {unreadCount > 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        <Bell className="h-3 w-3 text-blue-600" />
                        <span className="text-blue-600 font-medium">{unreadCount} new</span>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => navigate('/member/billing')}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  size="lg"
                >
                  <DollarSign className="mr-2 h-4 w-4" /> Pay My Bill
                </Button>
              </div>

              {/* Enhanced Stats Cards */}
              <div className="grid gap-4 lg:gap-6 md:grid-cols-2 lg:grid-cols-3">
                {state.loading ? (
                  <>
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                  </>
                ) : (
                  <>
                    <Card className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-gray-600">Membership Status</CardTitle>
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                          <UserCircle className="h-4 w-4 text-white" />
                        </div>
                      </CardHeader>

                      <CardContent className="relative z-10">
                        <div className="text-2xl font-bold text-gray-900 mb-2">Active</div>
                        <p className="text-xs text-gray-500 mb-4">
                          {state.memberProfile?.role || 'Member'} • Since {new Date(state.memberProfile?.created_at || Date.now()).getFullYear()}
                        </p>

                        <div className="space-y-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-gray-600 hover:text-gray-900 p-0 h-auto font-medium hover:bg-transparent group-hover:text-indigo-600"
                            onClick={() => navigate('/member/profile')}
                          >
                            View Profile <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-gray-600 hover:text-gray-900 p-0 h-auto font-medium hover:bg-transparent group-hover:text-purple-600"
                            onClick={() => setState(prev => ({ ...prev, showFamilyManager: true }))}
                          >
                            Manage Family <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    <EnhancedStatCard 
                      title="Classes Attended" 
                      value={`${state.attendanceSummary.present}`} 
                      icon={<CheckSquare />} 
                      color="from-green-500 to-green-600"
                      description={`${state.attendanceSummary.total} total sessions`}
                      trend={attendancePercent >= 80 ? "+12% from last month" : ""}
                      sparklineData={sparklineData}
                      comparison={attendanceComparison}
                    />
                    <EnhancedStatCard 
                      title="Next Payment" 
                      value={`$${state.billingInfo.amountDue.toFixed(2)}`} 
                      icon={<CreditCard />} 
                      color="from-amber-500 to-orange-500"
                      description={state.billingInfo.nextPaymentDate ? `Due: ${state.billingInfo.nextPaymentDate}` : "Up to date"}
                      action={{ label: "View Billing", onClick: () => navigate('/member/billing') }}
                    />
                  </>
                )}
              </div>

              {/* Membership Information Card */}
              <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="flex items-center text-gray-900">
                    <CreditCard className="mr-3 h-5 w-5 text-indigo-600" />
                    Membership Details
                  </CardTitle>
                  <CardDescription>Your current plan and add-ons</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Current Plan */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Current Plan</h4>
                        <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-indigo-900">
                              {state.membership?.membership_type?.name || 'Premium Membership'}
                            </span>
                            <Badge className="bg-indigo-100 text-indigo-800">
                              {state.membership?.status || 'Active'}
                            </Badge>
                          </div>
                          <p className="text-sm text-indigo-700 mb-2">
                            ${state.membership?.membership_type?.price || state.billingInfo.amountDue}/month
                          </p>
                          <div className="text-xs text-indigo-600">
                            Member since: {state.membership?.start_date ?
                              new Date(state.membership.start_date).toLocaleDateString() :
                              'Recently joined'
                            }
                          </div>
                        </div>
                      </div>

                      {/* Add-ons */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Add-on Services</h4>
                        {state.addons && state.addons.length > 0 ? (
                          <div className="space-y-2">
                            {state.addons.map((addon, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">
                                  {addon.addon_type?.name || 'Add-on Service'}
                                </span>
                                <span className="text-sm text-gray-600">
                                  ${addon.addon_type?.price || 0}/month
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-lg text-center">
                            <p className="text-sm text-gray-500 mb-2">No add-ons currently active</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate('/join-online')}
                            >
                              Browse Add-ons
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Billing & Actions */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Billing Information</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                            <span className="text-sm font-medium text-green-800">Next Payment</span>
                            <div className="text-right">
                              <div className="font-semibold text-green-900">
                                ${state.billingInfo.amountDue.toFixed(2)}
                              </div>
                              <div className="text-xs text-green-700">
                                {state.billingInfo.nextPaymentDate || 'Up to date'}
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Payment Method</span>
                            <span className="text-sm text-gray-600">
                              {state.membership?.payment_method || '•••• 1234'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Quick Actions</h4>
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => navigate('/member/billing')}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Manage Billing
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => setState(prev => ({ ...prev, showFamilyManager: true }))}
                          >
                            <UserCircle className="mr-2 h-4 w-4" />
                            Manage Family
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => navigate('/join-online')}
                          >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Upgrade Plan
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full justify-start bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 hover:from-purple-100 hover:to-indigo-100"
                            onClick={() => navigate('/member-portal/advanced')}
                          >
                            <Star className="mr-2 h-4 w-4 text-purple-600" />
                            <span className="text-purple-700">Advanced Features</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Content Grid */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Upcoming Classes */}
                <Card className="lg:col-span-2 bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="flex items-center text-gray-900">
                      <CalendarDays className="mr-3 h-5 w-5 text-indigo-600" /> 
                      Upcoming Classes
                    </CardTitle>
                    <CardDescription>Your next scheduled sessions</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {state.upcomingClasses.length > 0 ? (
                      <div className="space-y-4">
                        {state.upcomingClasses.map(cls => (
                          <motion.div 
                            key={cls.id} 
                            whileHover={{ scale: 1.01 }}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-indigo-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{cls.name}</p>
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                  <Clock className="h-4 w-4" />
                                  <span>{new Date(cls.start_time).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => navigate(`/member/classes#${cls.id}`)}
                            >
                              View
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <CalendarDays className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4 text-lg">No upcoming classes scheduled</p>

                        {/* Show sample data setup if user has no attendance history */}
                        {state.attendanceSummary.total === 0 ? (
                          <div className="max-w-md mx-auto">
                            <SampleDataSetup onComplete={() => fetchDashboardData(true)} />
                          </div>
                        ) : (
                          <Button
                            onClick={() => navigate('/member/classes')}
                            className="bg-indigo-600 hover:bg-indigo-700"
                            size="lg"
                          >
                            Book a Class
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Smart Recommendations */}
                <SmartRecommendations 
                  upcomingClasses={state.upcomingClasses}
                  attendancePercent={attendancePercent}
                />
              </div>

              {/* Attendance Progress & Announcements */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Enhanced Attendance Progress */}
                <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="flex items-center text-gray-900">
                      <BarChart3 className="mr-3 h-5 w-5 text-indigo-600" /> 
                      Attendance Progress
                    </CardTitle>
                    <CardDescription>Your consistency tracker</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Overall Attendance</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-indigo-600">
                            {attendancePercent.toFixed(1)}%
                          </span>
                          <div className="flex items-center space-x-1 text-xs text-green-600">
                            <TrendingUp className="h-3 w-3" />
                            <span>+12% this month</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Progress 
                          value={attendancePercent} 
                          className="w-full h-3 bg-gray-200" 
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-4">
                          {attendancePercent >= 80 ? "🔥 Amazing consistency!" : 
                           attendancePercent >= 50 ? "💪 Keep pushing!" : 
                           "📈 Every session counts!"}
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={() => navigate('/member/attendance')}
                        >
                          View Full History
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Announcements */}
                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="flex items-center text-gray-900">
                      <Bell className="mr-3 h-5 w-5 text-indigo-600" /> 
                      Updates & Announcements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl cursor-pointer"
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl">🎉</span>
                          <div>
                            <span className="font-semibold text-blue-900">Special Offer:</span>
                            <p className="text-blue-800 text-sm mt-1">
                              Bring a friend this week and get 10% off your next month!
                            </p>
                          </div>
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl cursor-pointer"
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl">🔧</span>
                          <div>
                            <span className="font-semibold text-amber-900">Maintenance Alert:</span>
                            <p className="text-amber-800 text-sm mt-1">
                              The sauna will be closed on May 20th for upgrades.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Family Membership Management Modal */}
      {state.showFamilyManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Family Membership Management</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setState(prev => ({ ...prev, showFamilyManager: false }))}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <FamilyMembershipManager
                membershipData={{
                  membership_type: {
                    member_type: 'family', // Default to family type
                    price: 99.99
                  }
                }}
                onUpdate={handleMembershipUpdate}
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MemberDashboard;
