-- Create system_settings table for global system configuration

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id integer PRIMARY KEY DEFAULT 1,
  multi_location_enabled boolean DEFAULT false,
  online_joining_enabled boolean DEFAULT true,
  electronic_agreements_enabled boolean DEFAULT true,
  pos_integration_enabled boolean DEFAULT false,
  advanced_reporting_enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT single_settings_row CHECK (id = 1)
);

-- Insert default settings row
INSERT INTO system_settings (
  id, 
  multi_location_enabled, 
  online_joining_enabled, 
  electronic_agreements_enabled, 
  pos_integration_enabled, 
  advanced_reporting_enabled
) VALUES (
  1, 
  false, 
  true, 
  true, 
  false, 
  true
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_settings
-- Allow authenticated users to read system settings
CREATE POLICY "Allow authenticated users to read system settings" ON system_settings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admin users to manage system settings
CREATE POLICY "Allow admin users to manage system settings" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
