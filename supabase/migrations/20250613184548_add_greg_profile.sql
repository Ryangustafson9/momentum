-- Add profile for greg@test.com user
INSERT INTO profiles (id, email, role, first_name, last_name, name, created_at)
SELECT
    '4f4c90b7-d3a5-4f38-9f7c-9eaddda17241'::uuid,
    'greg@test.com',
    'nonmember',
    'Greg',
    'Test',
    'Greg Test',
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = '4f4c90b7-d3a5-4f38-9f7c-9eaddda17241'::uuid
);

-- Log the changes
DO $$
BEGIN
  RAISE NOTICE 'Added profile for greg@test.com user';
END $$;