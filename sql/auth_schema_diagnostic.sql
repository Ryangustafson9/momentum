-- ============================================================================
-- COMPREHENSIVE AUTH SCHEMA DIAGNOSTIC
-- ============================================================================
-- This script diagnoses all potential causes of "Database error querying schema"

-- DIAGNOSTIC 1: Auth Schema Structure
SELECT 
    '🔍 AUTH SCHEMA TABLES' as diagnostic,
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'auth'
ORDER BY tablename;

-- DIAGNOSTIC 2: Auth Functions Existence
SELECT 
    '🔍 AUTH FUNCTIONS' as diagnostic,
    routine_name,
    routine_type,
    security_type,
    is_deterministic
FROM information_schema.routines 
WHERE routine_schema = 'auth'
AND routine_name IN ('uid', 'role', 'jwt')
ORDER BY routine_name;

-- DIAGNOSTIC 3: Test Auth Functions
DO $$
DECLARE
    test_uid UUID;
    test_role TEXT;
    error_count INTEGER := 0;
BEGIN
    -- Test auth.uid()
    BEGIN
        SELECT auth.uid() INTO test_uid;
        RAISE NOTICE '✅ auth.uid() function works: %', COALESCE(test_uid::text, 'NULL');
    EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE NOTICE '❌ auth.uid() function failed: %', SQLERRM;
    END;
    
    -- Test auth.role()
    BEGIN
        SELECT auth.role() INTO test_role;
        RAISE NOTICE '✅ auth.role() function works: %', COALESCE(test_role, 'NULL');
    EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE NOTICE '❌ auth.role() function failed: %', SQLERRM;
    END;
    
    IF error_count = 0 THEN
        RAISE NOTICE '🎉 All auth functions working correctly';
    ELSE
        RAISE NOTICE '⚠️  Found % auth function errors', error_count;
    END IF;
END $$;

-- DIAGNOSTIC 4: Admin User Data Integrity
SELECT 
    '🔍 ADMIN USER AUTH DATA' as diagnostic,
    u.id,
    u.email,
    u.role,
    u.aud,
    u.encrypted_password IS NOT NULL as has_password,
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    u.created_at,
    u.instance_id
FROM auth.users u
WHERE u.email = 'admin@momentum.com';

-- DIAGNOSTIC 5: Admin Identity Data
SELECT 
    '🔍 ADMIN IDENTITY DATA' as diagnostic,
    i.id,
    i.user_id,
    i.provider,
    i.provider_id,
    i.identity_data,
    i.created_at
FROM auth.identities i
JOIN auth.users u ON i.user_id = u.id
WHERE u.email = 'admin@momentum.com';

-- DIAGNOSTIC 6: Admin Profile Data
SELECT 
    '🔍 ADMIN PROFILE DATA' as diagnostic,
    p.id,
    p.email,
    p.role,
    p.first_name,
    p.last_name,
    p.name,
    p.created_at
FROM public.profiles p
WHERE p.email = 'admin@momentum.com';

-- DIAGNOSTIC 7: RLS Status and Policies
SELECT 
    '🔍 RLS STATUS' as diagnostic,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') as policy_count
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- DIAGNOSTIC 8: Current RLS Policies
SELECT 
    '🔍 CURRENT RLS POLICIES' as diagnostic,
    policyname,
    cmd as command,
    permissive,
    roles,
    qual as using_expression,
    with_check as check_expression
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- DIAGNOSTIC 9: Database Permissions
SELECT 
    '🔍 SCHEMA PERMISSIONS' as diagnostic,
    nspname as schema_name,
    nspowner::regrole as owner,
    nspacl as permissions
FROM pg_namespace 
WHERE nspname IN ('auth', 'public');

-- DIAGNOSTIC 10: Role Permissions
SELECT 
    '🔍 ROLE PERMISSIONS' as diagnostic,
    rolname,
    rolsuper,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin,
    rolreplication
FROM pg_roles 
WHERE rolname IN ('anon', 'authenticated', 'service_role', 'supabase_auth_admin', 'postgres')
ORDER BY rolname;

-- DIAGNOSTIC 11: Table Permissions
SELECT 
    '🔍 TABLE PERMISSIONS' as diagnostic,
    schemaname,
    tablename,
    tableowner,
    (SELECT string_agg(privilege_type, ', ') 
     FROM information_schema.table_privileges 
     WHERE table_schema = pt.schemaname 
     AND table_name = pt.tablename 
     AND grantee = 'authenticated') as authenticated_privileges
FROM pg_tables pt
WHERE schemaname IN ('auth', 'public')
AND tablename IN ('users', 'identities', 'profiles')
ORDER BY schemaname, tablename;

