-- Organization Creation System for Global Admin II
-- Allows Global Admin II users to create new customer sites with proper setup
-- Created: January 7, 2025

-- ==================== ORGANIZATION CREATION FUNCTIONS ====================

-- Function to validate organization slug
CREATE OR REPLACE FUNCTION validate_organization_slug(slug_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if slug is valid format (lowercase, alphanumeric, hyphens only)
    IF NOT slug_input ~ '^[a-z0-9-]+$' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if slug is not too short or too long
    IF LENGTH(slug_input) < 3 OR LENGTH(slug_input) > 50 THEN
        RETURN FALSE;
    END IF;
    
    -- Check if slug doesn't start or end with hyphen
    IF slug_input LIKE '-%' OR slug_input LIKE '%-' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if slug is not reserved
    IF slug_input IN ('admin', 'api', 'www', 'app', 'dashboard', 'support', 'help', 'docs', 'blog', 'mail', 'email', 'ftp', 'ssh', 'ssl', 'tls') THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate unique organization slug
CREATE OR REPLACE FUNCTION generate_organization_slug(org_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convert name to slug format
    base_slug := LOWER(TRIM(org_name));
    base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9\s-]', '', 'g');
    base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
    base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
    base_slug := TRIM(base_slug, '-');
    
    -- Ensure minimum length
    IF LENGTH(base_slug) < 3 THEN
        base_slug := base_slug || '-gym';
    END IF;
    
    -- Ensure maximum length
    IF LENGTH(base_slug) > 45 THEN
        base_slug := LEFT(base_slug, 45);
        base_slug := TRIM(base_slug, '-');
    END IF;
    
    final_slug := base_slug;
    
    -- Check for uniqueness and add counter if needed
    WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create organization with full setup
CREATE OR REPLACE FUNCTION create_organization_complete(
    p_name VARCHAR(255),
    p_slug VARCHAR(100) DEFAULT NULL,
    p_timezone VARCHAR(50) DEFAULT 'America/New_York',
    p_currency VARCHAR(3) DEFAULT 'USD',
    p_admin_email VARCHAR(255) DEFAULT NULL,
    p_admin_first_name VARCHAR(100) DEFAULT 'Admin',
    p_admin_last_name VARCHAR(100) DEFAULT 'User',
    p_created_by UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    new_org_id UUID;
    new_location_id UUID;
    new_admin_id UUID;
    final_slug VARCHAR(100);
    admin_email VARCHAR(255);
    result JSON;
BEGIN
    -- Validate inputs
    IF p_name IS NULL OR LENGTH(TRIM(p_name)) < 2 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Organization name must be at least 2 characters long'
        );
    END IF;
    
    -- Generate or validate slug
    IF p_slug IS NULL THEN
        final_slug := generate_organization_slug(p_name);
    ELSE
        IF NOT validate_organization_slug(p_slug) THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.'
            );
        END IF;
        
        IF EXISTS (SELECT 1 FROM organizations WHERE slug = p_slug) THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Slug already exists. Please choose a different one.'
            );
        END IF;
        
        final_slug := p_slug;
    END IF;
    
    -- Generate admin email if not provided
    IF p_admin_email IS NULL THEN
        admin_email := 'admin@' || final_slug || '.momentum.pro';
    ELSE
        admin_email := p_admin_email;
    END IF;
    
    -- Create organization
    INSERT INTO organizations (
        id,
        name,
        slug,
        timezone,
        currency,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        p_name,
        final_slug,
        p_timezone,
        p_currency,
        NOW(),
        NOW()
    ) RETURNING id INTO new_org_id;
    
    -- Create default location
    INSERT INTO locations (
        id,
        organization_id,
        name,
        slug,
        display_name,
        timezone,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        new_org_id,
        'Main Location',
        'main',
        p_name || ' - Main Location',
        p_timezone,
        true,
        NOW(),
        NOW()
    ) RETURNING id INTO new_location_id;
    
    -- Create admin profile
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
        new_org_id,
        new_location_id,
        1,
        p_admin_first_name,
        p_admin_last_name,
        admin_email,
        'admin',
        'active',
        false, -- Local admin, not global admin
        NOW(),
        NOW()
    ) RETURNING id INTO new_admin_id;
    
    -- Log the creation in audit logs
    IF p_created_by IS NOT NULL THEN
        INSERT INTO audit_logs (
            user_id,
            action,
            admin_hq_action_type,
            details,
            created_at
        ) VALUES (
            p_created_by,
            'ORGANIZATION_CREATED',
            'ORGANIZATION_MANAGEMENT',
            json_build_object(
                'organization_id', new_org_id,
                'organization_name', p_name,
                'organization_slug', final_slug,
                'admin_email', admin_email,
                'timezone', p_timezone,
                'currency', p_currency
            ),
            NOW()
        );
    END IF;
    
    -- Return success result
    result := json_build_object(
        'success', true,
        'organization', json_build_object(
            'id', new_org_id,
            'name', p_name,
            'slug', final_slug,
            'timezone', p_timezone,
            'currency', p_currency,
            'admin_email', admin_email,
            'location_id', new_location_id,
            'admin_profile_id', new_admin_id
        )
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Return error result
    RETURN json_build_object(
        'success', false,
        'error', 'Failed to create organization: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can create organizations (Global Admin II only)
CREATE OR REPLACE FUNCTION can_create_organizations(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND is_global_admin = true 
        AND global_admin_level = 2
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== RLS POLICIES FOR ORGANIZATION CREATION ====================

-- Policy to allow Global Admin II to create organizations
CREATE POLICY "Global Admin II can create organizations" ON organizations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND is_global_admin = true 
            AND global_admin_level = 2
        )
    );

-- ==================== HELPER VIEWS ====================

-- View for organization creation validation
CREATE OR REPLACE VIEW organization_creation_info AS
SELECT 
    COUNT(*) as total_organizations,
    ARRAY_AGG(slug) as existing_slugs,
    ARRAY_AGG(name) as existing_names
FROM organizations;

-- Grant access to the view
GRANT SELECT ON organization_creation_info TO authenticated;

-- ==================== COMMENTS AND DOCUMENTATION ====================

COMMENT ON FUNCTION validate_organization_slug(TEXT) IS 'Validates organization slug format and checks against reserved words';
COMMENT ON FUNCTION generate_organization_slug(TEXT) IS 'Generates a unique, URL-safe slug from organization name';
COMMENT ON FUNCTION create_organization_complete(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, UUID) IS 'Creates a complete organization setup with default location and admin user';
COMMENT ON FUNCTION can_create_organizations(UUID) IS 'Checks if user has Global Admin II privileges to create organizations';
COMMENT ON VIEW organization_creation_info IS 'Provides information for organization creation validation';
