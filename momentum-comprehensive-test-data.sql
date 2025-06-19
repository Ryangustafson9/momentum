-- ========================================
-- COMPREHENSIVE TEST DATA FOR MOMENTUM GYM
-- Creates realistic member and staff profiles for testing
-- Password for ALL users: password405
-- ========================================

-- Clear existing test data (keeping real admin accounts safe)
DO $$
BEGIN
    -- Delete test family relationships first
    DELETE FROM family_members WHERE primary_member_id IN (
        SELECT id FROM profiles WHERE email LIKE '%@testgym.com' OR email LIKE '%@momentumtest.com'
    );
    
    -- Delete test membership addons
    DELETE FROM membership_addons WHERE membership_id IN (
        SELECT id FROM memberships WHERE auth_user_id IN (
            SELECT id FROM profiles WHERE email LIKE '%@testgym.com' OR email LIKE '%@momentumtest.com'
        )
    );
    
    -- Delete test bookings and attendance
    DELETE FROM bookings WHERE member_id IN (
        SELECT id FROM profiles WHERE email LIKE '%@testgym.com' OR email LIKE '%@momentumtest.com'
    );
    
    DELETE FROM attendance WHERE member_id IN (
        SELECT id FROM profiles WHERE email LIKE '%@testgym.com' OR email LIKE '%@momentumtest.com'
    );
    
    -- Delete test memberships
    DELETE FROM memberships WHERE auth_user_id IN (
        SELECT id FROM profiles WHERE email LIKE '%@testgym.com' OR email LIKE '%@momentumtest.com'
    );
    
    -- Delete test profiles
    DELETE FROM profiles WHERE email LIKE '%@testgym.com' OR email LIKE '%@momentumtest.com';
    
    -- Delete test auth users
    DELETE FROM auth.users WHERE email LIKE '%@testgym.com' OR email LIKE '%@momentumtest.com';
    
    RAISE NOTICE 'Cleared existing test data';
END $$;

-- ========================================
-- CREATE TEST USERS IN AUTH.USERS
-- ========================================

-- STAFF USERS (5 total)
INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, 
    created_at, updated_at, raw_user_meta_data, role
) VALUES 
-- 1. Administrator
('11111111-1111-1111-1111-111111111111', 'admin@momentumtest.com', crypt('password405', gen_salt('bf')), NOW(), NOW(), NOW(), '{"first_name": "Sarah", "last_name": "Chen", "role": "admin"}', 'authenticated'),

-- 2. Manager
('22222222-2222-2222-2222-222222222222', 'manager@momentumtest.com', crypt('password405', gen_salt('bf')), NOW(), NOW(), NOW(), '{"first_name": "Michael", "last_name": "Rodriguez", "role": "staff"}', 'authenticated'),

-- 3. Front Desk Staff 1
('33333333-3333-3333-3333-333333333333', 'frontdesk1@momentumtest.com', crypt('password405', gen_salt('bf')), NOW(), NOW(), NOW(), '{"first_name": "Emma", "last_name": "Thompson", "role": "staff"}', 'authenticated'),

-- 4. Front Desk Staff 2
('44444444-4444-4444-4444-444444444444', 'frontdesk2@momentumtest.com', crypt('password405', gen_salt('bf')), NOW(), NOW(), NOW(), '{"first_name": "James", "last_name": "Wilson", "role": "staff"}', 'authenticated'),

-- 5. Instructor
('55555555-5555-5555-5555-555555555555', 'instructor@momentumtest.com', crypt('password405', gen_salt('bf')), NOW(), NOW(), NOW(), '{"first_name": "Lisa", "last_name": "Martinez", "role": "staff"}', 'authenticated');

-- MEMBER USERS (15 total - includes family members)
INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, 
    created_at, updated_at, raw_user_meta_data, role
) VALUES 
-- Individual Members (3 total)
('aa111111-1111-1111-1111-111111111111', 'alex.johnson@testgym.com', crypt('password405', gen_salt('bf')), NOW(), NOW(), NOW(), '{"first_name": "Alex", "last_name": "Johnson", "role": "member"}', 'authenticated'),
('bb111111-1111-1111-1111-111111111111', 'maria.garcia@testgym.com', crypt('password405', gen_salt('bf')), NOW(), NOW(), NOW(), '{"first_name": "Maria", "last_name": "Garcia", "role": "member"}', 'authenticated'),
('cc111111-1111-1111-1111-111111111111', 'david.brown@testgym.com', crypt('password405', gen_salt('bf')), NOW(), NOW(), NOW(), '{"first_name": "David", "last_name": "Brown", "role": "member"}', 'authenticated'),

-- Couple Members (6 total - 3 couples)
-- Couple 1: John & Jennifer Davis
('dd111111-1111-1111-1111-111111111111', 'john.davis@testgym.com', crypt('password405', gen_salt('bf')), NOW(), NOW(), NOW(), '{"first_name": "John", "last_name": "Davis", "role": "member"}', 'authenticated'),
('ee111111-1111-1111-1111-111111111111', 'jennifer.davis@testgym.com', crypt('password405', gen_salt('bf')), NOW(), NOW(), NOW(), '{"first_name": "Jennifer", "last_name": "Davis", "role": "member"}', 'authenticated'),

-- Couple 2: Robert & Lisa Anderson
('ff111111-1111-1111-1111-111111111111', 'robert.anderson@testgym.com', crypt('password405', gen_salt('bf')), NOW(), NOW(), NOW(), '{"first_name": "Robert", "last_name": "Anderson", "role": "member"}', 'authenticated'),
('gg111111-1111-1111-1111-111111111111', 'lisa.anderson@testgym.com', crypt('password405', gen_salt('bf')), NOW(), NOW(), NOW(), '{"first_name": "Lisa", "last_name": "Anderson", "role": "member"}', 'authenticated'),

