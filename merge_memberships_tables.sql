-- =====================================================
-- MERGE MEMBERSHIPS AND MEMBERSHIP_ADDONS TABLES
-- =====================================================
-- This script merges membership_addons into memberships table
-- and adds a plan_type column to distinguish between:
-- - Membership (primary membership)
-- - Add-On (additional services/features)
-- - Staff (employee memberships)
-- - Guest (temporary/visitor access)
-- =====================================================
-- Updated: 2025-07-03
-- Handles both membership_addons and addon_memberships tables
-- =====================================================

BEGIN;

-- Step 1: Check current table structures
DO $$
DECLARE
    memberships_count INTEGER;
    addons_count INTEGER;
    addon_memberships_count INTEGER;
BEGIN
    RAISE NOTICE '=== CURRENT TABLE STATUS ===';

    -- Check if tables exist and get counts
    SELECT COUNT(*) INTO memberships_count
    FROM information_schema.tables
    WHERE table_name = 'memberships' AND table_schema = 'public';

    SELECT COUNT(*) INTO addons_count
    FROM information_schema.tables
    WHERE table_name = 'membership_addons' AND table_schema = 'public';

    SELECT COUNT(*) INTO addon_memberships_count
    FROM information_schema.tables
    WHERE table_name = 'addon_memberships' AND table_schema = 'public';

    RAISE NOTICE 'Memberships table exists: %', CASE WHEN memberships_count > 0 THEN 'YES' ELSE 'NO' END;
    RAISE NOTICE 'Membership_addons table exists: %', CASE WHEN addons_count > 0 THEN 'YES' ELSE 'NO' END;
    RAISE NOTICE 'Addon_memberships table exists: %', CASE WHEN addon_memberships_count > 0 THEN 'YES' ELSE 'NO' END;

    -- Show current data counts if tables exist
    IF memberships_count > 0 THEN
        EXECUTE 'SELECT COUNT(*) FROM memberships' INTO memberships_count;
        RAISE NOTICE 'Current memberships records: %', memberships_count;
    END IF;

    IF addons_count > 0 THEN
        EXECUTE 'SELECT COUNT(*) FROM membership_addons' INTO addons_count;
        RAISE NOTICE 'Current membership_addons records: %', addons_count;
    END IF;

    IF addon_memberships_count > 0 THEN
        SELECT COUNT(*) INTO addon_memberships_count FROM addon_memberships;
        RAISE NOTICE 'Current addon_memberships records: %', addon_memberships_count;
    END IF;
END $$;

-- Step 2: Create backup of existing data
DO $$
BEGIN
    RAISE NOTICE 'Creating backup tables...';

    -- Backup memberships if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memberships' AND table_schema = 'public') THEN
        DROP TABLE IF EXISTS memberships_backup;
        CREATE TABLE memberships_backup AS SELECT * FROM memberships;
        RAISE NOTICE 'Created memberships_backup table';
    END IF;

    -- Backup membership_addons if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'membership_addons' AND table_schema = 'public') THEN
        DROP TABLE IF EXISTS membership_addons_backup;
        CREATE TABLE membership_addons_backup AS SELECT * FROM membership_addons;
        RAISE NOTICE 'Created membership_addons_backup table';
    END IF;

    -- Backup addon_memberships if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'addon_memberships' AND table_schema = 'public') THEN
        DROP TABLE IF EXISTS addon_memberships_backup;
        CREATE TABLE addon_memberships_backup AS SELECT * FROM addon_memberships;
        RAISE NOTICE 'Created addon_memberships_backup table';
    END IF;
END $$;

-- Step 3: Create new unified memberships table structure
DROP TABLE IF EXISTS memberships CASCADE;

