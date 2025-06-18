-- ============================================================================
-- REMOTE DATABASE SETUP - FIXED VERSION (No ON CONFLICT issues)
-- ============================================================================
-- This script sets up the complete schema and admin user for remote Supabase

-- Step 1: Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    system_member_id SERIAL,
    name TEXT,
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    access_card_number TEXT,
    address TEXT,
    dob DATE,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    profile_picture_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role TEXT DEFAULT 'nonmember'
);

-- Step 2: Create membership_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.membership_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    price NUMERIC(10,2),
    billing_type TEXT,
    duration_months INTEGER,
    features TEXT[],
    available_for_sale BOOLEAN DEFAULT true,
    available_online BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    category TEXT,
    color TEXT,
    role_id TEXT
);

-- Step 3: Create memberships table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    system_member_id SERIAL,
    join_date DATE,
    status TEXT DEFAULT 'Active',
    dependents_count INTEGER DEFAULT 0,
    role TEXT DEFAULT 'member',
    current_membership_type_id UUID REFERENCES public.membership_types(id),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    assigned_plan_ids TEXT[],
    staff_role_id TEXT,
    parent_member_id UUID,
    user_id UUID
);

-- Step 4: Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Step 6: Create RLS policies for membership_types
DROP POLICY IF EXISTS "membership_types_select_policy" ON public.membership_types;

CREATE POLICY "membership_types_select_policy" ON public.membership_types
    FOR SELECT USING (true);

-- Step 7: Create RLS policies for memberships
DROP POLICY IF EXISTS "memberships_select_policy" ON public.memberships;
DROP POLICY IF EXISTS "memberships_insert_policy" ON public.memberships;
DROP POLICY IF EXISTS "memberships_update_policy" ON public.memberships;

CREATE POLICY "memberships_select_policy" ON public.memberships
    FOR SELECT USING (true);

CREATE POLICY "memberships_insert_policy" ON public.memberships
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "memberships_update_policy" ON public.memberships
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- Step 8: Create admin user
DO $create_admin_user$
DECLARE
    admin_user_id UUID;
    admin_email TEXT := 'admin@momentum.com';
    admin_password TEXT := 'Bu!!et0!';
BEGIN
    -- Check if admin already exists
    IF EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
        RAISE NOTICE 'Admin user already exists. Skipping creation.';
        RETURN;
    END IF;
    
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
    
    -- Create identity
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
    
    -- Create profile
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
    );
    
    RAISE NOTICE 'SUCCESS: Admin user created';
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'Password: %', admin_password;
    
END $create_admin_user$;

-- Step 9: Create essential membership types (using existence checks instead of ON CONFLICT)
DO $create_membership_types$
BEGIN
    -- Global Admin Staff Plan
    IF NOT EXISTS (SELECT 1 FROM public.membership_types WHERE name = 'Global Admin Staff Plan') THEN
        INSERT INTO public.membership_types (
            name, description, category, price, billing_type, duration_months,
            features, available_for_sale, available_online, active, color
        ) VALUES (
            'Global Admin Staff Plan',
            'Administrative access plan for system administrators.',
            'Staff', 0.00, 'N/A', NULL,
            ARRAY['Full system access', 'Administrative privileges', 'Staff dashboard'],
            false, false, true, '#DC2626'
        );
        RAISE NOTICE 'Created Global Admin Staff Plan';
    END IF;
    
    -- Basic Membership
    IF NOT EXISTS (SELECT 1 FROM public.membership_types WHERE name = 'Basic Membership') THEN
        INSERT INTO public.membership_types (
            name, description, category, price, billing_type, duration_months,
            features, available_for_sale, available_online, active, color
        ) VALUES (
            'Basic Membership',
            'Standard gym membership with basic access.',
            'Membership', 29.99, 'Monthly', 1,
            ARRAY['Gym access', 'Basic equipment', 'Locker room'],
            true, true, true, '#3B82F6'
        );
        RAISE NOTICE 'Created Basic Membership';
    END IF;
    
    -- Premium Membership
    IF NOT EXISTS (SELECT 1 FROM public.membership_types WHERE name = 'Premium Membership') THEN
        INSERT INTO public.membership_types (
            name, description, category, price, billing_type, duration_months,
            features, available_for_sale, available_online, active, color
        ) VALUES (
            'Premium Membership',
            'Premium gym membership with additional perks.',
            'Membership', 49.99, 'Monthly', 1,
            ARRAY['All basic features', 'Group classes', 'Personal training discount'],
            true, true, true, '#8B5CF6'
        );
        RAISE NOTICE 'Created Premium Membership';
    END IF;
END $create_membership_types$;

-- Step 10: Assign admin membership
DO $assign_admin_membership$
DECLARE
    admin_user_id UUID;
    admin_membership_type_id UUID;
    existing_membership_id UUID;
BEGIN
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@momentum.com';
    SELECT id INTO admin_membership_type_id FROM public.membership_types WHERE name = 'Global Admin Staff Plan';

    IF admin_user_id IS NOT NULL AND admin_membership_type_id IS NOT NULL THEN
        -- Check if membership already exists
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
            RAISE NOTICE 'Updated existing admin membership';
        ELSE
            -- Create new membership
            INSERT INTO public.memberships (
                auth_user_id,
                user_id,
                current_membership_type_id,
                status,
                role,
                join_date
            ) VALUES (
                admin_user_id,
                admin_user_id,
                admin_membership_type_id,
                'Active',
                'admin',
                NOW()::date
            );
            RAISE NOTICE 'Created new admin membership';
        END IF;
    END IF;
END $assign_admin_membership$;

-- Step 11: Verification
SELECT 
    'REMOTE SETUP VERIFICATION' as status,
    u.email,
    p.role as profile_role,
    m.status as membership_status,
    mt.name as membership_type
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.memberships m ON u.id = m.auth_user_id
LEFT JOIN public.membership_types mt ON m.current_membership_type_id = mt.id
WHERE u.email = 'admin@momentum.com';
