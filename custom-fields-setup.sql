-- =========================================
-- CUSTOM FIELDS SETUP FOR SUPABASE
-- =========================================
-- Run this script in your Supabase SQL Editor
-- This creates tables for custom member fields functionality

-- 1. Create custom_fields table for field definitions
CREATE TABLE IF NOT EXISTS custom_fields (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    label TEXT NOT NULL,
    field_key TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('text', 'textarea', 'number', 'email', 'phone', 'date', 'select', 'checkbox', 'url')),
    placeholder TEXT,
    description TEXT,
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    options JSONB,
    validation_rules JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 2. Create member_custom_field_values table for storing member values
CREATE TABLE IF NOT EXISTS member_custom_field_values (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    custom_field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    UNIQUE(member_id, custom_field_id)
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_fields_active ON custom_fields(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_custom_fields_order ON custom_fields(order_index) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_member_custom_values_member ON member_custom_field_values(member_id);
CREATE INDEX IF NOT EXISTS idx_member_custom_values_field ON member_custom_field_values(custom_field_id);

-- 4. Create/update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop triggers if they exist, then recreate them
DROP TRIGGER IF EXISTS update_custom_fields_updated_at ON custom_fields;
DROP TRIGGER IF EXISTS update_member_custom_field_values_updated_at ON member_custom_field_values;

CREATE TRIGGER update_custom_fields_updated_at 
    BEFORE UPDATE ON custom_fields 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_custom_field_values_updated_at 
    BEFORE UPDATE ON member_custom_field_values 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Enable RLS
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_custom_field_values ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies (drop existing ones first)
DROP POLICY IF EXISTS "Allow read access to active custom fields" ON custom_fields;
DROP POLICY IF EXISTS "Allow staff to manage custom fields" ON custom_fields;
DROP POLICY IF EXISTS "Allow users to read own custom field values" ON member_custom_field_values;
DROP POLICY IF EXISTS "Allow staff to read all custom field values" ON member_custom_field_values;
DROP POLICY IF EXISTS "Allow staff to manage custom field values" ON member_custom_field_values;
DROP POLICY IF EXISTS "Allow users to update own custom field values" ON member_custom_field_values;

CREATE POLICY "Allow read access to active custom fields" ON custom_fields
    FOR SELECT TO authenticated
    USING (is_active = true);

CREATE POLICY "Allow staff to manage custom fields" ON custom_fields
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'staff', 'manager')
        )
    );

CREATE POLICY "Allow users to read own custom field values" ON member_custom_field_values
    FOR SELECT TO authenticated
    USING (member_id = auth.uid());

CREATE POLICY "Allow staff to read all custom field values" ON member_custom_field_values
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'staff', 'manager')
        )
    );

CREATE POLICY "Allow staff to manage custom field values" ON member_custom_field_values
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'staff', 'manager')
        )
    );

CREATE POLICY "Allow users to update own custom field values" ON member_custom_field_values
    FOR UPDATE TO authenticated
    USING (member_id = auth.uid());

-- 7. Insert sample custom fields (only if they don't exist)
INSERT INTO custom_fields (label, field_key, type, placeholder, description, is_required, order_index, options) 
SELECT * FROM (VALUES
    ('Preferred Trainer', 'preferred_trainer', 'text', 'Enter preferred trainer name', 'Member''s preferred personal trainer', false, 1, null),
    ('Emergency Medical Info', 'emergency_medical_info', 'textarea', 'Enter any medical conditions, allergies, medications', 'Important medical information for emergencies', false, 2, null),
    ('How Did You Hear About Us?', 'membership_source', 'select', null, 'Marketing source tracking', false, 3, '[
        {"value": "referral", "label": "Referral from friend/family"},
        {"value": "social_media", "label": "Social Media"},
        {"value": "google", "label": "Google Search"},
        {"value": "advertisement", "label": "Advertisement"},
        {"value": "walk_in", "label": "Walk-in"},
        {"value": "corporate", "label": "Corporate Partnership"},
        {"value": "other", "label": "Other"}
    ]'::jsonb),
    ('T-Shirt Size', 'tshirt_size', 'select', null, 'For events and promotions', false, 4, '[
        {"value": "xs", "label": "XS"},
        {"value": "s", "label": "S"},
        {"value": "m", "label": "M"},
        {"value": "l", "label": "L"},
        {"value": "xl", "label": "XL"},
        {"value": "xxl", "label": "XXL"}
    ]'::jsonb),
    ('Fitness Goals', 'fitness_goals', 'textarea', 'Describe your fitness goals', 'Member''s fitness objectives', false, 5, null),
    ('Marketing Consent', 'marketing_consent', 'checkbox', null, 'Consent to receive marketing emails/texts', false, 6, null)
) AS v(label, field_key, type, placeholder, description, is_required, order_index, options)
WHERE NOT EXISTS (
    SELECT 1 FROM custom_fields WHERE field_key = v.field_key
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Custom fields tables created successfully!';
    RAISE NOTICE 'You can now use the custom fields feature in your member profiles.';
END $$;
