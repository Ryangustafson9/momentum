-- Custom Fields Migration
-- This migration creates tables for custom member fields functionality

-- Create custom_fields table for field definitions
CREATE TABLE IF NOT EXISTS custom_fields (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    label TEXT NOT NULL,
    field_key TEXT NOT NULL UNIQUE, -- Used as identifier (e.g., 'preferred_trainer', 'emergency_medical_info')
    type TEXT NOT NULL CHECK (type IN ('text', 'textarea', 'number', 'email', 'phone', 'date', 'select', 'checkbox', 'url')),
    placeholder TEXT,
    description TEXT,
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    options JSONB, -- For select fields, stores array of options: [{"value": "option1", "label": "Option 1"}]
    validation_rules JSONB, -- For additional validation rules
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create member_custom_field_values table for storing member values
CREATE TABLE IF NOT EXISTS member_custom_field_values (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    custom_field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
    value TEXT, -- Store all values as text, convert as needed based on field type
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Ensure one value per field per member
    UNIQUE(member_id, custom_field_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_custom_fields_active ON custom_fields(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_custom_fields_order ON custom_fields(order_index) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_member_custom_values_member ON member_custom_field_values(member_id);
CREATE INDEX IF NOT EXISTS idx_member_custom_values_field ON member_custom_field_values(custom_field_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_custom_fields_updated_at 
    BEFORE UPDATE ON custom_fields 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_custom_field_values_updated_at 
    BEFORE UPDATE ON member_custom_field_values 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some example custom fields
INSERT INTO custom_fields (label, field_key, type, placeholder, description, is_required, order_index, options) VALUES
('Preferred Trainer', 'preferred_trainer', 'text', 'Enter preferred trainer name', 'Member''s preferred personal trainer', false, 1, null),
('Emergency Medical Information', 'emergency_medical_info', 'textarea', 'Enter any medical conditions, allergies, or medications', 'Important medical information for emergency situations', false, 2, null),
('Membership Source', 'membership_source', 'select', null, 'How did the member hear about us?', false, 3, '[
    {"value": "referral", "label": "Referral from friend/family"},
    {"value": "social_media", "label": "Social Media"},
    {"value": "google", "label": "Google Search"},
    {"value": "advertisement", "label": "Advertisement"},
    {"value": "walk_in", "label": "Walk-in"},
    {"value": "corporate", "label": "Corporate Partnership"},
    {"value": "other", "label": "Other"}
]'::jsonb),
('T-Shirt Size', 'tshirt_size', 'select', null, 'T-shirt size for events and promotions', false, 4, '[
    {"value": "xs", "label": "XS"},
    {"value": "s", "label": "S"},
    {"value": "m", "label": "M"},
    {"value": "l", "label": "L"},
    {"value": "xl", "label": "XL"},
    {"value": "xxl", "label": "XXL"},
    {"value": "xxxl", "label": "3XL"}
]'::jsonb),
('Fitness Goals', 'fitness_goals', 'textarea', 'Describe your fitness goals', 'Member''s fitness objectives and goals', false, 5, null),
('Locker Preference', 'locker_preference', 'select', null, 'Preferred locker room area', false, 6, '[
    {"value": "men_main", "label": "Men''s Main Area"},
    {"value": "men_family", "label": "Men''s Family Area"},
    {"value": "women_main", "label": "Women''s Main Area"},
    {"value": "women_family", "label": "Women''s Family Area"},
    {"value": "no_preference", "label": "No Preference"}
]'::jsonb),
('Marketing Consent', 'marketing_consent', 'checkbox', null, 'Consent to receive marketing communications', false, 7, null),
('Instagram Handle', 'instagram_handle', 'text', '@username', 'Member''s Instagram handle for social features', false, 8, null),
('Referral Code', 'referral_code', 'text', 'Enter referral code', 'Code used if member was referred by someone', false, 9, null),
('Birthday Month', 'birthday_month', 'select', null, 'Birth month for birthday promotions', false, 10, '[
    {"value": "january", "label": "January"},
    {"value": "february", "label": "February"},
    {"value": "march", "label": "March"},
    {"value": "april", "label": "April"},
    {"value": "may", "label": "May"},
    {"value": "june", "label": "June"},
    {"value": "july", "label": "July"},
    {"value": "august", "label": "August"},
    {"value": "september", "label": "September"},
    {"value": "october", "label": "October"},
    {"value": "november", "label": "November"},
    {"value": "december", "label": "December"}
]'::jsonb);

-- Set up Row Level Security (RLS)
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_custom_field_values ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_fields
-- Allow authenticated users to read active custom fields
CREATE POLICY "Allow read access to active custom fields" ON custom_fields
    FOR SELECT TO authenticated
    USING (is_active = true);

-- Allow staff to manage custom fields (you may need to adjust this based on your staff role system)
CREATE POLICY "Allow staff to manage custom fields" ON custom_fields
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'staff', 'manager')
        )
    );

-- RLS Policies for member_custom_field_values
-- Allow users to read their own custom field values
CREATE POLICY "Allow users to read own custom field values" ON member_custom_field_values
    FOR SELECT TO authenticated
    USING (member_id = auth.uid());

-- Allow staff to read all custom field values
CREATE POLICY "Allow staff to read all custom field values" ON member_custom_field_values
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'staff', 'manager')
        )
    );

-- Allow staff to manage custom field values
CREATE POLICY "Allow staff to manage custom field values" ON member_custom_field_values
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'staff', 'manager')
        )
    );

-- Allow users to update their own custom field values
CREATE POLICY "Allow users to update own custom field values" ON member_custom_field_values
    FOR UPDATE TO authenticated
    USING (member_id = auth.uid());

-- Comments for documentation
COMMENT ON TABLE custom_fields IS 'Defines custom fields that can be added to member profiles';
COMMENT ON TABLE member_custom_field_values IS 'Stores custom field values for each member';
COMMENT ON COLUMN custom_fields.field_key IS 'Unique identifier for the field, used in code';
COMMENT ON COLUMN custom_fields.type IS 'Field type: text, textarea, number, email, phone, date, select, checkbox, url';
COMMENT ON COLUMN custom_fields.options IS 'JSON array of options for select fields';
COMMENT ON COLUMN custom_fields.validation_rules IS 'JSON object with validation rules (min_length, max_length, pattern, etc.)';
COMMENT ON COLUMN member_custom_field_values.value IS 'Field value stored as text, converted based on field type';