-- DIAGNOSTIC 12: Foreign Key Constraints
SELECT 
    '🔍 FOREIGN KEY CONSTRAINTS' as diagnostic,
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as referenced_table,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE contype = 'f' 
AND (conrelid::regclass::text LIKE '%profiles%' OR confrelid::regclass::text LIKE '%users%');

-- DIAGNOSTIC 13: Simulate Auth Login Query
DO $$
DECLARE
    admin_record RECORD;
    error_occurred BOOLEAN := FALSE;
BEGIN
    -- This simulates the exact query Supabase auth performs
    BEGIN
        SELECT 
            u.id,
            u.email,
            u.encrypted_password,
            u.email_confirmed_at,
            u.role,
            u.aud,
            p.role as profile_role
        INTO admin_record
        FROM auth.users u
        LEFT JOIN public.profiles p ON u.id = p.id
        WHERE u.email = 'admin@momentum.com'
        AND u.encrypted_password IS NOT NULL;
        
        IF FOUND THEN
            RAISE NOTICE '✅ AUTH SIMULATION SUCCESS: Found admin user';
            RAISE NOTICE '   User ID: %', admin_record.id;
            RAISE NOTICE '   Email: %', admin_record.email;
            RAISE NOTICE '   Auth Role: %', admin_record.role;
            RAISE NOTICE '   Profile Role: %', admin_record.profile_role;
            RAISE NOTICE '   Email Confirmed: %', (admin_record.email_confirmed_at IS NOT NULL);
        ELSE
            RAISE NOTICE '❌ AUTH SIMULATION FAILED: No admin user found';
            error_occurred := TRUE;
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ AUTH SIMULATION ERROR: %', SQLERRM;
        error_occurred := TRUE;
    END;
    
    IF NOT error_occurred THEN
        RAISE NOTICE '🎉 Auth simulation completed successfully';
    END IF;
END $$;

-- DIAGNOSTIC 14: Check for Missing Extensions
SELECT 
    '🔍 REQUIRED EXTENSIONS' as diagnostic,
    extname,
    extversion,
    extrelocatable
FROM pg_extension 
WHERE extname IN ('pgcrypto', 'uuid-ossp', 'pgjwt')
ORDER BY extname;

-- DIAGNOSTIC 15: Instance Configuration
SELECT 
    '🔍 INSTANCE CONFIG' as diagnostic,
    name,
    setting,
    category
FROM pg_settings 
WHERE name IN ('shared_preload_libraries', 'log_statement', 'log_min_messages')
ORDER BY name;

-- DIAGNOSTIC SUMMARY
DO $$
DECLARE
    auth_users_count INTEGER;
    profiles_count INTEGER;
    identities_count INTEGER;
    admin_auth_exists BOOLEAN;
    admin_profile_exists BOOLEAN;
    admin_identity_exists BOOLEAN;
    rls_enabled BOOLEAN;
    policies_count INTEGER;
BEGIN
    -- Count records
    SELECT COUNT(*) INTO auth_users_count FROM auth.users;
    SELECT COUNT(*) INTO profiles_count FROM public.profiles;
    SELECT COUNT(*) INTO identities_count FROM auth.identities;
    
    -- Check admin existence
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin@momentum.com') INTO admin_auth_exists;
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE email = 'admin@momentum.com') INTO admin_profile_exists;
    SELECT EXISTS(SELECT 1 FROM auth.identities i JOIN auth.users u ON i.user_id = u.id WHERE u.email = 'admin@momentum.com') INTO admin_identity_exists;
    
    -- Check RLS
    SELECT rowsecurity INTO rls_enabled FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles';
    SELECT COUNT(*) INTO policies_count FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles';
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 DIAGNOSTIC SUMMARY';
    RAISE NOTICE '==================';
    RAISE NOTICE 'Auth Users: %', auth_users_count;
    RAISE NOTICE 'Profiles: %', profiles_count;
    RAISE NOTICE 'Identities: %', identities_count;
    RAISE NOTICE 'Admin in auth.users: %', admin_auth_exists;
    RAISE NOTICE 'Admin in profiles: %', admin_profile_exists;
    RAISE NOTICE 'Admin has identity: %', admin_identity_exists;
    RAISE NOTICE 'RLS enabled on profiles: %', rls_enabled;
    RAISE NOTICE 'RLS policies count: %', policies_count;
    RAISE NOTICE '';
    
    IF admin_auth_exists AND admin_profile_exists AND admin_identity_exists AND rls_enabled THEN
        RAISE NOTICE '🎉 BASIC SETUP LOOKS GOOD - Issue may be in auth functions or permissions';
    ELSE
        RAISE NOTICE '⚠️  SETUP ISSUES DETECTED - Missing components found';
    END IF;
END $$;
