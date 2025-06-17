-- Update the test user role to nonmember to test proper signup flow
-- This ensures new users are correctly identified as non-members

-- Update any existing profiles to have the correct nonmember role
UPDATE profiles
SET role = 'nonmember'
WHERE email = 'ryan@test.com' AND role = 'member';

-- Also update any other test users that might have been created with wrong role
UPDATE profiles
SET role = 'nonmember'
WHERE role = 'member'
  AND email LIKE '%@test.com';

-- Log the changes
DO $$
BEGIN
  RAISE NOTICE 'Updated test user roles to nonmember for proper signup flow testing';
END $$;