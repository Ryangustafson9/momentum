-- ============================================================================
-- RESET ADMIN USER - Nuclear Option
-- ============================================================================
-- This completely removes and recreates the admin user

-- Step 1: Remove existing admin user completely
DELETE FROM auth.identities 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'admin@momentum.com'
);

DELETE FROM public.profiles 
WHERE email = 'admin@momentum.com';

DELETE FROM auth.users 
WHERE email = 'admin@momentum.com';

-- Step 2: Create fresh admin user
DO $create_fresh_admin$
DECLARE
    new_admin_id UUID;
    admin_email TEXT := 'admin@momentum.com';
    admin_password TEXT := 'SecureAdminPassword123!';
BEGIN
    -- Generate new UUID
    new_admin_id := gen_random_uuid();
    
    -- Create auth user with minimal required fields
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
        role,
        aud
    ) VALUES (
        new_admin_id,
        '00000000-0000-0000-0000-000000000000',
        admin_email,
        crypt(admin_password, gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"first_name": "System", "last_name": "Administrator"}',
        'authenticated',
        'authenticated'
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
        new_admin_id,
        jsonb_build_object(
            'sub', new_admin_id::text,
            'email', admin_email,
            'email_verified', true
        ),
        'email',
        new_admin_id::text,
        NOW(),
        NOW(),
        NOW()
    );
    
    -- Create profile with direct insert (bypass any functions)
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        name,
        role,
        created_at
    ) VALUES (
        new_admin_id,
        admin_email,
        'System',
        'Administrator',
        'System Administrator',
        'admin',
        NOW()
    );
    
    RAISE NOTICE 'SUCCESS: Fresh admin user created with ID: %', new_admin_id;
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'Password: %', admin_password;
    
END $create_fresh_admin$;

-- Step 3: Verify the new admin user
SELECT 
    'NEW ADMIN VERIFICATION' as status,
    u.id as user_id,
    u.email as auth_email,
    u.role as auth_role,
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    p.email as profile_email,
    p.role as profile_role,
    p.first_name,
    p.last_name,
    (i.id IS NOT NULL) as has_identity
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN auth.identities i ON u.id = i.user_id
WHERE u.email = 'admin@momentum.com';
