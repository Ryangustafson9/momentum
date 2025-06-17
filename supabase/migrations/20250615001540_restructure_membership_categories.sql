-- Restructure membership types into 4 categories
-- Member Plans, Staff Plans, Add-ons, and Guest Plans

DO $$
BEGIN
  -- Update existing membership types to use proper categories
  UPDATE membership_types SET category = 'Member Plans' WHERE category IN ('Standard', 'Premium') OR category IS NULL;

  -- Clear existing membership types to start fresh with proper structure
  DELETE FROM membership_types;

  RAISE NOTICE 'Cleared existing membership types for restructure';

  -- ==================== MEMBER PLANS ====================
  INSERT INTO membership_types (
    name, price, billing_type, duration_months, features, available_online,
    category, color, max_included_members, additional_member_price, member_type
  ) VALUES
  -- Basic Individual
  ('Basic Individual', 49.99, 'monthly', 1,
   ARRAY['Gym access during standard hours', 'Basic equipment usage', 'Locker room access', 'Free fitness assessment'],
   true, 'Member Plans', 'from-blue-500 to-blue-600', 1, 0.00, 'individual'),

  -- Premium Individual
  ('Premium Individual', 79.99, 'monthly', 1,
   ARRAY['24/7 gym access', 'All equipment access', 'Group classes included', 'Personal training session (1/month)', 'Guest passes (2/month)'],
   true, 'Member Plans', 'from-purple-500 to-purple-600', 1, 0.00, 'individual'),

  -- Couple Membership
  ('Couple Membership', 129.99, 'monthly', 1,
   ARRAY['24/7 gym access for 2', 'All equipment access', 'Unlimited group classes', 'Personal training session (1/month)', 'Guest passes (4/month)', 'Couples training sessions'],
   true, 'Member Plans', 'from-pink-500 to-pink-600', 2, 0.00, 'couple'),

  -- Family Membership
  ('Family Membership', 159.99, 'monthly', 1,
   ARRAY['24/7 gym access for family', 'All equipment access', 'Unlimited group classes', 'Personal training sessions (2/month)', 'Guest passes (6/month)', 'Family fitness programs', 'Kids zone access'],
   true, 'Member Plans', 'from-green-500 to-green-600', 4, 19.99, 'family'),

  -- Student Discount
  ('Student Membership', 34.99, 'monthly', 1,
   ARRAY['Gym access during standard hours', 'Basic equipment usage', 'Group classes (limited)', 'Student ID required'],
   true, 'Member Plans', 'from-yellow-500 to-yellow-600', 1, 0.00, 'individual'),

  -- Senior Membership
  ('Senior Membership', 39.99, 'monthly', 1,
   ARRAY['Gym access during standard hours', 'Senior-friendly equipment', 'Senior fitness classes', 'Health monitoring', 'Age 65+ required'],
   true, 'Member Plans', 'from-gray-500 to-gray-600', 1, 0.00, 'individual');

  -- ==================== STAFF PLANS ====================
  INSERT INTO membership_types (
    name, price, billing_type, duration_months, features, available_online,
    category, color, max_included_members, additional_member_price, member_type, role_id
  ) VALUES
  -- Front Desk Staff
  ('Front Desk Staff', 0.00, 'monthly', 1,
   ARRAY['Member check-in/out', 'Basic member management', 'Schedule viewing', 'Payment processing'],
   false, 'Staff Plans', 'from-indigo-500 to-indigo-600', 1, 0.00, 'staff', 'front_desk'),

  -- Sales Staff
  ('Sales Representative', 0.00, 'monthly', 1,
   ARRAY['Lead management', 'Tour scheduling', 'Membership sales', 'Follow-up tracking', 'Commission reporting'],
   false, 'Staff Plans', 'from-emerald-500 to-emerald-600', 1, 0.00, 'staff', 'sales'),

  -- Fitness Instructor
  ('Fitness Instructor', 0.00, 'monthly', 1,
   ARRAY['Class scheduling', 'Member training', 'Equipment management', 'Fitness assessments', 'Program design'],
   false, 'Staff Plans', 'from-orange-500 to-orange-600', 1, 0.00, 'staff', 'instructor'),

  -- Personal Trainer
  ('Personal Trainer', 0.00, 'monthly', 1,
   ARRAY['Client management', 'Training sessions', 'Progress tracking', 'Nutrition guidance', 'Specialized programs'],
   false, 'Staff Plans', 'from-red-500 to-red-600', 1, 0.00, 'staff', 'trainer'),

  -- Fitness Manager
  ('Fitness Manager', 0.00, 'monthly', 1,
   ARRAY['Staff management', 'Program oversight', 'Equipment maintenance', 'Member relations', 'Performance reporting'],
   false, 'Staff Plans', 'from-violet-500 to-violet-600', 1, 0.00, 'staff', 'fitness_manager'),

  -- General Manager
  ('General Manager', 0.00, 'monthly', 1,
   ARRAY['Full facility management', 'Staff oversight', 'Financial reporting', 'Strategic planning', 'All system access'],
   false, 'Staff Plans', 'from-slate-500 to-slate-600', 1, 0.00, 'staff', 'manager');

  -- ==================== ADD-ONS ====================
  INSERT INTO membership_types (
    name, price, billing_type, duration_months, features, available_online,
    category, color, max_included_members, additional_member_price, member_type
  ) VALUES
  -- Locker Rentals
  ('Monthly Locker Rental', 15.99, 'monthly', 1,
   ARRAY['Dedicated locker space', 'Combination lock included', 'Towel service', '24/7 access'],
   true, 'Add-ons', 'from-cyan-500 to-cyan-600', 1, 0.00, 'addon'),

  ('Annual Locker Rental', 159.99, 'yearly', 12,
   ARRAY['Dedicated locker space', 'Combination lock included', 'Towel service', '24/7 access', '2 months free'],
   true, 'Add-ons', 'from-cyan-600 to-cyan-700', 1, 0.00, 'addon'),

  -- Towel Service
  ('Towel Service', 9.99, 'monthly', 1,
   ARRAY['Fresh towels daily', 'Laundry service', 'Premium towel quality'],
   true, 'Add-ons', 'from-teal-500 to-teal-600', 1, 0.00, 'addon'),

  -- Equipment Rentals
  ('Ball Machine Access', 25.99, 'monthly', 1,
   ARRAY['Tennis ball machine access', 'Court reservation priority', 'Equipment maintenance included'],
   true, 'Add-ons', 'from-lime-500 to-lime-600', 1, 0.00, 'addon'),

  -- Personal Training Add-ons
  ('Additional PT Session', 75.00, 'one-time', 0,
   ARRAY['One-on-one training session', 'Customized workout plan', 'Progress tracking'],
   true, 'Add-ons', 'from-amber-500 to-amber-600', 1, 0.00, 'addon'),

  ('Nutrition Consultation', 50.00, 'one-time', 0,
   ARRAY['Dietary assessment', 'Meal planning', 'Supplement recommendations', 'Follow-up included'],
   true, 'Add-ons', 'from-rose-500 to-rose-600', 1, 0.00, 'addon');

  -- ==================== GUEST PLANS ====================
  INSERT INTO membership_types (
    name, price, billing_type, duration_months, features, available_online,
    category, color, max_included_members, additional_member_price, member_type
  ) VALUES
  -- Day Pass
  ('Day Pass', 15.00, 'one-time', 0,
   ARRAY['Single day gym access', 'Basic equipment usage', 'Locker room access', 'Valid for 24 hours'],
   true, 'Guest Plans', 'from-gray-400 to-gray-500', 1, 0.00, 'guest'),

  -- Week Pass
  ('Week Pass', 45.00, 'one-time', 0,
   ARRAY['7-day gym access', 'Basic equipment usage', 'Group classes (limited)', 'Locker room access'],
   true, 'Guest Plans', 'from-gray-500 to-gray-600', 1, 0.00, 'guest'),

  -- Trial Membership
  ('Free Trial', 0.00, 'one-time', 0,
   ARRAY['3-day trial access', 'Fitness assessment', 'Tour included', 'No commitment'],
   true, 'Guest Plans', 'from-green-400 to-green-500', 1, 0.00, 'guest'),

  -- Guest Pass (for members)
  ('Member Guest Pass', 10.00, 'one-time', 0,
   ARRAY['Single day access for guest', 'Must be accompanied by member', 'Basic equipment usage'],
   false, 'Guest Plans', 'from-blue-400 to-blue-500', 1, 0.00, 'guest');

  -- ==================== STAFF ROLES ====================
  -- Create staff roles that correspond to staff plans
  INSERT INTO staff_roles (id, name, description, permissions) VALUES
  ('front_desk', 'Front Desk', 'Front desk operations and basic member services',
   '{"member_checkin": true, "member_checkout": true, "view_schedules": true, "process_payments": true, "basic_member_info": true}'),

  ('sales', 'Sales Representative', 'Membership sales and lead management',
   '{"lead_management": true, "tour_scheduling": true, "membership_sales": true, "follow_up_tracking": true, "commission_reports": true}'),

  ('instructor', 'Fitness Instructor', 'Group fitness classes and member training',
   '{"class_scheduling": true, "member_training": true, "equipment_management": true, "fitness_assessments": true, "program_design": true}'),

  ('trainer', 'Personal Trainer', 'One-on-one training and specialized programs',
   '{"client_management": true, "training_sessions": true, "progress_tracking": true, "nutrition_guidance": true, "specialized_programs": true}'),

  ('fitness_manager', 'Fitness Manager', 'Fitness department management and oversight',
   '{"staff_management": true, "program_oversight": true, "equipment_maintenance": true, "member_relations": true, "performance_reporting": true, "all_fitness_permissions": true}'),

  ('manager', 'General Manager', 'Full facility management and administration',
   '{"full_facility_management": true, "staff_oversight": true, "financial_reporting": true, "strategic_planning": true, "all_system_access": true}')
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions;

  RAISE NOTICE 'Created membership type categories:';
  RAISE NOTICE '- Member Plans: 6 types (Basic, Premium, Couple, Family, Student, Senior)';
  RAISE NOTICE '- Staff Plans: 6 types (Front Desk, Sales, Instructor, Trainer, Fitness Manager, General Manager)';
  RAISE NOTICE '- Add-ons: 6 types (Lockers, Towels, Ball Machine, PT Sessions, Nutrition)';
  RAISE NOTICE '- Guest Plans: 4 types (Day Pass, Week Pass, Trial, Member Guest)';
  RAISE NOTICE 'Created corresponding staff roles with permissions';
END $$;