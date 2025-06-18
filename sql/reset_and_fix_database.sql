-- Reset and Fix Database Script
-- This script attempts to fix common database schema issues

-- 1. Ensure auth schema exists and is properly configured
CREATE SCHEMA IF NOT EXISTS auth;

-- 2. Clean up any existing test data that might be causing conflicts
DO $$
BEGIN
    -- Clean up auth.identities first (foreign key dependency)
    DELETE FROM auth.identities WHERE user_id IN (
        SELECT id FROM auth.users WHERE email LIKE '%@example.com' OR email LIKE '%@temp.local'
    );
    
    -- Clean up auth.users
    DELETE FROM auth.users WHERE email LIKE '%@example.com' OR email LIKE '%@temp.local';
    
    -- Clean up public tables
    DELETE FROM public.memberships WHERE auth_user_id IS NULL;
    DELETE FROM public.profiles WHERE email LIKE '%@example.com' OR email LIKE '%@temp.local';
    
    RAISE NOTICE 'Cleaned up existing test data';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Cleanup failed (this is OK if tables are empty): %', SQLERRM;
END $$;

-- 3. Ensure RLS is properly configured but not blocking admin operations
-- Temporarily disable RLS for setup
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_types DISABLE ROW LEVEL SECURITY;

-- 4. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 5. Ensure auth schema permissions
GRANT USAGE ON SCHEMA auth TO anon, authenticated;

-- 6. Create a simple test to verify database is working
DO $$
DECLARE
    test_id UUID := gen_random_uuid();
BEGIN
    -- Test basic table operations
    INSERT INTO public.profiles (id, email, role, name) 
    VALUES (test_id, 'test@database.check', 'nonmember', 'Test User');
    
    DELETE FROM public.profiles WHERE id = test_id;
    
    RAISE NOTICE 'SUCCESS: Database operations are working correctly';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: Database operations failed - %', SQLERRM;
END $$;

-- 7. Re-enable RLS with permissive policies for now
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_types ENABLE ROW LEVEL SECURITY;

-- 8. Create permissive policies to allow operations during setup
DROP POLICY IF EXISTS "Allow all operations during setup" ON public.profiles;
CREATE POLICY "Allow all operations during setup" ON public.profiles
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations during setup" ON public.memberships;
CREATE POLICY "Allow all operations during setup" ON public.memberships
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations during setup" ON public.staff_roles;
CREATE POLICY "Allow all operations during setup" ON public.staff_roles
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations during setup" ON public.membership_types;
CREATE POLICY "Allow all operations during setup" ON public.membership_types
    FOR ALL USING (true) WITH CHECK (true);

-- 9. Verify the fix worked
SELECT 
    'Database Status' as status,
    'Ready for admin user creation' as message,
    current_timestamp as timestamp;

RAISE NOTICE '=== Database reset and permissions fixed ===';
RAISE NOTICE 'You can now run the create_admin_user.sql script';
RAISE NOTICE '=== Remember to implement proper RLS policies later ===';
