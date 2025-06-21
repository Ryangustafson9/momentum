-- Link existing staff plans to staff roles
-- This script creates matching staff roles for existing staff plans and links them

BEGIN;

-- First, let's create staff roles that match our existing staff plans
INSERT INTO staff_roles (id, name, description, permissions, created_at, updated_at)
VALUES 
  ('fitness-manager', 'Fitness Manager', 'Manages fitness programs, personal trainers, and member fitness assessments', 
   '{"manage_classes": true, "view_classes": true, "manage_schedule": true, "track_attendance": true, "client_management": true, "program_design": true, "fitness_assessments": true, "nutrition_guidance": true, "view_members": true, "member_checkin": true}', 
   NOW(), NOW()),
  
  ('general-manager', 'General Manager', 'Full administrative access to all gym operations and management functions', 
   '{"manage_members": true, "view_members": true, "member_checkin": true, "impersonate_members": true, "manage_classes": true, "view_classes": true, "manage_schedule": true, "track_attendance": true, "manage_billing": true, "view_reports": true, "process_payments": true, "view_revenue": true, "manage_staff": true, "view_staff": true, "assign_roles": true, "manage_settings": true, "view_logs": true, "manage_equipment": true, "lead_management": true, "membership_sales": true, "tour_scheduling": true, "commission_reports": true}', 
   NOW(), NOW()),
  
  ('front-desk-staff', 'Front Desk Staff', 'Handles member check-ins, basic member services, and front desk operations', 
   '{"view_members": true, "member_checkin": true, "view_classes": true, "tour_scheduling": true, "lead_management": true}', 
   NOW(), NOW()),
  
  ('sales-representative', 'Sales Representative', 'Focuses on membership sales, lead management, and customer acquisition', 
   '{"view_members": true, "lead_management": true, "membership_sales": true, "tour_scheduling": true, "commission_reports": true, "view_classes": true}', 
   NOW(), NOW()),
  
  ('fitness-instructor', 'Fitness Instructor', 'Teaches fitness classes and provides basic fitness guidance to members', 
   '{"view_classes": true, "track_attendance": true, "view_members": true, "member_checkin": true, "fitness_assessments": true}', 
   NOW(), NOW()),
  
  ('personal-trainer', 'Personal Trainer', 'Provides one-on-one training services and personalized fitness programs', 
   '{"client_management": true, "program_design": true, "fitness_assessments": true, "nutrition_guidance": true, "view_members": true, "member_checkin": true, "view_classes": true}', 
   NOW(), NOW())

ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  updated_at = NOW();

-- Now link the staff plans to their corresponding roles
UPDATE membership_types 
SET role_id = 'fitness-manager', updated_at = NOW()
WHERE name = 'Fitness Manager' AND category = 'Staff';

UPDATE membership_types 
SET role_id = 'general-manager', updated_at = NOW()
WHERE name = 'General Manager' AND category = 'Staff';

UPDATE membership_types 
SET role_id = 'front-desk-staff', updated_at = NOW()
WHERE name = 'Front Desk Staff' AND category = 'Staff';

UPDATE membership_types 
SET role_id = 'sales-representative', updated_at = NOW()
WHERE name = 'Sales Representative' AND category = 'Staff';

UPDATE membership_types 
SET role_id = 'fitness-instructor', updated_at = NOW()
WHERE name = 'Fitness Instructor' AND category = 'Staff';

UPDATE membership_types 
SET role_id = 'personal-trainer', updated_at = NOW()
WHERE name = 'Personal Trainer' AND category = 'Staff';

COMMIT;