-- Couple 3: Kevin & Sarah Miller
('hh111111-1111-1111-1111-111111111111', 'kevin.miller@testgym.com', crypt('password405', gen_salt('bf')), NOW(), NOW(), NOW(), '{"first_name": "Kevin", "last_name": "Miller", "role": "member"}', 'authenticated'),
('ii111111-1111-1111-1111-111111111111', 'sarah.miller@testgym.com', crypt('password405', gen_salt('bf')), NOW(), NOW(), NOW(), '{"first_name": "Sarah", "last_name": "Miller", "role": "member"}', 'authenticated'),

-- Family Members (13 total - 4 families with 3-4 members each)
-- Family 1: The Smiths (4 members)
('jj111111-1111-1111-1111-111111111111', 'mike.smith@testgym.com', crypt('password405', gen_salt('bf')), NOW(), NOW(), NOW(), '{"first_name": "Mike", "last_name": "Smith", "role": "member"}', 'authenticated'),
('kk111111-1111-1111-1111-111111111111', 'linda.smith@testgym.com', crypt('password405', gen_salt('bf')), NOW(), NOW(), NOW(), '{"first_name": "Linda", "last_name": "Smith", "role": "member"}', 'authenticated'),
('ll111111-1111-1111-1111-111111111111', 'tyler.smith@testgym.com', crypt('password405', gen_salt('bf')), NOW(), NOW(), NOW(), '{"first_name": "Tyler", "last_name": "Smith", "role": "member"}', 'authenticated'),
('mm111111-1111-1111-1111-111111111111', 'emma.smith@testgym.com', crypt('password405', gen_salt('bf')), NOW(), NOW(), NOW(), '{"first_name": "Emma", "last_name": "Smith", "role": "member"}', 'authenticated'),

-- Family 2: The Johnsons (3 members)
('nn111111-1111-1111-1111-111111111111', 'chris.johnson@testgym.com', crypt('password405', gen_salt('bf')), NOW(), NOW(), NOW(), '{"first_name": "Chris", "last_name": "Johnson", "role": "member"}', 'authenticated'),
('oo111111-1111-1111-1111-111111111111', 'amy.johnson@testgym.com', crypt('password405', gen_salt('bf')), NOW(), NOW(), NOW(), '{"first_name": "Amy", "last_name": "Johnson", "role": "member"}', 'authenticated'),
('pp111111-1111-1111-1111-111111111111', 'jake.johnson@testgym.com', crypt('password405', gen_salt('bf')), NOW(), NOW(), NOW(), '{"first_name": "Jake", "last_name": "Johnson", "role": "member"}', 'authenticated'),

-- Family 3: The Williams (3 members)
('qq111111-1111-1111-1111-111111111111', 'brian.williams@testgym.com', crypt('password405', gen_salt('bf')), NOW(), NOW(), NOW(), '{"first_name": "Brian", "last_name": "Williams", "role": "member"}', 'authenticated'),
('rr111111-1111-1111-1111-111111111111', 'jessica.williams@testgym.com', crypt('password405', gen_salt('bf')), NOW(), NOW(), NOW(), '{"first_name": "Jessica", "last_name": "Williams", "role": "member"}', 'authenticated'),
('ss111111-1111-1111-1111-111111111111', 'sophia.williams@testgym.com', crypt('password405', gen_salt('bf')), NOW(), NOW(), NOW(), '{"first_name": "Sophia", "last_name": "Williams", "role": "member"}', 'authenticated'),

-- Family 4: The Taylors (3 members)
('tt111111-1111-1111-1111-111111111111', 'mark.taylor@testgym.com', crypt('password405', gen_salt('bf')), NOW(), NOW(), NOW(), '{"first_name": "Mark", "last_name": "Taylor", "role": "member"}', 'authenticated'),
('uu111111-1111-1111-1111-111111111111', 'rachel.taylor@testgym.com', crypt('password405', gen_salt('bf')), NOW(), NOW(), NOW(), '{"first_name": "Rachel", "last_name": "Taylor", "role": "member"}', 'authenticated'),
('vv111111-1111-1111-1111-111111111111', 'noah.taylor@testgym.com', crypt('password405', gen_salt('bf')), NOW(), NOW(), NOW(), '{"first_name": "Noah", "last_name": "Taylor", "role": "member"}', 'authenticated');

-- ========================================
-- CREATE PROFILES FOR ALL USERS
-- ========================================

-- STAFF PROFILES
INSERT INTO profiles (
    id, email, first_name, last_name, display_name, role, phone, 
    date_of_birth, emergency_contact_name, emergency_contact_phone,
    created_at, updated_at
) VALUES
-- Administrator
('11111111-1111-1111-1111-111111111111', 'admin@momentumtest.com', 'Sarah', 'Chen', 'Sarah Chen', 'admin', '555-0101', '1985-03-15', 'Tom Chen', '555-0102', NOW() - interval '2 years', NOW()),

-- Manager  
('22222222-2222-2222-2222-222222222222', 'manager@momentumtest.com', 'Michael', 'Rodriguez', 'Michael Rodriguez', 'staff', '555-0201', '1988-07-22', 'Ana Rodriguez', '555-0202', NOW() - interval '18 months', NOW()),

-- Front Desk Staff 1
('33333333-3333-3333-3333-333333333333', 'frontdesk1@momentumtest.com', 'Emma', 'Thompson', 'Emma Thompson', 'staff', '555-0301', '1995-11-08', 'Paul Thompson', '555-0302', NOW() - interval '1 year', NOW()),

-- Front Desk Staff 2
('44444444-4444-4444-4444-444444444444', 'frontdesk2@momentumtest.com', 'James', 'Wilson', 'James Wilson', 'staff', '555-0401', '1992-05-30', 'Mary Wilson', '555-0402', NOW() - interval '8 months', NOW()),

