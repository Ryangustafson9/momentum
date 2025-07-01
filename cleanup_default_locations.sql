-- Clean up duplicate default locations
-- This script will remove default/test locations and keep only real ones

-- First, let's see what locations exist
SELECT id, name, slug, organization_id, is_active, created_at 
FROM locations 
ORDER BY created_at;

-- Remove locations with placeholder/test names
DELETE FROM locations 
WHERE name IN (
  'Default Location',
  'Main Location', 
  'Test Location',
  'Sample Location'
) OR slug IN (
  'default',
  'main',
  'test',
  'sample'
) OR id IN (
  '00000000-0000-0000-0000-000000000001',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc'
);

-- Show remaining locations after cleanup
SELECT id, name, slug, organization_id, is_active, created_at 
FROM locations 
ORDER BY created_at;
