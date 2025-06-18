-- Simple Database Test
-- Run this one query at a time to isolate the issue

-- Test 1: Basic database connectivity
SELECT 'Database Test' as test, current_database() as database, current_user as user;

-- Test 2: Check auth schema tables
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'auth' 
ORDER BY tablename;

-- Test 3: Try to access auth.users (this might fail)
SELECT COUNT(*) as user_count FROM auth.users;

-- Test 4: Check RLS on auth.users
SELECT tablename, rowsecurity as rls_enabled 
FROM pg_tables 
WHERE schemaname = 'auth' AND tablename = 'users';

-- Test 5: Check current role permissions
SELECT 
    r.rolname as role_name,
    r.rolsuper as is_superuser,
    r.rolcreaterole as can_create_roles,
    r.rolcreatedb as can_create_db
FROM pg_roles r 
WHERE r.rolname = current_user;

-- Test 6: Try a simple NOTICE (to see if DO blocks work)
DO $$ BEGIN RAISE NOTICE 'Test notice message'; END $$;
