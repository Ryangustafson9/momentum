-- ========================================
-- ADD UNIQUE CONSTRAINT TO MEMBERSHIP_TYPES
-- Run this if you already have the membership_types table without unique constraint
-- ========================================

-- First, remove any duplicate names if they exist
DELETE FROM membership_types a USING membership_types b 
WHERE a.id > b.id AND a.name = b.name;

-- Add unique constraint to name column
ALTER TABLE membership_types ADD CONSTRAINT membership_types_name_unique UNIQUE (name);

-- Verify the constraint was added
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'membership_types'::regclass 
AND contype = 'u';

COMMIT;
