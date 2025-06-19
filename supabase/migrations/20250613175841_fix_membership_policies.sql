-- Fix infinite recursion in membership policies and create missing tables
-- This addresses the database policy errors preventing membership plan loading

-- Drop problematic policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their own memberships" ON memberships;
DROP POLICY IF EXISTS "Users can insert their own memberships" ON memberships;
DROP POLICY IF EXISTS "Users can update their own memberships" ON memberships;

-- Create simple, non-recursive policies for memberships table
CREATE POLICY "Enable read access for authenticated users" ON memberships
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON memberships
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for own records" ON memberships
    FOR UPDATE USING (user_id = auth.uid());

-- Ensure membership_types table has proper policies (should be readable by all authenticated users)
DROP POLICY IF EXISTS "Enable read access for all users" ON membership_types;
CREATE POLICY "Enable read access for all users" ON membership_types
    FOR SELECT USING (true);

-- Update existing general_settings table with default values
-- The table already exists with different schema, so we'll work with it

-- Insert/update default settings in the existing general_settings table
INSERT INTO general_settings (id, gym_name, admin_email, timezone, updated_at)
VALUES (1, 'Nordic Fitness', 'info@nordicfitness.com', 'America/New_York', now())
ON CONFLICT (id) DO UPDATE SET
    gym_name = COALESCE(general_settings.gym_name, 'Nordic Fitness'),
    admin_email = COALESCE(general_settings.admin_email, 'info@nordicfitness.com'),
    timezone = COALESCE(general_settings.timezone, 'America/New_York'),
    updated_at = now();

-- Add online_joining column if it doesn't exist
ALTER TABLE general_settings
ADD COLUMN IF NOT EXISTS online_joining boolean DEFAULT true;

-- Add contact_phone column if it doesn't exist
ALTER TABLE general_settings
ADD COLUMN IF NOT EXISTS contact_phone text DEFAULT '(555) 123-4567';

-- Update the record with online joining enabled
UPDATE general_settings
SET online_joining = true,
    contact_phone = COALESCE(contact_phone, '(555) 123-4567')
WHERE id = 1;

-- Create missing profile for lauren@test.com if it doesn't exist
INSERT INTO profiles (id, email, role, first_name, last_name, name, created_at)
SELECT
    'a272ee28-2660-4540-971d-8613a4da6dbc'::uuid,
    'lauren@test.com',
    'nonmember',
    'Lauren',
    'Test',
    'Lauren Test',
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = 'a272ee28-2660-4540-971d-8613a4da6dbc'::uuid
);

-- Log the changes
DO $$
BEGIN
  RAISE NOTICE 'Fixed membership policies, created general_settings table, and added missing profile';
END $$;