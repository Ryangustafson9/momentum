-- Enhanced Family Management System
-- Supports both shared memberships and sponsored memberships
-- Created: June 25, 2025

-- ==================== FAMILY MEMBERS TABLE ====================
-- Enhanced family relationships with membership type differentiation
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core Relationship
  primary_member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Relationship Details
  relationship VARCHAR(50) NOT NULL, -- 'spouse', 'child', 'parent', 'sibling', 'other'
  relationship_type VARCHAR(20) NOT NULL DEFAULT 'shared' 
    CHECK (relationship_type IN ('shared', 'sponsored')),
  
  -- Shared Membership: Family members share the same membership plan
  -- Sponsored Membership: Primary member pays for family member's separate membership
  
  -- Membership Configuration
  shared_membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
  sponsored_membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
  
  -- Financial Responsibility
  is_financially_responsible BOOLEAN DEFAULT false, -- Can this family member make billing decisions?
  billing_responsibility VARCHAR(20) DEFAULT 'primary' 
    CHECK (billing_responsibility IN ('primary', 'shared', 'independent')),
  
  -- Access & Permissions
  can_check_in_others BOOLEAN DEFAULT false, -- Can check in other family members
  can_view_billing BOOLEAN DEFAULT false, -- Can view family billing information
  can_manage_family BOOLEAN DEFAULT false, -- Can add/remove family members
  
  -- Status & Metadata
  status VARCHAR(20) DEFAULT 'active' 
    CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
  notes TEXT,
  
  -- Emergency Contact Priority
  emergency_contact_priority INTEGER DEFAULT 0, -- 0 = not emergency contact, 1+ = priority order
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  
  -- Constraints
  UNIQUE(primary_member_id, family_member_id),
  CHECK (primary_member_id != family_member_id),
  CHECK (
    (relationship_type = 'shared' AND shared_membership_id IS NOT NULL AND sponsored_membership_id IS NULL) OR
    (relationship_type = 'sponsored' AND sponsored_membership_id IS NOT NULL AND shared_membership_id IS NULL)
  )
);

-- ==================== FAMILY GROUPS TABLE ====================
-- Optional: Group family members for easier management
CREATE TABLE IF NOT EXISTS family_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Group Details
  group_name VARCHAR(255) NOT NULL,
  primary_member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Group Settings
  shared_billing BOOLEAN DEFAULT true,
  group_discount_percentage DECIMAL(5,2) DEFAULT 0.00,
  max_members INTEGER DEFAULT 10,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== FAMILY GROUP MEMBERS TABLE ====================
-- Link family members to groups (optional advanced feature)
CREATE TABLE IF NOT EXISTS family_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  family_group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  
  -- Member Role in Group
  role VARCHAR(20) DEFAULT 'member' 
    CHECK (role IN ('primary', 'secondary', 'member', 'dependent')),
  
  -- Timestamps
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(family_group_id, family_member_id)
);

-- ==================== INDEXES FOR PERFORMANCE ====================

-- Family members indexes
CREATE INDEX IF NOT EXISTS idx_family_members_primary ON family_members(primary_member_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family_member ON family_members(family_member_id);
CREATE INDEX IF NOT EXISTS idx_family_members_relationship_type ON family_members(relationship_type);
CREATE INDEX IF NOT EXISTS idx_family_members_status ON family_members(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_family_members_shared_membership ON family_members(shared_membership_id) WHERE shared_membership_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_family_members_sponsored_membership ON family_members(sponsored_membership_id) WHERE sponsored_membership_id IS NOT NULL;

-- Family groups indexes
CREATE INDEX IF NOT EXISTS idx_family_groups_primary_member ON family_groups(primary_member_id);
CREATE INDEX IF NOT EXISTS idx_family_groups_active ON family_groups(is_active) WHERE is_active = true;

-- Family group members indexes
CREATE INDEX IF NOT EXISTS idx_family_group_members_group ON family_group_members(family_group_id);
CREATE INDEX IF NOT EXISTS idx_family_group_members_member ON family_group_members(family_member_id);

-- ==================== TRIGGERS ====================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_family_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_family_members_updated_at
    BEFORE UPDATE ON family_members
    FOR EACH ROW
    EXECUTE FUNCTION update_family_updated_at();

CREATE TRIGGER trigger_family_groups_updated_at
    BEFORE UPDATE ON family_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_family_updated_at();

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_group_members ENABLE ROW LEVEL SECURITY;

-- Family members policies
CREATE POLICY "Users can view their own family relationships" ON family_members
    FOR SELECT USING (
        primary_member_id = auth.uid() OR 
        family_member_id = auth.uid()
    );

CREATE POLICY "Primary members can manage their family" ON family_members
    FOR ALL USING (primary_member_id = auth.uid());

CREATE POLICY "Staff can view all family relationships" ON family_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'staff')
        )
    );

CREATE POLICY "Staff can manage all family relationships" ON family_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'staff')
        )
    );

-- Family groups policies
CREATE POLICY "Users can view their family groups" ON family_groups
    FOR SELECT USING (primary_member_id = auth.uid());

CREATE POLICY "Primary members can manage their family groups" ON family_groups
    FOR ALL USING (primary_member_id = auth.uid());

-- ==================== GRANTS ====================

GRANT ALL ON family_members TO authenticated;
GRANT ALL ON family_groups TO authenticated;
GRANT ALL ON family_group_members TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ==================== COMMENTS ====================

COMMENT ON TABLE family_members IS 'Enhanced family relationships supporting both shared and sponsored memberships';
COMMENT ON COLUMN family_members.relationship_type IS 'shared: family members share same membership, sponsored: primary pays for separate memberships';
COMMENT ON COLUMN family_members.shared_membership_id IS 'Reference to shared membership (for relationship_type = shared)';
COMMENT ON COLUMN family_members.sponsored_membership_id IS 'Reference to sponsored individual membership (for relationship_type = sponsored)';
COMMENT ON COLUMN family_members.billing_responsibility IS 'Who is responsible for billing decisions';
COMMENT ON COLUMN family_members.emergency_contact_priority IS '0 = not emergency contact, 1+ = priority order';

COMMENT ON TABLE family_groups IS 'Optional grouping of family members for advanced management';
COMMENT ON TABLE family_group_members IS 'Links family members to family groups';
