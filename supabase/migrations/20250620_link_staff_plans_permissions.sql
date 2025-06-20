-- Link Staff Plans to Permissions System
-- This migration connects users to staff roles and enables permission-based access control

-- Add staff_role_id to profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'staff_role_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN staff_role_id TEXT REFERENCES staff_roles(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_profiles_staff_role_id ON profiles(staff_role_id);
    END IF;
END $$;

-- Create a function to get user permissions based on their staff role
CREATE OR REPLACE FUNCTION get_user_permissions(user_id UUID)
RETURNS JSONB AS $$
DECLARE
    user_permissions JSONB := '[]'::JSONB;
    staff_role_permissions JSONB;
BEGIN    -- Get permissions from the user's staff role
    SELECT sr.permissions INTO staff_role_permissions
    FROM profiles p
    JOIN staff_roles sr ON p.staff_role_id = sr.id
    WHERE p.id = user_id;
    
    -- Return the permissions array, or empty array if no role assigned
    RETURN COALESCE(staff_role_permissions, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user has a specific permission
CREATE OR REPLACE FUNCTION user_has_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_perms JSONB;
BEGIN
    user_perms := get_user_permissions(user_id);
    RETURN user_perms ? permission_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for easy access to user roles and permissions
CREATE OR REPLACE VIEW user_role_permissions AS
SELECT 
    p.id as profile_id,
    p.id as user_id,  -- Use profile id as the user identifier
    p.email,
    p.first_name,
    p.last_name,
    p.role as basic_role,
    sr.id as staff_role_id,
    sr.name as staff_role_name,
    sr.description as staff_role_description,
    sr.permissions as permissions,
    COALESCE(sr.permissions, '[]'::JSONB) as effective_permissions
FROM profiles p
LEFT JOIN staff_roles sr ON p.staff_role_id = sr.id;

-- Grant permissions
GRANT SELECT ON user_role_permissions TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_permissions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_permission(UUID, TEXT) TO authenticated;