-- Instructor
('55555555-5555-5555-5555-555555555555', 'instructor@momentumtest.com', 'Lisa', 'Martinez', 'Lisa Martinez', 'staff', '555-0501', '1987-09-14', 'Carlos Martinez', '555-0502', NOW() - interval '3 years', NOW());

-- MEMBER PROFILES
INSERT INTO profiles (
    id, email, first_name, last_name, display_name, role, phone, 
    date_of_birth, emergency_contact_name, emergency_contact_phone,
    medical_conditions, fitness_goals, created_at, updated_at
) VALUES 
-- Individual Members
('aa111111-1111-1111-1111-111111111111', 'alex.johnson@testgym.com', 'Alex', 'Johnson', 'Alex Johnson', 'member', '555-1001', '1990-04-12', 'Sam Johnson', '555-1002', NULL, ARRAY['Weight Loss', 'Strength Training'], NOW() - interval '6 months', NOW()),
('bb111111-1111-1111-1111-111111111111', 'maria.garcia@testgym.com', 'Maria', 'Garcia', 'Maria Garcia', 'member', '555-1101', '1986-12-03', 'Luis Garcia', '555-1102', 'Asthma', ARRAY['Cardio Fitness', 'Flexibility'], NOW() - interval '4 months', NOW()),
('cc111111-1111-1111-1111-111111111111', 'david.brown@testgym.com', 'David', 'Brown', 'David Brown', 'member', '555-1201', '1993-08-25', 'Jennifer Brown', '555-1202', NULL, ARRAY['Muscle Building', 'Athletic Performance'], NOW() - interval '8 months', NOW()),

-- Couple Members
('dd111111-1111-1111-1111-111111111111', 'john.davis@testgym.com', 'John', 'Davis', 'John Davis', 'member', '555-2001', '1982-01-15', 'Jennifer Davis', '555-2002', NULL, ARRAY['General Fitness', 'Weight Loss'], NOW() - interval '1 year', NOW()),
('ee111111-1111-1111-1111-111111111111', 'jennifer.davis@testgym.com', 'Jennifer', 'Davis', 'Jennifer Davis', 'member', '555-2002', '1984-06-20', 'John Davis', '555-2001', NULL, ARRAY['Yoga', 'Stress Relief'], NOW() - interval '1 year', NOW()),

('ff111111-1111-1111-1111-111111111111', 'robert.anderson@testgym.com', 'Robert', 'Anderson', 'Robert Anderson', 'member', '555-2101', '1979-10-08', 'Lisa Anderson', '555-2102', 'High Blood Pressure', ARRAY['Heart Health', 'Low Impact Exercise'], NOW() - interval '2 years', NOW()),
('gg111111-1111-1111-1111-111111111111', 'lisa.anderson@testgym.com', 'Lisa', 'Anderson', 'Lisa Anderson', 'member', '555-2102', '1981-03-12', 'Robert Anderson', '555-2101', NULL, ARRAY['Strength Training', 'Balance'], NOW() - interval '2 years', NOW()),

('hh111111-1111-1111-1111-111111111111', 'kevin.miller@testgym.com', 'Kevin', 'Miller', 'Kevin Miller', 'member', '555-2201', '1988-07-04', 'Sarah Miller', '555-2202', NULL, ARRAY['CrossFit', 'Functional Fitness'], NOW() - interval '9 months', NOW()),
('ii111111-1111-1111-1111-111111111111', 'sarah.miller@testgym.com', 'Sarah', 'Miller', 'Sarah Miller', 'member', '555-2202', '1990-11-18', 'Kevin Miller', '555-2201', NULL, ARRAY['Pilates', 'Core Strength'], NOW() - interval '9 months', NOW()),

-- Family Members
-- Smith Family
('jj111111-1111-1111-1111-111111111111', 'mike.smith@testgym.com', 'Mike', 'Smith', 'Mike Smith', 'member', '555-3001', '1980-05-10', 'Linda Smith', '555-3002', NULL, ARRAY['Weight Training', 'Dad Strength'], NOW() - interval '15 months', NOW()),
('kk111111-1111-1111-1111-111111111111', 'linda.smith@testgym.com', 'Linda', 'Smith', 'Linda Smith', 'member', '555-3002', '1982-09-22', 'Mike Smith', '555-3001', NULL, ARRAY['Group Classes', 'Social Fitness'], NOW() - interval '15 months', NOW()),
('ll111111-1111-1111-1111-111111111111', 'tyler.smith@testgym.com', 'Tyler', 'Smith', 'Tyler Smith', 'member', '555-3003', '2005-03-15', 'Mike Smith', '555-3001', NULL, ARRAY['Sports Training', 'Youth Fitness'], NOW() - interval '15 months', NOW()),
('mm111111-1111-1111-1111-111111111111', 'emma.smith@testgym.com', 'Emma', 'Smith', 'Emma Smith', 'member', '555-3004', '2007-08-08', 'Linda Smith', '555-3002', NULL, ARRAY['Dance', 'Flexibility'], NOW() - interval '15 months', NOW()),

-- Johnson Family
('nn111111-1111-1111-1111-111111111111', 'chris.johnson@testgym.com', 'Chris', 'Johnson', 'Chris Johnson', 'member', '555-3101', '1977-12-30', 'Amy Johnson', '555-3102', 'Diabetes Type 2', ARRAY['Health Management', 'Cardio'], NOW() - interval '10 months', NOW()),
('oo111111-1111-1111-1111-111111111111', 'amy.johnson@testgym.com', 'Amy', 'Johnson', 'Amy Johnson', 'member', '555-3102', '1979-04-18', 'Chris Johnson', '555-3101', NULL, ARRAY['Wellness', 'Mind-Body Connection'], NOW() - interval '10 months', NOW()),
('pp111111-1111-1111-1111-111111111111', 'jake.johnson@testgym.com', 'Jake', 'Johnson', 'Jake Johnson', 'member', '555-3103', '2004-11-05', 'Chris Johnson', '555-3101', NULL, ARRAY['Basketball', 'Teen Fitness'], NOW() - interval '10 months', NOW()),

