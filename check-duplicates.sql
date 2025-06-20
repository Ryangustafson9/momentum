-- Check for duplicate add-ons
SELECT 
  name,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as ids,
  STRING_AGG(price::text, ', ') as prices
FROM membership_types 
WHERE category = 'Add-ons'
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY name;

-- Also show all add-ons for reference
SELECT 
  id,
  name,
  price,
  category,
  created_at,
  is_addon,
  requires_primary_membership,
  available_online,
  available_for_sale
FROM membership_types 
WHERE category = 'Add-ons' 
   OR is_addon = true
ORDER BY name, created_at;
