-- Create admin/staff accounts
-- Production migration for setting up initial admin and staff users

DO $$
DECLARE
  admin_user_id UUID := gen_random_uuid();
  staff_user_id UUID := gen_random_uuid();
BEGIN
  -- Clean up any existing test accounts (if any)
  DELETE FROM auth.users WHERE email IN ('currentuser@test.com', 'newuser@test.com');
  DELETE FROM profiles WHERE email IN ('currentuser@test.com', 'newuser@test.com');

  RAISE NOTICE 'Cleaned up any existing test accounts';

  -- Create admin user profile
  INSERT INTO profiles (
    id,
    email,
    first_name,
    last_name,
    name,
    role,
    created_at
  ) VALUES (
    admin_user_id,
    'admin@admin.com',
    'Admin',
    'User',
    'Admin User',
    'admin',
    NOW()
  );

  -- Create admin auth user
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
    admin_user_id,
    '00000000-0000-0000-0000-000000000000',
    'admin@admin.com',
    crypt('Bu!!et0!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    '',
    'authenticated',
    'authenticated',
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object(
      'first_name', 'Admin',
      'last_name', 'User',
      'full_name', 'Admin User'
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

  -- Create staff user profile
  INSERT INTO profiles (
    id,
    email,
    first_name,
    last_name,
    name,
    role,
    created_at
  ) VALUES (
    staff_user_id,
    'staff@staff.com',
    'Staff',
    'User',
    'Staff User',
    'staff',
    NOW()
  );

  -- Create staff auth user
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
    staff_user_id,
    '00000000-0000-0000-0000-000000000000',
    'staff@staff.com',
    crypt('Bu!!et0!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    '',
    'authenticated',
    'authenticated',
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object(
      'first_name', 'Staff',
      'last_name', 'User',
      'full_name', 'Staff User'
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

  RAISE NOTICE 'Created admin user: admin@admin.com';
  RAISE NOTICE 'Created staff user: staff@staff.com';
  RAISE NOTICE 'Both users have password: Bu!!et0!';
END $$;