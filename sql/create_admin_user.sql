-- Create Global Admin User and Staff Plan
-- This script creates the initial admin user for the Momentum gym application
--
-- User Details:
-- Name: Global Admin
-- Email: globaladmin@momentum.com
-- Password: Bu!!et0!
-- Role: admin
--
-- Also creates:
-- - Global Admin Staff Role
-- - Global Admin Staff Plan (membership type)
-- - Links user to the staff plan

-- First, we need to create the user in Supabase auth.users table
-- Note: This requires admin/service role privileges

DO $$
DECLARE
    admin_user_id UUID;
    admin_membership_id UUID;
    admin_staff_role_id TEXT := 'global-administrator';
    admin_membership_type_id UUID;
    admin_user_email TEXT := 'globaladmin@momentum.com';
    admin_user_first_name TEXT := 'Global';
    admin_user_last_name TEXT := 'Admin';
    admin_user_password TEXT := 'Bu!!et0!';
BEGIN
    -- Generate UUIDs
    admin_user_id := gen_random_uuid();
    admin_membership_id := gen_random_uuid();
    admin_membership_type_id := gen_random_uuid();

    -- Step 1: Create Global Administrator Staff Role
    INSERT INTO public.staff_roles (
        id,
        name,
        description,
        permissions,
        created_at,
        updated_at
    ) VALUES (
        admin_staff_role_id,
        'Global Administrator',
        'System-wide administrator with full access to all features and settings.',
        '["all"]'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        permissions = EXCLUDED.permissions,
        updated_at = NOW();

    RAISE NOTICE 'Created/Updated Global Administrator staff role';

    -- Step 2: Create Global Admin Staff Plan (membership type)
    INSERT INTO public.membership_types (
        id,
        name,
        price,
        billing_type,
        duration_months,
        features,
        available_for_sale,
        available_online,
        active,
        description,
        category,
        color,
        role_id,
        created_at,
        updated_at
    ) VALUES (
        admin_membership_type_id,
        'Global Admin Staff Plan',
        0.00,
        'N/A',
        NULL,
        ARRAY['Full system access', 'All administrative privileges', 'Staff dashboard access', 'Member management', 'System configuration'],
        false, -- Not for sale
        false, -- Not available online
        true,  -- Active
        'Special staff plan for global administrators with full system access.',
        'Staff',
        '#DC2626', -- Red color for admin
        admin_staff_role_id,
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        updated_at = NOW();

    RAISE NOTICE 'Created/Updated Global Admin Staff Plan';

    -- Step 3: Check if user already exists in auth.users
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = admin_user_email) THEN
        RAISE NOTICE 'User with email % already exists in auth.users', admin_user_email;
        -- Get the existing user ID
        SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_user_email;
    ELSE
        -- Create user in auth.users table
        -- Note: The password will be hashed by Supabase
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
            aud,
            confirmation_token,
            email_change_token_new,
            recovery_token
        ) VALUES (
            admin_user_id,
            '00000000-0000-0000-0000-000000000000',
            admin_user_email,
            crypt(admin_user_password, gen_salt('bf')), -- Hash the password
            NOW(),
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object(
                'first_name', admin_user_first_name,
                'last_name', admin_user_last_name
            ),
            false,
            'authenticated',
            'authenticated',
            '',
            '',
            ''
        );

        RAISE NOTICE 'Created user in auth.users with ID: %', admin_user_id;
    END IF;

    -- Step 4: Check if profile already exists
    IF EXISTS (SELECT 1 FROM public.profiles WHERE email = admin_user_email) THEN
        RAISE NOTICE 'Profile with email % already exists', admin_user_email;

        -- Update existing profile to ensure admin role
        UPDATE public.profiles
        SET
            role = 'admin',
            first_name = admin_user_first_name,
            last_name = admin_user_last_name,
            name = admin_user_first_name || ' ' || admin_user_last_name
        WHERE email = admin_user_email;

        RAISE NOTICE 'Updated existing profile to admin role';
    ELSE
        -- Create profile in public.profiles table (correct fields based on schema)
        INSERT INTO public.profiles (
            id,
            email,
            first_name,
            last_name,
            name,
            role,
            created_at
        ) VALUES (
            admin_user_id,
            admin_user_email,
            admin_user_first_name,
            admin_user_last_name,
            admin_user_first_name || ' ' || admin_user_last_name,
            'admin',
            NOW()
        );

        RAISE NOTICE 'Created profile for admin user';
    END IF;

    -- Step 5: Create membership record
    IF EXISTS (SELECT 1 FROM public.memberships m WHERE m.auth_user_id = admin_user_id) THEN
        RAISE NOTICE 'Membership already exists for user';

        -- Update existing membership
        UPDATE public.memberships
        SET
            role = 'admin',
            current_membership_type_id = admin_membership_type_id,
            staff_role_id = admin_staff_role_id,
            status = 'Active'
        WHERE auth_user_id = admin_user_id;

        RAISE NOTICE 'Updated existing membership';
    ELSE
        -- Create membership record
        INSERT INTO public.memberships (
            id,
            auth_user_id,
            join_date,
            status,
            role,
            current_membership_type_id,
            staff_role_id
        ) VALUES (
            admin_membership_id,
            admin_user_id,
            CURRENT_DATE,
            'Active',
            'admin',
            admin_membership_type_id,
            admin_staff_role_id
        );

        RAISE NOTICE 'Created membership for admin user';
    END IF;

    -- Step 6: Verify the user was created successfully
    IF EXISTS (
        SELECT 1
        FROM auth.users au
        JOIN public.profiles p ON au.id = p.id
        JOIN public.memberships m ON au.id = m.auth_user_id
        WHERE au.email = admin_user_email
        AND p.role = 'admin'
        AND m.role = 'admin'
        AND m.staff_role_id = admin_staff_role_id
    ) THEN
        RAISE NOTICE '=== SUCCESS: Global Admin user created successfully! ===';
        RAISE NOTICE 'Email: %', admin_user_email;
        RAISE NOTICE 'Password: %', admin_user_password;
        RAISE NOTICE 'Role: admin';
        RAISE NOTICE 'User ID: %', admin_user_id;
        RAISE NOTICE 'Membership ID: %', admin_membership_id;
        RAISE NOTICE 'Staff Role: %', admin_staff_role_id;
        RAISE NOTICE 'Membership Type: Global Admin Staff Plan';
        RAISE NOTICE '=== User is ready to log in! ===';
    ELSE
        RAISE EXCEPTION 'FAILED: Admin user creation failed - verification check failed';
    END IF;

