-- =====================================================
-- FIX ORGANIZATIONS - RESET TO SINGLE DEMO ORG
-- =====================================================
-- This script will clean up duplicate organizations and 
-- ensure you have exactly one demo organization
-- =====================================================

BEGIN;

-- First, let's see what we have
DO $$
BEGIN
    RAISE NOTICE '=== CURRENT ORGANIZATIONS ===';
END $$;

-- Show current organizations
SELECT 
    'Current organizations:' as info,
    id,
    name,
    slug,
    created_at
FROM organizations
ORDER BY created_at;

-- Delete all organizations and related data
DO $$
DECLARE
    org_count INTEGER;
BEGIN
    RAISE NOTICE 'Cleaning up existing organizations...';
    
    -- Get count before deletion
    SELECT COUNT(*) INTO org_count FROM organizations;
    RAISE NOTICE 'Found % organizations to clean up', org_count;
    
    -- Delete related data first (foreign key constraints)
    DELETE FROM profiles WHERE organization_id IS NOT NULL;
    DELETE FROM locations;
    DELETE FROM organizations;
    
    RAISE NOTICE 'Deleted all organizations and related data';
END $$;

-- Create fresh demo organization
DO $$
DECLARE
    org_id UUID;
    location_id UUID;
BEGIN
    RAISE NOTICE 'Creating fresh demo organization...';
    
    -- Create demo organization
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
    
    RAISE NOTICE 'Created organization: Momentum Fitness Demo (ID: %)', org_id;
    
    -- Create demo location
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
    
    RAISE NOTICE 'Created location: Main Location (ID: %)', location_id;
    
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
        'global.admin@momentum-demo.momentum.internal',
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

-- Verify the results
DO $$
DECLARE
    org_count INTEGER;
    location_count INTEGER;
    admin_count INTEGER;
    global_admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO org_count FROM organizations;
    SELECT COUNT(*) INTO location_count FROM locations;
    SELECT COUNT(*) INTO admin_count FROM profiles WHERE first_name = 'Global' AND last_name = 'Administrator';
    SELECT COUNT(*) INTO global_admin_count FROM profiles WHERE is_global_admin = true;
    
    RAISE NOTICE '=== VERIFICATION RESULTS ===';
    RAISE NOTICE 'Organizations: %', org_count;
    RAISE NOTICE 'Locations: %', location_count;
    RAISE NOTICE 'Global Administrator accounts: %', admin_count;
    RAISE NOTICE 'Global admin users: %', global_admin_count;
    
    IF org_count = 1 AND location_count = 1 AND admin_count = 1 AND global_admin_count = 1 THEN
        RAISE NOTICE '✅ SUCCESS: Database is properly configured';
    ELSE
        RAISE NOTICE '❌ WARNING: Unexpected counts detected';
    END IF;
END $$;

-- Show final state
SELECT 
    'Final organizations:' as info,
    id,
    name,
    slug,
    created_at
FROM organizations
ORDER BY created_at;

-- Show profiles
SELECT 
    'Profiles created:' as info,
    first_name,
    last_name,
    email,
    role,
    is_global_admin,
    CASE 
        WHEN organization_id IS NOT NULL THEN 'Organization-specific'
        ELSE 'Global'
    END as scope
FROM profiles
ORDER BY is_global_admin DESC, first_name;

COMMIT;

DO $$
BEGIN
    RAISE NOTICE '=== ORGANIZATIONS FIXED ===';
    RAISE NOTICE 'You now have exactly one demo organization';
    RAISE NOTICE 'Refresh your Admin HQ dashboard to see the changes';
END $$;
