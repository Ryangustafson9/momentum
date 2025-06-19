-- Enhance membership system for multi-person memberships and add-on bundling (v2)
-- This migration adds support for family memberships and add-on services

-- ==================== ENHANCE MEMBERSHIP_TYPES TABLE ====================
-- Add person capacity and add-on specific fields
ALTER TABLE membership_types 
ADD COLUMN IF NOT EXISTS person_capacity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_family_members INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_addon BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS addon_billing_cycle TEXT DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS requires_primary_membership BOOLEAN DEFAULT false;

-- Add comments for new columns
COMMENT ON COLUMN membership_types.person_capacity IS 'Maximum number of people this membership type supports (1=Individual, 2=Couple, 3+=Family)';
COMMENT ON COLUMN membership_types.max_family_members IS 'Maximum family members allowed for family plans';
COMMENT ON COLUMN membership_types.is_addon IS 'Whether this is an add-on service rather than a primary membership';
COMMENT ON COLUMN membership_types.addon_billing_cycle IS 'Billing cycle for add-on services (monthly, quarterly, yearly)';
COMMENT ON COLUMN membership_types.requires_primary_membership IS 'Whether this add-on requires an active primary membership';

-- ==================== ENHANCE MEMBERSHIPS TABLE ====================
-- Add fields for family relationships and add-on tracking
ALTER TABLE memberships 
ADD COLUMN IF NOT EXISTS primary_member_id UUID REFERENCES memberships(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_primary_member BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS family_role TEXT DEFAULT 'primary',
ADD COLUMN IF NOT EXISTS addon_membership_ids UUID[],
ADD COLUMN IF NOT EXISTS total_monthly_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS family_member_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_family_members INTEGER DEFAULT 1;

-- Add check constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'check_family_role') THEN
    ALTER TABLE memberships 
    ADD CONSTRAINT check_family_role 
    CHECK (family_role IN ('primary', 'spouse', 'child', 'dependent'));
  END IF;
END $$;

-- Add comments for new columns
COMMENT ON COLUMN memberships.primary_member_id IS 'Reference to the primary family member (null for primary members)';
COMMENT ON COLUMN memberships.is_primary_member IS 'Whether this member is the primary account holder with billing responsibility';
COMMENT ON COLUMN memberships.family_role IS 'Role within the family membership (primary, spouse, child, dependent)';
COMMENT ON COLUMN memberships.addon_membership_ids IS 'Array of add-on membership type IDs associated with this membership';
COMMENT ON COLUMN memberships.total_monthly_cost IS 'Total monthly cost including base membership and add-ons';
COMMENT ON COLUMN memberships.family_member_count IS 'Current number of family members on this membership';
COMMENT ON COLUMN memberships.max_family_members IS 'Maximum family members allowed for this membership type';

-- ==================== CREATE MEMBERSHIP_ADDONS TABLE ====================
-- Track individual add-on assignments and billing
CREATE TABLE IF NOT EXISTS membership_addons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  membership_id UUID REFERENCES memberships(id) ON DELETE CASCADE NOT NULL,
  addon_type_id UUID REFERENCES membership_types(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'expired')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  monthly_cost DECIMAL(10,2) NOT NULL,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique addon per membership
  UNIQUE(membership_id, addon_type_id)
);

-- Add RLS for membership_addons
ALTER TABLE membership_addons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for membership_addons
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own membership addons" ON membership_addons;
  DROP POLICY IF EXISTS "Users can insert their own membership addons" ON membership_addons;
  DROP POLICY IF EXISTS "Users can update their own membership addons" ON membership_addons;
  
  -- Create new policies
  CREATE POLICY "Users can view their own membership addons" ON membership_addons
    FOR SELECT USING (
      membership_id IN (
        SELECT id FROM memberships WHERE auth_user_id = auth.uid()
      )
    );

  CREATE POLICY "Users can insert their own membership addons" ON membership_addons
    FOR INSERT WITH CHECK (
      membership_id IN (
        SELECT id FROM memberships WHERE auth_user_id = auth.uid()
      )
    );

  CREATE POLICY "Users can update their own membership addons" ON membership_addons
    FOR UPDATE USING (
      membership_id IN (
        SELECT id FROM memberships WHERE auth_user_id = auth.uid()
      )
    );
END $$;

-- ==================== UPDATE EXISTING DATA ====================
-- Set default values for existing records
UPDATE membership_types 
SET 
  person_capacity = CASE 
    WHEN name ILIKE '%family%' THEN 4
    WHEN name ILIKE '%couple%' THEN 2
    ELSE 1
  END,
  max_family_members = CASE 
    WHEN name ILIKE '%family%' THEN 4
    WHEN name ILIKE '%couple%' THEN 2
    ELSE 1
  END,
  is_addon = CASE 
    WHEN category = 'Add-ons' THEN true
    ELSE false
  END,
  requires_primary_membership = CASE 
    WHEN category = 'Add-ons' THEN true
    ELSE false
  END
WHERE person_capacity IS NULL;

-- Update existing memberships to set family member limits
UPDATE memberships 
SET 
  max_family_members = COALESCE(
    (SELECT max_family_members FROM membership_types WHERE id = current_membership_type_id),
    1
  ),
  total_monthly_cost = monthly_fee
WHERE max_family_members IS NULL;

-- ==================== CREATE INDEXES ====================
-- Improve query performance
CREATE INDEX IF NOT EXISTS idx_membership_addons_membership_id ON membership_addons(membership_id);
CREATE INDEX IF NOT EXISTS idx_membership_addons_addon_type_id ON membership_addons(addon_type_id);
CREATE INDEX IF NOT EXISTS idx_memberships_primary_member ON memberships(primary_member_id);
CREATE INDEX IF NOT EXISTS idx_membership_types_is_addon ON membership_types(is_addon);
CREATE INDEX IF NOT EXISTS idx_membership_types_person_capacity ON membership_types(person_capacity);

-- ==================== CREATE HELPER FUNCTIONS ====================
-- Function to calculate total membership cost including add-ons
CREATE OR REPLACE FUNCTION calculate_total_membership_cost(membership_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  base_cost DECIMAL(10,2);
  addon_cost DECIMAL(10,2);
  total_cost DECIMAL(10,2);
BEGIN
  -- Get base membership cost
  SELECT COALESCE(monthly_fee, 0) INTO base_cost
  FROM memberships 
  WHERE id = membership_id;
  
  -- Get total add-on costs
  SELECT COALESCE(SUM(monthly_cost), 0) INTO addon_cost
  FROM membership_addons 
  WHERE membership_id = membership_id AND status = 'active';
  
  total_cost := COALESCE(base_cost, 0) + COALESCE(addon_cost, 0);
  
  RETURN total_cost;
END;
$$ LANGUAGE plpgsql;

-- Function to check if membership can add more family members
CREATE OR REPLACE FUNCTION can_add_family_member(membership_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  SELECT family_member_count, max_family_members 
  INTO current_count, max_allowed
  FROM memberships 
  WHERE id = membership_id;
  
  RETURN COALESCE(current_count, 0) < COALESCE(max_allowed, 1);
END;
$$ LANGUAGE plpgsql;

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Enhanced membership system with multi-person support and add-on bundling (v2)';
END $$;
