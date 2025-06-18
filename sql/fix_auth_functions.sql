-- ============================================================================
-- FIX AUTH FUNCTIONS - Target the Schema Error
-- ============================================================================
-- This script fixes the specific auth functions that cause schema errors

-- Step 1: Ensure auth functions exist and work properly
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.sub', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  )::uuid
$$;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS TEXT
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.role', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role')
  )::text
$$;

-- Step 2: Grant permissions on auth functions
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.role() TO anon, authenticated, service_role;

-- Step 3: Ensure auth schema permissions
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT SELECT ON auth.users TO anon, authenticated, service_role;
GRANT SELECT ON auth.identities TO anon, authenticated, service_role;

-- Step 4: Fix any potential auth.users table issues
-- Update admin user to ensure all required fields are properly set
UPDATE auth.users 
SET 
    role = 'authenticated',
    aud = 'authenticated',
    instance_id = COALESCE(instance_id, '00000000-0000-0000-0000-000000000000'),
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    raw_app_meta_data = COALESCE(raw_app_meta_data, '{"provider": "email", "providers": ["email"]}'),
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}')
WHERE email = 'admin@momentum.com';

-- Step 5: Ensure identity record is properly formatted
UPDATE auth.identities 
SET identity_data = jsonb_build_object(
    'sub', user_id::text,
    'email', (SELECT email FROM auth.users WHERE id = user_id),
    'email_verified', true,
    'phone_verified', false
)
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'admin@momentum.com');

-- Step 6: Create a simple auth test function
CREATE OR REPLACE FUNCTION test_auth_login(test_email TEXT)
RETURNS TABLE(
    status TEXT,
    user_id UUID,
    email TEXT,
    role TEXT,
    has_password BOOLEAN,
    email_confirmed BOOLEAN,
    profile_role TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'SUCCESS'::TEXT as status,
        u.id as user_id,
        u.email,
        u.role,
        u.encrypted_password IS NOT NULL as has_password,
        u.email_confirmed_at IS NOT NULL as email_confirmed,
        p.role as profile_role
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE u.email = test_email;
    
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            'NOT_FOUND'::TEXT as status,
            NULL::UUID as user_id,
            test_email as email,
            NULL::TEXT as role,
            FALSE as has_password,
            FALSE as email_confirmed,
            NULL::TEXT as profile_role;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION test_auth_login(TEXT) TO anon, authenticated, service_role;

-- Step 7: Test the auth login simulation
SELECT * FROM test_auth_login('admin@momentum.com');

-- Step 8: Create a minimal RLS policy that should work
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Allow all operations for anon users" ON public.profiles;

-- Create very simple policies
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE USING (true);

-- Step 9: Verify auth system integrity
DO $$
DECLARE
    auth_test_result RECORD;
    error_found BOOLEAN := FALSE;
BEGIN
    -- Test 1: Basic auth function access
    BEGIN
        PERFORM auth.uid();
        PERFORM auth.role();
        RAISE NOTICE 'SUCCESS: Auth functions accessible';
    EXCEPTION WHEN OTHERS THEN
        error_found := TRUE;
        RAISE NOTICE 'ERROR: Auth functions failed: %', SQLERRM;
    END;
    
    -- Test 2: Auth user query
    BEGIN
        SELECT id, email, role INTO auth_test_result
        FROM auth.users 
        WHERE email = 'admin@momentum.com';
        
        IF FOUND THEN
            RAISE NOTICE 'SUCCESS: Can query auth.users for admin';
        ELSE
            error_found := TRUE;
            RAISE NOTICE 'ERROR: Admin user not found in auth.users';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        error_found := TRUE;
        RAISE NOTICE 'ERROR: Cannot query auth.users: %', SQLERRM;
    END;
    
    -- Test 3: Profile query
    BEGIN
        SELECT id, email, role INTO auth_test_result
        FROM public.profiles 
        WHERE email = 'admin@momentum.com';
        
        IF FOUND THEN
            RAISE NOTICE 'SUCCESS: Can query profiles for admin';
        ELSE
            error_found := TRUE;
            RAISE NOTICE 'ERROR: Admin profile not found';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        error_found := TRUE;
        RAISE NOTICE 'ERROR: Cannot query profiles: %', SQLERRM;
    END;
    
    -- Test 4: Join query (what Supabase does)
    BEGIN
        SELECT u.id, u.email, u.role, p.role as profile_role INTO auth_test_result
        FROM auth.users u
        LEFT JOIN public.profiles p ON u.id = p.id
        WHERE u.email = 'admin@momentum.com';
        
        IF FOUND THEN
            RAISE NOTICE 'SUCCESS: Can perform auth join query';
            RAISE NOTICE 'RESULT: User ID %, Email %, Auth Role %, Profile Role %', 
                         auth_test_result.id, auth_test_result.email, auth_test_result.role, auth_test_result.profile_role;
        ELSE
            error_found := TRUE;
            RAISE NOTICE 'ERROR: Join query returned no results';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        error_found := TRUE;
        RAISE NOTICE 'ERROR: Join query failed: %', SQLERRM;
    END;
    
    IF NOT error_found THEN
        RAISE NOTICE 'OVERALL SUCCESS: All auth system tests passed';
    ELSE
        RAISE NOTICE 'OVERALL ERROR: Some auth system tests failed';
    END IF;
END $$;

-- Step 10: Final verification
SELECT 
    'FINAL AUTH CHECK' as check_type,
    u.id,
    u.email,
    u.role as auth_role,
    u.aud,
    u.encrypted_password IS NOT NULL as has_password,
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    p.role as profile_role,
    i.provider as identity_provider
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN auth.identities i ON u.id = i.user_id
WHERE u.email = 'admin@momentum.com';
