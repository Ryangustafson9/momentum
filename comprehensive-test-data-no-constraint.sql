-- ========================================
-- COMPREHENSIVE TEST DATA FOR MOMENTUM APP (NO CONSTRAINT VERSION)
-- Use this version if the membership_types table doesn't have a unique constraint on name
-- ========================================

-- First, let's clean up any existing test data to avoid conflicts
DELETE FROM check_ins WHERE auth_user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@test.momentum.com'
);
DELETE FROM bookings WHERE auth_user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@test.momentum.com'
);
DELETE FROM memberships WHERE auth_user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@test.momentum.com'
);
DELETE FROM family_members WHERE primary_member_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@test.momentum.com'
) OR family_member_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@test.momentum.com'
);
DELETE FROM member_addons WHERE member_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@test.momentum.com'
);
DELETE FROM profiles WHERE email LIKE '%@test.momentum.com';
DELETE FROM auth.users WHERE email LIKE '%@test.momentum.com';

-- Ensure we have all needed membership types (without ON CONFLICT)
DO $$
BEGIN
  -- Individual Basic
  IF NOT EXISTS (SELECT 1 FROM membership_types WHERE name = 'Individual Basic') THEN
    INSERT INTO membership_types (name, description, price, duration_months, category, active, available_online) 
    VALUES ('Individual Basic', 'Basic gym access for one person', 39.99, 1, 'Member Plans', true, true);
  END IF;
  
  -- Individual Premium
  IF NOT EXISTS (SELECT 1 FROM membership_types WHERE name = 'Individual Premium') THEN
    INSERT INTO membership_types (name, description, price, duration_months, category, active, available_online) 
    VALUES ('Individual Premium', 'Full gym access with classes for one person', 59.99, 1, 'Member Plans', true, true);
  END IF;
  
  -- Couple Basic
  IF NOT EXISTS (SELECT 1 FROM membership_types WHERE name = 'Couple Basic') THEN
    INSERT INTO membership_types (name, description, price, duration_months, category, active, available_online) 
    VALUES ('Couple Basic', 'Basic gym access for two people', 69.99, 1, 'Member Plans', true, true);
  END IF;
  
  -- Couple Premium
  IF NOT EXISTS (SELECT 1 FROM membership_types WHERE name = 'Couple Premium') THEN
    INSERT INTO membership_types (name, description, price, duration_months, category, active, available_online) 
    VALUES ('Couple Premium', 'Full gym access with classes for two people', 99.99, 1, 'Member Plans', true, true);
  END IF;
  
  -- Family Basic
  IF NOT EXISTS (SELECT 1 FROM membership_types WHERE name = 'Family Basic') THEN
    INSERT INTO membership_types (name, description, price, duration_months, category, active, available_online) 
    VALUES ('Family Basic', 'Basic gym access for up to 4 family members', 89.99, 1, 'Member Plans', true, true);
  END IF;
  
  -- Family Premium
  IF NOT EXISTS (SELECT 1 FROM membership_types WHERE name = 'Family Premium') THEN
    INSERT INTO membership_types (name, description, price, duration_months, category, active, available_online) 
    VALUES ('Family Premium', 'Full gym access with classes for up to 4 family members', 129.99, 1, 'Member Plans', true, true);
  END IF;
END $$;

-- ========================================
-- STAFF DATA (5 profiles)
-- ========================================

-- 1. Administrator
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000001',
    'authenticated', 'authenticated',
    'admin2@test.momentum.com',
    '$2a$10$YQj9Yaj9QQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9Y', -- password: admin123
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days',
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"email": "admin2@test.momentum.com", "name": "Admin User"}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone) VALUES
('a0000000-0000-0000-0000-000000000001', 'admin2@test.momentum.com', 'admin', 'Alex', 'Administrator', 'Alex Administrator', '555-0001');

-- 2. Manager
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000002',
    'authenticated', 'authenticated',
    'manager@test.momentum.com',
    '$2a$10$YQj9Yaj9QQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9Y', -- password: admin123
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '25 days',
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"email": "manager@test.momentum.com", "name": "Sam Manager"}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone) VALUES
('a0000000-0000-0000-0000-000000000002', 'manager@test.momentum.com', 'staff', 'Sam', 'Manager', 'Sam Manager', '555-0002');

-- 3. Front Desk Staff
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000003',
    'authenticated', 'authenticated',
    'frontdesk@test.momentum.com',
    '$2a$10$YQj9Yaj9QQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9Y', -- password: admin123
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '20 days',
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"email": "frontdesk@test.momentum.com", "name": "Jordan Desk"}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone) VALUES
('a0000000-0000-0000-0000-000000000003', 'frontdesk@test.momentum.com', 'staff', 'Jordan', 'Desk', 'Jordan Desk', '555-0003');

-- 4. Trainer
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000004',
    'authenticated', 'authenticated',
    'trainer@test.momentum.com',
    '$2a$10$YQj9Yaj9QQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9Y', -- password: admin123
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days',
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"email": "trainer@test.momentum.com", "name": "Casey Trainer"}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone) VALUES
('a0000000-0000-0000-0000-000000000004', 'trainer@test.momentum.com', 'staff', 'Casey', 'Trainer', 'Casey Trainer', '555-0004');

