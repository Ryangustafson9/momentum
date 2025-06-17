-- Add family membership support
-- This migration adds the necessary tables and columns for family memberships

-- Add family membership columns to membership_types
ALTER TABLE membership_types
ADD COLUMN IF NOT EXISTS max_included_members INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS additional_member_price DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS member_type VARCHAR(20) DEFAULT 'individual';

-- Update existing membership types with family support
UPDATE membership_types SET
  max_included_members = 1,
  additional_member_price = 0.00,
  member_type = 'individual'
WHERE name = 'Basic';

UPDATE membership_types SET
  max_included_members = 2,
  additional_member_price = 0.00,
  member_type = 'couple'
WHERE name = 'Premium';

UPDATE membership_types SET
  max_included_members = 4,
  additional_member_price = 12.99,
  member_type = 'family'
WHERE name = 'VIP';

-- Create family_members table
CREATE TABLE IF NOT EXISTS family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  primary_member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  relationship VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure a family member can't be added twice to the same primary member
  UNIQUE(primary_member_id, family_member_id),

  -- Ensure a user can't add themselves as a family member
  CHECK (primary_member_id != family_member_id)
);

-- Add family_member role to profiles if not exists
DO $$
BEGIN
  -- Add family_member role as a valid option
  -- This is for family members who don't have their own membership
  -- but are part of someone else's family plan
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_family_members_primary ON family_members(primary_member_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family ON family_members(family_member_id);

-- Add RLS policies for family_members table (currently disabled for development)
-- ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Create policy for family members (members can manage their own family)
-- CREATE POLICY "Users can manage their own family members" ON family_members
--   FOR ALL USING (auth.uid() = primary_member_id);

-- Create policy for family members to view their family membership
-- CREATE POLICY "Family members can view their membership" ON family_members
--   FOR SELECT USING (auth.uid() = family_member_id);

-- Insert sample family membership types if they don't exist
-- First, let's insert them only if they don't exist
INSERT INTO membership_types (name, price, billing_type, duration_months, features, available_online, category, color, max_included_members, additional_member_price, member_type)
SELECT 'Individual', 49.99, 'monthly', 1, ARRAY['Full gym access', 'Basic classes', 'Locker room access'], true, 'Standard', 'from-blue-500 to-blue-600', 1, 0.00, 'individual'
WHERE NOT EXISTS (SELECT 1 FROM membership_types WHERE name = 'Individual');

INSERT INTO membership_types (name, price, billing_type, duration_months, features, available_online, category, color, max_included_members, additional_member_price, member_type)
SELECT 'Couple', 79.99, 'monthly', 1, ARRAY['Full gym access', 'All group classes', 'Locker room access', 'Guest passes (2/month)'], true, 'Premium', 'from-purple-500 to-purple-600', 2, 0.00, 'couple'
WHERE NOT EXISTS (SELECT 1 FROM membership_types WHERE name = 'Couple');

INSERT INTO membership_types (name, price, billing_type, duration_months, features, available_online, category, color, max_included_members, additional_member_price, member_type)
SELECT 'Family', 99.99, 'monthly', 1, ARRAY['Full gym access', 'All group classes', 'Personal training session (1/month)', 'Nutrition consultation', 'Guest passes (4/month)', 'Family locker discounts'], true, 'Premium', 'from-green-500 to-green-600', 4, 12.99, 'family'
WHERE NOT EXISTS (SELECT 1 FROM membership_types WHERE name = 'Family');

-- Log the changes
DO $$
BEGIN
  RAISE NOTICE 'Added family membership support with family_members table and updated membership_types';
END $$;