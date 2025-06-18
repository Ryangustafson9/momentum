-- ============================================================================
-- DEEP AUTH DIAGNOSTIC - Find Root Cause of Schema Error
-- ============================================================================

-- Check 1: Basic auth schema structure
SELECT 
    'AUTH SCHEMA CHECK' as check_type,
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'auth'
ORDER BY tablename;

-- Check 2: Auth users table structure
SELECT 
    'AUTH USERS COLUMNS' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Check 3: Check for any corrupted auth data
SELECT 
    'AUTH USERS DATA CHECK' as check_type,
    COUNT(*) as total_users,
    COUNT(CASE WHEN email IS NULL THEN 1 END) as null_emails,
    COUNT(CASE WHEN encrypted_password IS NULL THEN 1 END) as null_passwords,
    COUNT(CASE WHEN role IS NULL THEN 1 END) as null_roles
FROM auth.users;

-- Check 4: Specific admin user data integrity
SELECT 
    'ADMIN USER DATA' as check_type,
    id,
    email,
    role,
    aud,
    encrypted_password IS NOT NULL as has_password,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at,
    updated_at
FROM auth.users 
WHERE email = 'admin@momentum.com';

-- Check 5: Auth identities table
SELECT 
    'AUTH IDENTITIES CHECK' as check_type,
    COUNT(*) as total_identities,
    COUNT(CASE WHEN provider = 'email' THEN 1 END) as email_identities
FROM auth.identities;

-- Check 6: Admin identity data
SELECT 
    'ADMIN IDENTITY DATA' as check_type,
    i.id,
    i.user_id,
    i.provider,
    i.identity_data,
    i.created_at
FROM auth.identities i
JOIN auth.users u ON i.user_id = u.id
WHERE u.email = 'admin@momentum.com';

-- Check 7: Auth triggers and functions
SELECT 
    'AUTH TRIGGERS' as check_type,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'auth';

-- Check 8: Auth functions
SELECT 
    'AUTH FUNCTIONS' as check_type,
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'auth'
ORDER BY routine_name;

-- Check 9: Profiles table foreign key constraints
SELECT 
    'PROFILES CONSTRAINTS' as check_type,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass;

-- Check 10: Check for any auth schema corruption
DO $$
DECLARE
    rec RECORD;
    error_count INTEGER := 0;
BEGIN
    -- Test basic auth operations
    BEGIN
        PERFORM auth.uid();
    EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE NOTICE 'ERROR: auth.uid() function failed: %', SQLERRM;
    END;
    
    BEGIN
        PERFORM auth.role();
    EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE NOTICE 'ERROR: auth.role() function failed: %', SQLERRM;
    END;
    
    -- Test auth.users access
    BEGIN
        PERFORM COUNT(*) FROM auth.users LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE NOTICE 'ERROR: Cannot access auth.users table: %', SQLERRM;
    END;
    
    -- Test profiles access
    BEGIN
        PERFORM COUNT(*) FROM public.profiles LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE NOTICE 'ERROR: Cannot access profiles table: %', SQLERRM;
    END;
    
    IF error_count = 0 THEN
        RAISE NOTICE 'SUCCESS: All basic auth functions working';
    ELSE
        RAISE NOTICE 'FOUND % ERRORS in auth system', error_count;
    END IF;
END $$;

-- Check 11: Supabase specific auth configuration
SELECT 
    'SUPABASE CONFIG' as check_type,
    name,
    setting,
    category,
    short_desc
FROM pg_settings 
WHERE name LIKE '%supabase%' OR name LIKE '%auth%'
ORDER BY name;

-- Check 12: Database roles and permissions
SELECT 
    'DATABASE ROLES' as check_type,
    rolname,
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin
FROM pg_roles 
WHERE rolname IN ('anon', 'authenticated', 'service_role', 'supabase_auth_admin')
ORDER BY rolname;

-- Check 13: Schema permissions
SELECT 
    'SCHEMA PERMISSIONS' as check_type,
    schemaname,
    schemaowner,
    schemaacl
FROM pg_namespace n
JOIN pg_user u ON n.nspowner = u.usesysid
WHERE schemaname IN ('auth', 'public');

-- Check 14: Try to simulate the exact auth query that's failing
DO $$
DECLARE
    test_result RECORD;
BEGIN
    -- This simulates what Supabase auth does internally
    BEGIN
        SELECT 
            u.id,
            u.email,
            u.role,
            u.aud,
            u.email_confirmed_at,
            p.role as profile_role
        INTO test_result
        FROM auth.users u
        LEFT JOIN public.profiles p ON u.id = p.id
        WHERE u.email = 'admin@momentum.com'
        AND u.encrypted_password IS NOT NULL;
        
        IF FOUND THEN
            RAISE NOTICE 'SUCCESS: Auth query simulation worked - User ID: %', test_result.id;
        ELSE
            RAISE NOTICE 'WARNING: Auth query found no matching user';
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: Auth query simulation failed: %', SQLERRM;
    END;
END $$;

-- Check 15: Final summary
SELECT 
    'DIAGNOSTIC SUMMARY' as summary_type,
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM public.profiles) as total_profiles,
    (SELECT COUNT(*) FROM auth.identities) as total_identities,
    (SELECT COUNT(*) FROM auth.users WHERE email = 'admin@momentum.com') as admin_auth_count,
    (SELECT COUNT(*) FROM public.profiles WHERE email = 'admin@momentum.com') as admin_profile_count;
