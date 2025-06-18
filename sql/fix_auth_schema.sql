-- ============================================================================
-- FIX AUTH SCHEMA ISSUES
-- ============================================================================
-- This script fixes common auth schema problems that cause login failures

-- Step 1: Ensure foreign key constraint exists (if not already added)
DO $fix_schema$
BEGIN
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.profiles'::regclass 
        AND conname = 'profiles_id_fkey'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_id_fkey 
        FOREIGN KEY (id) REFERENCES auth.users(id) 
        ON DELETE CASCADE;
    END IF;
END $fix_schema$;

-- Step 2: Fix any orphaned profiles (profiles without auth users)
DELETE FROM public.profiles 
WHERE id NOT IN (
    SELECT id FROM auth.users
);

-- Step 3: Ensure admin user has proper role in auth.users
UPDATE auth.users 
SET 
    role = 'authenticated',
    aud = 'authenticated'
WHERE email = 'admin@momentum.com';

-- Step 4: Ensure admin profile exists and has correct role
DO $ensure_admin_profile$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@momentum.com';
    
    IF admin_user_id IS NOT NULL THEN
        -- Insert or update admin profile
        INSERT INTO public.profiles (
            id,
            email,
            first_name,
            last_name,
            name,
            role,
            created_at
        ) VALUES (
            admin_user_id,
            'admin@momentum.com',
            'System',
            'Administrator',
            'System Administrator',
            'admin',
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            role = 'admin',
            email = 'admin@momentum.com',
            first_name = COALESCE(profiles.first_name, 'System'),
            last_name = COALESCE(profiles.last_name, 'Administrator'),
            name = COALESCE(profiles.name, 'System Administrator');
    END IF;
END $ensure_admin_profile$;

-- Step 5: Ensure proper RLS policies exist for profiles table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- Create proper RLS policies
CREATE POLICY "Enable read access for authenticated users" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT USAGE ON SCHEMA auth TO authenticated;

-- Step 7: Verify admin user setup
DO $verify_admin$
DECLARE
    admin_user_id UUID;
    admin_profile_exists BOOLEAN;
    admin_identity_exists BOOLEAN;
BEGIN
    -- Check admin user exists
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@momentum.com';
    
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Admin user not found in auth.users';
    END IF;
    
    -- Check admin profile exists
    SELECT EXISTS(
        SELECT 1 FROM public.profiles 
        WHERE id = admin_user_id AND role = 'admin'
    ) INTO admin_profile_exists;
    
    IF NOT admin_profile_exists THEN
        RAISE EXCEPTION 'Admin profile not found or role not set correctly';
    END IF;
    
    -- Check admin identity exists
    SELECT EXISTS(
        SELECT 1 FROM auth.identities 
        WHERE user_id = admin_user_id
    ) INTO admin_identity_exists;
    
    IF NOT admin_identity_exists THEN
        RAISE EXCEPTION 'Admin identity record not found';
    END IF;
    
END $verify_admin$;

-- Step 8: Create a function to safely get user profile (for debugging)
CREATE OR REPLACE FUNCTION get_user_profile_safe(user_email TEXT)
RETURNS TABLE(
    user_id UUID,
    email TEXT,
    role TEXT,
    first_name TEXT,
    last_name TEXT,
    auth_role TEXT,
    email_confirmed BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.email,
        p.role,
        p.first_name,
        p.last_name,
        u.role as auth_role,
        (u.email_confirmed_at IS NOT NULL) as email_confirmed
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE u.email = user_email;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_profile_safe(TEXT) TO authenticated;

-- Display final verification
SELECT 
    'ADMIN USER VERIFICATION' as status,
    u.id as user_id,
    u.email,
    u.role as auth_role,
    u.aud,
    (u.email_confirmed_at IS NOT NULL) as email_confirmed,
    p.role as profile_role,
    p.first_name,
    p.last_name,
    (i.id IS NOT NULL) as has_identity
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN auth.identities i ON u.id = i.user_id
WHERE u.email = 'admin@momentum.com';

-- Test the safe profile function
SELECT * FROM get_user_profile_safe('admin@momentum.com');
