-- ============================================================================
-- CREATE ADMIN USER - Simple Working Script
-- ============================================================================
-- MODIFY THE VALUES BELOW BEFORE RUNNING:

DO $admin_creation$
DECLARE
    admin_user_id UUID;
    admin_user_email TEXT := 'admin@momentum.com';
    admin_user_password TEXT := 'Bu!!et0!';
    admin_user_first_name TEXT := 'System';
    admin_user_last_name TEXT := 'Administrator';
    admin_user_phone TEXT := '+1-405-413-4938';
    existing_user_id UUID;
    existing_profile_id UUID;
BEGIN
    -- Check if admin user already exists
    SELECT id INTO existing_user_id 
    FROM auth.users 
    WHERE email = admin_user_email;
    
    SELECT id INTO existing_profile_id 
    FROM public.profiles 
    WHERE email = admin_user_email;
    
    IF existing_user_id IS NOT NULL THEN
        admin_user_id := existing_user_id;
    END IF;
    
    -- Create auth user if doesn't exist
    IF existing_user_id IS NULL THEN
        admin_user_id := gen_random_uuid();
        
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
            phone_confirmed_at
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
            NULL
        );
        
        -- Create identity record
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
    
    -- Create or update profile
    IF existing_profile_id IS NULL THEN
        -- Try using safe creation function first
        BEGIN
            PERFORM create_profile_safe(
                admin_user_id,
                admin_user_email,
                'admin',
                admin_user_first_name,
                admin_user_last_name,
                admin_user_phone
            );
        EXCEPTION WHEN OTHERS THEN
            -- Fallback to direct insertion
            INSERT INTO public.profiles (
                id,
                email,
                first_name,
                last_name,
                name,
                phone,
                role,
                created_at
            ) VALUES (
                admin_user_id,
                admin_user_email,
                admin_user_first_name,
                admin_user_last_name,
                admin_user_first_name || ' ' || admin_user_last_name,
                admin_user_phone,
                'admin',
                NOW()
            );
        END;
    ELSE
        -- Update existing profile to admin
        UPDATE public.profiles
        SET
            role = 'admin',
            first_name = COALESCE(first_name, admin_user_first_name),
            last_name = COALESCE(last_name, admin_user_last_name),
            name = COALESCE(name, admin_user_first_name || ' ' || admin_user_last_name),
            phone = COALESCE(phone, admin_user_phone)
        WHERE id = admin_user_id;
    END IF;
    
    -- Verify creation
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = admin_user_id) THEN
        RAISE EXCEPTION 'FAILED: Auth user not found after creation';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_user_id AND role = 'admin') THEN
        RAISE EXCEPTION 'FAILED: Admin profile not found or role not set correctly';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = admin_user_id) THEN
        RAISE EXCEPTION 'FAILED: Identity record not found';
    END IF;

END $admin_creation$;

-- Display the created admin user
SELECT 
    'Admin User Created Successfully' as status,
    u.id as user_id,
    u.email,
    p.first_name,
    p.last_name,
    p.role,
    u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'admin@momentum.com';

/*
USAGE INSTRUCTIONS:

1. MODIFY THE CREDENTIALS:
   - Change admin_user_email to your desired admin email
   - Change admin_user_password to a secure password
   - Update name and phone as needed

2. RUN THE SCRIPT:
   - Copy and paste into Supabase SQL Editor
   - Click "Run"

3. TEST LOGIN:
   - Email: admin@momentum.com
   - Password: SecureAdminPassword123!

4. SECURITY:
   - Change the password after first login
   - Remove this script from production
   - Store credentials securely

TROUBLESHOOTING:
- If you get permission errors, make sure you're using service_role key
- If profile creation fails, check that the profiles table exists
- If login fails, verify the user was created in both auth.users and profiles tables
*/
