-- Migration to add membership type configuration fields
-- This migration adds fields for the new membership type configuration feature

BEGIN;

-- Add new columns to membership_types table
ALTER TABLE membership_types 
ADD COLUMN IF NOT EXISTS has_secondary BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_dependents BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_dependents INTEGER DEFAULT 0;

-- Add comments to explain the new fields
COMMENT ON COLUMN membership_types.has_secondary IS 'Whether this membership type includes a secondary member (spouse/partner)';
COMMENT ON COLUMN membership_types.has_dependents IS 'Whether this membership type allows dependents (children)';
COMMENT ON COLUMN membership_types.max_dependents IS 'Maximum number of dependents allowed (only relevant when has_dependents is true)';

-- Update existing membership types based on their current person_capacity
-- This is a best-guess migration for existing data

-- Individual memberships (capacity = 1)
UPDATE membership_types 
SET has_secondary = false, has_dependents = false, max_dependents = 0
WHERE person_capacity = 1;

-- Couple memberships (capacity = 2)
UPDATE membership_types 
SET has_secondary = true, has_dependents = false, max_dependents = 0
WHERE person_capacity = 2;

-- Family memberships (capacity > 2)
UPDATE membership_types 
SET has_secondary = true, has_dependents = true, max_dependents = (person_capacity - 2)
WHERE person_capacity > 2;

-- For any memberships with specific family-related names, ensure they're configured as family
UPDATE membership_types 
SET has_secondary = true, has_dependents = true, max_dependents = GREATEST(max_dependents, 2)
WHERE LOWER(name) LIKE '%family%' AND max_dependents < 2;

COMMIT;
