-- Quick Diagnosis for "Database error querying schema"
-- Run this in your local Supabase Studio (http://127.0.0.1:54323)

-- 1. Check if auth schema and tables exist
SELECT 'Auth Tables' as check_type, COUNT(*) as table_count
FROM pg_tables 
WHERE schemaname = 'auth';

-- 2. Check if auth.users table exists and is accessible
DO $$
BEGIN
    BEGIN
        PERFORM 1 FROM auth.users LIMIT 1;
        RAISE NOTICE 'SUCCESS: auth.users table is accessible';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: auth.users table issue - %', SQLERRM;
    END;
END $$;

-- 3. Check if public.profiles table exists and is accessible
DO $$
BEGIN
    BEGIN
        PERFORM 1 FROM public.profiles LIMIT 1;
        RAISE NOTICE 'SUCCESS: public.profiles table is accessible';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: public.profiles table issue - %', SQLERRM;
    END;
END $$;

-- 4. Check current user and permissions
SELECT 
    'Current User Info' as check_type,
    current_user as current_user,
    session_user as session_user,
    current_database() as database;

-- 5. Check RLS status on critical tables
SELECT 
    'RLS Status' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'RLS is ON - may block operations'
        ELSE 'RLS is OFF - operations should work'
    END as status
FROM pg_tables 
WHERE schemaname IN ('auth', 'public')
AND tablename IN ('users', 'profiles', 'memberships')
ORDER BY schemaname, tablename;

-- 6. Count existing data
SELECT 'Data Count' as check_type, 'auth.users' as table_name, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'Data Count' as check_type, 'public.profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'Data Count' as check_type, 'public.memberships' as table_name, COUNT(*) as count FROM public.memberships;

-- 7. Test basic auth operations
DO $$
DECLARE
    test_email TEXT := 'test@diagnosis.local';
    test_user_id UUID;
BEGIN
    -- Try to create a test user in auth.users
    BEGIN
        INSERT INTO auth.users (
            id, email, encrypted_password, email_confirmed_at, 
            created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
            aud, role
        ) VALUES (
            gen_random_uuid(), test_email, 'test_password', NOW(),
            NOW(), NOW(), '{}', '{}',
            'authenticated', 'authenticated'
        ) RETURNING id INTO test_user_id;
        
        RAISE NOTICE 'SUCCESS: Can create auth.users record';
        
        -- Clean up test user
        DELETE FROM auth.users WHERE email = test_email;
        RAISE NOTICE 'SUCCESS: Can delete auth.users record';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: Cannot create auth.users record - %', SQLERRM;
    END;
END $$;

-- 8. Check if Supabase auth functions exist
SELECT 
    'Auth Functions' as check_type,
    proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'auth'
AND proname IN ('sign_in', 'sign_up', 'jwt')
ORDER BY proname;

-- 9. Final diagnosis
SELECT 
    'DIAGNOSIS' as result_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users')
        THEN 'Auth schema exists'
        ELSE 'AUTH SCHEMA MISSING - This is the problem!'
    END as auth_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles')
        THEN 'Profiles table exists'
        ELSE 'PROFILES TABLE MISSING'
    END as profiles_status;
