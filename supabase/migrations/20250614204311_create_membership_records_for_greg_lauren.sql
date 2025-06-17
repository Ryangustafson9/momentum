-- Create membership records for Greg and Lauren
-- This fixes the missing membership data issue

-- First, let's get the Family membership type ID
DO $$
DECLARE
  family_membership_id UUID;
  greg_user_id UUID := '4f4c90b7-d3a5-4f38-9f7c-9eaddda17241';
  lauren_user_id UUID := 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
BEGIN
  -- Get the Family membership type ID
  SELECT id INTO family_membership_id
  FROM membership_types
  WHERE name = 'Family' OR name = 'Premium'
  LIMIT 1;

  -- If no Family membership exists, create one
  IF family_membership_id IS NULL THEN
    INSERT INTO membership_types (
      name, price, billing_type, duration_months, features, available_online,
      category, color, max_included_members, additional_member_price, member_type
    ) VALUES (
      'Family', 99.99, 'monthly', 1,
      ARRAY['Full gym access', 'All group classes', 'Personal training session (1/month)', 'Nutrition consultation', 'Guest passes (4/month)', 'Family locker discounts'],
      true, 'Premium', 'from-green-500 to-green-600', 4, 12.99, 'family'
    ) RETURNING id INTO family_membership_id;

    RAISE NOTICE 'Created Family membership type with ID: %', family_membership_id;
  END IF;

  -- Create profiles first if they don't exist
  -- Check if Greg's profile exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = greg_user_id) THEN
    INSERT INTO profiles (id, email, role, first_name, last_name, name, created_at)
    VALUES (greg_user_id, 'greg@test.com', 'member', 'Greg', 'Test', 'Greg Test', NOW());
    RAISE NOTICE 'Created profile for Greg';
  ELSE
    UPDATE profiles SET role = 'member', updated_at = NOW() WHERE id = greg_user_id;
    RAISE NOTICE 'Updated existing profile for Greg';
  END IF;

  -- Check if Lauren's profile exists by email or ID
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = lauren_user_id OR email = 'lauren@test.com') THEN
    INSERT INTO profiles (id, email, role, first_name, last_name, name, created_at)
    VALUES (lauren_user_id, 'lauren@test.com', 'member', 'Lauren', 'Test', 'Lauren Test', NOW());
    RAISE NOTICE 'Created profile for Lauren';
  ELSE
    -- Update existing profile (could be by email or ID)
    UPDATE profiles SET
      role = 'member',
      updated_at = NOW(),
      id = lauren_user_id,
      first_name = 'Lauren',
      last_name = 'Test',
      name = 'Lauren Test'
    WHERE id = lauren_user_id OR email = 'lauren@test.com';
    RAISE NOTICE 'Updated existing profile for Lauren';
  END IF;

  -- Delete any existing membership records first
  DELETE FROM memberships WHERE user_id IN (greg_user_id, lauren_user_id);

  -- Create Greg's membership record (primary member)
  INSERT INTO memberships (
    user_id,
    current_membership_type_id,
    status,
    join_date,
    role
  ) VALUES (
    greg_user_id,
    family_membership_id,
    'Active',
    CURRENT_DATE,
    'member'
  );

  -- Create Lauren's membership record (family member)
  INSERT INTO memberships (
    user_id,
    current_membership_type_id,
    status,
    join_date,
    role,
    parent_member_id
  ) VALUES (
    lauren_user_id,
    family_membership_id,
    'Active',
    CURRENT_DATE,
    'member',
    (SELECT id FROM memberships WHERE user_id = greg_user_id)
  );

  -- Create family relationship (Greg as primary, Lauren as family member)
  INSERT INTO family_members (
    primary_member_id,
    family_member_id,
    relationship,
    created_at
  ) VALUES (
    greg_user_id,
    lauren_user_id,
    'spouse',
    NOW()
  ) ON CONFLICT (primary_member_id, family_member_id) DO NOTHING;

  -- Update profiles to ensure they have member role
  UPDATE profiles SET
    role = 'member',
    updated_at = NOW()
  WHERE id IN (greg_user_id, lauren_user_id);

  RAISE NOTICE 'Created membership records for Greg and Lauren with Family membership';
  RAISE NOTICE 'Greg (primary): %, Lauren (family): %', greg_user_id, lauren_user_id;
  RAISE NOTICE 'Family membership type: %', family_membership_id;
END $$;