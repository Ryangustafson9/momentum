-- =====================================================
-- EXECUTE MEMBERSHIP MERGE - SIMPLIFIED VERSION
-- =====================================================
-- Since both tables are empty, we can safely modify the structure
-- This script adds the plan_type column and prepares for unified usage
-- =====================================================

BEGIN;

-- Step 1: Check current state
DO $$
DECLARE
    memberships_count INTEGER := 0;
    addons_count INTEGER := 0;
BEGIN
    SELECT COUNT(*) INTO memberships_count FROM memberships;
    SELECT COUNT(*) INTO addons_count FROM membership_addons;
    
    RAISE NOTICE '=== CURRENT STATE ===';
    RAISE NOTICE 'Memberships records: %', memberships_count;
    RAISE NOTICE 'Membership_addons records: %', addons_count;
    
    IF memberships_count > 0 OR addons_count > 0 THEN
        RAISE EXCEPTION 'Tables contain data. Please use the full migration script instead.';
    END IF;
    
    RAISE NOTICE 'Tables are empty. Proceeding with structure modification...';
END $$;

-- Step 2: Add plan_type column to memberships table
ALTER TABLE memberships 
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) NOT NULL DEFAULT 'Membership' 
    CHECK (plan_type IN ('Membership', 'Add-On', 'Staff', 'Guest'));

-- Step 3: Add missing columns for unified structure
-- Add organization_id if it doesn't exist
ALTER TABLE memberships 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Add member_id column (map from existing user columns)
DO $$
BEGIN
    -- Add member_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'member_id') THEN
        ALTER TABLE memberships ADD COLUMN member_id UUID;
        RAISE NOTICE 'Added member_id column';
    END IF;
    
    -- Add membership_plan_id if it doesn't exist (map from membership_type_id)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'membership_plan_id') THEN
        ALTER TABLE memberships ADD COLUMN membership_plan_id UUID;
        RAISE NOTICE 'Added membership_plan_id column';
    END IF;
    
    -- Add monthly_rate if it doesn't exist (we have monthly_fee)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'monthly_rate') THEN
        ALTER TABLE memberships ADD COLUMN monthly_rate DECIMAL(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Added monthly_rate column';
    END IF;
    
    -- Add billing_frequency if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'billing_frequency') THEN
        ALTER TABLE memberships ADD COLUMN billing_frequency VARCHAR(20) DEFAULT 'monthly';
        RAISE NOTICE 'Added billing_frequency column';
    END IF;
    
    -- Add setup_fee if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'setup_fee') THEN
        ALTER TABLE memberships ADD COLUMN setup_fee DECIMAL(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Added setup_fee column';
    END IF;
    
    -- Add notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'notes') THEN
        ALTER TABLE memberships ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column';
    END IF;
    
    -- Add created_by and updated_by if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'created_by') THEN
        ALTER TABLE memberships ADD COLUMN created_by UUID;
        RAISE NOTICE 'Added created_by column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'updated_by') THEN
        ALTER TABLE memberships ADD COLUMN updated_by UUID;
        RAISE NOTICE 'Added updated_by column';
    END IF;
    
    -- Add created_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'created_at') THEN
        ALTER TABLE memberships ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column';
    END IF;
END $$;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_memberships_member_id ON memberships(member_id);
CREATE INDEX IF NOT EXISTS idx_memberships_organization_id ON memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_memberships_plan_type ON memberships(plan_type);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_start_date ON memberships(start_date);
CREATE INDEX IF NOT EXISTS idx_memberships_next_payment_date ON memberships(next_payment_date);

-- Step 5: Create a view for backward compatibility with membership_addons
CREATE OR REPLACE VIEW membership_addons_view AS
SELECT 
    id,
    member_id as membership_id,  -- Map member_id to membership_id for compatibility
    membership_plan_id as addon_type_id,
    status,
    start_date,
    expiration_date as end_date,
    monthly_rate as monthly_cost,
    billing_frequency as billing_cycle,
    auto_renew,
    created_at,
    updated_at
FROM memberships 
WHERE plan_type = 'Add-On';

-- Step 6: Create helper functions for the unified structure
CREATE OR REPLACE FUNCTION get_member_primary_membership(p_member_id UUID)
RETURNS TABLE (
    id UUID,
    member_id UUID,
    membership_plan_id UUID,
    status TEXT,
    start_date DATE,
    monthly_rate DECIMAL,
    next_payment_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.member_id,
        m.membership_plan_id,
        m.status,
        m.start_date,
        m.monthly_rate,
        m.next_payment_date
    FROM memberships m
    WHERE m.member_id = p_member_id 
      AND m.plan_type = 'Membership'
    ORDER BY m.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_member_addons(p_member_id UUID)
RETURNS TABLE (
    id UUID,
    member_id UUID,
    membership_plan_id UUID,
    status TEXT,
    start_date DATE,
    monthly_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.member_id,
        m.membership_plan_id,
        m.status,
        m.start_date,
        m.monthly_rate
    FROM memberships m
    WHERE m.member_id = p_member_id 
      AND m.plan_type = 'Add-On'
    ORDER BY m.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Add comments for documentation
COMMENT ON COLUMN memberships.plan_type IS 'Type of membership: Membership (primary), Add-On, Staff, or Guest';
COMMENT ON COLUMN memberships.member_id IS 'Reference to the member (profiles.id)';
COMMENT ON COLUMN memberships.membership_plan_id IS 'Reference to the membership plan (membership_types.id)';
COMMENT ON COLUMN memberships.monthly_rate IS 'Monthly cost for this membership/add-on';

-- Step 8: Verification
DO $$
BEGIN
    RAISE NOTICE '=== MIGRATION COMPLETED ===';
    RAISE NOTICE 'Added plan_type column to memberships table';
    RAISE NOTICE 'Added missing columns for unified structure';
    RAISE NOTICE 'Created indexes for performance';
    RAISE NOTICE 'Created compatibility view: membership_addons_view';
    RAISE NOTICE 'Created helper functions for querying';
    RAISE NOTICE '';
    RAISE NOTICE 'The memberships table is now ready for unified usage!';
    RAISE NOTICE 'Use plan_type to distinguish between:';
    RAISE NOTICE '  - Membership: Primary gym memberships';
    RAISE NOTICE '  - Add-On: Additional services';
    RAISE NOTICE '  - Staff: Employee memberships';
    RAISE NOTICE '  - Guest: Temporary access';
END $$;

COMMIT;
