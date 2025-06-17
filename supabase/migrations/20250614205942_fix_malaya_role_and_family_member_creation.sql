-- Fix Malaya Anderson's role and ensure family members get correct roles
-- This fixes the family_member role issue

DO $$
BEGIN
  -- Fix Malaya Anderson's role from 'family_member' to 'member'
  UPDATE profiles
  SET
    role = 'member',
    updated_at = NOW()
  WHERE
    (first_name ILIKE 'Malaya' AND last_name ILIKE 'Anderson')
    OR role = 'family_member';

  -- Log the fix
  RAISE NOTICE 'Fixed role for Malaya Anderson and any other profiles with family_member role';

  -- Also fix any other profiles that might have the incorrect family_member role
  UPDATE profiles
  SET
    role = 'member',
    updated_at = NOW()
  WHERE role = 'family_member';

  RAISE NOTICE 'Updated all profiles with family_member role to member role';
END $$;