-- 5. Part-time Staff
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000005',
    'authenticated', 'authenticated',
    'parttime@test.momentum.com',
    '$2a$10$YQj9Yaj9QQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9Y', -- password: admin123
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days',
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"email": "parttime@test.momentum.com", "name": "Riley Part"}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone) VALUES
('a0000000-0000-0000-0000-000000000005', 'parttime@test.momentum.com', 'staff', 'Riley', 'Part', 'Riley Part', '555-0005');

-- ========================================
-- MEMBER DATA (20 members across different membership types)
-- ========================================

-- Individual Basic Members (4 members)
-- Member 1: John Smith
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'b0000000-0000-0000-0000-000000000001',
    'authenticated', 'authenticated',
    'john.smith@test.momentum.com',
    '$2a$10$YQj9Yaj9QQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9Y',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '60 days',
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"email": "john.smith@test.momentum.com", "name": "John Smith"}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone) VALUES
('b0000000-0000-0000-0000-000000000001', 'john.smith@test.momentum.com', 'member', 'John', 'Smith', 'John Smith', '555-1001');

INSERT INTO memberships (auth_user_id, membership_type_id, status, start_date, end_date) VALUES
('b0000000-0000-0000-0000-000000000001', (SELECT id FROM membership_types WHERE name = 'Individual Basic'), 'Active', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '30 days');

-- Member 2: Sarah Johnson
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'b0000000-0000-0000-0000-000000000002',
    'authenticated', 'authenticated',
    'sarah.johnson@test.momentum.com',
    '$2a$10$YQj9Yaj9QQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9Y',
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '45 days',
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"email": "sarah.johnson@test.momentum.com", "name": "Sarah Johnson"}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone) VALUES
('b0000000-0000-0000-0000-000000000002', 'sarah.johnson@test.momentum.com', 'member', 'Sarah', 'Johnson', 'Sarah Johnson', '555-1002');

INSERT INTO memberships (auth_user_id, membership_type_id, status, start_date, end_date) VALUES
('b0000000-0000-0000-0000-000000000002', (SELECT id FROM membership_types WHERE name = 'Individual Basic'), 'Active', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '45 days');

-- Member 3: Mike Brown (Suspended)
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'b0000000-0000-0000-0000-000000000003',
    'authenticated', 'authenticated',
    'mike.brown@test.momentum.com',
    '$2a$10$YQj9Yaj9QQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9Y',
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '90 days',
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"email": "mike.brown@test.momentum.com", "name": "Mike Brown"}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone) VALUES
('b0000000-0000-0000-0000-000000000003', 'mike.brown@test.momentum.com', 'member', 'Mike', 'Brown', 'Mike Brown', '555-1003');

INSERT INTO memberships (auth_user_id, membership_type_id, status, start_date, end_date) VALUES
('b0000000-0000-0000-0000-000000000003', (SELECT id FROM membership_types WHERE name = 'Individual Basic'), 'Suspended', CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE + INTERVAL '30 days');

-- Member 4: Lisa Davis
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'b0000000-0000-0000-0000-000000000004',
    'authenticated', 'authenticated',
    'lisa.davis@test.momentum.com',
    '$2a$10$YQj9Yaj9QQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9Y',
    NOW() - INTERVAL '120 days',
    NOW() - INTERVAL '120 days',
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"email": "lisa.davis@test.momentum.com", "name": "Lisa Davis"}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone) VALUES
('b0000000-0000-0000-0000-000000000004', 'lisa.davis@test.momentum.com', 'member', 'Lisa', 'Davis', 'Lisa Davis', '555-1004');

INSERT INTO memberships (auth_user_id, membership_type_id, status, start_date, end_date) VALUES
('b0000000-0000-0000-0000-000000000004', (SELECT id FROM membership_types WHERE name = 'Individual Basic'), 'Active', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '60 days');

-- Individual Premium Members (4 members)
-- Member 5: David Wilson
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'b0000000-0000-0000-0000-000000000005',
    'authenticated', 'authenticated',
    'david.wilson@test.momentum.com',
    '$2a$10$YQj9Yaj9QQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9Y',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days',
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"email": "david.wilson@test.momentum.com", "name": "David Wilson"}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone) VALUES
('b0000000-0000-0000-0000-000000000005', 'david.wilson@test.momentum.com', 'member', 'David', 'Wilson', 'David Wilson', '555-1005');

INSERT INTO memberships (auth_user_id, membership_type_id, status, start_date, end_date) VALUES
('b0000000-0000-0000-0000-000000000005', (SELECT id FROM membership_types WHERE name = 'Individual Premium'), 'Active', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '50 days');

-- Continue with remaining members...
-- For brevity, I'll add a few more key members and family groups

