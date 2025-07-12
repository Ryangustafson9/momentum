-- =====================================================
-- CREATE GLOBAL ADMINISTRATOR ACCOUNTS
-- =====================================================
-- This script creates a "Global Administrator" profile for each
-- organization to be used for SSO login from Momentum Admin HQ
-- =====================================================

BEGIN;

DO $$
DECLARE
    org_record RECORD;
    location_record RECORD;
    admin_count INTEGER;
BEGIN
    RAISE NOTICE 'Creating Global Administrator accounts for all organizations...';

    -- Loop through all organizations
    FOR org_record IN 
        SELECT id, name, slug 
        FROM organizations 
        ORDER BY name
    LOOP
        RAISE NOTICE 'Processing organization: % (ID: %)', org_record.name, org_record.id;

        -- Get the primary location for this organization
        SELECT id INTO location_record
        FROM locations 
        WHERE organization_id = org_record.id 
        AND (is_primary = true OR is_primary IS NULL)
        LIMIT 1;

        -- Check if Global Administrator already exists for this organization
        SELECT COUNT(*) INTO admin_count
        FROM profiles
        WHERE organization_id = org_record.id
        AND first_name = 'Global'
        AND last_name = 'Administrator'
        AND role = 'admin';

        IF admin_count = 0 THEN
            -- Create Global Administrator profile
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
                org_record.id,
                location_record.id,
                (SELECT COALESCE(MAX(system_member_id), 0) + 1 FROM profiles WHERE organization_id = org_record.id),
                'Global',
                'Administrator',
                'global.admin@' || org_record.slug || '.momentum.internal',
                'admin',
                'active',
                false, -- This is a local admin, not a global admin
                NOW(),
                NOW()
            );

            RAISE NOTICE '✅ Created Global Administrator for: %', org_record.name;
        ELSE
            RAISE NOTICE '⚠️ Global Administrator already exists for: %', org_record.name;
        END IF;
    END LOOP;

    RAISE NOTICE 'Global Administrator account creation completed.';
END $$;

-- Verify the created accounts
SELECT 
    o.name as organization_name,
    o.slug as organization_slug,
    p.first_name,
    p.last_name,
    p.email,
    p.role,
    p.status,
    p.created_at
FROM profiles p
JOIN organizations o ON p.organization_id = o.id
WHERE p.first_name = 'Global' 
AND p.last_name = 'Administrator'
ORDER BY o.name;

COMMIT;

DO $$
BEGIN
    RAISE NOTICE '=== GLOBAL ADMINISTRATOR SETUP COMPLETE ===';
    RAISE NOTICE 'Each organization now has a Global Administrator account';
    RAISE NOTICE 'SSO will use these accounts for seamless login';
END $$;
