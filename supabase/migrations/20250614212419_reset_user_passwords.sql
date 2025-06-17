-- Reset all user passwords to Bu!!et0! for testing
-- This allows testing of existing user accounts

DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- Update all existing auth users with the new password
  -- Note: This uses Supabase's auth.users table directly

  FOR user_record IN
    SELECT id, email FROM auth.users
  LOOP
    -- Update password for each user
    UPDATE auth.users
    SET
      encrypted_password = crypt('Bu!!et0!', gen_salt('bf')),
      updated_at = NOW()
    WHERE id = user_record.id;

    RAISE NOTICE 'Updated password for user: %', user_record.email;
  END LOOP;

  RAISE NOTICE 'All user passwords have been reset to Bu!!et0!';
END $$;