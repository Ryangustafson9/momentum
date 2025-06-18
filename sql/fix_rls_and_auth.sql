-- ============================================================================
-- FIX RLS AND AUTH ISSUES
-- ============================================================================
-- This script fixes the specific issues found in the diagnostic

-- Step 1: Enable RLS on profiles table (this was disabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 2: Create proper RLS policies for profiles table
-- Drop any existing policies first
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create new RLS policies
-- Allow authenticated users to read all profiles (needed for admin functions)
CREATE POLICY "Enable read access for authenticated users" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 3: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Step 4: Create the missing create_profile_safe function
CREATE OR REPLACE FUNCTION create_profile_safe(
    p_user_id UUID,
    p_email TEXT,
    p_role TEXT DEFAULT 'nonmember',
    p_first_name TEXT DEFAULT '',
    p_last_name TEXT DEFAULT '',
    p_phone TEXT DEFAULT NULL
)
RETURNS public.profiles AS $$
DECLARE
    result_profile public.profiles;
    auth_user_email TEXT;
BEGIN
    -- Validate that auth user exists
    SELECT email INTO auth_user_email 
    FROM auth.users 
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cannot create profile: auth user with id % does not exist', p_user_id;
    END IF;
    
    -- Use auth user email if provided email doesn't match
    IF auth_user_email IS NOT NULL AND auth_user_email != p_email THEN
        p_email := auth_user_email;
    END IF;
    
    -- Create the profile
    INSERT INTO public.profiles (
        id,
        email,
        role,
        first_name,
        last_name,
        name,
        phone,
        created_at
    ) VALUES (
        p_user_id,
        p_email,
        p_role,
        p_first_name,
        p_last_name,
        TRIM(CONCAT(p_first_name, ' ', p_last_name)),
        p_phone,
        NOW()
    )
    RETURNING * INTO result_profile;
    
    RETURN result_profile;
    
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Profile with id % or email % already exists', p_user_id, p_email;
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'Cannot create profile: auth user with id % does not exist', p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_profile_safe(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Step 5: Ensure admin user has proper setup
DO $fix_admin$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@momentum.com';
    
    IF admin_user_id IS NOT NULL THEN
        -- Ensure admin profile exists with correct role
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
END $fix_admin$;

-- Step 6: Add foreign key constraint if missing
DO $add_fk$
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
END $add_fk$;

-- Step 7: Test the setup
-- Verify admin user can be queried
SELECT 
    'ADMIN VERIFICATION' as status,
    u.id as user_id,
    u.email as auth_email,
    u.role as auth_role,
    p.email as profile_email,
    p.role as profile_role,
    p.first_name,
    p.last_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'admin@momentum.com';

-- Test RLS is working
SELECT 
    'RLS TEST' as test_type,
    COUNT(*) as profile_count
FROM public.profiles;

-- Show final RLS status
SELECT 
    'FINAL RLS STATUS' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';
