-- Initialize general_settings table with default values
-- This fixes the Supabase 406 error by ensuring at least one row exists

INSERT INTO general_settings (
    id,
    gym_name,
    gym_address,
    gym_phone,
    gym_email,
    gym_website,
    primary_color,
    secondary_color,
    logo_url,
    require_first_name,
    require_last_name,
    require_email,
    require_phone,
    require_dob,
    require_address,
    auto_assign_member_id,
    member_id_prefix,
    member_id_start_number,
    default_membership_length_months,
    allow_family_memberships,
    max_family_members,
    send_welcome_email,
    welcome_email_template,
    require_waivers,
    waiver_template,
    business_hours,
    timezone,
    currency,
    tax_rate,
    payment_processing_enabled,
    billing_cycle_day,
    late_fee_amount,
    late_fee_grace_days,
    allow_member_self_service,
    member_portal_enabled,
    class_booking_enabled,
    max_class_bookings_per_member,
    booking_cancellation_hours,
    trainer_booking_enabled,
    equipment_tracking_enabled,
    inventory_management_enabled,
    staff_check_in_enabled,
    member_photo_required,
    access_control_integration,
    notification_preferences,
    backup_frequency,
    data_retention_months,
    maintenance_mode,
    system_announcements,
    created_at,
    updated_at
) VALUES (
    1, -- Primary key
    'Momentum Fitness', -- Default gym name
    '123 Main St, Anytown, ST 12345', -- Default address
    '(555) 123-4567', -- Default phone
    'info@momentumfitness.com', -- Default email
    'https://momentumfitness.com', -- Default website
    '#007bff', -- Primary color (blue)
    '#6c757d', -- Secondary color (gray)
    '/assets/momentum-logo.png', -- Logo URL
    true, -- require_first_name
    true, -- require_last_name
    true, -- require_email
    false, -- require_phone
    false, -- require_dob
    false, -- require_address
    true, -- auto_assign_member_id
    'MOM', -- member_id_prefix
    1000, -- member_id_start_number
    12, -- default_membership_length_months
    true, -- allow_family_memberships
    5, -- max_family_members
    true, -- send_welcome_email
    'Welcome to Momentum Fitness! We are excited to have you as a member.', -- welcome_email_template
    true, -- require_waivers
    'Standard liability waiver template.', -- waiver_template
    'Mon-Fri: 5AM-10PM, Sat-Sun: 6AM-8PM', -- business_hours
    'America/New_York', -- timezone
    'USD', -- currency
    0.08, -- tax_rate (8%)
    true, -- payment_processing_enabled
    1, -- billing_cycle_day (1st of month)
    25.00, -- late_fee_amount
    5, -- late_fee_grace_days
    true, -- allow_member_self_service
    true, -- member_portal_enabled
    true, -- class_booking_enabled
    3, -- max_class_bookings_per_member
    2, -- booking_cancellation_hours
    true, -- trainer_booking_enabled
    false, -- equipment_tracking_enabled
    false, -- inventory_management_enabled
    true, -- staff_check_in_enabled
    false, -- member_photo_required
    'none', -- access_control_integration
    '{"email": true, "sms": false, "push": true}', -- notification_preferences
    'daily', -- backup_frequency
    36, -- data_retention_months
    false, -- maintenance_mode
    '[]', -- system_announcements (empty JSON array)
    now(), -- created_at
    now() -- updated_at
)
ON CONFLICT (id) DO UPDATE SET
    updated_at = now();

-- Verify the insertion
SELECT 'general_settings initialized' as status, count(*) as row_count FROM general_settings;
