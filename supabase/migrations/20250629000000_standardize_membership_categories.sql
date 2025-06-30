-- Migration to standardize membership categories
-- This migration updates all existing membership types to use the new standardized category names

BEGIN;

-- Update existing membership types to use standardized category names
UPDATE membership_types 
SET category = 'Membership', updated_at = NOW()
WHERE category IN ('Member Plans', 'member plans', 'Member', 'member');

UPDATE membership_types 
SET category = 'Staff', updated_at = NOW()
WHERE category IN ('Staff Plans', 'staff plans', 'staff');

UPDATE membership_types 
SET category = 'Add-On', updated_at = NOW()
WHERE category IN ('Add-ons', 'add-ons', 'Add-on', 'add-on', 'Addon', 'addon');

UPDATE membership_types 
SET category = 'Guest', updated_at = NOW()
WHERE category IN ('Guest Plans', 'guest plans', 'guest');

-- Add a check constraint to ensure only valid categories are used
ALTER TABLE membership_types 
DROP CONSTRAINT IF EXISTS membership_types_category_check;

ALTER TABLE membership_types 
ADD CONSTRAINT membership_types_category_check 
CHECK (category IN ('Membership', 'Staff', 'Add-On', 'Guest'));

-- Update any existing member_memberships that might reference old category names
-- (This is just in case there are any cached or stored category references)

COMMIT;