END $$;

-- Optional: Create an identity record for email authentication
-- This ensures the user can log in with email/password
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    au.id,
    jsonb_build_object(
        'sub', au.id::text,
        'email', au.email,
        'email_verified', true,
        'phone_verified', false
    ),
    'email',
    au.id::text, -- Use user ID as provider_id for email provider
    NOW(),
    NOW(),
    NOW()
FROM auth.users au
WHERE au.email = 'globaladmin@momentum.com'
AND NOT EXISTS (
    SELECT 1 FROM auth.identities ai
    WHERE ai.user_id = au.id AND ai.provider = 'email'
);

-- Display final verification with complete information
SELECT
    'Global Admin User Created' as status,
    au.email,
    p.first_name,
    p.last_name,
    p.role as profile_role,
    m.role as membership_role,
    sr.name as staff_role_name,
    mt.name as membership_plan,
    au.email_confirmed_at,
    p.created_at,
    m.status as membership_status
FROM auth.users au
JOIN public.profiles p ON au.id = p.id
JOIN public.memberships m ON au.id = m.auth_user_id
JOIN public.staff_roles sr ON m.staff_role_id = sr.id
JOIN public.membership_types mt ON m.current_membership_type_id = mt.id
WHERE au.email = 'globaladmin@momentum.com';
