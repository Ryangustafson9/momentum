-- =====================================================
-- MOMENTUM GYM MANAGEMENT SYSTEM - DATABASE RESET
-- =====================================================
-- This script resets the database to a clean state while preserving:
-- - Database schema and structure
-- - RLS policies and security settings
-- - System templates and configuration data
-- - Protected accounting accounts
-- 
-- WARNING: This will delete ALL tenant/operational data!
-- =====================================================

BEGIN;

-- =====================================================
-- SECTION 1: BACKUP VERIFICATION
-- =====================================================
-- Verify we have the essential system tables before proceeding
DO $$
BEGIN
    -- Check for essential system tables (removed accounting_account_templates check)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings') THEN
        RAISE EXCEPTION 'Critical system table system_settings not found. Aborting reset.';
    END IF;

    RAISE NOTICE 'Database verification passed. Proceeding with reset...';
END $$;

-- =====================================================
-- SECTION 2: DELETE TENANT/OPERATIONAL DATA
-- =====================================================
-- Delete in dependency order to respect foreign key constraints

DO $$
DECLARE
    row_count_val INTEGER;
    table_exists BOOLEAN;
    constraint_record RECORD;
BEGIN
    RAISE NOTICE 'Starting deletion of tenant/operational data...';

    -- First, let's identify and handle any remaining foreign key constraints
    -- by deleting from all tables that reference profiles
    FOR constraint_record IN
        SELECT DISTINCT tc.table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'profiles'
        AND tc.table_name != 'profiles'
    LOOP
        BEGIN
            EXECUTE format('DELETE FROM %I WHERE 1=1', constraint_record.table_name);
            GET DIAGNOSTICS row_count_val = ROW_COUNT;
            RAISE NOTICE 'Deleted from %: % rows', constraint_record.table_name, row_count_val;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not delete from % (table may not exist or have other constraints): %',
                constraint_record.table_name, SQLERRM;
        END;
    END LOOP;

    -- Helper function to safely delete from table if it exists
    -- Delete audit and logging data
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') INTO table_exists;
    IF table_exists THEN
        DELETE FROM audit_logs WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted audit_logs: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table audit_logs does not exist, skipping...';
    END IF;

    -- Delete support and communication data
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_tickets') INTO table_exists;
    IF table_exists THEN
        DELETE FROM support_tickets WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted support_tickets: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table support_tickets does not exist, skipping...';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'member_notes') INTO table_exists;
    IF table_exists THEN
        DELETE FROM member_notes WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted member_notes: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table member_notes does not exist, skipping...';
    END IF;

    -- Delete operational activity data
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checkin_history') INTO table_exists;
    IF table_exists THEN
        DELETE FROM checkin_history WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted checkin_history: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table checkin_history does not exist, skipping...';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'login_attempts') INTO table_exists;
    IF table_exists THEN
        DELETE FROM login_attempts WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted login_attempts: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table login_attempts does not exist, skipping...';
    END IF;

    -- Delete financial/payment data (must be before profiles due to foreign keys)
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') INTO table_exists;
    IF table_exists THEN
        DELETE FROM transactions WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted transactions: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table transactions does not exist, skipping...';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') INTO table_exists;
    IF table_exists THEN
        DELETE FROM payments WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted payments: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table payments does not exist, skipping...';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'billing_schedules') INTO table_exists;
    IF table_exists THEN
        DELETE FROM billing_schedules WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted billing_schedules: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table billing_schedules does not exist, skipping...';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') INTO table_exists;
    IF table_exists THEN
        DELETE FROM invoices WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted invoices: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table invoices does not exist, skipping...';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_methods') INTO table_exists;
    IF table_exists THEN
        DELETE FROM payment_methods WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted payment_methods: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table payment_methods does not exist, skipping...';
    END IF;

    -- Delete membership and service data
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'member_services') INTO table_exists;
    IF table_exists THEN
        DELETE FROM member_services WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted member_services: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table member_services does not exist, skipping...';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memberships') INTO table_exists;
    IF table_exists THEN
        DELETE FROM memberships WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted memberships: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table memberships does not exist, skipping...';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'membership_plans') INTO table_exists;
    IF table_exists THEN
        DELETE FROM membership_plans WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted membership_plans: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table membership_plans does not exist, skipping...';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'membership_types') INTO table_exists;
    IF table_exists THEN
        DELETE FROM membership_types WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted membership_types: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table membership_types does not exist, skipping...';
    END IF;

    -- Delete staff and role assignments
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_roles') INTO table_exists;
    IF table_exists THEN
        DELETE FROM staff_roles WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted staff_roles: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table staff_roles does not exist, skipping...';
    END IF;

    -- Delete any other tables that might reference profiles
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'member_documents') INTO table_exists;
    IF table_exists THEN
        DELETE FROM member_documents WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted member_documents: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table member_documents does not exist, skipping...';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'member_emergency_contacts') INTO table_exists;
    IF table_exists THEN
        DELETE FROM member_emergency_contacts WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted member_emergency_contacts: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table member_emergency_contacts does not exist, skipping...';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') INTO table_exists;
    IF table_exists THEN
        DELETE FROM notifications WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted notifications: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table notifications does not exist, skipping...';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences') INTO table_exists;
    IF table_exists THEN
        DELETE FROM user_preferences WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted user_preferences: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table user_preferences does not exist, skipping...';
    END IF;

    -- Delete user profiles (except system accounts)
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') INTO table_exists;
    IF table_exists THEN
        DELETE FROM profiles WHERE role != 'system' OR role IS NULL;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted profiles: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table profiles does not exist, skipping...';
    END IF;

    -- Delete location and organization data
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') INTO table_exists;
    IF table_exists THEN
        DELETE FROM locations WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted locations: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table locations does not exist, skipping...';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') INTO table_exists;
    IF table_exists THEN
        DELETE FROM organizations WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted organizations: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table organizations does not exist, skipping...';
    END IF;

    -- Delete non-protected accounting accounts
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounting_accounts') INTO table_exists;
    IF table_exists THEN
        DELETE FROM accounting_accounts WHERE is_protected != true OR is_protected IS NULL;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted non-protected accounting_accounts: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table accounting_accounts does not exist, skipping...';
    END IF;

    -- Delete any additional operational tables that might exist
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services') INTO table_exists;
    IF table_exists THEN
        DELETE FROM services WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted services: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table services does not exist, skipping...';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_categories') INTO table_exists;
    IF table_exists THEN
        DELETE FROM service_categories WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted service_categories: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table service_categories does not exist, skipping...';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'packages') INTO table_exists;
    IF table_exists THEN
        DELETE FROM packages WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted packages: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table packages does not exist, skipping...';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pos_categories') INTO table_exists;
    IF table_exists THEN
        DELETE FROM pos_categories WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted pos_categories: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table pos_categories does not exist, skipping...';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'equipment') INTO table_exists;
    IF table_exists THEN
        DELETE FROM equipment WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted equipment: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table equipment does not exist, skipping...';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'classes') INTO table_exists;
    IF table_exists THEN
        DELETE FROM classes WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted classes: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table classes does not exist, skipping...';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schedules') INTO table_exists;
    IF table_exists THEN
        DELETE FROM schedules WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted schedules: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table schedules does not exist, skipping...';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') INTO table_exists;
    IF table_exists THEN
        DELETE FROM bookings WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted bookings: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table bookings does not exist, skipping...';
    END IF;

    -- Clean up any session or temporary data
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions') INTO table_exists;
    IF table_exists THEN
        DELETE FROM user_sessions WHERE 1=1;
        GET DIAGNOSTICS row_count_val = ROW_COUNT;
        RAISE NOTICE 'Deleted user_sessions: % rows', row_count_val;
    ELSE
        RAISE NOTICE 'Table user_sessions does not exist, skipping...';
    END IF;

    -- Reset sequences to start fresh
    ALTER SEQUENCE IF EXISTS profiles_system_member_id_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS organizations_id_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS locations_id_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS memberships_id_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS payments_id_seq RESTART WITH 1;

    RAISE NOTICE 'Tenant/operational data deletion completed.';
