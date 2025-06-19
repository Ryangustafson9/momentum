-- Nuclear option: Completely disable RLS and remove all policies
-- This will eliminate all infinite recursion issues

-- Disable RLS on all problematic tables
ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE membership_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies on these tables (including ones from original schema)
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on memberships table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'memberships' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON memberships';
    END LOOP;

    -- Drop all policies on membership_types table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'membership_types' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON membership_types';
    END LOOP;

    -- Drop all policies on profiles table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON profiles';
    END LOOP;
END $$;

-- For now, leave RLS disabled to eliminate all policy issues
-- This allows full access to these tables for development

-- Create profile for the current user
INSERT INTO profiles (id, email, role, first_name, last_name, name, created_at)
SELECT
    'd3840f07-0e0b-48c8-a7e0-3e0804773c5f'::uuid,
    'currentuser@test.com',
    'nonmember',
    'Current',
    'User',
    'Current User',
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = 'd3840f07-0e0b-48c8-a7e0-3e0804773c5f'::uuid
);

-- Log the changes
DO $$
BEGIN
  RAISE NOTICE 'Disabled RLS and removed all policies to eliminate infinite recursion';
END $$;