CREATE TABLE memberships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    location_id UUID,
    membership_plan_id UUID,
    
    -- New plan_type column
    plan_type VARCHAR(20) NOT NULL DEFAULT 'Membership' 
        CHECK (plan_type IN ('Membership', 'Add-On', 'Staff', 'Guest')),
    
    -- Membership details
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'suspended', 'cancelled', 'expired', 'pending', 'on_hold')),
    
    -- Dates
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    next_billing_date DATE,
    cancelled_date DATE,
    suspended_date DATE,
    
    -- Financial
    monthly_rate DECIMAL(10,2),
    setup_fee DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_type VARCHAR(20) DEFAULT 'none'
        CHECK (discount_type IN ('none', 'percentage', 'fixed')),
    
    -- Contract and billing
    contract_length_months INTEGER DEFAULT 0,
    billing_frequency VARCHAR(20) DEFAULT 'monthly'
        CHECK (billing_frequency IN ('monthly', 'quarterly', 'semi_annual', 'annual', 'one_time')),
    auto_renew BOOLEAN DEFAULT true,
    
    -- Capacity and dependents
    capacity_type VARCHAR(20) DEFAULT 'individual'
        CHECK (capacity_type IN ('individual', 'couple', 'family', 'individual_plus_dependents')),
    max_dependents INTEGER DEFAULT 0,
    current_dependents INTEGER DEFAULT 0,
    
    -- Additional features
    freeze_holds_remaining INTEGER DEFAULT 0,
    guest_passes_remaining INTEGER DEFAULT 0,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    -- Foreign key constraints
    CONSTRAINT fk_memberships_member 
        FOREIGN KEY (member_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_memberships_organization 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_memberships_location 
        FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
    CONSTRAINT fk_memberships_plan 
        FOREIGN KEY (membership_plan_id) REFERENCES membership_plans(id) ON DELETE SET NULL
);

-- Step 4: Create indexes for performance
CREATE INDEX idx_memberships_member_id ON memberships(member_id);
CREATE INDEX idx_memberships_organization_id ON memberships(organization_id);
CREATE INDEX idx_memberships_plan_type ON memberships(plan_type);
CREATE INDEX idx_memberships_status ON memberships(status);
CREATE INDEX idx_memberships_start_date ON memberships(start_date);
CREATE INDEX idx_memberships_next_billing_date ON memberships(next_billing_date);

-- Step 5: Migrate data from backup tables
DO $$
DECLARE
    migrated_memberships INTEGER := 0;
    migrated_addons INTEGER := 0;
BEGIN
    RAISE NOTICE 'Migrating data to new memberships table...';
    
    -- Migrate original memberships data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memberships_backup') THEN
        INSERT INTO memberships (
            id, member_id, organization_id, location_id, membership_plan_id,
            plan_type, status, start_date, end_date, next_billing_date,
            cancelled_date, suspended_date, monthly_rate, setup_fee,
            discount_amount, discount_type, contract_length_months,
            billing_frequency, auto_renew, capacity_type, max_dependents,
            current_dependents, freeze_holds_remaining, guest_passes_remaining,
            notes, created_at, updated_at, created_by, updated_by
        )
        SELECT 
            id, member_id, organization_id, location_id, membership_plan_id,
            'Membership' as plan_type, -- Set as primary membership
            COALESCE(status, 'active'),
            COALESCE(start_date, CURRENT_DATE),
            end_date, next_billing_date, cancelled_date, suspended_date,
            monthly_rate, COALESCE(setup_fee, 0.00),
            COALESCE(discount_amount, 0.00),
            COALESCE(discount_type, 'none'),
            COALESCE(contract_length_months, 0),
            COALESCE(billing_frequency, 'monthly'),
            COALESCE(auto_renew, true),
            COALESCE(capacity_type, 'individual'),
            COALESCE(max_dependents, 0),
            COALESCE(current_dependents, 0),
            COALESCE(freeze_holds_remaining, 0),
            COALESCE(guest_passes_remaining, 0),
            notes, created_at, updated_at, created_by, updated_by
        FROM memberships_backup;
        
        GET DIAGNOSTICS migrated_memberships = ROW_COUNT;
        RAISE NOTICE 'Migrated % membership records', migrated_memberships;
    END IF;
    
    -- Migrate membership_addons data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'membership_addons_backup') THEN
        INSERT INTO memberships (
            id, member_id, organization_id, location_id, membership_plan_id,
            plan_type, status, start_date, end_date, next_billing_date,
            monthly_rate, setup_fee, billing_frequency, auto_renew,
            notes, created_at, updated_at, created_by, updated_by
        )
        SELECT
            id, member_id, organization_id, location_id, addon_plan_id,
            'Add-On' as plan_type, -- Set as add-on
            COALESCE(status, 'active'),
            COALESCE(start_date, CURRENT_DATE),
            end_date, next_billing_date,
            monthly_rate, COALESCE(setup_fee, 0.00),
            COALESCE(billing_frequency, 'monthly'),
            COALESCE(auto_renew, true),
            notes, created_at, updated_at, created_by, updated_by
        FROM membership_addons_backup;

        GET DIAGNOSTICS migrated_addons = ROW_COUNT;
        RAISE NOTICE 'Migrated % add-on records from membership_addons', migrated_addons;
    END IF;

    -- Migrate addon_memberships data (alternative table name)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'addon_memberships_backup') THEN
        INSERT INTO memberships (
            id, member_id, organization_id, location_id, membership_plan_id,
            plan_type, status, start_date, end_date, next_billing_date,
            monthly_rate, setup_fee, billing_frequency, auto_renew,
            notes, created_at, updated_at, created_by, updated_by
        )
        SELECT
            id, member_id, organization_id, location_id,
            COALESCE(addon_type_id, membership_type_id) as membership_plan_id,
            'Add-On' as plan_type, -- Set as add-on
            COALESCE(status, 'active'),
            COALESCE(start_date, CURRENT_DATE),
            end_date, next_billing_date,
            COALESCE(monthly_rate, price, 0.00), COALESCE(setup_fee, 0.00),
            COALESCE(billing_frequency, 'monthly'),
            COALESCE(auto_renew, true),
            notes, created_at, updated_at, created_by, updated_by
        FROM addon_memberships_backup;

        GET DIAGNOSTICS migrated_addons = ROW_COUNT;
        RAISE NOTICE 'Migrated % add-on records from addon_memberships', migrated_addons;
    END IF;
    
    RAISE NOTICE 'Data migration completed: % total records', migrated_memberships + migrated_addons;
