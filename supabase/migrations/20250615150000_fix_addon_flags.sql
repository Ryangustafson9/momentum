-- Fix add-on flags to ensure they show up in the join-online flow
-- This migration ensures all add-ons have the correct flags set

-- Update all membership types in the Add-ons category
UPDATE membership_types 
SET 
  is_addon = true,
  requires_primary_membership = true,
  available_online = true,
  available_for_sale = true,
  person_capacity = 1,
  max_family_members = 1,
  addon_billing_cycle = COALESCE(addon_billing_cycle, 'monthly')
WHERE category = 'Add-ons';

-- Also ensure any membership types with member_type = 'addon' are flagged correctly
UPDATE membership_types 
SET 
  is_addon = true,
  requires_primary_membership = true,
  available_online = true,
  available_for_sale = true,
  person_capacity = 1,
  max_family_members = 1,
  addon_billing_cycle = COALESCE(addon_billing_cycle, 'monthly')
WHERE member_type = 'addon';

-- Log the update
DO $$
DECLARE
  addon_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO addon_count 
  FROM membership_types 
  WHERE category = 'Add-ons' AND is_addon = true AND available_online = true;
  
  RAISE NOTICE 'Fixed add-on flags. % add-ons are now available online.', addon_count;
END $$;
