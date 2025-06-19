-- =====================================================
-- 🚀 ADVANCED MEMBER FEATURES DATABASE SCHEMA
-- Tables for enhanced member functionality
-- =====================================================

-- =====================================================
-- 💪 WORKOUT TRACKING TABLES
-- =====================================================

-- Member workouts table
CREATE TABLE IF NOT EXISTS member_workouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'General',
    duration INTEGER NOT NULL DEFAULT 0, -- in seconds
    exercises JSONB NOT NULL DEFAULT '[]',
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Workout templates table
CREATE TABLE IF NOT EXISTS workout_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    exercises JSONB NOT NULL DEFAULT '[]',
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 🏋️ PERSONAL TRAINING TABLES
-- =====================================================

-- Personal training bookings
CREATE TABLE IF NOT EXISTS personal_training_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    trainer_name VARCHAR(255) NOT NULL,
    session_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL DEFAULT 60, -- in minutes
    rate DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Trainer profiles and availability
CREATE TABLE IF NOT EXISTS trainer_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    specialties TEXT[] NOT NULL DEFAULT '{}',
    bio TEXT,
    experience VARCHAR(100),
    hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    total_reviews INTEGER DEFAULT 0,
    availability JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 🤝 REFERRAL SYSTEM TABLES
-- =====================================================

-- Member referral codes
CREATE TABLE IF NOT EXISTS member_referral_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Member referrals tracking
CREATE TABLE IF NOT EXISTS member_referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    referred_name VARCHAR(255),
    referred_email VARCHAR(255),
    referral_code VARCHAR(20) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    reward_amount DECIMAL(10,2) DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Referral rewards
CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    referral_id UUID NOT NULL REFERENCES member_referrals(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 🏆 LOYALTY PROGRAM TABLES
-- =====================================================

-- Member loyalty points
CREATE TABLE IF NOT EXISTS member_loyalty_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    total_points INTEGER NOT NULL DEFAULT 0,
    current_tier VARCHAR(50) NOT NULL DEFAULT 'Bronze',
    tier_progress INTEGER NOT NULL DEFAULT 0,
    lifetime_points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Loyalty points history
CREATE TABLE IF NOT EXISTS loyalty_points_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    activity VARCHAR(255) NOT NULL,
    description TEXT,
    reference_id UUID, -- Can reference other tables
    reference_type VARCHAR(100), -- Type of reference (workout, class, referral, etc.)
    earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Loyalty rewards catalog
CREATE TABLE IF NOT EXISTS loyalty_rewards_catalog (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    points_cost INTEGER NOT NULL,
    category VARCHAR(100) NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    stock_quantity INTEGER,
    image_url TEXT,
    terms_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Loyalty rewards redeemed
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
          </button>
          <button
            onClick={() => navigate('/staff/members')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium">Members</span>
          </button>
          <button
            onClick={() => navigate('/staff/classes')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Calendar className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium">Classes</span>
          </button>
          <button
            onClick={() => navigate('/staff/memberships')}
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
