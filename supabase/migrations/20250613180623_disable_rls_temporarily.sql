-- Temporarily disable RLS to eliminate infinite recursion issues
-- This is a development fix to get the app working

-- Disable RLS on problematic tables
ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE membership_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Log the changes
DO $$
BEGIN
  RAISE NOTICE 'Temporarily disabled RLS on memberships, membership_types, and profiles tables';
END $$;