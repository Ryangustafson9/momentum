-- =====================================================
-- RUN MEMBERSHIP MERGE MIGRATION
-- =====================================================
-- This script executes the membership table merge
-- Run this in Supabase SQL Editor to merge tables
-- =====================================================

-- First, let's check what tables currently exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('memberships', 'membership_addons', 'addon_memberships')
ORDER BY table_name;

-- Show current record counts
DO $$
DECLARE
    memberships_count INTEGER := 0;
    addons_count INTEGER := 0;
    addon_memberships_count INTEGER := 0;
BEGIN
    -- Check memberships table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memberships' AND table_schema = 'public') THEN
        SELECT COUNT(*) INTO memberships_count FROM memberships;
    END IF;
    
    -- Check membership_addons table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'membership_addons' AND table_schema = 'public') THEN
        SELECT COUNT(*) INTO addons_count FROM membership_addons;
    END IF;
    
    -- Check addon_memberships table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'addon_memberships' AND table_schema = 'public') THEN
        SELECT COUNT(*) INTO addon_memberships_count FROM addon_memberships;
    END IF;
    
    RAISE NOTICE '=== CURRENT DATA COUNTS ===';
    RAISE NOTICE 'Memberships: %', memberships_count;
    RAISE NOTICE 'Membership_addons: %', addons_count;
    RAISE NOTICE 'Addon_memberships: %', addon_memberships_count;
    RAISE NOTICE 'Total records to migrate: %', memberships_count + addons_count + addon_memberships_count;
END $$;

-- Show sample data from existing tables (if they exist)
DO $$
BEGIN
    RAISE NOTICE '=== SAMPLE DATA PREVIEW ===';
    
    -- Sample from memberships
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memberships' AND table_schema = 'public') THEN
        RAISE NOTICE 'Sample memberships columns:';
        FOR rec IN 
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'memberships' AND table_schema = 'public'
            ORDER BY ordinal_position
            LIMIT 10
        LOOP
            RAISE NOTICE '  - %: %', rec.column_name, rec.data_type;
        END LOOP;
    END IF;
    
    -- Sample from membership_addons
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'membership_addons' AND table_schema = 'public') THEN
        RAISE NOTICE 'Sample membership_addons columns:';
        FOR rec IN 
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'membership_addons' AND table_schema = 'public'
            ORDER BY ordinal_position
            LIMIT 10
        LOOP
            RAISE NOTICE '  - %: %', rec.column_name, rec.data_type;
        END LOOP;
    END IF;
    
    -- Sample from addon_memberships
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'addon_memberships' AND table_schema = 'public') THEN
        RAISE NOTICE 'Sample addon_memberships columns:';
        FOR rec IN 
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'addon_memberships' AND table_schema = 'public'
            ORDER BY ordinal_position
            LIMIT 10
        LOOP
            RAISE NOTICE '  - %: %', rec.column_name, rec.data_type;
        END LOOP;
    END IF;
END $$;

-- Prompt user to continue
SELECT 'Ready to run migration. Please review the above information and run merge_memberships_tables.sql if everything looks correct.' as next_step;
