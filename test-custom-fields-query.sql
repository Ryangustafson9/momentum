-- Test query to check custom fields setup
-- Run this in Supabase SQL Editor to verify custom fields are working

-- 1. Check if custom_fields table exists and has data
SELECT 'custom_fields table' as table_name, count(*) as record_count FROM custom_fields;

-- 2. Show all custom fields
SELECT id, label, type, field_type, is_active, order_index 
FROM custom_fields 
ORDER BY order_index;

-- 3. Check if member_custom_field_values table exists
SELECT 'member_custom_field_values table' as table_name, count(*) as record_count 
FROM member_custom_field_values;

-- 4. Show sample member custom field values
SELECT mcfv.*, cf.label, cf.type, cf.field_type
FROM member_custom_field_values mcfv
JOIN custom_fields cf ON mcfv.custom_field_id = cf.id
LIMIT 10;

-- 5. Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'custom_fields'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'member_custom_field_values'
ORDER BY ordinal_position;
