-- Check if the Global Admin user was created successfully
-- This script verifies all components of the admin user setup

-- 1. Check if user exists in auth.users
SELECT 
    'Auth User Check' as check_type,
    au.id,
    au.email,
    au.email_confirmed_at,
    au.created_at
FROM auth.users au
WHERE au.email = 'globaladmin@momentum.com';

-- 2. Check if profile exists
SELECT 
    'Profile Check' as check_type,
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    p.created_at
FROM public.profiles p
WHERE p.email = 'globaladmin@momentum.com';

-- 3. Check if membership exists
SELECT 
    'Membership Check' as check_type,
    m.id,
    m.auth_user_id,
    m.role,
    m.status,
    m.staff_role_id,
    m.current_membership_type_id
FROM public.memberships m
JOIN auth.users au ON m.auth_user_id = au.id
WHERE au.email = 'globaladmin@momentum.com';

-- 4. Check if staff role exists
SELECT 
    'Staff Role Check' as check_type,
    sr.id,
    sr.name,
    sr.description,
    sr.permissions
FROM public.staff_roles sr
WHERE sr.id = 'global-administrator';

-- 5. Check if membership type exists
SELECT 
    'Membership Type Check' as check_type,
    mt.id,
    mt.name,
    mt.category,
    mt.role_id,
    mt.active
FROM public.membership_types mt
WHERE mt.name = 'Global Admin Staff Plan';

-- 6. Check if identity exists
SELECT 
    'Identity Check' as check_type,
    ai.id,
    ai.user_id,
    ai.provider,
    ai.provider_id,
    ai.created_at
FROM auth.identities ai
JOIN auth.users au ON ai.user_id = au.id
WHERE au.email = 'globaladmin@momentum.com';

-- 7. Complete verification - all linked together
SELECT 
    'Complete Verification' as check_type,
    au.email,
    p.role as profile_role,
    m.role as membership_role,
    sr.name as staff_role_name,
    mt.name as membership_plan_name,
    CASE 
        WHEN au.id IS NOT NULL AND p.id IS NOT NULL AND m.id IS NOT NULL 
        THEN 'SUCCESS - All components exist'
        ELSE 'INCOMPLETE - Missing components'
    END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
LEFT JOIN public.memberships m ON au.id = m.auth_user_id
LEFT JOIN public.staff_roles sr ON m.staff_role_id = sr.id
LEFT JOIN public.membership_types mt ON m.current_membership_type_id = mt.id
WHERE au.email = 'globaladmin@momentum.com';

-- 8. Check for any RLS policies that might be blocking access
SELECT 
    'RLS Policy Check' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'memberships', 'staff_roles', 'membership_types')
ORDER BY tablename, policyname;
