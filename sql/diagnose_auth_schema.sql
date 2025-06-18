-- ============================================================================
-- DIAGNOSE AUTH SCHEMA ISSUES
-- ============================================================================
-- This script checks for common schema issues that cause auth failures

-- Check if admin user exists in auth.users
SELECT 
    'AUTH USERS CHECK' as check_type,
    COUNT(*) as total_users,
    COUNT(CASE WHEN email = 'admin@momentum.com' THEN 1 END) as admin_users
FROM auth.users;

-- Check admin user details
SELECT 
    'ADMIN USER DETAILS' as check_type,
    id,
    email,
    email_confirmed_at,
    phone_confirmed_at,
    confirmed_at,
    role,
    aud,
    created_at
FROM auth.users 
WHERE email = 'admin@momentum.com';

-- Check if admin profile exists
SELECT 
    'PROFILE CHECK' as check_type,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN email = 'admin@momentum.com' THEN 1 END) as admin_profiles
FROM public.profiles;

-- Check admin profile details
SELECT 
    'ADMIN PROFILE DETAILS' as check_type,
    id,
    email,
    first_name,
    last_name,
    role,
    created_at
FROM public.profiles 
WHERE email = 'admin@momentum.com';

-- Check identity records
SELECT 
    'IDENTITY CHECK' as check_type,
    COUNT(*) as total_identities,
    COUNT(CASE WHEN identity_data->>'email' = 'admin@momentum.com' THEN 1 END) as admin_identities
FROM auth.identities;

-- Check admin identity details
SELECT 
    'ADMIN IDENTITY DETAILS' as check_type,
    id,
    user_id,
    provider,
    identity_data,
    created_at
FROM auth.identities 
WHERE identity_data->>'email' = 'admin@momentum.com';

-- Check for foreign key constraint issues
SELECT 
    'FOREIGN KEY CHECK' as check_type,
    p.id as profile_id,
    u.id as user_id,
    CASE 
        WHEN p.id IS NOT NULL AND u.id IS NULL THEN 'ORPHANED_PROFILE'
        WHEN p.id IS NULL AND u.id IS NOT NULL THEN 'MISSING_PROFILE'
        WHEN p.id IS NOT NULL AND u.id IS NOT NULL THEN 'VALID'
        ELSE 'UNKNOWN'
    END as status
FROM public.profiles p
FULL OUTER JOIN auth.users u ON p.id = u.id
WHERE p.email = 'admin@momentum.com' OR u.email = 'admin@momentum.com';

-- Check profiles table structure
SELECT 
    'PROFILES TABLE STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check for any constraints on profiles table
SELECT 
    'PROFILES CONSTRAINTS' as check_type,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass;

-- Check auth.users table structure (key columns)
SELECT 
    'AUTH USERS STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
AND column_name IN ('id', 'email', 'encrypted_password', 'email_confirmed_at', 'role', 'aud')
ORDER BY ordinal_position;

-- Check for RLS policies that might be blocking access
SELECT 
    'RLS POLICIES CHECK' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname IN ('public', 'auth')
AND tablename IN ('profiles', 'users');

-- Check if RLS is enabled on profiles table
SELECT 
    'RLS STATUS' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';