-- Williams Family
('qq111111-1111-1111-1111-111111111111', 'brian.williams@testgym.com', 'Brian', 'Williams', 'Brian Williams', 'member', '555-3201', '1985-02-14', 'Jessica Williams', '555-3202', NULL, ARRAY['Marathon Training', 'Endurance'], NOW() - interval '7 months', NOW()),
('rr111111-1111-1111-1111-111111111111', 'jessica.williams@testgym.com', 'Jessica', 'Williams', 'Jessica Williams', 'member', '555-3202', '1987-06-27', 'Brian Williams', '555-3201', NULL, ARRAY['Postpartum Fitness', 'Core Recovery'], NOW() - interval '7 months', NOW()),
('ss111111-1111-1111-1111-111111111111', 'sophia.williams@testgym.com', 'Sophia', 'Williams', 'Sophia Williams', 'member', '555-3203', '2008-09-12', 'Jessica Williams', '555-3202', NULL, ARRAY['Swimming', 'Youth Development'], NOW() - interval '7 months', NOW()),

-- Taylor Family
('tt111111-1111-1111-1111-111111111111', 'mark.taylor@testgym.com', 'Mark', 'Taylor', 'Mark Taylor', 'member', '555-3301', '1983-08-05', 'Rachel Taylor', '555-3302', 'Back Issues', ARRAY['Physical Therapy', 'Core Strengthening'], NOW() - interval '5 months', NOW()),
('uu111111-1111-1111-1111-111111111111', 'rachel.taylor@testgym.com', 'Rachel', 'Taylor', 'Rachel Taylor', 'member', '555-3302', '1985-01-28', 'Mark Taylor', '555-3301', NULL, ARRAY['Yoga', 'Meditation'], NOW() - interval '5 months', NOW()),
('vv111111-1111-1111-1111-111111111111', 'noah.taylor@testgym.com', 'Noah', 'Taylor', 'Noah Taylor', 'member', '555-3303', '2006-05-20', 'Rachel Taylor', '555-3302', NULL, ARRAY['Soccer Training', 'Agility'], NOW() - interval '5 months', NOW());

-- ========================================
-- GET MEMBERSHIP TYPE IDs
-- ========================================

-- We need to get the actual membership type IDs from the database
DO $$
DECLARE
    individual_type_id UUID;
    couple_type_id UUID;
    family_type_id UUID;
    
    personal_training_id UUID;
    locker_rental_id UUID;
    guest_passes_id UUID;
    nutrition_id UUID;
    towel_service_id UUID;
BEGIN
    -- Get membership type IDs
    SELECT id INTO individual_type_id FROM membership_types WHERE name ILIKE '%individual%' OR (member_type = 'individual' AND is_addon = false) LIMIT 1;
    SELECT id INTO couple_type_id FROM membership_types WHERE name ILIKE '%couple%' OR (member_type = 'couple' AND is_addon = false) LIMIT 1;
    SELECT id INTO family_type_id FROM membership_types WHERE name ILIKE '%family%' OR (member_type = 'family' AND is_addon = false) LIMIT 1;
    
    -- Get add-on type IDs
    SELECT id INTO personal_training_id FROM membership_types WHERE name ILIKE '%personal training%' AND is_addon = true LIMIT 1;
    SELECT id INTO locker_rental_id FROM membership_types WHERE name ILIKE '%locker%' AND is_addon = true LIMIT 1;
    SELECT id INTO guest_passes_id FROM membership_types WHERE name ILIKE '%guest%' AND is_addon = true LIMIT 1;
    SELECT id INTO nutrition_id FROM membership_types WHERE name ILIKE '%nutrition%' AND is_addon = true LIMIT 1;
    SELECT id INTO towel_service_id FROM membership_types WHERE name ILIKE '%towel%' AND is_addon = true LIMIT 1;
    
    -- Log the IDs found
    RAISE NOTICE 'Found membership types - Individual: %, Couple: %, Family: %', individual_type_id, couple_type_id, family_type_id;
    RAISE NOTICE 'Found addon types - Personal Training: %, Locker: %, Guest Passes: %, Nutrition: %, Towel: %', personal_training_id, locker_rental_id, guest_passes_id, nutrition_id, towel_service_id;
END $$;

-- ========================================
-- CREATE MEMBERSHIPS
-- ========================================

