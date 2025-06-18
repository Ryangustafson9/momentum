-- Database Diagnostic Script
-- This script checks for common issues that cause "Database error querying schema"

-- 1. Check if auth schema exists and has required tables
SELECT 
    'Auth Schema Check' as check_type,
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'auth'
ORDER BY tablename;

-- 2. Check if public schema tables exist
SELECT 
    'Public Schema Check' as check_type,
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'memberships', 'staff_roles', 'membership_types')
ORDER BY tablename;

-- 3. Check auth.users table structure
SELECT 
    'Auth Users Structure' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 4. Check profiles table structure
SELECT 
    'Profiles Structure' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 5. Check for RLS policies on critical tables
SELECT 
    'RLS Status Check' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname IN ('auth', 'public')
AND tablename IN ('users', 'profiles', 'memberships')
ORDER BY schemaname, tablename;

-- 6. Check auth configuration
SELECT 
    'Auth Config Check' as check_type,
    name,
    setting
FROM pg_settings 
WHERE name LIKE '%auth%' OR name LIKE '%jwt%'
ORDER BY name;

-- 7. Test basic database connectivity
SELECT 
    'Database Connectivity' as check_type,
    current_database() as database_name,
    current_user as current_user,
    version() as postgres_version;

-- 8. Check if there are any users in auth.users (should be empty after cleanup)
SELECT 
    'Auth Users Count' as check_type,
    COUNT(*) as user_count
FROM auth.users;

-- 9. Check if there are any profiles (should be empty after cleanup)
SELECT 
    'Profiles Count' as check_type,
    COUNT(*) as profile_count
FROM public.profiles;

-- 10. Check for any foreign key constraints that might be causing issues
SELECT 
    'Foreign Key Constraints' as check_type,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN ('profiles', 'memberships')
ORDER BY tc.table_name, tc.constraint_name;

-- 11. Check for any triggers that might be interfering
SELECT 
    'Triggers Check' as check_type,
    trigger_name,
    event_manipulation,
    event_object_table,
    trigger_schema
FROM information_schema.triggers
WHERE trigger_schema IN ('auth', 'public')
AND event_object_table IN ('users', 'profiles', 'memberships')
ORDER BY trigger_schema, event_object_table;

-- 12. Test if we can actually query auth.users (this might fail if there are permission issues)
DO $$
BEGIN
    BEGIN
        PERFORM COUNT(*) FROM auth.users LIMIT 1;
        RAISE NOTICE 'SUCCESS: Can query auth.users table';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: Cannot query auth.users table - %', SQLERRM;
    END;
END $$;

-- 13. Test if we can actually query public.profiles
DO $$
BEGIN
    BEGIN
        PERFORM COUNT(*) FROM public.profiles LIMIT 1;
        RAISE NOTICE 'SUCCESS: Can query public.profiles table';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: Cannot query public.profiles table - %', SQLERRM;
    END;
END $$;
