-- Create auth users for existing profiles
-- This creates the actual authentication users that can log in

DO $$
DECLARE
  profile_record RECORD;
  new_user_id UUID;
BEGIN
  -- Create auth users for each profile that doesn't have one
  FOR profile_record IN
    SELECT id, email, first_name, last_name, name, created_at
    FROM profiles
    WHERE email IS NOT NULL
  LOOP
    -- Check if auth user already exists for this email
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = profile_record.email) THEN
      -- Create new auth user
      INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token,
        aud,
        role,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        last_sign_in_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at,
        is_sso_user,
        deleted_at
      ) VALUES (
        profile_record.id, -- Use same ID as profile
        '00000000-0000-0000-0000-000000000000',
        profile_record.email,
        crypt('Bu!!et0!', gen_salt('bf')), -- Set password to Bu!!et0!
        NOW(), -- Email confirmed
        profile_record.created_at,
        NOW(),
        '',
        '',
        '',
        '',
        'authenticated',
        'authenticated',
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object(
          'first_name', profile_record.first_name,
          'last_name', profile_record.last_name,
          'full_name', profile_record.name
        ),
        false,
        NULL,
        NULL,
        NULL,
        '',
        '',
        '',
        0,
        NULL,
        '',
        NULL,
        false,
        NULL
      );

      RAISE NOTICE 'Created auth user for: %', profile_record.email;
    ELSE
      RAISE NOTICE 'Auth user already exists for: %', profile_record.email;
    END IF;
  END LOOP;

  RAISE NOTICE 'Auth user creation complete';
END $$;