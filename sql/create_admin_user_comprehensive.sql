-- ============================================================================
-- CREATE ADMIN USER - Comprehensive Supabase Script
-- ============================================================================
-- This script creates a complete admin user with auth and profile setup
-- Run this with service_role key or in Supabase SQL Editor

-- ============================================================================
-- CONFIGURATION - MODIFY THESE VALUES
-- ============================================================================

-- Admin user details (CHANGE THESE!)
\set admin_email 'admin@momentum.com'
\set admin_password 'Bu!!et0!!'
\set admin_first_name 'System'
\set admin_last_name 'Administrator'
\set admin_phone '+1-405-413-4938'

-- ============================================================================
-- MAIN SCRIPT
-- ============================================================================

DO $$
DECLARE
    admin_user_id UUID;
    admin_user_email TEXT := 'admin@momentum.com';
    admin_user_password TEXT := 'Bu!!et0!!';
    admin_user_first_name TEXT := 'System';
    admin_user_last_name TEXT := 'Administrator';
    admin_user_phone TEXT := '+1-405-413-4938';
    existing_user_id UUID;
    existing_profile_id UUID;
BEGIN
    -- ========================================================================
    -- STEP 1: Check if admin user already exists
    -- ========================================================================
    
    -- Check auth.users table
    SELECT id INTO existing_user_id 
    FROM auth.users 
    WHERE email = admin_user_email;
    
    -- Check profiles table
    SELECT id INTO existing_profile_id 
    FROM public.profiles 
    WHERE email = admin_user_email;
    
    IF existing_user_id IS NOT NULL THEN
        admin_user_id := existing_user_id;
    END IF;
    
    -- ========================================================================
    -- STEP 2: Create auth user (if doesn't exist)
    -- ========================================================================
    
    IF existing_user_id IS NULL THEN
        -- Generate new UUID for admin user
        admin_user_id := gen_random_uuid();
        
        -- Insert into auth.users table
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            role,
            aud,
            confirmation_token,
            phone_confirmed_at,
            confirmed_at
        ) VALUES (
            admin_user_id,
            '00000000-0000-0000-0000-000000000000',
            admin_user_email,
            crypt(admin_user_password, gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object(
                'first_name', admin_user_first_name,
                'last_name', admin_user_last_name,
                'phone', admin_user_phone
            ),
            false,
            'authenticated',
            'authenticated',
            '',
            NULL,
            NOW()
        );

        -- ====================================================================
        -- STEP 3: Create identity record for email authentication
        -- ====================================================================
        
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            admin_user_id,
            jsonb_build_object(
                'sub', admin_user_id::text,
                'email', admin_user_email,
                'email_verified', true,
                'phone_verified', false
            ),
            'email',
            admin_user_id::text,
            NOW(),
            NOW(),
            NOW()
        );

    END IF;
    
    -- ========================================================================
    -- STEP 4: Create or update profile (if doesn't exist)
    -- ========================================================================
    
    IF existing_profile_id IS NULL THEN
        -- Use the safe profile creation function if it exists
        BEGIN
            -- Try using the safe creation function first
            PERFORM create_profile_safe(
                admin_user_id,
                admin_user_email,
                'admin',
                admin_user_first_name,
                admin_user_last_name,
                admin_user_phone
            );

        EXCEPTION WHEN OTHERS THEN
            -- Fallback to direct insertion if function doesn't exist
            
            INSERT INTO public.profiles (
                id,
                email,
                first_name,
                last_name,
                name,
                phone,
                role,
                created_at,
                updated_at
            ) VALUES (
                admin_user_id,
                admin_user_email,
                admin_user_first_name,
                admin_user_last_name,
                admin_user_first_name || ' ' || admin_user_last_name,
                admin_user_phone,
                'admin',
                NOW(),
                NOW()
            );

        END;

    ELSE
        
        UPDATE public.profiles 
        SET 
            role = 'admin',
            first_name = COALESCE(first_name, admin_user_first_name),
            last_name = COALESCE(last_name, admin_user_last_name),
            name = COALESCE(name, admin_user_first_name || ' ' || admin_user_last_name),
            phone = COALESCE(phone, admin_user_phone),
            updated_at = NOW()
        WHERE id = admin_user_id;

    END IF;
    
    -- ========================================================================
    -- STEP 5: Create admin membership (if membership system exists)
    -- ========================================================================
    
    BEGIN
        -- Check if membership_types table exists and has admin plan
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'membership_types'
        ) THEN
            -- Check for admin membership type
            IF EXISTS (
                SELECT 1 FROM public.membership_types
                WHERE LOWER(name) LIKE '%admin%' OR LOWER(category) = 'staff'
            ) THEN
                
                -- Create membership record if memberships table exists
                IF EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'memberships'
                ) THEN
                    -- Insert admin membership (this might need adjustment based on your schema)
                    INSERT INTO public.memberships (
                        id,
                        user_id,
                        role,
                        status,
                        created_at,
                        updated_at
                    ) VALUES (
                        gen_random_uuid(),
                        admin_user_id,
                        'admin',
                        'active',
                        NOW(),
                        NOW()
                    )
                    ON CONFLICT (user_id) DO UPDATE SET
                        role = 'admin',
                        status = 'active',
                        updated_at = NOW();

                END IF;
            END IF;
        END IF;

    EXCEPTION WHEN OTHERS THEN
        -- Membership creation skipped (tables may not exist)
        NULL;
    END;
    
    -- ========================================================================
    -- STEP 6: Verification
    -- ========================================================================

    -- Verify auth user
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = admin_user_id) THEN
        RAISE EXCEPTION 'FAILED: Auth user not found after creation';
    END IF;

    -- Verify profile
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_user_id AND role = 'admin') THEN
        RAISE EXCEPTION 'FAILED: Admin profile not found or role not set correctly';
    END IF;

    -- Verify identity
    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = admin_user_id) THEN
        RAISE EXCEPTION 'FAILED: Identity record not found';
    END IF;

END $$;

-- ============================================================================
-- OPTIONAL: Display admin user info
-- ============================================================================

SELECT 
    'Admin User Created' as status,
    u.id as user_id,
    u.email,
    p.first_name,
    p.last_name,
    p.role,
    u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'admin@momentum.com';

-- ============================================================================
-- CLEANUP INSTRUCTIONS
-- ============================================================================

/*
IMPORTANT: After running this script:

1. TEST THE LOGIN:
   - Go to your app's login page
   - Use email: admin@momentum.com
   - Use password: SecureAdminPassword123!

2. CHANGE THE PASSWORD:
   - Log in and immediately change the password
   - Use a strong, unique password

3. SECURITY CHECKLIST:
   ✅ Change default password
   ✅ Enable 2FA if available
   ✅ Remove this script from production
   ✅ Store credentials in secure password manager
   ✅ Verify admin permissions work correctly

4. TROUBLESHOOTING:
   - If login fails, check the auth.users table
   - If permissions don't work, check the profiles.role field
   - If app doesn't recognize admin, check your role validation logic

5. TO CREATE ADDITIONAL ADMINS:
   - Modify the email and password variables at the top
   - Run the script again
   - Or use your app's user management interface
*/
