-- Final fix for infinite recursion and missing profiles
-- This completely removes problematic policies and creates simple ones

-- Disable RLS temporarily to clear all policies
ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE membership_types DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on both tables
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON memberships;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON memberships;
DROP POLICY IF EXISTS "Enable update for own records" ON memberships;
DROP POLICY IF EXISTS "Enable read access for all users" ON membership_types;

-- Re-enable RLS
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_types ENABLE ROW LEVEL SECURITY;

-- Create very simple policies that don't reference other tables
CREATE POLICY "Allow all authenticated reads" ON memberships
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated writes" ON memberships
    FOR ALL USING (auth.role() = 'authenticated');

-- For membership_types, allow everyone to read (no user-specific logic)
CREATE POLICY "Allow public read access" ON membership_types
    FOR SELECT USING (true);

-- Create profile for the new user
INSERT INTO profiles (id, email, role, first_name, last_name, name, created_at)
SELECT
    'f991b0b0-c3bf-4988-9bde-dfa380061307'::uuid,
    'newuser@test.com',
    'nonmember',
    'New',
    'User',
    'New User',
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = 'f991b0b0-c3bf-4988-9bde-dfa380061307'::uuid
);

-- Log the changes
DO $$
BEGIN
  RAISE NOTICE 'Fixed infinite recursion by simplifying policies and added missing profile';
END $$;