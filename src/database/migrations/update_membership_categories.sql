-- ==================== UPDATE MEMBERSHIP TYPE CATEGORIES ====================
-- Update categories to use the correct naming convention:
-- Membership, Staff, Add-on, Guest

-- Update existing categories to new naming convention
UPDATE membership_types SET category = 'Membership' WHERE category IN ('Member Plans', 'Standard', 'Premium', 'Member');
UPDATE membership_types SET category = 'Staff' WHERE category IN ('Staff Plans');
UPDATE membership_types SET category = 'Add-on' WHERE category IN ('Add-ons', 'Addon');
UPDATE membership_types SET category = 'Guest' WHERE category IN ('Guest Plans', 'Non-Member');

-- Add constraint to ensure only valid categories are used
ALTER TABLE membership_types 
DROP CONSTRAINT IF EXISTS membership_types_category_check;

ALTER TABLE membership_types 
ADD CONSTRAINT membership_types_category_check 
CHECK (category IN ('Membership', 'Staff', 'Add-on', 'Guest'));

-- Update any existing data that might not match
UPDATE membership_types SET category = 'Membership' WHERE category IS NULL OR category NOT IN ('Membership', 'Staff', 'Add-on', 'Guest');

-- Add comments for clarity
COMMENT ON COLUMN membership_types.category IS 'Category of membership type: Membership, Staff, Add-on, or Guest';
