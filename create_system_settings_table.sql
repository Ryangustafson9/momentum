-- Create system_settings table for global system configuration
-- This table stores system-wide settings and feature toggles

CREATE TABLE IF NOT EXISTS system_settings (
  id varchar(50) PRIMARY KEY DEFAULT 'global',
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_at ON system_settings(updated_at);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only admins can manage system settings
CREATE POLICY "Only admins can view system settings" ON system_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update system settings" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Insert default settings
INSERT INTO system_settings (id, settings) 
VALUES ('global', '{
  "timeclock_enabled": false,
  "timeclock_location_tracking": true,
  "timeclock_break_tracking": true,
  "timeclock_overtime_threshold": 40,
  "member_self_checkin": true,
  "staff_schedule_management": true,
  "multi_location_enabled": false,
  "advanced_reporting": true
}')
ON CONFLICT (id) DO NOTHING;

-- Create timeclock_entries table for staff time tracking
CREATE TABLE IF NOT EXISTS timeclock_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  clock_in_time timestamp with time zone NOT NULL,
  clock_out_time timestamp with time zone,
  break_start_time timestamp with time zone,
  break_end_time timestamp with time zone,
  status varchar(20) DEFAULT 'clocked_in', -- clocked_in, clocked_out, on_break
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for timeclock performance
CREATE INDEX IF NOT EXISTS idx_timeclock_entries_staff_id ON timeclock_entries(staff_id);
CREATE INDEX IF NOT EXISTS idx_timeclock_entries_location_id ON timeclock_entries(location_id);
CREATE INDEX IF NOT EXISTS idx_timeclock_entries_clock_in_time ON timeclock_entries(clock_in_time);
CREATE INDEX IF NOT EXISTS idx_timeclock_entries_status ON timeclock_entries(status);

-- Enable RLS for timeclock
ALTER TABLE timeclock_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for timeclock
CREATE POLICY "Staff can view their own timeclock entries" ON timeclock_entries
  FOR SELECT USING (staff_id = auth.uid());

CREATE POLICY "Staff can create their own timeclock entries" ON timeclock_entries
  FOR INSERT WITH CHECK (staff_id = auth.uid());

CREATE POLICY "Staff can update their own timeclock entries" ON timeclock_entries
  FOR UPDATE USING (staff_id = auth.uid());

CREATE POLICY "Admins can view all timeclock entries" ON timeclock_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create functions
CREATE OR REPLACE FUNCTION create_system_settings_table()
RETURNS void AS $$
BEGIN
  -- This function is just a placeholder since the table is created above
  RETURN;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_timeclock_table()
RETURNS void AS $$
BEGIN
  -- This function is just a placeholder since the table is created above
  RETURN;
END;
$$ LANGUAGE plpgsql;
