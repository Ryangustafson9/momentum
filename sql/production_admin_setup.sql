-- ============================================================================
-- PRODUCTION ADMIN SETUP - Complete First Admin User Creation
-- ============================================================================
-- This script creates the first admin user for a clean production database

-- Step 1: Create the first admin user in auth.users
DO $create_first_admin$
DECLARE
    admin_user_id UUID;
    admin_email TEXT := 'admin@momentum.com';
    admin_password TEXT := 'SecureAdminPassword123!';
    admin_first_name TEXT := 'System';
    admin_last_name TEXT := 'Administrator';
BEGIN
    -- Check if any admin users already exist
    IF EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
        RAISE NOTICE '⚠️  Admin user already exists. Skipping creation.';
        RETURN;
    END IF;
    
    -- Generate new UUID for admin user
    admin_user_id := gen_random_uuid();
    
    -- Create auth user
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
        role,
        aud
    ) VALUES (
        admin_user_id,
        '00000000-0000-0000-0000-000000000000',
        admin_email,
        crypt(admin_password, gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object(
            'first_name', admin_first_name,
            'last_name', admin_last_name
        ),
        'authenticated',
        'authenticated'
    );
    
    -- Create identity record
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        admin_user_id,
        jsonb_build_object(
            'sub', admin_user_id::text,
            'email', admin_email,
            'email_verified', true,
            'phone_verified', false
        ),
        'email',
        admin_user_id::text,
        NOW(),
        NOW(),
        NOW()
    );
    
    -- Create admin profile
    INSERT INTO public.profiles (
        id,
        name,
        first_name,
        last_name,
        email,
        role,
        created_at
    ) VALUES (
        admin_user_id,
        admin_first_name || ' ' || admin_last_name,
        admin_first_name,
        admin_last_name,
        admin_email,
        'admin',
        NOW()
    );
    
    RAISE NOTICE 'SUCCESS: First admin user created';
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'Password: %', admin_password;
    RAISE NOTICE 'User ID: %', admin_user_id;
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT: Change the password after first login!';
    
END $create_first_admin$;

-- Step 2: Create Global Admin Staff membership type
INSERT INTO public.membership_types (
    id,
    name,
    description,
    category,
    price,
    billing_type,
    duration_months,
    features,
    available_for_sale,
    available_online,
    active,
    color,
    role_id,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Global Admin Staff Plan',
    'Administrative access plan for system administrators with full privileges.',
    'Staff',
    0.00,
    'N/A',
    NULL,
    ARRAY[
        'Full system access',
        'All administrative privileges', 
        'Staff dashboard access',
        'Member management',
        'System configuration',
        'Billing management',
        'Reports access'
    ],
    false,
    false,
    true,
    '#DC2626',
    NULL,
    NOW(),
    NOW()
)
ON CONFLICT (name) DO NOTHING;

-- Step 3: Assign admin membership to admin user
DO $assign_admin_membership$
DECLARE
    admin_user_id UUID;
    admin_membership_type_id UUID;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@momentum.com';
    
    -- Get admin membership type ID
    SELECT id INTO admin_membership_type_id 
    FROM public.membership_types 
    WHERE name = 'Global Admin Staff Plan';
    
    IF admin_user_id IS NOT NULL AND admin_membership_type_id IS NOT NULL THEN
        -- Create membership assignment
        INSERT INTO public.memberships (
            id,
            auth_user_id,
            user_id,
            current_membership_type_id,
            status,
            role,
            join_date
        ) VALUES (
            gen_random_uuid(),
            admin_user_id,
            admin_user_id,
            admin_membership_type_id,
            'Active',
            'admin',
            NOW()::date
        )
        ON CONFLICT (auth_user_id) DO UPDATE SET
            current_membership_type_id = admin_membership_type_id,
            status = 'Active',
            role = 'admin';
        
        RAISE NOTICE 'Admin membership assigned successfully';
    END IF;
END $assign_admin_membership$;

-- Step 4: Create essential membership types for production
INSERT INTO public.membership_types (
    id,
    name,
    description,
    category,
    price,
    billing_type,
    duration_months,
    features,
    available_for_sale,
    available_online,
    active,
    color,
    role_id,
    created_at,
    updated_at
) VALUES 
-- Basic Member Plan
(
    gen_random_uuid(),
    'Basic Membership',
    'Standard gym membership with access to all basic facilities.',
    'Membership',
    29.99,
    'Monthly',
    1,
    ARRAY['Gym access', 'Basic equipment', 'Locker room access'],
    true,
    true,
    true,
    '#3B82F6',
    NULL,
    NOW(),
    NOW()
),
-- Premium Member Plan
(
    gen_random_uuid(),
    'Premium Membership',
    'Premium gym membership with additional perks and classes.',
    'Membership',
    49.99,
    'Monthly',
    1,
    ARRAY['All basic features', 'Group classes', 'Personal training discount', 'Guest passes'],
    true,
    true,
    true,
    '#8B5CF6',
    NULL,
    NOW(),
    NOW()
),
-- Staff Plan
(
    gen_random_uuid(),
    'Staff Member Plan',
    'Plan for gym staff members with operational access.',
    'Staff',
    0.00,
    'N/A',
    NULL,
    ARRAY['Staff dashboard', 'Member management', 'Class management', 'Basic reports'],
    false,
    false,
    true,
    '#F97316',
    NULL,
    NOW(),
    NOW()
)
ON CONFLICT (name) DO NOTHING;

-- Step 5: Verification
SELECT 
    'PRODUCTION SETUP VERIFICATION' as check_type,
    u.id as user_id,
    u.email,
    u.role as auth_role,
    p.role as profile_role,
    p.first_name,
    p.last_name,
    mt.name as membership_type,
    m.status as membership_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.memberships m ON u.id = m.auth_user_id
LEFT JOIN public.membership_types mt ON m.current_membership_type_id = mt.id
WHERE u.email = 'admin@momentum.com';

-- Show created membership types
SELECT 
    'MEMBERSHIP TYPES CREATED' as info,
    name,
    category,
    price,
    available_online,
    active
FROM public.membership_types
ORDER BY category, name;
