-- Add available_online column to membership_types table
-- This column controls which membership types can be purchased online

-- Add the available_online column
ALTER TABLE membership_types
ADD COLUMN available_online boolean DEFAULT true;

-- Set all existing membership types to be available online
UPDATE membership_types
SET available_online = true
WHERE available_online IS NULL;

-- Add a comment to explain the column
COMMENT ON COLUMN membership_types.available_online IS 'Whether this membership type can be purchased through the online join flow';

-- Log the changes
DO $$
BEGIN
  RAISE NOTICE 'Added available_online column to membership_types table and set all existing records to true';
END $$;