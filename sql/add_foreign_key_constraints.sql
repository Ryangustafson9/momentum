-- Add Missing Foreign Key Constraints
-- This script adds critical foreign key constraints to ensure data integrity

-- ============================================================================
-- CRITICAL: Add Foreign Key Constraint for profiles.id -> auth.users.id
-- ============================================================================

-- This is the main missing constraint that allows orphaned profiles
-- profiles.id should always reference a valid auth.users.id

-- Step 1: Check for orphaned profiles before adding constraint
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    -- Count profiles that don't have corresponding auth users
    SELECT COUNT(*) INTO orphaned_count
    FROM public.profiles p
    LEFT JOIN auth.users au ON p.id = au.id
    WHERE au.id IS NULL;
    
    IF orphaned_count > 0 THEN
        RAISE WARNING 'Found % orphaned profiles without corresponding auth users', orphaned_count;
        RAISE WARNING 'These profiles will need to be cleaned up before adding foreign key constraint';
        
        -- Log the orphaned profiles for manual review
        RAISE NOTICE 'Orphaned profiles:';
        FOR rec IN 
            SELECT p.id, p.email, p.role, p.created_at
            FROM public.profiles p
            LEFT JOIN auth.users au ON p.id = au.id
            WHERE au.id IS NULL
            ORDER BY p.created_at DESC
        LOOP
            RAISE NOTICE 'Profile ID: %, Email: %, Role: %, Created: %', 
                         rec.id, rec.email, rec.role, rec.created_at;
        END LOOP;
    ELSE
        RAISE NOTICE 'No orphaned profiles found - safe to add foreign key constraint';
    END IF;
END $$;

-- Step 2: Clean up orphaned profiles (if any exist)
-- This removes profiles that don't have corresponding auth users
DELETE FROM public.profiles 
WHERE id NOT IN (
    SELECT id FROM auth.users
);

-- Step 3: Add the foreign key constraint
-- This ensures profiles.id always references a valid auth.users.id
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Validate the constraint
ALTER TABLE public.profiles 
VALIDATE CONSTRAINT profiles_id_fkey;

-- ============================================================================
-- ADDITIONAL VALIDATION CONSTRAINTS
-- ============================================================================

-- Add check constraint to ensure email is not null and properly formatted
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_email_not_null 
CHECK (email IS NOT NULL AND email != '');

-- Add check constraint to ensure role is valid
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_valid 
CHECK (role IN ('admin', 'staff', 'instructor', 'member', 'nonmember', 'non-member'));

-- ============================================================================
-- CREATE VALIDATION FUNCTIONS
-- ============================================================================

-- Function to validate profile creation
CREATE OR REPLACE FUNCTION validate_profile_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure the auth user exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.id) THEN
        RAISE EXCEPTION 'Cannot create profile: auth user with id % does not exist', NEW.id;
    END IF;
    
    -- Ensure email matches auth user email (if available)
    IF EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = NEW.id 
        AND email IS NOT NULL 
        AND email != NEW.email
    ) THEN
        RAISE WARNING 'Profile email % does not match auth user email for user %', NEW.email, NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate profile creation
DROP TRIGGER IF EXISTS validate_profile_creation_trigger ON public.profiles;
CREATE TRIGGER validate_profile_creation_trigger
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION validate_profile_creation();

-- ============================================================================
-- CREATE HELPER FUNCTIONS FOR SAFE PROFILE OPERATIONS
-- ============================================================================

-- Function to safely create a profile with auth user validation
CREATE OR REPLACE FUNCTION create_profile_safe(
    p_user_id UUID,
    p_email TEXT,
    p_role TEXT DEFAULT 'nonmember',
    p_first_name TEXT DEFAULT '',
    p_last_name TEXT DEFAULT '',
    p_phone TEXT DEFAULT NULL
)
RETURNS public.profiles AS $$
DECLARE
    result_profile public.profiles;
    auth_user_email TEXT;
BEGIN
    -- Validate that auth user exists
    SELECT email INTO auth_user_email 
    FROM auth.users 
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cannot create profile: auth user with id % does not exist', p_user_id;
    END IF;
    
    -- Use auth user email if provided email doesn't match
    IF auth_user_email IS NOT NULL AND auth_user_email != p_email THEN
        RAISE NOTICE 'Using auth user email % instead of provided email %', auth_user_email, p_email;
        p_email := auth_user_email;
    END IF;
    
    -- Create the profile
    INSERT INTO public.profiles (
        id,
        email,
        role,
        first_name,
        last_name,
        name,
        phone,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_email,
        p_role,
        p_first_name,
        p_last_name,
        TRIM(CONCAT(p_first_name, ' ', p_last_name)),
        p_phone,
        NOW(),
        NOW()
    )
    RETURNING * INTO result_profile;
    
    RETURN result_profile;
    
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Profile with id % or email % already exists', p_user_id, p_email;
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'Cannot create profile: auth user with id % does not exist', p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_profile_safe(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Query to check constraint was added successfully
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    confrelid::regclass as referenced_table
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass 
AND conname = 'profiles_id_fkey';

-- Query to verify no orphaned profiles exist
SELECT 
    'Orphaned Profiles Check' as check_type,
    COUNT(*) as orphaned_count
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL;

-- Query to verify constraint is working
SELECT 
    'Foreign Key Constraint Status' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conrelid = 'public.profiles'::regclass 
            AND conname = 'profiles_id_fkey'
        ) THEN 'ACTIVE'
        ELSE 'MISSING'
    END as status;

RAISE NOTICE 'Foreign key constraints have been successfully added to profiles table';
RAISE NOTICE 'All profile inserts will now validate against auth.users table';
RAISE NOTICE 'Use create_profile_safe() function for safe profile creation';
