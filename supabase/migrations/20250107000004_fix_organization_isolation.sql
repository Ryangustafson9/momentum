-- Fix Organization Data Isolation with Proper RLS Policies
-- This migration ensures complete data isolation between organizations
-- Created: January 7, 2025

-- ==================== ENABLE RLS ON CRITICAL TABLES ====================

-- Enable RLS on profiles table (CRITICAL)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on locations table
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on memberships table
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Enable RLS on checkin_history table
ALTER TABLE checkin_history ENABLE ROW LEVEL SECURITY;

-- Enable RLS on organizations table (for admin access control)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ==================== HELPER FUNCTIONS FOR RLS ====================

-- Function to get user's organization ID
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id 
        FROM profiles 
        WHERE id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin in their organization
CREATE OR REPLACE FUNCTION is_organization_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is staff or admin in their organization
CREATE OR REPLACE FUNCTION is_organization_staff_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'staff')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== PROFILES TABLE RLS POLICIES ====================

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Staff can manage profiles in their organization" ON profiles;
DROP POLICY IF EXISTS "Global admins can view all profiles" ON profiles;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (id = auth.uid());

-- Policy: Staff and admins can view profiles in their organization
CREATE POLICY "Staff can view organization profiles" ON profiles
    FOR SELECT USING (
        organization_id = get_user_organization_id()
        AND is_organization_staff_or_admin()
    );

-- Policy: Admins can manage profiles in their organization
CREATE POLICY "Admins can manage organization profiles" ON profiles
    FOR ALL USING (
        organization_id = get_user_organization_id()
        AND is_organization_admin()
    );

-- Policy: Global admins can view all profiles (for Admin HQ)
CREATE POLICY "Global admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND is_global_admin = true
        )
    );

-- ==================== LOCATIONS TABLE RLS POLICIES ====================

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view their organization's locations" ON locations;
DROP POLICY IF EXISTS "Admins can manage their organization's locations" ON locations;

-- Policy: Users can view locations in their organization
CREATE POLICY "Users can view organization locations" ON locations
    FOR SELECT USING (
        organization_id = get_user_organization_id()
    );

-- Policy: Admins can manage locations in their organization
CREATE POLICY "Admins can manage organization locations" ON locations
    FOR ALL USING (
        organization_id = get_user_organization_id()
        AND is_organization_admin()
    );

-- Policy: Global admins can manage all locations
CREATE POLICY "Global admins can manage all locations" ON locations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND is_global_admin = true
        )
    );

-- ==================== MEMBERSHIPS TABLE RLS POLICIES ====================

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view own memberships" ON memberships;
DROP POLICY IF EXISTS "Staff can manage organization memberships" ON memberships;

-- Policy: Users can view their own memberships
CREATE POLICY "Users can view own memberships" ON memberships
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Policy: Staff can view memberships in their organization
CREATE POLICY "Staff can view organization memberships" ON memberships
    FOR SELECT USING (
        organization_id = get_user_organization_id()
        AND is_organization_staff_or_admin()
    );

-- Policy: Admins can manage memberships in their organization
CREATE POLICY "Admins can manage organization memberships" ON memberships
    FOR ALL USING (
        organization_id = get_user_organization_id()
        AND is_organization_admin()
    );

-- ==================== CHECKIN_HISTORY TABLE RLS POLICIES ====================

-- Policy: Users can view their own check-ins
CREATE POLICY "Users can view own checkins" ON checkin_history
    FOR SELECT USING (
        profile_id = auth.uid()
    );

-- Policy: Staff can view check-ins in their organization
CREATE POLICY "Staff can view organization checkins" ON checkin_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = checkin_history.profile_id
            AND profiles.organization_id = get_user_organization_id()
        )
        AND is_organization_staff_or_admin()
    );

-- Policy: Staff can manage check-ins in their organization
CREATE POLICY "Staff can manage organization checkins" ON checkin_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = checkin_history.profile_id
            AND profiles.organization_id = get_user_organization_id()
        )
        AND is_organization_staff_or_admin()
    );

-- ==================== ORGANIZATIONS TABLE RLS POLICIES ====================

-- Policy: Users can view their own organization
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (
        id = get_user_organization_id()
    );

-- Policy: Global admins can view all organizations
CREATE POLICY "Global admins can view all organizations" ON organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND is_global_admin = true
        )
    );

-- Policy: Global Admin II can manage organizations
CREATE POLICY "Global Admin II can manage organizations" ON organizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND is_global_admin = true 
            AND global_admin_level = 2
        )
    );

-- ==================== ADDITIONAL SECURITY MEASURES ====================

-- Create function to validate organization access
CREATE OR REPLACE FUNCTION validate_organization_access(target_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Allow if user belongs to the target organization
    IF target_org_id = get_user_organization_id() THEN
        RETURN TRUE;
    END IF;
    
    -- Allow if user is a global admin
    IF EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND is_global_admin = true
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== COMMENTS AND DOCUMENTATION ====================

COMMENT ON FUNCTION get_user_organization_id() IS 'Returns the organization ID for the current authenticated user';
COMMENT ON FUNCTION is_organization_admin() IS 'Returns true if the current user is an admin in their organization';
COMMENT ON FUNCTION is_organization_staff_or_admin() IS 'Returns true if the current user is staff or admin in their organization';
COMMENT ON FUNCTION validate_organization_access(UUID) IS 'Validates if the current user can access data from the specified organization';

-- ==================== VERIFICATION QUERIES ====================

-- These queries can be used to verify the RLS policies are working correctly
-- SELECT 'RLS Status Check' as check_type;
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('profiles', 'locations', 'memberships', 'checkin_history', 'organizations');
-- SELECT 'Policy Count Check' as check_type;
-- SELECT tablename, COUNT(*) as policy_count FROM pg_policies WHERE tablename IN ('profiles', 'locations', 'memberships', 'checkin_history', 'organizations') GROUP BY tablename;
