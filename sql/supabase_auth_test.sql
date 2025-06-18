-- Test Supabase Auth Configuration
-- Run this to check if Supabase auth is properly set up

-- 1. Check if Supabase auth functions exist
SELECT 
    'Auth Functions' as check_type,
    n.nspname as schema_name,
    p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'auth'
AND p.proname LIKE '%sign%'
ORDER BY p.proname;

-- 2. Check if anon and authenticated roles exist
SELECT 
    'Supabase Roles' as check_type,
    rolname as role_name,
    rolcanlogin as can_login
FROM pg_roles 
WHERE rolname IN ('anon', 'authenticated', 'service_role')
ORDER BY rolname;

-- 3. Check RLS policies on auth.users
SELECT 
    'Auth Users RLS' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'auth' AND tablename = 'users';

-- 4. Test if we can switch to anon role (this might fail)
SET ROLE anon;
SELECT 'Role Switch Test' as test, current_user as current_role;
RESET ROLE;

-- 5. Check JWT configuration
SELECT 
    'JWT Config' as check_type,
    name,
    setting
FROM pg_settings 
WHERE name LIKE '%jwt%' OR name LIKE '%pgjwt%'
ORDER BY name;
