-- ============================================================================
-- COMPLETE ADMIN SETUP - Create Admin Profile, Staff Membership, and Assignment
-- ============================================================================
-- This script creates everything needed for a complete admin setup

-- Step 1: Create the admin user in auth.users (if not exists)
DO $create_admin_user$
DECLARE
    admin_user_id UUID;
    admin_email TEXT := 'admin@momentum.com';
    admin_password TEXT := 'SecureAdminPassword123!';
BEGIN
    -- Check if admin user already exists
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = admin_email;
    
    IF admin_user_id IS NULL THEN
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
            '{"first_name": "System", "last_name": "Administrator"}',
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
                'email_verified', true
            ),
            'email',
            admin_user_id::text,
            NOW(),
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created new admin user with ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Admin user already exists with ID: %', admin_user_id;
    END IF;
END $create_admin_user$;

-- Step 2: Create admin profile in profiles table
DO $create_admin_profile$
DECLARE
    admin_user_id UUID;
    admin_email TEXT := 'admin@momentum.com';
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = admin_email;
    
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Admin user not found in auth.users';
    END IF;
    
    -- Create or update admin profile
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
        'System Administrator',
        'System',
        'Administrator',
        admin_email,
        'admin',
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        email = admin_email,
        first_name = COALESCE(profiles.first_name, 'System'),
        last_name = COALESCE(profiles.last_name, 'Administrator'),
        name = COALESCE(profiles.name, 'System Administrator');
    
    RAISE NOTICE 'Created/updated admin profile for user ID: %', admin_user_id;
END $create_admin_profile$;

-- Step 3: Create Global Admin Staff membership type
DO $create_admin_membership_type$
DECLARE
    admin_membership_type_id UUID;
BEGIN
    -- Check if Global Admin Staff Plan already exists
    SELECT id INTO admin_membership_type_id
    FROM public.membership_types 
    WHERE name = 'Global Admin Staff Plan';
    
    IF admin_membership_type_id IS NULL THEN
        -- Create the membership type
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
            'Administrative access plan for system administrators with full privileges and access to all features.',
            'Staff',
            0.00,
            'N/A',
            NULL,
            ARRAY['Full system access', 'All administrative privileges', 'Staff dashboard access', 'Member management', 'System configuration', 'Billing management', 'Reports access'],
            false,  -- Not available for sale (admin-only)
            false,  -- Not available online (admin-only)
            true,
            '#DC2626', -- Red color for admin
            NULL,
            NOW(),
            NOW()
        )
        RETURNING id INTO admin_membership_type_id;
        
        RAISE NOTICE 'Created Global Admin Staff Plan with ID: %', admin_membership_type_id;
    ELSE
        RAISE NOTICE 'Global Admin Staff Plan already exists with ID: %', admin_membership_type_id;
    END IF;
END $create_admin_membership_type$;

-- Step 4: Assign admin membership to admin user
DO $assign_admin_membership$
DECLARE
    admin_user_id UUID;
    admin_membership_type_id UUID;
    existing_membership_id UUID;
    admin_email TEXT := 'admin@momentum.com';
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = admin_email;
    
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Admin user not found';
    END IF;
    
    -- Get admin membership type ID
    SELECT id INTO admin_membership_type_id 
    FROM public.membership_types 
    WHERE name = 'Global Admin Staff Plan';
    
    IF admin_membership_type_id IS NULL THEN
        RAISE EXCEPTION 'Global Admin Staff Plan not found';
    END IF;
    
    -- Check if admin already has a membership
    SELECT id INTO existing_membership_id 
    FROM public.memberships 
    WHERE auth_user_id = admin_user_id;
    
    IF existing_membership_id IS NOT NULL THEN
        -- Update existing membership
        UPDATE public.memberships 
        SET 
            current_membership_type_id = admin_membership_type_id,
            status = 'Active',
            role = 'admin'
        WHERE id = existing_membership_id;
        
        RAISE NOTICE 'Updated existing membership for admin user';
    ELSE
        -- Create new membership for admin
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
        );
        
        RAISE NOTICE 'Created new membership for admin user';
    END IF;
    
    RAISE NOTICE 'Admin user ID: %', admin_user_id;
    RAISE NOTICE 'Admin membership type ID: %', admin_membership_type_id;
END $assign_admin_membership$;

-- Step 5: Verification - Show complete admin setup
SELECT 
    'COMPLETE ADMIN VERIFICATION' as verification_type,
    u.id as user_id,
    u.email as auth_email,
    u.role as auth_role,
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    p.role as profile_role,
    p.first_name,
    p.last_name,
    p.name,
    mt.name as membership_type_name,
    mt.category as membership_category,
    mt.price,
    m.status as membership_status,
    m.role as membership_role,
    m.join_date,
    (i.id IS NOT NULL) as has_identity
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.memberships m ON u.id = m.auth_user_id
LEFT JOIN public.membership_types mt ON m.current_membership_type_id = mt.id
LEFT JOIN auth.identities i ON u.id = i.user_id
WHERE u.email = 'admin@momentum.com';

-- Step 6: Show the created membership type details
SELECT 
    'ADMIN MEMBERSHIP TYPE DETAILS' as check_type,
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
    created_at
FROM public.membership_types 
WHERE name = 'Global Admin Staff Plan';

-- Step 7: Show all staff membership types for reference
SELECT 
    'ALL STAFF MEMBERSHIP TYPES' as check_type,
    id,
    name,
    description,
    category,
    price,
    available_for_sale,
    available_online,
    active,
    color
FROM public.membership_types 
WHERE category = 'Staff'
ORDER BY name;

-- Step 8: Final summary
SELECT 
    'SETUP SUMMARY' as summary_type,
    (SELECT COUNT(*) FROM auth.users WHERE email = 'admin@momentum.com') as admin_auth_users,
    (SELECT COUNT(*) FROM public.profiles WHERE email = 'admin@momentum.com' AND role = 'admin') as admin_profiles,
    (SELECT COUNT(*) FROM public.membership_types WHERE name = 'Global Admin Staff Plan') as admin_membership_types,
    (SELECT COUNT(*) FROM public.memberships m 
     JOIN auth.users u ON m.auth_user_id = u.id 
     WHERE u.email = 'admin@momentum.com') as admin_memberships;
