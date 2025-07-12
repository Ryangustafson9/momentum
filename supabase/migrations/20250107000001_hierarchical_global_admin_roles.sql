-- Hierarchical Global Admin Role System
-- Implements Global Admin I (Standard) and Global Admin II (Super Admin) roles
-- Created: January 7, 2025

-- ==================== GLOBAL ADMIN ROLE LEVELS ====================

-- Add global_admin_level column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS global_admin_level INTEGER DEFAULT NULL 
CHECK (global_admin_level IN (1, 2));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_global_admin_level 
ON profiles(global_admin_level) 
WHERE global_admin_level IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN profiles.global_admin_level IS 'Global Admin hierarchy: 1 = Global Admin I (Standard), 2 = Global Admin II (Super Admin). NULL for non-global admins.';

-- ==================== UPDATE EXISTING GLOBAL ADMINS ====================

-- Set ryan@momentum.pro as Global Admin II (Super Admin)
UPDATE profiles 
SET global_admin_level = 2 
WHERE email = 'ryan@momentum.pro' 
AND is_global_admin = true;

-- Set any other existing global admins as Global Admin I (Standard)
UPDATE profiles 
SET global_admin_level = 1 
WHERE is_global_admin = true 
AND global_admin_level IS NULL 
AND email != 'ryan@momentum.pro';

-- ==================== ADMIN HQ USER MANAGEMENT TABLE ====================

-- Create admin_hq_users table for internal admin dashboard user management
CREATE TABLE IF NOT EXISTS admin_hq_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User Information
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  
  -- Role and Permissions
  global_admin_level INTEGER NOT NULL CHECK (global_admin_level IN (1, 2)),
  is_active BOOLEAN DEFAULT true,
  
  -- Access Control
  allowed_organizations UUID[] DEFAULT '{}', -- Empty array means access to all
  sso_access_enabled BOOLEAN DEFAULT true,
  
  -- Audit Fields
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  notes TEXT,
  
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Add indexes for admin_hq_users
CREATE INDEX IF NOT EXISTS idx_admin_hq_users_email ON admin_hq_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_hq_users_level ON admin_hq_users(global_admin_level);
CREATE INDEX IF NOT EXISTS idx_admin_hq_users_active ON admin_hq_users(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_admin_hq_users_created_by ON admin_hq_users(created_by);

-- Add comments
COMMENT ON TABLE admin_hq_users IS 'Internal Admin HQ user management for Global Admin I and II accounts';
COMMENT ON COLUMN admin_hq_users.global_admin_level IS '1 = Global Admin I (Standard), 2 = Global Admin II (Super Admin)';
COMMENT ON COLUMN admin_hq_users.allowed_organizations IS 'Array of organization UUIDs. Empty array means access to all organizations.';

-- ==================== AUDIT LOG ENHANCEMENTS ====================

-- Add admin_hq_action_type for tracking admin HQ specific actions
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS admin_hq_action_type VARCHAR(50);

-- Add index for admin HQ actions
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_hq_action 
ON audit_logs(admin_hq_action_type) 
WHERE admin_hq_action_type IS NOT NULL;

-- ==================== FUNCTIONS ====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_hq_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE TRIGGER trigger_admin_hq_users_updated_at
    BEFORE UPDATE ON admin_hq_users
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_hq_users_updated_at();

-- Function to check Global Admin II permissions
CREATE OR REPLACE FUNCTION is_global_admin_ii(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND is_global_admin = true 
        AND global_admin_level = 2
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check Global Admin I or II permissions
CREATE OR REPLACE FUNCTION is_global_admin_any_level(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND is_global_admin = true 
        AND global_admin_level IN (1, 2)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS on admin_hq_users
ALTER TABLE admin_hq_users ENABLE ROW LEVEL SECURITY;

-- Policy: Global Admin II can manage all admin HQ users
CREATE POLICY "Global Admin II can manage all admin HQ users" ON admin_hq_users
    FOR ALL USING (is_global_admin_ii(auth.uid()));

-- Policy: Global Admin I can view admin HQ users but not modify
CREATE POLICY "Global Admin I can view admin HQ users" ON admin_hq_users
    FOR SELECT USING (is_global_admin_any_level(auth.uid()));

-- ==================== INITIAL DATA ====================

-- Insert ryan@momentum.pro as the initial Global Admin II
INSERT INTO admin_hq_users (
    email,
    first_name,
    last_name,
    global_admin_level,
    is_active,
    sso_access_enabled,
    created_by,
    notes
) VALUES (
    'ryan@momentum.pro',
    'Ryan',
    'Gustafson',
    2,
    true,
    true,
    (SELECT id FROM profiles WHERE email = 'ryan@momentum.pro' LIMIT 1),
    'Initial Global Admin II - Super Admin with full privileges'
) ON CONFLICT (email) DO UPDATE SET
    global_admin_level = EXCLUDED.global_admin_level,
    updated_at = NOW();

-- ==================== HELPER VIEWS ====================

-- View for easy admin HQ user management
CREATE OR REPLACE VIEW admin_hq_users_view AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.global_admin_level,
    CASE 
        WHEN u.global_admin_level = 1 THEN 'Global Admin I (Standard)'
        WHEN u.global_admin_level = 2 THEN 'Global Admin II (Super Admin)'
        ELSE 'Unknown'
    END as role_display,
    u.is_active,
    u.sso_access_enabled,
    u.allowed_organizations,
    u.created_at,
    u.updated_at,
    u.last_login_at,
    u.notes,
    creator.first_name || ' ' || creator.last_name as created_by_name,
    updater.first_name || ' ' || updater.last_name as updated_by_name
FROM admin_hq_users u
LEFT JOIN profiles creator ON u.created_by = creator.id
LEFT JOIN profiles updater ON u.updated_by = updater.id;

-- Grant access to the view
GRANT SELECT ON admin_hq_users_view TO authenticated;

-- ==================== COMMENTS AND DOCUMENTATION ====================

COMMENT ON COLUMN profiles.global_admin_level IS 'Hierarchical Global Admin levels: 1 = Global Admin I (Standard - can view orgs and SSO), 2 = Global Admin II (Super Admin - can manage other admins)';
COMMENT ON FUNCTION is_global_admin_ii(UUID) IS 'Returns true if the user is a Global Admin II (Super Admin) with user management privileges';
COMMENT ON FUNCTION is_global_admin_any_level(UUID) IS 'Returns true if the user is a Global Admin of any level (I or II)';
COMMENT ON VIEW admin_hq_users_view IS 'Comprehensive view of Admin HQ users with role information and creator details';
