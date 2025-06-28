-- Test query to check membership types setup
-- Run this in Supabase SQL Editor to verify membership types are configured correctly

-- 1. Check if membership_types table exists and has data
SELECT 'membership_types table' as table_name, count(*) as record_count FROM membership_types;

-- 2. Show all membership types
SELECT id, name, category, available_for_sale, available_online, price, created_at 
FROM membership_types 
ORDER BY category, name;

-- 3. Show only membership types available for sale
SELECT id, name, category, available_for_sale, available_online, price 
FROM membership_types 
WHERE available_for_sale = true
ORDER BY category, name;

-- 4. Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'membership_types'
ORDER BY ordinal_position;

-- 5. Insert some test membership types if none exist
INSERT INTO membership_types (name, category, price, available_for_sale, available_online, billing_type, duration_months)
SELECT * FROM (VALUES
    ('Basic Monthly', 'Membership', 29.99, true, true, 'monthly', 1),
    ('Premium Monthly', 'Membership', 49.99, true, true, 'monthly', 1),
    ('Annual Membership', 'Membership', 299.99, true, true, 'annual', 12),
    ('Staff Plan', 'Staff', 0.00, true, false, 'monthly', 1),
    ('Personal Training Add-on', 'Add-on', 75.00, true, true, 'monthly', 1)
) AS v(name, category, price, available_for_sale, available_online, billing_type, duration_months)
WHERE NOT EXISTS (
    SELECT 1 FROM membership_types WHERE available_for_sale = true LIMIT 1
);

-- 6. Final check - show what's available for sale after potential insert
SELECT id, name, category, available_for_sale, price 
FROM membership_types 
WHERE available_for_sale = true
ORDER BY category, price;
