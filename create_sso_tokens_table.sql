-- =====================================================
-- CREATE SSO TOKENS TABLE FOR MOMENTUM ADMIN HQ
-- =====================================================
-- This table stores SSO token nonces to prevent replay attacks
-- and tracks SSO usage for audit purposes
-- =====================================================

BEGIN;

-- Create SSO tokens table
CREATE TABLE IF NOT EXISTS sso_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nonce UUID NOT NULL UNIQUE,
    admin_user_id UUID NOT NULL,
    target_organization_id UUID NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    
    -- Foreign key constraints
    CONSTRAINT fk_sso_tokens_admin_user 
        FOREIGN KEY (admin_user_id) 
        REFERENCES profiles(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_sso_tokens_organization 
        FOREIGN KEY (target_organization_id) 
        REFERENCES organizations(id) 
        ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sso_tokens_nonce ON sso_tokens(nonce);
CREATE INDEX IF NOT EXISTS idx_sso_tokens_admin_user ON sso_tokens(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_sso_tokens_expires_at ON sso_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_sso_tokens_used ON sso_tokens(used);

-- Enable RLS
ALTER TABLE sso_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Global admins can manage all SSO tokens
CREATE POLICY "Global admins can manage SSO tokens" ON sso_tokens
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_global_admin = true
        )
    );

-- Users can only see their own SSO tokens
CREATE POLICY "Users can see own SSO tokens" ON sso_tokens
    FOR SELECT USING (admin_user_id = auth.uid());

-- Add comments for documentation
COMMENT ON TABLE sso_tokens IS 'Stores SSO token nonces and usage tracking for Momentum Admin HQ';
COMMENT ON COLUMN sso_tokens.nonce IS 'Unique nonce to prevent token replay attacks';
COMMENT ON COLUMN sso_tokens.admin_user_id IS 'ID of the global admin who generated the token';
COMMENT ON COLUMN sso_tokens.target_organization_id IS 'ID of the organization being accessed';
COMMENT ON COLUMN sso_tokens.used IS 'Whether the token has been used (single-use tokens)';
COMMENT ON COLUMN sso_tokens.expires_at IS 'When the token expires (60 seconds from creation)';
COMMENT ON COLUMN sso_tokens.used_at IS 'When the token was actually used';

COMMIT;

-- Log the table creation
DO $$
BEGIN
    RAISE NOTICE 'SSO tokens table created successfully';
    RAISE NOTICE 'Table includes RLS policies for security';
    RAISE NOTICE 'Indexes created for optimal performance';
END $$;
