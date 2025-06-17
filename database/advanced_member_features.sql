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
CREATE TABLE IF NOT EXISTS loyalty_rewards_redeemed (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES loyalty_rewards_catalog(id) ON DELETE SET NULL,
    reward_name VARCHAR(255) NOT NULL,
    points_cost INTEGER NOT NULL,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
    redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    fulfilled_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- =====================================================
-- 💬 COMMUNICATION TABLES
-- =====================================================

-- Member messages
CREATE TABLE IF NOT EXISTS member_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sender_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(50) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    member_name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolution TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Announcements
CREATE TABLE IF NOT EXISTS member_announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    announcement_type VARCHAR(50) NOT NULL DEFAULT 'info' CHECK (announcement_type IN ('info', 'warning', 'success', 'error')),
    priority VARCHAR(50) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    target_audience VARCHAR(100) NOT NULL DEFAULT 'all', -- all, members, staff, specific_tier
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Member announcement reads (track who has read what)
CREATE TABLE IF NOT EXISTS member_announcement_reads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    announcement_id UUID NOT NULL REFERENCES member_announcements(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(member_id, announcement_id)
);

-- =====================================================
-- 📊 INDEXES FOR PERFORMANCE
-- =====================================================

-- Workout tracking indexes
CREATE INDEX IF NOT EXISTS idx_member_workouts_member_id ON member_workouts(member_id);
CREATE INDEX IF NOT EXISTS idx_member_workouts_completed_at ON member_workouts(completed_at);

-- Personal training indexes
CREATE INDEX IF NOT EXISTS idx_pt_bookings_member_id ON personal_training_bookings(member_id);
CREATE INDEX IF NOT EXISTS idx_pt_bookings_trainer_id ON personal_training_bookings(trainer_id);
CREATE INDEX IF NOT EXISTS idx_pt_bookings_session_date ON personal_training_bookings(session_date);

-- Referral indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON member_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON member_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON member_referral_codes(code);

-- Loyalty indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_points_member_id ON member_loyalty_points(member_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_history_member_id ON loyalty_points_history(member_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_history_earned_at ON loyalty_points_history(earned_at);

-- Communication indexes
CREATE INDEX IF NOT EXISTS idx_messages_member_id ON member_messages(member_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON member_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_support_tickets_member_id ON support_tickets(member_id);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON member_announcements(is_active);

-- =====================================================
-- 🔄 ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE member_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_training_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards_redeemed ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_announcement_reads ENABLE ROW LEVEL SECURITY;

-- Member can only access their own data
CREATE POLICY "Members can view own workouts" ON member_workouts FOR SELECT USING (auth.uid() = member_id);
CREATE POLICY "Members can insert own workouts" ON member_workouts FOR INSERT WITH CHECK (auth.uid() = member_id);
CREATE POLICY "Members can update own workouts" ON member_workouts FOR UPDATE USING (auth.uid() = member_id);

CREATE POLICY "Members can view own PT bookings" ON personal_training_bookings FOR SELECT USING (auth.uid() = member_id OR auth.uid() = trainer_id);
CREATE POLICY "Members can insert own PT bookings" ON personal_training_bookings FOR INSERT WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Members can view own referrals" ON member_referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Members can insert own referrals" ON member_referrals FOR INSERT WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Members can view own loyalty points" ON member_loyalty_points FOR SELECT USING (auth.uid() = member_id);
CREATE POLICY "Members can view own loyalty history" ON loyalty_points_history FOR SELECT USING (auth.uid() = member_id);

CREATE POLICY "Members can view own messages" ON member_messages FOR SELECT USING (auth.uid() = member_id OR auth.uid() = sender_id);
CREATE POLICY "Members can insert own messages" ON member_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Members can view own support tickets" ON support_tickets FOR SELECT USING (auth.uid() = member_id);
CREATE POLICY "Members can insert own support tickets" ON support_tickets FOR INSERT WITH CHECK (auth.uid() = member_id);

-- Public read access for some tables
CREATE POLICY "Anyone can view public workout templates" ON workout_templates FOR SELECT USING (is_public = true);
CREATE POLICY "Anyone can view active trainer profiles" ON trainer_profiles FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view available loyalty rewards" ON loyalty_rewards_catalog FOR SELECT USING (is_available = true);
CREATE POLICY "Anyone can view active announcements" ON member_announcements FOR SELECT USING (is_active = true);

-- Staff can manage most data
CREATE POLICY "Staff can manage all data" ON member_workouts FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
);

-- =====================================================
-- 🎯 FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update loyalty points
CREATE OR REPLACE FUNCTION update_loyalty_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total points and tier
    UPDATE member_loyalty_points 
    SET 
        total_points = total_points + NEW.points,
        lifetime_points = lifetime_points + NEW.points,
        updated_at = NOW()
    WHERE member_id = NEW.member_id;
    
    -- Insert if doesn't exist
    INSERT INTO member_loyalty_points (member_id, total_points, lifetime_points)
    VALUES (NEW.member_id, NEW.points, NEW.points)
    ON CONFLICT (member_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update loyalty points
CREATE TRIGGER trigger_update_loyalty_points
    AFTER INSERT ON loyalty_points_history
    FOR EACH ROW
    EXECUTE FUNCTION update_loyalty_points();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers to relevant tables
CREATE TRIGGER update_member_workouts_updated_at BEFORE UPDATE ON member_workouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workout_templates_updated_at BEFORE UPDATE ON workout_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pt_bookings_updated_at BEFORE UPDATE ON personal_training_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trainer_profiles_updated_at BEFORE UPDATE ON trainer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_referral_codes_updated_at BEFORE UPDATE ON member_referral_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON member_referrals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loyalty_points_updated_at BEFORE UPDATE ON member_loyalty_points FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loyalty_catalog_updated_at BEFORE UPDATE ON loyalty_rewards_catalog FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON member_announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
