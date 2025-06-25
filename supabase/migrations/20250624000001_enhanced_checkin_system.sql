-- Enhanced Check-In System Migration
-- Comprehensive check-in functionality with QR codes, access cards, and validation
-- Created: June 24, 2025

-- ==================== PREREQUISITES ====================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== ENHANCED CHECKIN_HISTORY TABLE ====================
-- First, let's clean up the existing checkin_history table and enhance it

-- Add new columns to existing checkin_history table
ALTER TABLE checkin_history 
ADD COLUMN IF NOT EXISTS check_in_method VARCHAR(20) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS access_card_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS qr_code_data TEXT,
ADD COLUMN IF NOT EXISTS staff_member_id UUID,
ADD COLUMN IF NOT EXISTS location_id UUID,
ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS validation_status VARCHAR(20) DEFAULT 'valid',
ADD COLUMN IF NOT EXISTS validation_message TEXT,
ADD COLUMN IF NOT EXISTS guest_info JSONB,
ADD COLUMN IF NOT EXISTS session_duration INTEGER, -- For future check-out functionality
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add constraints for check_in_method
ALTER TABLE checkin_history 
ADD CONSTRAINT check_in_method_valid 
CHECK (check_in_method IN ('qr_scan', 'manual', 'access_card', 'mobile_app', 'barcode_scan'));

-- Add constraints for validation_status
ALTER TABLE checkin_history 
ADD CONSTRAINT validation_status_valid 
CHECK (validation_status IN ('valid', 'expired_membership', 'suspended', 'cancelled', 'guest_denied', 'location_restricted', 'daily_limit_exceeded', 'invalid_card'));

-- Add foreign key constraints
ALTER TABLE checkin_history 
ADD CONSTRAINT fk_checkin_staff_member 
FOREIGN KEY (staff_member_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Add location foreign key (will reference locations table when available)
-- ALTER TABLE checkin_history 
-- ADD CONSTRAINT fk_checkin_location 
-- FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;

-- ==================== MEMBER ACCESS CARDS TABLE ====================
-- Track member access cards and QR codes
CREATE TABLE IF NOT EXISTS member_access_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Card Information
  card_number VARCHAR(100) UNIQUE,
  card_type VARCHAR(20) NOT NULL DEFAULT 'qr_code', -- 'qr_code', 'barcode', 'rfid', 'magnetic_stripe'
  qr_code_data TEXT UNIQUE,
  
  -- Card Status
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false, -- Primary card for the member
  
  -- Security
  issued_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_date TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  
  -- Metadata
  issued_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Staff who issued the card
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT card_type_valid CHECK (card_type IN ('qr_code', 'barcode', 'rfid', 'magnetic_stripe', 'nfc')),
  CONSTRAINT primary_card_unique UNIQUE (profile_id, is_primary) DEFERRABLE INITIALLY DEFERRED
);

-- ==================== CHECK-IN VALIDATION RULES TABLE ====================
-- Configurable business rules for check-in validation
CREATE TABLE IF NOT EXISTS checkin_validation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID, -- NULL means global rule
  
  -- Rule Configuration
  rule_name VARCHAR(100) NOT NULL,
  rule_type VARCHAR(50) NOT NULL, -- 'daily_limit', 'time_restriction', 'membership_requirement', etc.
  rule_config JSONB NOT NULL,
  
  -- Rule Status
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 100, -- Lower number = higher priority
  
  -- Metadata
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT rule_type_valid CHECK (rule_type IN (
    'daily_limit', 'time_restriction', 'membership_requirement', 
    'location_access', 'guest_policy', 'suspension_check'
  ))
);

-- ==================== CHECK-IN SESSIONS TABLE ====================
-- Track active check-in sessions (for future check-out functionality)
CREATE TABLE IF NOT EXISTS checkin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_history_id UUID NOT NULL REFERENCES checkin_history(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location_id UUID,
  
  -- Session Information
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
  check_out_time TIMESTAMP WITH TIME ZONE,
  session_duration INTEGER, -- Duration in minutes
  
  -- Session Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'expired'
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT session_status_valid CHECK (status IN ('active', 'completed', 'expired')),
  CONSTRAINT valid_session_times CHECK (check_out_time IS NULL OR check_out_time > check_in_time)
);

-- ==================== CHECK-IN ANALYTICS TABLE ====================
-- Pre-computed analytics for performance
CREATE TABLE IF NOT EXISTS checkin_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Analytics Scope
  date DATE NOT NULL,
  location_id UUID,
  
  -- Metrics
  total_checkins INTEGER DEFAULT 0,
  unique_members INTEGER DEFAULT 0,
  first_time_visitors INTEGER DEFAULT 0,
  peak_hour INTEGER, -- Hour with most check-ins (0-23)
  peak_hour_count INTEGER DEFAULT 0,
  
  -- Check-in Methods
  qr_scan_count INTEGER DEFAULT 0,
  manual_count INTEGER DEFAULT 0,
  access_card_count INTEGER DEFAULT 0,
  mobile_app_count INTEGER DEFAULT 0,
  
  -- Validation Results
  valid_checkins INTEGER DEFAULT 0,
  denied_checkins INTEGER DEFAULT 0,
  guest_attempts INTEGER DEFAULT 0,
  
  -- Metadata
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(date, location_id)
);

