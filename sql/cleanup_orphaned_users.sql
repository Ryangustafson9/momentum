-- Database function to clean up orphaned auth users
-- This should be run periodically by an admin or scheduled job

-- Function to identify orphaned auth users (users without profiles)
CREATE OR REPLACE FUNCTION get_orphaned_auth_users()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    created_at TIMESTAMPTZ,
    hours_since_creation NUMERIC
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        au.id as user_id,
        au.email,
        au.created_at,
        EXTRACT(EPOCH FROM (NOW() - au.created_at)) / 3600 as hours_since_creation
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
    AND au.created_at < NOW() - INTERVAL '1 hour'  -- Only consider users created more than 1 hour ago
    ORDER BY au.created_at DESC;
$$;

-- Function to clean up orphaned users (admin only)
-- This requires service role permissions and should be called from server-side
CREATE OR REPLACE FUNCTION cleanup_orphaned_auth_users(
    max_age_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
    cleaned_user_id UUID,
    email TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    orphaned_user RECORD;
    cleanup_count INTEGER := 0;
BEGIN
    -- Log the cleanup operation
    RAISE NOTICE 'Starting cleanup of orphaned auth users older than % hours', max_age_hours;
    
    -- Find and clean up orphaned users
    FOR orphaned_user IN 
        SELECT au.id, au.email, au.created_at
        FROM auth.users au
        LEFT JOIN public.profiles p ON au.id = p.id
        WHERE p.id IS NULL
        AND au.created_at < NOW() - (max_age_hours || ' hours')::INTERVAL
        ORDER BY au.created_at
    LOOP
        -- Return the user info before deletion
        cleaned_user_id := orphaned_user.id;
        email := orphaned_user.email;
        created_at := orphaned_user.created_at;
        
        -- Note: Actual deletion would require service role permissions
        -- This function documents what should be cleaned up
        RAISE NOTICE 'Would clean up orphaned user: % (%) created at %', 
                     orphaned_user.email, orphaned_user.id, orphaned_user.created_at;
        
        cleanup_count := cleanup_count + 1;
        
        RETURN NEXT;
    END LOOP;
    
    RAISE NOTICE 'Cleanup operation completed. Found % orphaned users', cleanup_count;
    RETURN;
END;
$$;

-- Grant execute permissions to service role
-- GRANT EXECUTE ON FUNCTION get_orphaned_auth_users() TO service_role;
-- GRANT EXECUTE ON FUNCTION cleanup_orphaned_auth_users(INTEGER) TO service_role;

-- Example usage (for admin reference):
-- SELECT * FROM get_orphaned_auth_users();
-- SELECT * FROM cleanup_orphaned_auth_users(24); -- Clean up users older than 24 hours

-- Manual cleanup query (requires service role):
/*
-- To manually clean up orphaned users, run this with service role permissions:
DELETE FROM auth.users 
WHERE id IN (
    SELECT au.id
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
    AND au.created_at < NOW() - INTERVAL '24 hours'
);
*/
