-- ============================================================================
-- SIMPLE AUTH DIAGNOSTIC - Find Root Cause of Schema Error
-- ============================================================================

-- Check 1: Basic auth schema structure
SELECT 
    'AUTH SCHEMA CHECK' as check_type,
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'auth'
ORDER BY tablename;

-- Check 2: Check if admin user exists in auth.users
SELECT 
    'ADMIN USER CHECK' as check_type,
    id,
    email,
    role,
    aud,
    encrypted_password IS NOT NULL as has_password,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at
FROM auth.users 
WHERE email = 'admin@momentum.com';

-- Check 3: Check if admin profile exists
SELECT 
    'ADMIN PROFILE CHECK' as check_type,
    id,
    email,
    role,
    first_name,
    last_name,
    created_at
FROM public.profiles 
WHERE email = 'admin@momentum.com';

-- Check 4: Check auth identities for admin
SELECT 
    'ADMIN IDENTITY CHECK' as check_type,
    i.id,
    i.user_id,
    i.provider,
    i.identity_data->>'email' as identity_email
FROM auth.identities i
WHERE i.identity_data->>'email' = 'admin@momentum.com';

-- Check 5: Test basic auth functions
DO $$
DECLARE
    error_count INTEGER := 0;
    test_uid UUID;
    test_role TEXT;
BEGIN
    -- Test auth.uid() function
    BEGIN
        SELECT auth.uid() INTO test_uid;
        RAISE NOTICE 'SUCCESS: auth.uid() function works';
    EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE NOTICE 'ERROR: auth.uid() function failed: %', SQLERRM;
    END;
    
    -- Test auth.role() function
    BEGIN
        SELECT auth.role() INTO test_role;
        RAISE NOTICE 'SUCCESS: auth.role() function works, current role: %', test_role;
    EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE NOTICE 'ERROR: auth.role() function failed: %', SQLERRM;
    END;
    
    -- Test auth.users table access
    BEGIN
        PERFORM COUNT(*) FROM auth.users LIMIT 1;
        RAISE NOTICE 'SUCCESS: Can access auth.users table';
    EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE NOTICE 'ERROR: Cannot access auth.users table: %', SQLERRM;
    END;
    
    -- Test profiles table access
    BEGIN
        PERFORM COUNT(*) FROM public.profiles LIMIT 1;
        RAISE NOTICE 'SUCCESS: Can access profiles table';
    EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE NOTICE 'ERROR: Cannot access profiles table: %', SQLERRM;
    END;
    
    IF error_count = 0 THEN
        RAISE NOTICE 'OVERALL: All basic auth functions working correctly';
    ELSE
        RAISE NOTICE 'OVERALL: Found % errors in auth system', error_count;
    END IF;
END $$;

-- Check 6: Database roles
SELECT 
    'DATABASE ROLES' as check_type,
    rolname,
    rolcanlogin,
    rolsuper
FROM pg_roles 
WHERE rolname IN ('anon', 'authenticated', 'service_role', 'supabase_auth_admin')
ORDER BY rolname;

-- Check 7: Schema permissions
SELECT 
    'SCHEMA PERMISSIONS' as check_type,
    nspname as schema_name,
    nspowner::regrole as owner
FROM pg_namespace 
WHERE nspname IN ('auth', 'public');

-- Check 8: Simulate the auth login query
DO $$
DECLARE
    test_result RECORD;
    admin_found BOOLEAN := FALSE;
BEGIN
    -- This simulates what Supabase does during login
    BEGIN
        SELECT 
            u.id,
            u.email,
            u.role,
            u.aud,
            u.encrypted_password IS NOT NULL as has_password,
            u.email_confirmed_at IS NOT NULL as email_confirmed
        INTO test_result
        FROM auth.users u
        WHERE u.email = 'admin@momentum.com';
        
        IF FOUND THEN
            admin_found := TRUE;
            RAISE NOTICE 'AUTH SIMULATION SUCCESS: Found admin user with ID: %', test_result.id;
            RAISE NOTICE 'AUTH SIMULATION: Email: %, Role: %, Has Password: %, Email Confirmed: %', 
                         test_result.email, test_result.role, test_result.has_password, test_result.email_confirmed;
        ELSE
            RAISE NOTICE 'AUTH SIMULATION WARNING: No admin user found';
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'AUTH SIMULATION ERROR: %', SQLERRM;
    END;
    
    -- Test profile lookup
    IF admin_found THEN
        BEGIN
            SELECT 
                p.id,
                p.email,
                p.role
            INTO test_result
            FROM public.profiles p
            WHERE p.id = test_result.id;
            
            IF FOUND THEN
                RAISE NOTICE 'PROFILE SIMULATION SUCCESS: Found admin profile with role: %', test_result.role;
            ELSE
                RAISE NOTICE 'PROFILE SIMULATION WARNING: No admin profile found';
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'PROFILE SIMULATION ERROR: %', SQLERRM;
        END;
    END IF;
END $$;

-- Check 9: RLS status
SELECT 
    'RLS STATUS' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- Check 10: Current policies on profiles
SELECT 
    'CURRENT POLICIES' as check_type,
    policyname,
    cmd as command,
    permissive,
    roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- Check 11: Final summary
SELECT 
    'SUMMARY' as check_type,
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM public.profiles) as total_profiles,
    (SELECT COUNT(*) FROM auth.identities) as total_identities,
    (SELECT COUNT(*) FROM auth.users WHERE email = 'admin@momentum.com') as admin_in_auth,
    (SELECT COUNT(*) FROM public.profiles WHERE email = 'admin@momentum.com') as admin_in_profiles;
