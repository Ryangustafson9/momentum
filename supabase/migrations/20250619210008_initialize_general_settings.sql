-- Initialize general_settings table with default values
-- This fixes the Supabase 406 error by ensuring at least one row exists

INSERT INTO general_settings (
    id,
    gym_name,
    admin_email,
    timezone,
    updated_at,
    stripe_publishable_key,
    stripe_secret_key
) VALUES (
    1, -- Primary key
    'Momentum Fitness', -- Default gym name
    'info@momentumfitness.com', -- Default admin email
    'America/New_York', -- timezone
    now(), -- updated_at
    '', -- stripe_publishable_key (empty for now)
    '' -- stripe_secret_key (empty for now)
)
ON CONFLICT (id) DO UPDATE SET
    gym_name = COALESCE(general_settings.gym_name, 'Momentum Fitness'),
    admin_email = COALESCE(general_settings.admin_email, 'info@momentumfitness.com'),
    timezone = COALESCE(general_settings.timezone, 'America/New_York'),
    updated_at = now();

-- Verify the insertion
SELECT 'general_settings initialized' as status, count(*) as row_count FROM general_settings;