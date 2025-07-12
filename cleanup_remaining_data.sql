-- =====================================================
-- CLEANUP REMAINING DATA SCRIPT
-- =====================================================
-- This script deletes remaining data from specific tables
-- that still contain tenant/operational data after the main reset
-- =====================================================

BEGIN;

DO $$
DECLARE
    row_count_val INTEGER;
    table_exists BOOLEAN;
BEGIN
    RAISE NOTICE 'Starting cleanup of remaining tenant data...';

    -- Delete accounting_account_templates (remove all template data)
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounting_account_templates') INTO table_exists;
    IF table_exists THEN
        DELETE FROM accounting_account_templates WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted accounting_account_templates: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table accounting_account_templates does not exist, skipping...';
    END IF;

    -- Delete POS inventory data
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pos_inventory') INTO table_exists;
    IF table_exists THEN
        DELETE FROM pos_inventory WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted pos_inventory: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table pos_inventory does not exist, skipping...';
    END IF;

    -- Also check for variations of POS inventory table names
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory') INTO table_exists;
    IF table_exists THEN
        DELETE FROM inventory WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted inventory: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table inventory does not exist, skipping...';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pos_items') INTO table_exists;
    IF table_exists THEN
        DELETE FROM pos_items WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted pos_items: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table pos_items does not exist, skipping...';
    END IF;

    -- Delete custom fields data
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'custom_fields') INTO table_exists;
    IF table_exists THEN
        DELETE FROM custom_fields WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted custom_fields: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table custom_fields does not exist, skipping...';
    END IF;

    -- Also check for custom field values
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'custom_field_values') INTO table_exists;
    IF table_exists THEN
        DELETE FROM custom_field_values WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted custom_field_values: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table custom_field_values does not exist, skipping...';
    END IF;

    -- Delete general settings data
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'general_settings') INTO table_exists;
    IF table_exists THEN
        DELETE FROM general_settings WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted general_settings: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table general_settings does not exist, skipping...';
    END IF;

    -- Delete holiday hours data
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'holiday_hours') INTO table_exists;
    IF table_exists THEN
        DELETE FROM holiday_hours WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted holiday_hours: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table holiday_hours does not exist, skipping...';
    END IF;

    -- Also check for variations of holiday/hours table names
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'holidays') INTO table_exists;
    IF table_exists THEN
        DELETE FROM holidays WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted holidays: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table holidays does not exist, skipping...';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'operating_hours') INTO table_exists;
    IF table_exists THEN
        DELETE FROM operating_hours WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted operating_hours: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table operating_hours does not exist, skipping...';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_hours') INTO table_exists;
    IF table_exists THEN
        DELETE FROM business_hours WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted business_hours: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table business_hours does not exist, skipping...';
    END IF;

    RAISE NOTICE 'Cleanup of remaining tenant data completed.';
END $$;

-- Log the cleanup action
INSERT INTO audit_logs (
    user_id,
    action,
    details,
    created_at
) VALUES (
    'fb22f72c-2deb-45bc-8927-4f35e0e4256e',
    'DATABASE_CLEANUP',
    '{"description": "Cleaned up remaining tenant data from specific tables", "timestamp": "' || NOW() || '"}',
    NOW()
);

COMMIT;

DO $$
BEGIN
    RAISE NOTICE '=== CLEANUP COMPLETE ===';
    RAISE NOTICE 'All remaining tenant data has been removed.';
    RAISE NOTICE 'Database is now fully clean and ready for testing.';
END $$;