-- Individual Memberships (3 total)
INSERT INTO memberships (
    id, auth_user_id, current_membership_type_id, membership_type, status, join_date, 
    monthly_fee, billing_cycle, auto_renew, is_primary_member, family_role,
    family_member_count, max_family_members, created_at, updated_at
) VALUES 
('aaaa1111-1111-1111-1111-111111111111', 'aa111111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE member_type = 'individual' AND is_addon = false LIMIT 1), 'individual', 'active', CURRENT_DATE - interval '6 months', 49.99, 'monthly', true, true, 'primary', 1, 1, NOW() - interval '6 months', NOW()),

('bbbb1111-1111-1111-1111-111111111111', 'bb111111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE member_type = 'individual' AND is_addon = false LIMIT 1), 'individual', 'active', CURRENT_DATE - interval '4 months', 49.99, 'monthly', true, true, 'primary', 1, 1, NOW() - interval '4 months', NOW()),

('cccc1111-1111-1111-1111-111111111111', 'cc111111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE member_type = 'individual' AND is_addon = false LIMIT 1), 'individual', 'active', CURRENT_DATE - interval '8 months', 49.99, 'monthly', true, true, 'primary', 1, 1, NOW() - interval '8 months', NOW());

-- Couple Memberships (3 couples = 6 membership records, with family relationships)
-- Couple 1: John & Jennifer Davis
INSERT INTO memberships (
    id, auth_user_id, current_membership_type_id, membership_type, status, join_date, 
    monthly_fee, billing_cycle, auto_renew, is_primary_member, family_role,
    family_member_count, max_family_members, created_at, updated_at
) VALUES 
('dddd1111-1111-1111-1111-111111111111', 'dd111111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE member_type = 'couple' AND is_addon = false LIMIT 1), 'couple', 'active', CURRENT_DATE - interval '1 year', 79.99, 'monthly', true, true, 'primary', 2, 2, NOW() - interval '1 year', NOW()),

('eeee1111-1111-1111-1111-111111111111', 'ee111111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE member_type = 'couple' AND is_addon = false LIMIT 1), 'couple', 'active', CURRENT_DATE - interval '1 year', 0.00, 'monthly', true, false, 'spouse', 2, 2, NOW() - interval '1 year', NOW());

-- Set primary member relationship for Jennifer Davis
UPDATE memberships SET primary_member_id = 'dddd1111-1111-1111-1111-111111111111' WHERE id = 'eeee1111-1111-1111-1111-111111111111';

-- Couple 2: Robert & Lisa Anderson
INSERT INTO memberships (
    id, auth_user_id, current_membership_type_id, membership_type, status, join_date, 
    monthly_fee, billing_cycle, auto_renew, is_primary_member, family_role,
    family_member_count, max_family_members, created_at, updated_at
) VALUES 
('ffff1111-1111-1111-1111-111111111111', 'ff111111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE member_type = 'couple' AND is_addon = false LIMIT 1), 'couple', 'active', CURRENT_DATE - interval '2 years', 79.99, 'monthly', true, true, 'primary', 2, 2, NOW() - interval '2 years', NOW()),

('gggg1111-1111-1111-1111-111111111111', 'gg111111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE member_type = 'couple' AND is_addon = false LIMIT 1), 'couple', 'active', CURRENT_DATE - interval '2 years', 0.00, 'monthly', true, false, 'spouse', 2, 2, NOW() - interval '2 years', NOW());

UPDATE memberships SET primary_member_id = 'ffff1111-1111-1111-1111-111111111111' WHERE id = 'gggg1111-1111-1111-1111-111111111111';

-- Couple 3: Kevin & Sarah Miller
INSERT INTO memberships (
    id, auth_user_id, current_membership_type_id, membership_type, status, join_date, 
    monthly_fee, billing_cycle, auto_renew, is_primary_member, family_role,
    family_member_count, max_family_members, created_at, updated_at
) VALUES 
('hhhh1111-1111-1111-1111-111111111111', 'hh111111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE member_type = 'couple' AND is_addon = false LIMIT 1), 'couple', 'active', CURRENT_DATE - interval '9 months', 79.99, 'monthly', true, true, 'primary', 2, 2, NOW() - interval '9 months', NOW()),

('iiii1111-1111-1111-1111-111111111111', 'ii111111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE member_type = 'couple' AND is_addon = false LIMIT 1), 'couple', 'active', CURRENT_DATE - interval '9 months', 0.00, 'monthly', true, false, 'spouse', 2, 2, NOW() - interval '9 months', NOW());

UPDATE memberships SET primary_member_id = 'hhhh1111-1111-1111-1111-111111111111' WHERE id = 'iiii1111-1111-1111-1111-111111111111';

-- Family Memberships (4 families = 13 membership records)
-- Family 1: Smith Family (4 members)
INSERT INTO memberships (
    id, auth_user_id, current_membership_type_id, membership_type, status, join_date, 
    monthly_fee, billing_cycle, auto_renew, is_primary_member, family_role,
    family_member_count, max_family_members, created_at, updated_at
) VALUES 
('jjjj1111-1111-1111-1111-111111111111', 'jj111111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE member_type = 'family' AND is_addon = false LIMIT 1), 'family', 'active', CURRENT_DATE - interval '15 months', 99.99, 'monthly', true, true, 'primary', 4, 4, NOW() - interval '15 months', NOW()),

('kkkk1111-1111-1111-1111-111111111111', 'kk111111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE member_type = 'family' AND is_addon = false LIMIT 1), 'family', 'active', CURRENT_DATE - interval '15 months', 0.00, 'monthly', true, false, 'spouse', 4, 4, NOW() - interval '15 months', NOW()),

('llll1111-1111-1111-1111-111111111111', 'll111111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE member_type = 'family' AND is_addon = false LIMIT 1), 'family', 'active', CURRENT_DATE - interval '15 months', 0.00, 'monthly', true, false, 'child', 4, 4, NOW() - interval '15 months', NOW()),

('mmmm1111-1111-1111-1111-111111111111', 'mm111111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE member_type = 'family' AND is_addon = false LIMIT 1), 'family', 'active', CURRENT_DATE - interval '15 months', 0.00, 'monthly', true, false, 'child', 4, 4, NOW() - interval '15 months', NOW());

-- Set primary member relationships for Smith family
UPDATE memberships SET primary_member_id = 'jjjj1111-1111-1111-1111-111111111111' WHERE id IN ('kkkk1111-1111-1111-1111-111111111111', 'llll1111-1111-1111-1111-111111111111', 'mmmm1111-1111-1111-1111-111111111111');

-- Family 2: Johnson Family (3 members)
INSERT INTO memberships (
    id, auth_user_id, current_membership_type_id, membership_type, status, join_date, 
    monthly_fee, billing_cycle, auto_renew, is_primary_member, family_role,
    family_member_count, max_family_members, created_at, updated_at
) VALUES 
('nnnn1111-1111-1111-1111-111111111111', 'nn111111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE member_type = 'family' AND is_addon = false LIMIT 1), 'family', 'active', CURRENT_DATE - interval '10 months', 99.99, 'monthly', true, true, 'primary', 3, 4, NOW() - interval '10 months', NOW()),

('oooo1111-1111-1111-1111-111111111111', 'oo111111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE member_type = 'family' AND is_addon = false LIMIT 1), 'family', 'active', CURRENT_DATE - interval '10 months', 0.00, 'monthly', true, false, 'spouse', 3, 4, NOW() - interval '10 months', NOW()),

('pppp1111-1111-1111-1111-111111111111', 'pp111111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE member_type = 'family' AND is_addon = false LIMIT 1), 'family', 'active', CURRENT_DATE - interval '10 months', 0.00, 'monthly', true, false, 'child', 3, 4, NOW() - interval '10 months', NOW());

UPDATE memberships SET primary_member_id = 'nnnn1111-1111-1111-1111-111111111111' WHERE id IN ('oooo1111-1111-1111-1111-111111111111', 'pppp1111-1111-1111-1111-111111111111');

-- Family 3: Williams Family (3 members)
INSERT INTO memberships (
    id, auth_user_id, current_membership_type_id, membership_type, status, join_date, 
    monthly_fee, billing_cycle, auto_renew, is_primary_member, family_role,
    family_member_count, max_family_members, created_at, updated_at
) VALUES 
('qqqq1111-1111-1111-1111-111111111111', 'qq111111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE member_type = 'family' AND is_addon = false LIMIT 1), 'family', 'active', CURRENT_DATE - interval '7 months', 99.99, 'monthly', true, true, 'primary', 3, 4, NOW() - interval '7 months', NOW()),

('rrrr1111-1111-1111-1111-111111111111', 'rr111111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE member_type = 'family' AND is_addon = false LIMIT 1), 'family', 'active', CURRENT_DATE - interval '7 months', 0.00, 'monthly', true, false, 'spouse', 3, 4, NOW() - interval '7 months', NOW()),

('ssss1111-1111-1111-1111-111111111111', 'ss111111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE member_type = 'family' AND is_addon = false LIMIT 1), 'family', 'active', CURRENT_DATE - interval '7 months', 0.00, 'monthly', true, false, 'child', 3, 4, NOW() - interval '7 months', NOW());

UPDATE memberships SET primary_member_id = 'qqqq1111-1111-1111-1111-111111111111' WHERE id IN ('rrrr1111-1111-1111-1111-111111111111', 'ssss1111-1111-1111-1111-111111111111');

-- Family 4: Taylor Family (3 members)
INSERT INTO memberships (
    id, auth_user_id, current_membership_type_id, membership_type, status, join_date, 
    monthly_fee, billing_cycle, auto_renew, is_primary_member, family_role,
    family_member_count, max_family_members, created_at, updated_at
) VALUES 
('tttt1111-1111-1111-1111-111111111111', 'tt111111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE member_type = 'family' AND is_addon = false LIMIT 1), 'family', 'active', CURRENT_DATE - interval '5 months', 99.99, 'monthly', true, true, 'primary', 3, 4, NOW() - interval '5 months', NOW()),

('uuuu1111-1111-1111-1111-111111111111', 'uu111111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE member_type = 'family' AND is_addon = false LIMIT 1), 'family', 'active', CURRENT_DATE - interval '5 months', 0.00, 'monthly', true, false, 'spouse', 3, 4, NOW() - interval '5 months', NOW()),

('vvvv1111-1111-1111-1111-111111111111', 'vv111111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE member_type = 'family' AND is_addon = false LIMIT 1), 'family', 'active', CURRENT_DATE - interval '5 months', 0.00, 'monthly', true, false, 'child', 3, 4, NOW() - interval '5 months', NOW());

UPDATE memberships SET primary_member_id = 'tttt1111-1111-1111-1111-111111111111' WHERE id IN ('uuuu1111-1111-1111-1111-111111111111', 'vvvv1111-1111-1111-1111-111111111111');

-- ========================================
-- CREATE FAMILY MEMBER RELATIONSHIPS
-- ========================================

INSERT INTO family_members (primary_member_id, family_member_id, relationship, created_at) VALUES 
-- Davis Couple
('dd111111-1111-1111-1111-111111111111', 'ee111111-1111-1111-1111-111111111111', 'spouse', NOW() - interval '1 year'),

-- Anderson Couple
('ff111111-1111-1111-1111-111111111111', 'gg111111-1111-1111-1111-111111111111', 'spouse', NOW() - interval '2 years'),

-- Miller Couple
('hh111111-1111-1111-1111-111111111111', 'ii111111-1111-1111-1111-111111111111', 'spouse', NOW() - interval '9 months'),

-- Smith Family
('jj111111-1111-1111-1111-111111111111', 'kk111111-1111-1111-1111-111111111111', 'spouse', NOW() - interval '15 months'),
('jj111111-1111-1111-1111-111111111111', 'll111111-1111-1111-1111-111111111111', 'child', NOW() - interval '15 months'),
('jj111111-1111-1111-1111-111111111111', 'mm111111-1111-1111-1111-111111111111', 'child', NOW() - interval '15 months'),

-- Johnson Family
('nn111111-1111-1111-1111-111111111111', 'oo111111-1111-1111-1111-111111111111', 'spouse', NOW() - interval '10 months'),
('nn111111-1111-1111-1111-111111111111', 'pp111111-1111-1111-1111-111111111111', 'child', NOW() - interval '10 months'),

-- Williams Family
('qq111111-1111-1111-1111-111111111111', 'rr111111-1111-1111-1111-111111111111', 'spouse', NOW() - interval '7 months'),
('qq111111-1111-1111-1111-111111111111', 'ss111111-1111-1111-1111-111111111111', 'child', NOW() - interval '7 months'),

-- Taylor Family
('tt111111-1111-1111-1111-111111111111', 'uu111111-1111-1111-1111-111111111111', 'spouse', NOW() - interval '5 months'),
('tt111111-1111-1111-1111-111111111111', 'vv111111-1111-1111-1111-111111111111', 'child', NOW() - interval '5 months');

-- ========================================
-- CREATE MEMBERSHIP ADD-ONS
-- ========================================

-- Add varied add-ons across members using the membership_addons table
INSERT INTO membership_addons (membership_id, addon_type_id, status, start_date, monthly_cost, billing_cycle, auto_renew, created_at) VALUES 

-- Individual Members Add-ons
-- Alex Johnson: Personal Training
('aaaa1111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE name ILIKE '%personal training%' AND is_addon = true LIMIT 1), 'active', CURRENT_DATE - interval '3 months', 75.00, 'monthly', true, NOW() - interval '3 months'),

-- Maria Garcia: Locker Rental + Towel Service
('bbbb1111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE name ILIKE '%locker%' AND is_addon = true LIMIT 1), 'active', CURRENT_DATE - interval '4 months', 15.00, 'monthly', true, NOW() - interval '4 months'),
('bbbb1111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE name ILIKE '%towel%' AND is_addon = true LIMIT 1), 'active', CURRENT_DATE - interval '2 months', 10.00, 'monthly', true, NOW() - interval '2 months'),

-- David Brown: Guest Passes + Personal Training
('cccc1111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE name ILIKE '%guest%' AND is_addon = true LIMIT 1), 'active', CURRENT_DATE - interval '6 months', 20.00, 'monthly', true, NOW() - interval '6 months'),
('cccc1111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE name ILIKE '%personal training%' AND is_addon = true LIMIT 1), 'active', CURRENT_DATE - interval '8 months', 75.00, 'monthly', true, NOW() - interval '8 months'),

-- Couple Members Add-ons
-- John Davis: Locker Rental
('dddd1111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE name ILIKE '%locker%' AND is_addon = true LIMIT 1), 'active', CURRENT_DATE - interval '1 year', 15.00, 'monthly', true, NOW() - interval '1 year'),

-- Robert Anderson: Nutrition Consultation (health focused)
('ffff1111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE name ILIKE '%nutrition%' AND is_addon = true LIMIT 1), 'active', CURRENT_DATE - interval '18 months', 25.00, 'monthly', true, NOW() - interval '18 months'),

-- Lisa Anderson: Personal Training
('gggg1111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE name ILIKE '%personal training%' AND is_addon = true LIMIT 1), 'active', CURRENT_DATE - interval '1 year', 75.00, 'monthly', true, NOW() - interval '1 year'),

-- Kevin Miller: Guest Passes
('hhhh1111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE name ILIKE '%guest%' AND is_addon = true LIMIT 1), 'active', CURRENT_DATE - interval '6 months', 20.00, 'monthly', true, NOW() - interval '6 months'),

-- Family Members Add-ons
-- Mike Smith: Personal Training + Locker
('jjjj1111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE name ILIKE '%personal training%' AND is_addon = true LIMIT 1), 'active', CURRENT_DATE - interval '12 months', 75.00, 'monthly', true, NOW() - interval '12 months'),
('jjjj1111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE name ILIKE '%locker%' AND is_addon = true LIMIT 1), 'active', CURRENT_DATE - interval '15 months', 15.00, 'monthly', true, NOW() - interval '15 months'),

-- Chris Johnson: Nutrition Consultation (diabetes management)
('nnnn1111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE name ILIKE '%nutrition%' AND is_addon = true LIMIT 1), 'active', CURRENT_DATE - interval '10 months', 25.00, 'monthly', true, NOW() - interval '10 months'),

-- Brian Williams: Guest Passes (marathon training partners)
('qqqq1111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE name ILIKE '%guest%' AND is_addon = true LIMIT 1), 'active', CURRENT_DATE - interval '5 months', 20.00, 'monthly', true, NOW() - interval '5 months'),

-- Mark Taylor: Personal Training (back issues)
('tttt1111-1111-1111-1111-111111111111', (SELECT id FROM membership_types WHERE name ILIKE '%personal training%' AND is_addon = true LIMIT 1), 'active', CURRENT_DATE - interval '3 months', 75.00, 'monthly', true, NOW() - interval '3 months');

-- ========================================
-- UPDATE TOTAL MONTHLY COSTS
-- ========================================

-- Update total monthly costs for memberships with add-ons
UPDATE memberships 
SET total_monthly_cost = monthly_fee + COALESCE((
    SELECT SUM(monthly_cost) 
    FROM membership_addons 
    WHERE membership_id = memberships.id AND status = 'active'
), 0);

-- ========================================
-- CREATE STAFF INSTRUCTOR RECORDS
-- ========================================

-- Create instructor record for Lisa Martinez
INSERT INTO instructors (
    auth_user_id, first_name, last_name, email, phone,
    specializations, bio, certifications, hire_date, hourly_rate,
    is_active, created_at, updated_at
) VALUES (
    '55555555-5555-5555-5555-555555555555',
    'Lisa', 'Martinez', 'instructor@momentumtest.com', '555-0501',
    ARRAY['Yoga', 'Pilates', 'HIIT', 'Personal Training'],
    'Lisa is a certified fitness instructor with over 8 years of experience. She specializes in yoga, pilates, and high-intensity interval training. Her approach focuses on building strength, flexibility, and mindfulness.',
    ARRAY['ACSM Certified Personal Trainer', 'RYT-500 Yoga Alliance', 'Pilates Mat Certification', 'HIIT Specialist'],
    CURRENT_DATE - interval '3 years',
    45.00,
    true,
    NOW() - interval '3 years',
    NOW()
);

-- ========================================
-- CREATE SAMPLE CLASSES
-- ========================================

-- Create some classes taught by Lisa Martinez
INSERT INTO classes (
    name, description, instructor_id, class_type, difficulty_level,
    duration_minutes, max_capacity, start_time, end_time, location,
    equipment_needed, price, is_recurring, recurrence_pattern,
    created_at, updated_at
) VALUES 
-- Morning Yoga
(
    'Morning Flow Yoga',
    'Start your day with gentle flow yoga movements to energize and center yourself.',
    (SELECT id FROM instructors WHERE email = 'instructor@momentumtest.com'),
    'yoga', 'beginner', 60, 15,
    CURRENT_DATE + interval '1 day' + time '07:00:00',
    CURRENT_DATE + interval '1 day' + time '08:00:00',
    'Studio A',
    ARRAY['Yoga mat', 'Blocks', 'Strap'],
    0.00, true, 'weekly',
    NOW(), NOW()
),

-- HIIT Class
(
    'High Intensity Interval Training',
    'Burn calories and build strength with this challenging HIIT workout.',
    (SELECT id FROM instructors WHERE email = 'instructor@momentumtest.com'),
    'hiit', 'intermediate', 45, 12,
    CURRENT_DATE + interval '2 days' + time '18:00:00',
    CURRENT_DATE + interval '2 days' + time '18:45:00',
    'Group Fitness Room',
    ARRAY['Water bottle', 'Towel'],
    0.00, true, 'weekly',
    NOW(), NOW()
),

-- Pilates
(
    'Core Pilates',
    'Strengthen your core and improve flexibility with mat-based Pilates exercises.',
    (SELECT id FROM instructors WHERE email = 'instructor@momentumtest.com'),
    'pilates', 'beginner', 50, 10,
    CURRENT_DATE + interval '3 days' + time '10:00:00',
    CURRENT_DATE + interval '3 days' + time '10:50:00',
    'Studio B',
    ARRAY['Pilates mat', 'Resistance band'],
    0.00, true, 'weekly',
    NOW(), NOW()
);

-- ========================================
-- CREATE SAMPLE ANNOUNCEMENTS
-- ========================================

INSERT INTO announcements (
    title, content, announcement_type, priority, target_audience,
    start_date, end_date, is_active, created_by, created_at, updated_at
) VALUES 
(
    'Welcome New Members!',
    'We are excited to welcome our new members to the Momentum Gym family! Please stop by the front desk to pick up your welcome package and schedule your complimentary fitness assessment.',
    'general', 'normal', 'members',
    CURRENT_DATE, CURRENT_DATE + interval '1 month',
    true, '11111111-1111-1111-1111-111111111111',
    NOW(), NOW()
),

(
    'Holiday Hours',
    'Please note that the gym will have modified hours during the upcoming holiday weekend. We will be open Saturday 6AM-8PM, Sunday 8AM-6PM, and closed Monday. Regular hours resume Tuesday.',
    'general', 'high', 'all',
    CURRENT_DATE, CURRENT_DATE + interval '2 weeks',
    true, '22222222-2222-2222-2222-222222222222',
    NOW(), NOW()
),

(
    'New Group Class Schedule',
    'Starting next month, we are adding more morning yoga classes and evening HIIT sessions based on member feedback. Check the updated schedule at the front desk or in your member portal.',
    'event', 'normal', 'members',
    CURRENT_DATE, CURRENT_DATE + interval '3 weeks',
    true, '55555555-5555-5555-5555-555555555555',
    NOW(), NOW()
);

-- ========================================
-- SUMMARY REPORT
-- ========================================

DO $$
DECLARE
    staff_count INTEGER;
    member_count INTEGER;
    individual_count INTEGER;
    couple_count INTEGER;
    family_count INTEGER;
    addon_count INTEGER;
    family_relationship_count INTEGER;
BEGIN
    -- Count staff
    SELECT COUNT(*) INTO staff_count FROM profiles WHERE role IN ('admin', 'staff');
    
    -- Count members
    SELECT COUNT(*) INTO member_count FROM profiles WHERE role = 'member';
    
    -- Count membership types
    SELECT COUNT(*) INTO individual_count FROM memberships WHERE membership_type = 'individual';
    SELECT COUNT(*) INTO couple_count FROM memberships WHERE membership_type = 'couple';
    SELECT COUNT(*) INTO family_count FROM memberships WHERE membership_type = 'family';
    
    -- Count add-ons
    SELECT COUNT(*) INTO addon_count FROM membership_addons WHERE status = 'active';
    
    -- Count family relationships
    SELECT COUNT(*) INTO family_relationship_count FROM family_members;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MOMENTUM GYM TEST DATA CREATION COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Staff Members Created: %', staff_count;
    RAISE NOTICE '  - 1 Administrator (admin@momentumtest.com)';
    RAISE NOTICE '  - 1 Manager (manager@momentumtest.com)';
    RAISE NOTICE '  - 2 Front Desk Staff';
    RAISE NOTICE '  - 1 Instructor';
    RAISE NOTICE '';
    RAISE NOTICE 'Member Profiles Created: %', member_count;
    RAISE NOTICE '  - % Individual Memberships', individual_count;
    RAISE NOTICE '  - % Couple Memberships (% people)', couple_count / 2, couple_count;
    RAISE NOTICE '  - % Family Memberships (% people)', family_count / 3, family_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Additional Features:';
    RAISE NOTICE '  - % Active Add-on Services', addon_count;
    RAISE NOTICE '  - % Family Relationships', family_relationship_count;
    RAISE NOTICE '  - Sample classes created';
    RAISE NOTICE '  - Announcements created';
    RAISE NOTICE '';
    RAISE NOTICE 'LOGIN CREDENTIALS:';
    RAISE NOTICE '  Password for ALL users: password405';
    RAISE NOTICE '  Admin: admin@momentumtest.com';
    RAISE NOTICE '  Manager: manager@momentumtest.com';
    RAISE NOTICE '  Sample Member: alex.johnson@testgym.com';
    RAISE NOTICE '  Sample Family: mike.smith@testgym.com';
    RAISE NOTICE '========================================';
END $$;