END $$;

-- =====================================================
-- SECTION 3: CREATE FRESH SEED DATA
-- =====================================================

DO $$
DECLARE
    org_id UUID;
    location_id UUID;
BEGIN
    RAISE NOTICE 'Creating fresh seed data...';

    -- Create demo organization (using only columns that exist)
    INSERT INTO organizations (
        id,
        name,
        slug,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'Momentum Fitness Demo',
        'momentum-demo',
        NOW(),
        NOW()
    ) RETURNING id INTO org_id;

    RAISE NOTICE 'Created demo organization with ID: %', org_id;

    -- Create demo location (using only columns that exist)
    INSERT INTO locations (
        id,
        organization_id,
        name,
        slug,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        org_id,
        'Main Location',
        'main',
        NOW(),
        NOW()
    ) RETURNING id INTO location_id;

    RAISE NOTICE 'Created demo location with ID: %', location_id;

    -- =====================================================
    -- SECTION 4: CREATE ADMIN PROFILES
    -- =====================================================

    -- Create Global Administrator profile for the organization
    INSERT INTO profiles (
        id,
        organization_id,
        location_id,
        system_member_id,
        first_name,
        last_name,
        email,
        role,
        status,
        is_global_admin,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        org_id,
        location_id,
        1,
        'Global',
        'Administrator',
        'global.admin@' || org_id || '.momentum.internal',
        'admin',
        'active',
        false, -- This is a local admin, not a global admin
        NOW(),
        NOW()
    );

    RAISE NOTICE 'Created Global Administrator profile for organization';

    -- Create/update the actual global admin user (ryan@momentum.pro)
    INSERT INTO profiles (
        id,
        system_member_id,
        first_name,
        last_name,
        email,
        role,
        is_global_admin,
        created_at,
        updated_at
    ) VALUES (
        'fb22f72c-2deb-45bc-8927-4f35e0e4256e', -- Known user ID from auth.users
        2,
        'Ryan',
        'Gustafson',
        'ryan@momentum.pro',
        'admin',
        true,
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role,
        is_global_admin = EXCLUDED.is_global_admin,
        updated_at = NOW();

    RAISE NOTICE 'Created/updated global admin profile for ryan@momentum.pro';
END $$;

-- =====================================================
-- SECTION 5: VERIFICATION AND SUMMARY
-- =====================================================

-- Verify the reset was successful
DO $$
DECLARE
    org_count INTEGER;
    location_count INTEGER;
    admin_count INTEGER;
    protected_accounts_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO org_count FROM organizations;
    SELECT COUNT(*) INTO location_count FROM locations;
    SELECT COUNT(*) INTO admin_count FROM profiles WHERE is_global_admin = true;
    SELECT COUNT(*) INTO protected_accounts_count FROM accounting_accounts WHERE is_protected = true;
    
    RAISE NOTICE '=== RESET SUMMARY ===';
    RAISE NOTICE 'Organizations created: %', org_count;
    RAISE NOTICE 'Locations created: %', location_count;
    RAISE NOTICE 'Global admins: %', admin_count;
    RAISE NOTICE 'Protected accounting accounts preserved: %', protected_accounts_count;
    
    IF org_count != 1 OR location_count != 1 OR admin_count != 1 THEN
        RAISE EXCEPTION 'Reset verification failed. Expected 1 org, 1 location, 1 admin. Got: %, %, %', 
            org_count, location_count, admin_count;
    END IF;
    
    RAISE NOTICE 'Database reset completed successfully!';
    RAISE NOTICE 'Demo organization: Momentum Fitness Demo (momentum-demo.momentum.pro)';
    RAISE NOTICE 'Global admin: ryan@momentum.pro';
    RAISE NOTICE 'You can now test both the customer gym interface and Momentum Admin HQ';
END $$;

-- Log the reset action
INSERT INTO audit_logs (
    user_id,
    action,
    details,
    created_at
) VALUES (
    'fb22f72c-2deb-45bc-8927-4f35e0e4256e',
    'DATABASE_RESET',
    jsonb_build_object(
        'description', 'Database reset to clean state with demo data',
        'timestamp', NOW()::text
    ),
    NOW()
);

COMMIT;

DO $$
BEGIN
    RAISE NOTICE '=== DATABASE RESET COMPLETE ===';
    RAISE NOTICE 'Transaction committed successfully. Database is ready for testing.';
END $$;