END $$;

-- Step 6: Enable RLS and create policies
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Policy for organization members to see their own memberships
CREATE POLICY "Users can view own memberships" ON memberships
    FOR SELECT USING (
        member_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.organization_id = memberships.organization_id
            AND profiles.role IN ('admin', 'staff')
        )
    );

-- Policy for staff to manage memberships in their organization
CREATE POLICY "Staff can manage organization memberships" ON memberships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.organization_id = memberships.organization_id
            AND profiles.role IN ('admin', 'staff')
        )
    );

-- Step 7: Clean up old tables (optional - commented out for safety)
-- DROP TABLE IF EXISTS membership_addons_backup;
-- DROP TABLE IF EXISTS memberships_backup;

-- Step 8: Add comments for documentation
COMMENT ON TABLE memberships IS 'Unified table for all membership types including primary memberships, add-ons, staff, and guest access';
COMMENT ON COLUMN memberships.plan_type IS 'Type of membership: Membership, Add-On, Staff, or Guest';
COMMENT ON COLUMN memberships.capacity_type IS 'Membership capacity: individual, couple, family, or individual_plus_dependents';
COMMENT ON COLUMN memberships.contract_length_months IS 'Contract length in months, 0 for month-to-month';

-- Step 9: Verification
DO $$
DECLARE
    total_count INTEGER;
    membership_count INTEGER;
    addon_count INTEGER;
    staff_count INTEGER;
    guest_count INTEGER;
BEGIN
    RAISE NOTICE '=== MIGRATION VERIFICATION ===';
    
    SELECT COUNT(*) INTO total_count FROM memberships;
    SELECT COUNT(*) INTO membership_count FROM memberships WHERE plan_type = 'Membership';
    SELECT COUNT(*) INTO addon_count FROM memberships WHERE plan_type = 'Add-On';
    SELECT COUNT(*) INTO staff_count FROM memberships WHERE plan_type = 'Staff';
    SELECT COUNT(*) INTO guest_count FROM memberships WHERE plan_type = 'Guest';
    
    RAISE NOTICE 'Total memberships: %', total_count;
    RAISE NOTICE 'Primary memberships: %', membership_count;
    RAISE NOTICE 'Add-ons: %', addon_count;
    RAISE NOTICE 'Staff memberships: %', staff_count;
    RAISE NOTICE 'Guest memberships: %', guest_count;
    
    RAISE NOTICE 'Migration completed successfully!';
END $$;

COMMIT;

-- Show final table structure
\d memberships;
