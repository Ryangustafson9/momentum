-- Create sample add-on services for testing
-- This ensures add-ons are available for the join-online flow

-- Update existing Add-ons to have proper flags
UPDATE membership_types 
SET 
  is_addon = true,
  requires_primary_membership = true,
  available_online = true,
  available_for_sale = true,
  person_capacity = 1,
  max_family_members = 1,
  addon_billing_cycle = 'monthly'
WHERE category = 'Add-ons';

-- Ensure we have some good add-on examples
INSERT INTO membership_types (
  name, 
  category, 
  price, 
  billing_type, 
  features, 
  available_for_sale, 
  available_online,
  is_addon,
  requires_primary_membership,
  person_capacity,
  max_family_members,
  addon_billing_cycle
) VALUES 
-- Locker Rental
(
  'Premium Locker Rental',
  'Add-ons',
  15.00,
  'monthly',
  ARRAY['Large secure locker', 'Towel hook included', 'Key card access'],
  true,
  true,
  true,
  true,
  1,
  1,
  'monthly'
),
-- Towel Service
(
  'Towel Service',
  'Add-ons',
  10.00,
  'monthly',
  ARRAY['Fresh towels daily', 'Laundry service included', 'Unlimited use'],
  true,
  true,
  true,
  true,
  1,
  1,
  'monthly'
),
-- Personal Training
(
  'Personal Training Sessions',
  'Add-ons',
  75.00,
  'monthly',
  ARRAY['4 sessions per month', 'Certified trainer', 'Custom workout plan', 'Progress tracking'],
  true,
  true,
  true,
  true,
  1,
  1,
  'monthly'
),
-- Nutrition Consultation
(
  'Nutrition Consultation',
  'Add-ons',
  25.00,
  'monthly',
  ARRAY['Monthly nutrition review', 'Meal planning', 'Supplement guidance'],
  true,
  true,
  true,
  true,
  1,
  1,
  'monthly'
),
-- Guest Passes
(
  'Guest Pass Package',
  'Add-ons',
  20.00,
  'monthly',
  ARRAY['5 guest passes per month', 'Valid for day access', 'Bring friends and family'],
  true,
  true,
  true,
  true,
  1,
  1,
  'monthly'
);

-- Log the creation
DO $$
BEGIN
  RAISE NOTICE 'Created sample add-on services for join-online testing';
END $$;
