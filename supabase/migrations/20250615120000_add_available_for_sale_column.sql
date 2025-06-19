-- Add available_for_sale column to membership_types table
-- This clarifies the business logic:
-- - available_for_sale: Can be sold by staff
-- - available_online: Can be sold online (requires available_for_sale to be true)

DO $$
BEGIN
  -- Add available_for_sale column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'membership_types' 
    AND column_name = 'available_for_sale'
  ) THEN
    ALTER TABLE membership_types ADD COLUMN available_for_sale BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added available_for_sale column to membership_types table';
  END IF;

  -- Set initial values based on business logic
  -- All current plans should be available for sale by staff
  UPDATE membership_types SET available_for_sale = true WHERE available_for_sale IS NULL;

  -- Staff plans should not be available for online sale but can be assigned by staff
  UPDATE membership_types SET 
    available_for_sale = true,
    available_online = false 
  WHERE category = 'Staff Plans';

  -- Member plans, Add-ons, and Guest plans should be available both for staff and online
  UPDATE membership_types SET 
    available_for_sale = true,
    available_online = true 
  WHERE category IN ('Member Plans', 'Add-ons', 'Guest Plans');

  -- Add constraint to ensure available_online cannot be true if available_for_sale is false
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_online_requires_for_sale'
    AND table_name = 'membership_types'
  ) THEN
    ALTER TABLE membership_types 
    ADD CONSTRAINT check_online_requires_for_sale 
    CHECK (NOT available_online OR available_for_sale);
    RAISE NOTICE 'Added constraint: available_online requires available_for_sale to be true';
  END IF;

  RAISE NOTICE 'Updated membership types availability settings:';
  RAISE NOTICE '- Staff Plans: available_for_sale=true, available_online=false';
  RAISE NOTICE '- Member Plans: available_for_sale=true, available_online=true';
  RAISE NOTICE '- Add-ons: available_for_sale=true, available_online=true';
  RAISE NOTICE '- Guest Plans: available_for_sale=true, available_online=true';
END $$;
