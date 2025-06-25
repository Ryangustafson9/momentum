-- Test script to add some sample custom field values for testing
-- Run this in Supabase SQL Editor after the main setup

-- First, let's check what custom fields we have
SELECT * FROM custom_fields WHERE is_active = true ORDER BY order_index;

-- Let's find a member to add custom field values to
-- (Replace the member_id with an actual ID from your profiles table)
DO $$
DECLARE
    sample_member_id UUID;
    trainer_field_id UUID;
    medical_field_id UUID;
    source_field_id UUID;
    tshirt_field_id UUID;
    goals_field_id UUID;
    consent_field_id UUID;
BEGIN
    -- Get a sample member (you may need to adjust this query)
    SELECT id INTO sample_member_id 
    FROM profiles 
    WHERE role = 'member' 
    LIMIT 1;
    
    IF sample_member_id IS NOT NULL THEN
        -- Get field IDs
        SELECT id INTO trainer_field_id FROM custom_fields WHERE field_key = 'preferred_trainer';
        SELECT id INTO medical_field_id FROM custom_fields WHERE field_key = 'emergency_medical_info';
        SELECT id INTO source_field_id FROM custom_fields WHERE field_key = 'membership_source';
        SELECT id INTO tshirt_field_id FROM custom_fields WHERE field_key = 'tshirt_size';
        SELECT id INTO goals_field_id FROM custom_fields WHERE field_key = 'fitness_goals';
        SELECT id INTO consent_field_id FROM custom_fields WHERE field_key = 'marketing_consent';
        
        -- Insert sample values
        INSERT INTO member_custom_field_values (member_id, custom_field_id, value) VALUES
        (sample_member_id, trainer_field_id, 'John Smith'),
        (sample_member_id, medical_field_id, 'No known allergies. Takes blood pressure medication.'),
        (sample_member_id, source_field_id, 'referral'),
        (sample_member_id, tshirt_field_id, 'l'),
        (sample_member_id, goals_field_id, 'Weight loss and muscle building. Training for a 5K run.'),
        (sample_member_id, consent_field_id, 'true')
        ON CONFLICT (member_id, custom_field_id) DO UPDATE SET 
            value = EXCLUDED.value,
            updated_at = NOW();
            
        RAISE NOTICE 'Sample custom field values added for member: %', sample_member_id;
    ELSE
        RAISE NOTICE 'No member found to add sample data to';
    END IF;
END $$;
