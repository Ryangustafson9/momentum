-- Create custom_fields table to store field definitions
CREATE TABLE IF NOT EXISTS custom_fields (
    id BIGSERIAL PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'email', 'phone', 'date', 'select', 'textarea', 'number')),
    placeholder VARCHAR(255),
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    options JSONB, -- For select type fields, store options as JSON array
    validation_rules JSONB, -- Store validation rules like min/max length, regex patterns
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- Create member_custom_field_values table to store member values for custom fields
CREATE TABLE IF NOT EXISTS member_custom_field_values (
    id BIGSERIAL PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    custom_field_id BIGINT NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(member_id, custom_field_id) -- Ensure one value per member per field
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_custom_fields_active_order ON custom_fields(is_active, order_index);
CREATE INDEX IF NOT EXISTS idx_member_custom_field_values_member ON member_custom_field_values(member_id);
CREATE INDEX IF NOT EXISTS idx_member_custom_field_values_field ON member_custom_field_values(custom_field_id);

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_custom_fields_updated_at BEFORE UPDATE ON custom_fields FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_member_custom_field_values_updated_at BEFORE UPDATE ON member_custom_field_values FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample custom fields for testing
INSERT INTO custom_fields (label, field_type, placeholder, is_required, order_index, options) VALUES 
('Preferred Contact Method', 'select', 'Choose preferred contact method', false, 1, '["Email", "Phone", "Text Message", "Mail"]'),
('Medical Conditions', 'textarea', 'List any relevant medical conditions', false, 2, null),
('Emergency Medical Contact', 'text', 'Name of emergency medical contact', false, 3, null),
('T-Shirt Size', 'select', 'Select t-shirt size', false, 4, '["XS", "S", "M", "L", "XL", "XXL", "XXXL"]'),
('Fitness Goals', 'textarea', 'Describe your fitness goals', false, 5, null),
('Referral Source', 'text', 'How did you hear about us?', false, 6, null),
('Social Media Handle', 'text', '@username (optional)', false, 7, null),
('Birthday', 'date', 'Select birthday for special offers', false, 8, null),
('Work Phone', 'phone', 'Work phone number', false, 9, null),
('Company Name', 'text', 'Employer or company name', false, 10, null)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON custom_fields TO authenticated;
GRANT ALL ON member_custom_field_values TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Add Row Level Security (RLS) policies
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_custom_field_values ENABLE ROW LEVEL SECURITY;

-- Policy for custom_fields: All authenticated users can read, only staff can modify
CREATE POLICY "Anyone can view custom fields" ON custom_fields FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage custom fields" ON custom_fields FOR ALL TO authenticated USING (true); -- Adjust as needed for staff role checking

-- Policy for member_custom_field_values: Users can manage their own values, staff can manage all
CREATE POLICY "Users can view their own values" ON member_custom_field_values FOR SELECT TO authenticated USING (member_id = auth.uid());
CREATE POLICY "Staff can view all values" ON member_custom_field_values FOR SELECT TO authenticated USING (true); -- Adjust for staff role
CREATE POLICY "Users can manage their own values" ON member_custom_field_values FOR ALL TO authenticated USING (member_id = auth.uid());
CREATE POLICY "Staff can manage all values" ON member_custom_field_values FOR ALL TO authenticated USING (true); -- Adjust for staff role
