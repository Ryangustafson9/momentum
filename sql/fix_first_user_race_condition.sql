-- Fix for First User Race Condition
-- SOLUTION: Remove client-side admin creation logic entirely
-- All app signups create 'nonmember' users only
-- Admin users are created at the database level during deployment

-- This script documents the race condition fix and provides admin creation tools

-- ============================================================================
-- RACE CONDITION ANALYSIS
-- ============================================================================
-- PROBLEM: Multiple users could simultaneously check user count and both become admin
-- SOLUTION: Remove "first user becomes admin" logic from client-side entirely
-- RESULT: All app signups are 'nonmember' - admins created via database scripts

-- ============================================================================
-- ADMIN USER CREATION (Database Level)
-- ============================================================================
-- Use this script to create admin users during deployment/setup
-- This should be run with service role permissions, not from the app

-- Example: Create an admin user (run this during deployment)
/*
-- Step 1: Create auth user (requires service role)
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'admin@momentum.com',
    crypt('SecureAdminPassword123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "System", "last_name": "Administrator"}',
    false,
    'authenticated',
    'authenticated'
);

-- Step 2: Create profile for the admin user
INSERT INTO public.profiles (
    id,
    email,
    role,
    first_name,
    last_name,
    name,
    created_at,
    updated_at
)
SELECT
    au.id,
    au.email,
    'admin',
    'System',
    'Administrator',
    'System Administrator',
    NOW(),
    NOW()
FROM auth.users au
WHERE au.email = 'admin@momentum.com'
AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.email = au.email
);
*/
