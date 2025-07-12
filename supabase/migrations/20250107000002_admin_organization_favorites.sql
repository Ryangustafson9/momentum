-- Admin Organization Favorites System
-- Allows Global Admin users to mark organizations as favorites for quick access
-- Created: January 7, 2025

-- ==================== ADMIN ORGANIZATION FAVORITES TABLE ====================

-- Create admin_organization_favorites table
CREATE TABLE IF NOT EXISTS admin_organization_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User and Organization
  admin_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one favorite per admin per organization
  UNIQUE(admin_user_id, organization_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_org_favorites_admin_user 
ON admin_organization_favorites(admin_user_id);

CREATE INDEX IF NOT EXISTS idx_admin_org_favorites_organization 
ON admin_organization_favorites(organization_id);

CREATE INDEX IF NOT EXISTS idx_admin_org_favorites_composite 
ON admin_organization_favorites(admin_user_id, organization_id);

-- Add comments
COMMENT ON TABLE admin_organization_favorites IS 'Tracks which organizations each admin user has marked as favorites';
COMMENT ON COLUMN admin_organization_favorites.admin_user_id IS 'The admin user who favorited the organization';
COMMENT ON COLUMN admin_organization_favorites.organization_id IS 'The organization that was favorited';

-- ==================== FUNCTIONS ====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_org_favorites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE TRIGGER trigger_admin_org_favorites_updated_at
    BEFORE UPDATE ON admin_organization_favorites
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_org_favorites_updated_at();

-- Function to check if an organization is favorited by a user
CREATE OR REPLACE FUNCTION is_organization_favorited(user_id UUID, org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_organization_favorites 
        WHERE admin_user_id = user_id 
        AND organization_id = org_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle favorite status
CREATE OR REPLACE FUNCTION toggle_organization_favorite(user_id UUID, org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_favorited BOOLEAN;
BEGIN
    -- Check if already favorited
    SELECT is_organization_favorited(user_id, org_id) INTO is_favorited;
    
    IF is_favorited THEN
        -- Remove from favorites
        DELETE FROM admin_organization_favorites 
        WHERE admin_user_id = user_id AND organization_id = org_id;
        RETURN FALSE;
    ELSE
        -- Add to favorites
        INSERT INTO admin_organization_favorites (admin_user_id, organization_id)
        VALUES (user_id, org_id)
        ON CONFLICT (admin_user_id, organization_id) DO NOTHING;
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS
ALTER TABLE admin_organization_favorites ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own favorites
CREATE POLICY "Users can manage their own organization favorites" ON admin_organization_favorites
    FOR ALL USING (admin_user_id = auth.uid());

-- Policy: Global admins can view all favorites (for admin purposes)
CREATE POLICY "Global admins can view all organization favorites" ON admin_organization_favorites
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND is_global_admin = true
        )
    );

-- ==================== ENHANCED ORGANIZATIONS VIEW ====================

-- Create a view that includes favorite status for the current user
CREATE OR REPLACE VIEW organizations_with_favorites AS
SELECT 
    o.*,
    COALESCE(f.admin_user_id IS NOT NULL, false) as is_favorited,
    f.created_at as favorited_at
FROM organizations o
LEFT JOIN admin_organization_favorites f ON (
    o.id = f.organization_id 
    AND f.admin_user_id = auth.uid()
)
ORDER BY 
    COALESCE(f.admin_user_id IS NOT NULL, false) DESC, -- Favorites first
    o.name ASC;

-- Grant access to the view
GRANT SELECT ON organizations_with_favorites TO authenticated;

-- ==================== HELPER FUNCTIONS FOR API ====================

-- Function to get favorited organizations for a user
CREATE OR REPLACE FUNCTION get_favorited_organizations(user_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    slug VARCHAR,
    description TEXT,
    status VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    favorited_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.name,
        o.slug,
        o.description,
        o.status,
        o.created_at,
        o.updated_at,
        f.created_at as favorited_at
    FROM organizations o
    INNER JOIN admin_organization_favorites f ON o.id = f.organization_id
    WHERE f.admin_user_id = user_id
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search organizations with favorite status
CREATE OR REPLACE FUNCTION search_organizations_with_favorites(
    user_id UUID, 
    search_term TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    slug VARCHAR,
    description TEXT,
    status VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    is_favorited BOOLEAN,
    favorited_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.name,
        o.slug,
        o.description,
        o.status,
        o.created_at,
        o.updated_at,
        COALESCE(f.admin_user_id IS NOT NULL, false) as is_favorited,
        f.created_at as favorited_at
    FROM organizations o
    LEFT JOIN admin_organization_favorites f ON (
        o.id = f.organization_id 
        AND f.admin_user_id = user_id
    )
    WHERE (
        search_term IS NULL 
        OR o.name ILIKE '%' || search_term || '%'
        OR o.slug ILIKE '%' || search_term || '%'
        OR o.description ILIKE '%' || search_term || '%'
    )
    ORDER BY 
        COALESCE(f.admin_user_id IS NOT NULL, false) DESC, -- Favorites first
        o.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== COMMENTS AND DOCUMENTATION ====================

COMMENT ON FUNCTION is_organization_favorited(UUID, UUID) IS 'Returns true if the specified organization is favorited by the specified user';
COMMENT ON FUNCTION toggle_organization_favorite(UUID, UUID) IS 'Toggles favorite status for an organization. Returns true if now favorited, false if unfavorited';
COMMENT ON FUNCTION get_favorited_organizations(UUID) IS 'Returns all organizations favorited by the specified user';
COMMENT ON FUNCTION search_organizations_with_favorites(UUID, TEXT) IS 'Searches organizations with favorite status for the specified user';
COMMENT ON VIEW organizations_with_favorites IS 'Organizations view with favorite status for the current authenticated user';