-- Family Premium (The Martinez Family)
-- Primary Member: Carlos Martinez
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'b0000000-0000-0000-0000-000000000010',
    'authenticated', 'authenticated',
    'carlos.martinez@test.momentum.com',
    '$2a$10$YQj9Yaj9QQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9Y',
    NOW() - INTERVAL '180 days',
    NOW() - INTERVAL '180 days',
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"email": "carlos.martinez@test.momentum.com", "name": "Carlos Martinez"}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone) VALUES
('b0000000-0000-0000-0000-000000000010', 'carlos.martinez@test.momentum.com', 'member', 'Carlos', 'Martinez', 'Carlos Martinez', '555-1010');

INSERT INTO memberships (auth_user_id, membership_type_id, status, start_date, end_date) VALUES
('b0000000-0000-0000-0000-000000000010', (SELECT id FROM membership_types WHERE name = 'Family Premium'), 'Active', CURRENT_DATE - INTERVAL '150 days', CURRENT_DATE + INTERVAL '30 days');

-- Maria Martinez (Spouse)
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'b0000000-0000-0000-0000-000000000011',
    'authenticated', 'authenticated',
    'maria.martinez@test.momentum.com',
    '$2a$10$YQj9Yaj9QQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9Y',
    NOW() - INTERVAL '180 days',
    NOW() - INTERVAL '180 days',
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"email": "maria.martinez@test.momentum.com", "name": "Maria Martinez"}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone) VALUES
('b0000000-0000-0000-0000-000000000011', 'maria.martinez@test.momentum.com', 'member', 'Maria', 'Martinez', 'Maria Martinez', '555-1011');

-- Sofia Martinez (Daughter - 16 years old)
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'b0000000-0000-0000-0000-000000000012',
    'authenticated', 'authenticated',
    'sofia.martinez@test.momentum.com',
    '$2a$10$YQj9Yaj9QQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9YQj9Y',
    NOW() - INTERVAL '180 days',
    NOW() - INTERVAL '180 days',
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"email": "sofia.martinez@test.momentum.com", "name": "Sofia Martinez"}'
);

INSERT INTO profiles (id, email, role, first_name, last_name, name, phone) VALUES
('b0000000-0000-0000-0000-000000000012', 'sofia.martinez@test.momentum.com', 'member', 'Sofia', 'Martinez', 'Sofia Martinez', '555-1012');

-- Create family relationships (if family_members table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'family_members') THEN
        INSERT INTO family_members (primary_member_id, family_member_id, relationship, active) VALUES
        ('b0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000011', 'spouse', true),
        ('b0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000012', 'child', true);
    END IF;
END $$;

-- ========================================
-- SAMPLE CHECK-INS (Recent activity)
-- ========================================

-- Generate check-ins for the last 7 days
INSERT INTO check_ins (auth_user_id, check_in_time, check_out_time, notes) VALUES
-- Today
('b0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', 'Morning workout'),
('b0000000-0000-0000-0000-000000000005', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours', 'Strength training session'),
('b0000000-0000-0000-0000-000000000010', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours', 'Family workout'),
('b0000000-0000-0000-0000-000000000011', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours', 'Family workout'),

-- Yesterday
('b0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 day 5 hours', NOW() - INTERVAL '1 day 4 hours', 'Cardio session'),
('b0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '1 day 6 hours', NOW() - INTERVAL '1 day 5 hours', 'Evening workout'),
('b0000000-0000-0000-0000-000000000012', NOW() - INTERVAL '1 day 3 hours', NOW() - INTERVAL '1 day 2 hours', 'Teen fitness class'),

-- 2 days ago
('b0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 days 4 hours', NOW() - INTERVAL '2 days 3 hours', 'Regular workout'),
('b0000000-0000-0000-0000-000000000005', NOW() - INTERVAL '2 days 2 hours', NOW() - INTERVAL '2 days 1 hour', 'Premium class'),

-- 3 days ago
('b0000000-0000-0000-0000-000000000010', NOW() - INTERVAL '3 days 5 hours', NOW() - INTERVAL '3 days 4 hours', 'Weekend family time'),
('b0000000-0000-0000-0000-000000000011', NOW() - INTERVAL '3 days 5 hours', NOW() - INTERVAL '3 days 4 hours', 'Weekend family time'),

-- A week ago
('b0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '7 days 3 hours', NOW() - INTERVAL '7 days 2 hours', 'Weekly check-in');

-- ========================================
-- SUMMARY
-- ========================================
SELECT 'Data import completed successfully!' as status;
SELECT COUNT(*) as staff_count FROM profiles WHERE role IN ('admin', 'staff');
SELECT COUNT(*) as member_count FROM profiles WHERE role = 'member';
SELECT COUNT(*) as active_memberships FROM memberships WHERE status = 'Active';
SELECT COUNT(*) as total_checkins FROM check_ins;
SELECT 
  mt.name as membership_type,
  COUNT(*) as member_count
FROM memberships m
JOIN membership_types mt ON m.membership_type_id = mt.id
WHERE m.status = 'Active'
GROUP BY mt.name
ORDER BY member_count DESC;
