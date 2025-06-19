-- ========================================
-- COMPREHENSIVE TEST DATA FOR MOMENTUM GYM
-- Creates realistic member and staff profiles for testing
-- Password for ALL users: password405
-- ========================================

-- First, let's check what membership types exist and create any missing ones
DO $$
BEGIN
    -- Create family_members table if it doesn't exist
    CREATE TABLE IF NOT EXISTS family_members (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        primary_member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        family_member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        relationship TEXT CHECK (relationship IN ('spouse', 'child', 'dependent', 'parent')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(primary_member_id, family_member_id)
    );

    -- Create membership_addons table if it doesn't exist
    CREATE TABLE IF NOT EXISTS membership_addons (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        membership_id UUID REFERENCES memberships(id) ON DELETE CASCADE,
        addon_type TEXT NOT NULL,
        addon_name TEXT NOT NULL,
        price DECIMAL(10,2) DEFAULT 0,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Enable RLS on new tables
    ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
    ALTER TABLE membership_addons ENABLE ROW LEVEL SECURITY;

    -- Create policies for family_members
    CREATE POLICY "Users can view family relationships" ON family_members
        FOR SELECT USING (
            auth.uid() = primary_member_id OR 
            auth.uid() = family_member_id
        );

    -- Create policies for membership_addons
    CREATE POLICY "Users can view own addons" ON membership_addons
        FOR SELECT USING (
            membership_id IN (
                SELECT id FROM memberships WHERE auth_user_id = auth.uid()
            )
        );

    RAISE NOTICE 'Family and addon tables created successfully';
EXCEPTION
    WHEN duplicate_table THEN
        RAISE NOTICE 'Tables already exist, continuing...';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating tables: %', SQLERRM;
END $$;

-- Ensure we have all needed membership types
INSERT INTO membership_types (name, description, price, duration_months, category, active, available_online) VALUES
('Individual Basic', 'Basic gym access for one person', 39.99, 1, 'Member Plans', true, true),
('Individual Premium', 'Full gym access with classes for one person', 59.99, 1, 'Member Plans', true, true),
('Couple Basic', 'Basic gym access for two people', 69.99, 1, 'Member Plans', true, true),
('Couple Premium', 'Full gym access with classes for two people', 99.99, 1, 'Member Plans', true, true),
('Family Basic', 'Basic gym access for up to 4 family members', 89.99, 1, 'Member Plans', true, true),
('Family Premium', 'Full gym access with classes for up to 4 family members', 129.99, 1, 'Member Plans', true, true)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  duration_months = EXCLUDED.duration_months,
  category = EXCLUDED.category,
  active = EXCLUDED.active,
  available_online = EXCLUDED.available_online,
  updated_at = NOW();

-- ========================================
-- STAFF DATA (5 profiles)
-- ========================================

-- 1. Administrator
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'admin@momentum.com',
    crypt('password405', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone, created_at) 
SELECT id, 'admin@momentum.com', 'admin', 'Sarah', 'Martinez', 'Sarah Martinez', '555-0101', NOW() - INTERVAL '2 years'
FROM auth.users WHERE email = 'admin@momentum.com';

-- 2. Manager
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'manager@momentum.com',
    crypt('password405', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone, created_at) 
SELECT id, 'manager@momentum.com', 'staff', 'Michael', 'Johnson', 'Michael Johnson', '555-0102', NOW() - INTERVAL '18 months'
FROM auth.users WHERE email = 'manager@momentum.com';

-- 3. Front Desk Staff 1
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'frontdesk1@momentum.com',
    crypt('password405', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone, created_at) 
SELECT id, 'frontdesk1@momentum.com', 'staff', 'Emily', 'Chen', 'Emily Chen', '555-0103', NOW() - INTERVAL '8 months'
FROM auth.users WHERE email = 'frontdesk1@momentum.com';

-- 4. Front Desk Staff 2
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'frontdesk2@momentum.com',
    crypt('password405', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone, created_at) 
SELECT id, 'frontdesk2@momentum.com', 'staff', 'David', 'Rodriguez', 'David Rodriguez', '555-0104', NOW() - INTERVAL '5 months'
FROM auth.users WHERE email = 'frontdesk2@momentum.com';

-- 5. Instructor
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'instructor@momentum.com',
    crypt('password405', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone, created_at) 
SELECT id, 'instructor@momentum.com', 'staff', 'Jessica', 'Wilson', 'Jessica Wilson', '555-0105', NOW() - INTERVAL '1 year'
FROM auth.users WHERE email = 'instructor@momentum.com';

-- ========================================
-- MEMBER DATA (10 profiles with different membership types)
-- ========================================

-- INDIVIDUAL MEMBERSHIPS (3 members)

-- 1. Individual Basic Member
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'john.smith@email.com',
    crypt('password405', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone, created_at) 
SELECT id, 'john.smith@email.com', 'member', 'John', 'Smith', 'John Smith', '555-1001', NOW() - INTERVAL '6 months'
FROM auth.users WHERE email = 'john.smith@email.com';

-- Create Individual Basic membership for John
INSERT INTO memberships (auth_user_id, membership_type_id, status, start_date, created_at)
SELECT 
    u.id, 
    mt.id, 
    'Active', 
    CURRENT_DATE - INTERVAL '6 months',
    NOW() - INTERVAL '6 months'
FROM auth.users u, membership_types mt 
WHERE u.email = 'john.smith@email.com' AND mt.name = 'Individual Basic';

-- Add locker rental addon for John
INSERT INTO membership_addons (membership_id, addon_type, addon_name, price, created_at)
SELECT m.id, 'facility', 'Locker Rental', 15.00, NOW() - INTERVAL '6 months'
FROM memberships m 
JOIN auth.users u ON m.auth_user_id = u.id 
WHERE u.email = 'john.smith@email.com';

-- 2. Individual Premium Member
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'lisa.jones@email.com',
    crypt('password405', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone, created_at) 
SELECT id, 'lisa.jones@email.com', 'member', 'Lisa', 'Jones', 'Lisa Jones', '555-1002', NOW() - INTERVAL '4 months'
FROM auth.users WHERE email = 'lisa.jones@email.com';

-- Create Individual Premium membership for Lisa
INSERT INTO memberships (auth_user_id, membership_type_id, status, start_date, created_at)
SELECT 
    u.id, 
    mt.id, 
    'Active', 
    CURRENT_DATE - INTERVAL '4 months',
    NOW() - INTERVAL '4 months'
FROM auth.users u, membership_types mt 
WHERE u.email = 'lisa.jones@email.com' AND mt.name = 'Individual Premium';

-- Add personal training addon for Lisa
INSERT INTO membership_addons (membership_id, addon_type, addon_name, price, created_at)
SELECT m.id, 'training', 'Personal Training Sessions (4/month)', 120.00, NOW() - INTERVAL '4 months'
FROM memberships m 
JOIN auth.users u ON m.auth_user_id = u.id 
WHERE u.email = 'lisa.jones@email.com';

-- 3. Individual Basic Member (Inactive)
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'mark.taylor@email.com',
    crypt('password405', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone, created_at) 
SELECT id, 'mark.taylor@email.com', 'member', 'Mark', 'Taylor', 'Mark Taylor', '555-1003', NOW() - INTERVAL '8 months'
FROM auth.users WHERE email = 'mark.taylor@email.com';

-- Create Individual Basic membership for Mark (Inactive)
INSERT INTO memberships (auth_user_id, membership_type_id, status, start_date, end_date, created_at)
SELECT 
    u.id, 
    mt.id, 
    'Inactive', 
    CURRENT_DATE - INTERVAL '8 months',
    CURRENT_DATE - INTERVAL '1 month',
    NOW() - INTERVAL '8 months'
FROM auth.users u, membership_types mt 
WHERE u.email = 'mark.taylor@email.com' AND mt.name = 'Individual Basic';

-- COUPLE MEMBERSHIPS (3 couples = 6 members)

-- 4. & 5. Couple Basic Membership
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'robert.davis@email.com',
    crypt('password405', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone, created_at) 
SELECT id, 'robert.davis@email.com', 'member', 'Robert', 'Davis', 'Robert Davis', '555-1004', NOW() - INTERVAL '7 months'
FROM auth.users WHERE email = 'robert.davis@email.com';

INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'sarah.davis@email.com',
    crypt('password405', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone, created_at) 
SELECT id, 'sarah.davis@email.com', 'member', 'Sarah', 'Davis', 'Sarah Davis', '555-1005', NOW() - INTERVAL '7 months'
FROM auth.users WHERE email = 'sarah.davis@email.com';

-- Create Couple Basic membership (Robert as primary)
INSERT INTO memberships (auth_user_id, membership_type_id, status, start_date, created_at)
SELECT 
    u.id, 
    mt.id, 
    'Active', 
    CURRENT_DATE - INTERVAL '7 months',
    NOW() - INTERVAL '7 months'
FROM auth.users u, membership_types mt 
WHERE u.email = 'robert.davis@email.com' AND mt.name = 'Couple Basic';

-- Create family relationship
INSERT INTO family_members (primary_member_id, family_member_id, relationship, created_at)
SELECT 
    p1.id, 
    p2.id, 
    'spouse',
    NOW() - INTERVAL '7 months'
FROM profiles p1, profiles p2 
WHERE p1.email = 'robert.davis@email.com' AND p2.email = 'sarah.davis@email.com';

-- Add guest passes addon
INSERT INTO membership_addons (membership_id, addon_type, addon_name, price, created_at)
SELECT m.id, 'access', 'Guest Passes (5/month)', 25.00, NOW() - INTERVAL '7 months'
FROM memberships m 
JOIN auth.users u ON m.auth_user_id = u.id 
WHERE u.email = 'robert.davis@email.com';

-- 6. & 7. Couple Premium Membership
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'james.wilson@email.com',
    crypt('password405', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone, created_at) 
SELECT id, 'james.wilson@email.com', 'member', 'James', 'Wilson', 'James Wilson', '555-1006', NOW() - INTERVAL '5 months'
FROM auth.users WHERE email = 'james.wilson@email.com';

INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'maria.wilson@email.com',
    crypt('password405', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone, created_at) 
SELECT id, 'maria.wilson@email.com', 'member', 'Maria', 'Wilson', 'Maria Wilson', '555-1007', NOW() - INTERVAL '5 months'
FROM auth.users WHERE email = 'maria.wilson@email.com';

-- Create Couple Premium membership (James as primary)
INSERT INTO memberships (auth_user_id, membership_type_id, status, start_date, created_at)
SELECT 
    u.id, 
    mt.id, 
    'Active', 
    CURRENT_DATE - INTERVAL '5 months',
    NOW() - INTERVAL '5 months'
FROM auth.users u, membership_types mt 
WHERE u.email = 'james.wilson@email.com' AND mt.name = 'Couple Premium';

-- Create family relationship
INSERT INTO family_members (primary_member_id, family_member_id, relationship, created_at)
SELECT 
    p1.id, 
    p2.id, 
    'spouse',
    NOW() - INTERVAL '5 months'
FROM profiles p1, profiles p2 
WHERE p1.email = 'james.wilson@email.com' AND p2.email = 'maria.wilson@email.com';

-- Add specialty class access addon
INSERT INTO membership_addons (membership_id, addon_type, addon_name, price, created_at)
SELECT m.id, 'classes', 'Specialty Classes Access', 35.00, NOW() - INTERVAL '5 months'
FROM memberships m 
JOIN auth.users u ON m.auth_user_id = u.id 
WHERE u.email = 'james.wilson@email.com';

-- 8. & 9. Couple Basic Membership (Inactive)
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'kevin.brown@email.com',
    crypt('password405', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone, created_at) 
SELECT id, 'kevin.brown@email.com', 'member', 'Kevin', 'Brown', 'Kevin Brown', '555-1008', NOW() - INTERVAL '10 months'
FROM auth.users WHERE email = 'kevin.brown@email.com';

INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'jennifer.brown@email.com',
    crypt('password405', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone, created_at) 
SELECT id, 'jennifer.brown@email.com', 'member', 'Jennifer', 'Brown', 'Jennifer Brown', '555-1009', NOW() - INTERVAL '10 months'
FROM auth.users WHERE email = 'jennifer.brown@email.com';

-- Create Couple Basic membership (Kevin as primary, Inactive)
INSERT INTO memberships (auth_user_id, membership_type_id, status, start_date, end_date, created_at)
SELECT 
    u.id, 
    mt.id, 
    'Inactive', 
    CURRENT_DATE - INTERVAL '10 months',
    CURRENT_DATE - INTERVAL '2 months',
    NOW() - INTERVAL '10 months'
FROM auth.users u, membership_types mt 
WHERE u.email = 'kevin.brown@email.com' AND mt.name = 'Couple Basic';

-- Create family relationship
INSERT INTO family_members (primary_member_id, family_member_id, relationship, created_at)
SELECT 
    p1.id, 
    p2.id, 
    'spouse',
    NOW() - INTERVAL '10 months'
FROM profiles p1, profiles p2 
WHERE p1.email = 'kevin.brown@email.com' AND p2.email = 'jennifer.brown@email.com';

-- FAMILY MEMBERSHIPS (4 families = 14 members)

-- 10., 11., 12., 13. Family Premium (Anderson Family - 4 members)
-- Primary member
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'thomas.anderson@email.com',
    crypt('password405', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone, created_at) 
SELECT id, 'thomas.anderson@email.com', 'member', 'Thomas', 'Anderson', 'Thomas Anderson', '555-1010', NOW() - INTERVAL '9 months'
FROM auth.users WHERE email = 'thomas.anderson@email.com';

-- Spouse
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'linda.anderson@email.com',
    crypt('password405', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone, created_at) 
SELECT id, 'linda.anderson@email.com', 'member', 'Linda', 'Anderson', 'Linda Anderson', '555-1011', NOW() - INTERVAL '9 months'
FROM auth.users WHERE email = 'linda.anderson@email.com';

-- Child 1
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'alex.anderson@email.com',
    crypt('password405', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone, created_at) 
SELECT id, 'alex.anderson@email.com', 'member', 'Alex', 'Anderson', 'Alex Anderson', '555-1012', NOW() - INTERVAL '9 months'
FROM auth.users WHERE email = 'alex.anderson@email.com';

-- Child 2
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'emma.anderson@email.com',
    crypt('password405', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone, created_at) 
SELECT id, 'emma.anderson@email.com', 'member', 'Emma', 'Anderson', 'Emma Anderson', '555-1013', NOW() - INTERVAL '9 months'
FROM auth.users WHERE email = 'emma.anderson@email.com';

-- Create Family Premium membership
INSERT INTO memberships (auth_user_id, membership_type_id, status, start_date, created_at)
SELECT 
    u.id, 
    mt.id, 
    'Active', 
    CURRENT_DATE - INTERVAL '9 months',
    NOW() - INTERVAL '9 months'
FROM auth.users u, membership_types mt 
WHERE u.email = 'thomas.anderson@email.com' AND mt.name = 'Family Premium';

-- Create family relationships
INSERT INTO family_members (primary_member_id, family_member_id, relationship, created_at)
SELECT 
    p1.id, 
    p2.id, 
    'spouse',
    NOW() - INTERVAL '9 months'
FROM profiles p1, profiles p2 
WHERE p1.email = 'thomas.anderson@email.com' AND p2.email = 'linda.anderson@email.com';

INSERT INTO family_members (primary_member_id, family_member_id, relationship, created_at)
SELECT 
    p1.id, 
    p2.id, 
    'child',
    NOW() - INTERVAL '9 months'
FROM profiles p1, profiles p2 
WHERE p1.email = 'thomas.anderson@email.com' AND p2.email = 'alex.anderson@email.com';

INSERT INTO family_members (primary_member_id, family_member_id, relationship, created_at)
SELECT 
    p1.id, 
    p2.id, 
    'child',
    NOW() - INTERVAL '9 months'
FROM profiles p1, profiles p2 
WHERE p1.email = 'thomas.anderson@email.com' AND p2.email = 'emma.anderson@email.com';

-- Add multiple addons for Anderson family
INSERT INTO membership_addons (membership_id, addon_type, addon_name, price, created_at) VALUES
((SELECT m.id FROM memberships m JOIN auth.users u ON m.auth_user_id = u.id WHERE u.email = 'thomas.anderson@email.com'), 'facility', 'Family Locker Rental', 25.00, NOW() - INTERVAL '9 months'),
((SELECT m.id FROM memberships m JOIN auth.users u ON m.auth_user_id = u.id WHERE u.email = 'thomas.anderson@email.com'), 'training', 'Youth Training Programs', 60.00, NOW() - INTERVAL '9 months'),
((SELECT m.id FROM memberships m JOIN auth.users u ON m.auth_user_id = u.id WHERE u.email = 'thomas.anderson@email.com'), 'access', 'Extended Hours Access', 20.00, NOW() - INTERVAL '9 months');

-- Create sample check-ins for active members (last 30 days)
INSERT INTO check_ins (auth_user_id, check_in_time, check_out_time, created_at)
SELECT 
    u.id,
    NOW() - INTERVAL '1 day' + INTERVAL '8 hours',
    NOW() - INTERVAL '1 day' + INTERVAL '9.5 hours',
    NOW() - INTERVAL '1 day'
FROM auth.users u 
WHERE u.email IN ('john.smith@email.com', 'lisa.jones@email.com', 'robert.davis@email.com', 'thomas.anderson@email.com');

INSERT INTO check_ins (auth_user_id, check_in_time, check_out_time, created_at)
SELECT 
    u.id,
    NOW() - INTERVAL '3 days' + INTERVAL '18 hours',
    NOW() - INTERVAL '3 days' + INTERVAL '19.5 hours',
    NOW() - INTERVAL '3 days'
FROM auth.users u 
WHERE u.email IN ('sarah.davis@email.com', 'james.wilson@email.com', 'linda.anderson@email.com');

INSERT INTO check_ins (auth_user_id, check_in_time, check_out_time, created_at)
SELECT 
    u.id,
    NOW() - INTERVAL '5 days' + INTERVAL '17 hours',
    NOW() - INTERVAL '5 days' + INTERVAL '18.5 hours',
    NOW() - INTERVAL '5 days'
FROM auth.users u 
WHERE u.email IN ('maria.wilson@email.com', 'alex.anderson@email.com', 'emma.anderson@email.com');

-- Create some class bookings for active members
INSERT INTO bookings (auth_user_id, class_id, booking_date, status, created_at)
SELECT 
    u.id,
    c.id,
    CURRENT_DATE,
    'confirmed',
    NOW()
FROM auth.users u, classes c
WHERE u.email IN ('lisa.jones@email.com', 'thomas.anderson@email.com', 'maria.wilson@email.com')
AND c.name IN ('Morning Yoga', 'HIIT Cardio', 'Evening Yoga')
LIMIT 6;

-- ========================================
-- SUMMARY REPORT
-- ========================================

DO $$
DECLARE
    staff_count INTEGER;
    member_count INTEGER;
    active_memberships INTEGER;
    total_addons INTEGER;
    family_relationships INTEGER;
BEGIN
    SELECT COUNT(*) INTO staff_count FROM profiles WHERE role IN ('admin', 'staff');
    SELECT COUNT(*) INTO member_count FROM profiles WHERE role = 'member';
    SELECT COUNT(*) INTO active_memberships FROM memberships WHERE status = 'Active';
    SELECT COUNT(*) INTO total_addons FROM membership_addons WHERE active = true;
    SELECT COUNT(*) INTO family_relationships FROM family_members;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MOMENTUM GYM TEST DATA CREATION COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Staff Accounts Created: % (admin@momentum.com, manager@momentum.com, etc.)', staff_count;
    RAISE NOTICE 'Member Accounts Created: %', member_count;
    RAISE NOTICE 'Active Memberships: %', active_memberships;
    RAISE NOTICE 'Membership Add-ons: %', total_addons;
    RAISE NOTICE 'Family Relationships: %', family_relationships;
    RAISE NOTICE '';
    RAISE NOTICE 'ALL USER PASSWORD: password405';
    RAISE NOTICE '';
    RAISE NOTICE 'TEST ACCOUNTS SUMMARY:';
    RAISE NOTICE '• Administrator: admin@momentum.com';
    RAISE NOTICE '• Manager: manager@momentum.com';
    RAISE NOTICE '• Front Desk Staff: frontdesk1@momentum.com, frontdesk2@momentum.com';
    RAISE NOTICE '• Instructor: instructor@momentum.com';
    RAISE NOTICE '';
    RAISE NOTICE 'MEMBER ACCOUNTS:';
    RAISE NOTICE '• Individual: john.smith@email.com, lisa.jones@email.com, mark.taylor@email.com';
    RAISE NOTICE '• Couples: robert.davis@email.com & sarah.davis@email.com';
    RAISE NOTICE '           james.wilson@email.com & maria.wilson@email.com';
    RAISE NOTICE '           kevin.brown@email.com & jennifer.brown@email.com';
    RAISE NOTICE '• Family: thomas.anderson@email.com + 3 family members';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready for testing membership management, billing, and role-based access!';
    RAISE NOTICE '========================================';
END $$;