-- ==================== INDEXES FOR PERFORMANCE ====================

-- Checkin history indexes
CREATE INDEX IF NOT EXISTS idx_checkin_history_profile_date ON checkin_history(profile_id, DATE(check_in_time));
CREATE INDEX IF NOT EXISTS idx_checkin_history_location_date ON checkin_history(location_id, DATE(check_in_time));
CREATE INDEX IF NOT EXISTS idx_checkin_history_method ON checkin_history(check_in_method);
CREATE INDEX IF NOT EXISTS idx_checkin_history_validation_status ON checkin_history(validation_status);
CREATE INDEX IF NOT EXISTS idx_checkin_history_access_card ON checkin_history(access_card_number) WHERE access_card_number IS NOT NULL;

-- Access cards indexes
CREATE INDEX IF NOT EXISTS idx_access_cards_profile ON member_access_cards(profile_id);
CREATE INDEX IF NOT EXISTS idx_access_cards_active ON member_access_cards(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_access_cards_primary ON member_access_cards(profile_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_access_cards_qr_data ON member_access_cards(qr_code_data) WHERE qr_code_data IS NOT NULL;

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_checkin_sessions_profile ON checkin_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_checkin_sessions_active ON checkin_sessions(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_checkin_sessions_location_date ON checkin_sessions(location_id, DATE(check_in_time));

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_checkin_analytics_date ON checkin_analytics(date);
CREATE INDEX IF NOT EXISTS idx_checkin_analytics_location_date ON checkin_analytics(location_id, date);

-- ==================== FUNCTIONS AND TRIGGERS ====================

-- Function to update access card usage
CREATE OR REPLACE FUNCTION update_access_card_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Update usage count and last used time for access cards
  IF NEW.access_card_number IS NOT NULL THEN
    UPDATE member_access_cards 
    SET 
      usage_count = usage_count + 1,
      last_used_at = NEW.check_in_time,
      updated_at = NOW()
    WHERE card_number = NEW.access_card_number;
  END IF;
  
  -- Update QR code usage
  IF NEW.qr_code_data IS NOT NULL THEN
    UPDATE member_access_cards 
    SET 
      usage_count = usage_count + 1,
      last_used_at = NEW.check_in_time,
      updated_at = NOW()
    WHERE qr_code_data = NEW.qr_code_data;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update access card usage on check-in
DROP TRIGGER IF EXISTS trigger_update_access_card_usage ON checkin_history;
CREATE TRIGGER trigger_update_access_card_usage
  AFTER INSERT ON checkin_history
  FOR EACH ROW
  EXECUTE FUNCTION update_access_card_usage();

-- Function to ensure only one primary card per member
CREATE OR REPLACE FUNCTION ensure_single_primary_card()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a card as primary, unset all other primary cards for this member
  IF NEW.is_primary = true THEN
    UPDATE member_access_cards 
    SET is_primary = false, updated_at = NOW()
    WHERE profile_id = NEW.profile_id AND id != NEW.id AND is_primary = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure single primary card
DROP TRIGGER IF EXISTS trigger_ensure_single_primary_card ON member_access_cards;
CREATE TRIGGER trigger_ensure_single_primary_card
  BEFORE INSERT OR UPDATE ON member_access_cards
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_card();

-- ==================== DEFAULT VALIDATION RULES ====================

-- Insert default validation rules
INSERT INTO checkin_validation_rules (rule_name, rule_type, rule_config, priority) VALUES
('Daily Check-in Limit', 'daily_limit', '{"max_checkins_per_day": 1, "allow_override": true}', 10),
('Membership Status Check', 'membership_requirement', '{"required_statuses": ["active"], "deny_guests": true}', 5),
('Operating Hours', 'time_restriction', '{"enforce_hours": true, "allow_staff_override": true}', 20),
('Suspension Check', 'suspension_check', '{"check_suspension": true, "check_cancellation": true}', 1)
ON CONFLICT DO NOTHING;

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS on new tables
ALTER TABLE member_access_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_validation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for member_access_cards
CREATE POLICY "Members can view their own access cards" ON member_access_cards
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Staff can view all access cards" ON member_access_cards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('staff', 'admin')
    )
  );

CREATE POLICY "Staff can manage access cards" ON member_access_cards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('staff', 'admin')
    )
  );

-- RLS Policies for validation rules (admin only)
CREATE POLICY "Admin can manage validation rules" ON checkin_validation_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- RLS Policies for sessions
CREATE POLICY "Members can view their own sessions" ON checkin_sessions
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Staff can view all sessions" ON checkin_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('staff', 'admin')
    )
  );

-- RLS Policies for analytics (staff and admin only)
CREATE POLICY "Staff can view analytics" ON checkin_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('staff', 'admin')
    )
  );

COMMENT ON TABLE checkin_history IS 'Enhanced check-in history with support for multiple check-in methods and validation';
COMMENT ON TABLE member_access_cards IS 'Member access cards and QR codes for check-in authentication';
COMMENT ON TABLE checkin_validation_rules IS 'Configurable business rules for check-in validation';
COMMENT ON TABLE checkin_sessions IS 'Active check-in sessions for future check-out functionality';
COMMENT ON TABLE checkin_analytics IS 'Pre-computed check-in analytics for reporting and dashboards';
