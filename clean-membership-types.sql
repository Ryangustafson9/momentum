-- ========================================
-- CLEAN MEMBERSHIP TYPES TABLE
-- Run this to remove all existing membership types and start fresh
-- ========================================

-- Delete all existing membership types
DELETE FROM membership_types;

-- Reset any sequences if they exist
-- (Supabase uses UUIDs by default, so this might not be needed)

-- Verify the table is empty
SELECT COUNT(*) as remaining_count FROM membership_types;

-- Show the table structure to confirm what columns exist
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'membership_types' 
AND table_schema = 'public'
ORDER BY ordinal_position;

COMMIT;
