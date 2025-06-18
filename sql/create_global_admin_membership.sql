-- ============================================================================
-- CREATE GLOBAL ADMIN MEMBERSHIP TYPE AND ASSIGN TO ADMIN
-- ============================================================================
-- This script creates a Global Admin membership type and assigns it to the admin user

-- Step 1: Create Global Admin membership type (only if it doesn't exist)
DO $create_admin_membership_type$
BEGIN
    -- Check if Global Admin Staff Plan already exists
    IF NOT EXISTS (SELECT 1 FROM public.membership_types WHERE name = 'Global Admin Staff Plan') THEN
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
            NULL, -- Will be set if staff roles are used
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Created Global Admin Staff Plan membership type';
    ELSE
        RAISE NOTICE 'Global Admin Staff Plan already exists, skipping creation';
    END IF;
END $create_admin_membership_type$;

-- Step 2: Get the admin user ID and membership type ID
DO $assign_admin_membership$
DECLARE
    admin_user_id UUID;
    admin_membership_type_id UUID;
    existing_membership_id UUID;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@momentum.com';
    
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Admin user not found in auth.users';
    END IF;
    
    -- Get Global Admin membership type ID
    SELECT id INTO admin_membership_type_id
    FROM public.membership_types
    WHERE name = 'Global Admin Staff Plan';

    IF admin_membership_type_id IS NULL THEN
        RAISE EXCEPTION 'Global Admin membership type not found';
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

-- Step 3: Verify the Global Admin membership type was created
SELECT
    'GLOBAL ADMIN MEMBERSHIP TYPE' as check_type,
    id,
    name,
    description,
    category,
    price,
    billing_type,
    duration_months,
    available_for_sale,
    available_online,
    features,
    active,
    color,
    created_at
FROM public.membership_types
WHERE name = 'Global Admin Staff Plan';

-- Step 4: Verify admin user has the membership assigned
SELECT
    'ADMIN MEMBERSHIP ASSIGNMENT' as check_type,
    m.id as membership_id,
    m.auth_user_id,
    u.email as user_email,
    mt.name as membership_type_name,
    mt.category as membership_category,
    m.status,
    m.role,
    m.join_date
FROM public.memberships m
JOIN auth.users u ON m.auth_user_id = u.id
JOIN public.membership_types mt ON m.current_membership_type_id = mt.id
WHERE u.email = 'admin@momentum.com';

-- Step 5: Show all staff category membership types for reference
SELECT 
    'ALL STAFF MEMBERSHIP TYPES' as check_type,
    id,
    name,
    description,
    category,
    price,
    available_for_sale,
    available_online,
    active
FROM public.membership_types 
WHERE category = 'Staff'
ORDER BY name;

-- Step 6: Create additional staff membership types if needed
DO $create_additional_staff_types$
BEGIN
    -- Create Staff Member Plan if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM public.membership_types WHERE name = 'Staff Member Plan') THEN
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
            'Staff Member Plan',
            'Standard staff access plan with limited administrative privileges.',
            'Staff',
            0.00,
            'N/A',
            NULL,
            ARRAY['Staff dashboard access', 'Member management', 'Basic reports', 'Class management'],
            false,  -- Not available for sale
            false,  -- Not available online
            true,
            '#F97316', -- Orange color for staff
            NULL,
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Created Staff Member Plan membership type';
    END IF;

    -- Create Instructor Plan if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM public.membership_types WHERE name = 'Instructor Plan') THEN
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
            'Instructor Plan',
            'Plan for fitness instructors with class and schedule management access.',
            'Staff',
            0.00,
            'N/A',
            NULL,
            ARRAY['Instructor dashboard', 'Class management', 'Schedule management', 'Member check-in'],
            false,  -- Not available for sale
            false,  -- Not available online
            true,
            '#10B981', -- Green color for instructors
            NULL,
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Created Instructor Plan membership type';
    END IF;
END $create_additional_staff_types$;

-- Step 7: Final verification - show complete admin setup
SELECT
    'COMPLETE ADMIN SETUP' as verification_type,
    u.id as user_id,
    u.email as auth_email,
    u.role as auth_role,
    p.role as profile_role,
    p.first_name,
    p.last_name,
    mt.name as membership_type,
    mt.category as membership_category,
    m.status as membership_status,
    m.role as membership_role,
    m.join_date
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.memberships m ON u.id = m.auth_user_id
LEFT JOIN public.membership_types mt ON m.current_membership_type_id = mt.id
WHERE u.email = 'admin@momentum.com';

-- Step 8: Show summary of all membership types by category
SELECT 
    'MEMBERSHIP TYPES SUMMARY' as summary_type,
    category,
    COUNT(*) as count,
    array_agg(name ORDER BY name) as membership_names
FROM public.membership_types 
WHERE active = true
GROUP BY category
ORDER BY category;
