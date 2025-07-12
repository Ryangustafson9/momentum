-- Heartland Time and Attendance Integration Schema
-- This extends the payroll system to support Heartland CSV export functionality

-- 1. Heartland Integration Settings (stored in system_settings)
-- Add columns to existing system_settings table
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS 
  heartland_integration_enabled boolean DEFAULT false;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS 
  heartland_integration_settings jsonb DEFAULT '{}';

-- 2. Heartland Export Log Table
CREATE TABLE IF NOT EXISTS heartland_exports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Export Details
  filename varchar(255) NOT NULL,
  record_count integer NOT NULL DEFAULT 0,
  file_size_bytes integer,
  
  -- Period Information
  payroll_period_id uuid REFERENCES staff_payroll_periods(id) ON DELETE SET NULL,
  export_start_date date,
  export_end_date date,
  
  -- Export Settings Snapshot
  export_settings jsonb NOT NULL DEFAULT '{}',
  company_identifier varchar(50),
  
  -- Status and Processing
  status varchar(20) DEFAULT 'completed', -- pending, completed, failed
  error_message text,
  
  -- Audit Trail
  exported_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (export_end_date IS NULL OR export_end_date >= export_start_date)
);

-- 3. Heartland Employee Mapping Table
CREATE TABLE IF NOT EXISTS heartland_employee_mapping (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Momentum Staff Reference
  staff_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Heartland Employee Information
  heartland_employee_number varchar(50),
  heartland_clock_number varchar(50),
  heartland_division_code varchar(10),
  heartland_department_code varchar(10),
  
  -- Mapping Status
  is_active boolean DEFAULT true,
  last_sync_date timestamp with time zone,
  
  -- Metadata
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Constraints
  CONSTRAINT unique_staff_mapping UNIQUE (staff_id),
  CONSTRAINT unique_employee_number UNIQUE (heartland_employee_number),
  CONSTRAINT unique_clock_number UNIQUE (heartland_clock_number)
);

-- 4. Heartland Earnings Codes Table
CREATE TABLE IF NOT EXISTS heartland_earnings_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Code Information
  code varchar(10) NOT NULL,
  name varchar(100) NOT NULL,
  description text,
  
  -- Code Type and Settings
  code_type varchar(20) NOT NULL, -- regular, overtime, holiday, weekend, bonus, deduction
  amount_type varchar(1) NOT NULL DEFAULT 'H', -- H=hours, $=dollars, D=deductions
  
  -- Rate Calculation
  rate_multiplier decimal(4,2) DEFAULT 1.0, -- 1.0=regular, 1.5=overtime, 2.0=holiday
  is_overtime_eligible boolean DEFAULT true,
  
  -- Status
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  
  -- Metadata
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Constraints
  CONSTRAINT unique_earnings_code UNIQUE (code),
  CONSTRAINT valid_amount_type CHECK (amount_type IN ('H', '$', 'D')),
  CONSTRAINT valid_code_type CHECK (code_type IN ('regular', 'overtime', 'holiday', 'weekend', 'bonus', 'deduction'))
);

-- 5. Heartland Export Details Table (for detailed export tracking)
CREATE TABLE IF NOT EXISTS heartland_export_details (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Export Reference
  export_id uuid REFERENCES heartland_exports(id) ON DELETE CASCADE,
  
  -- Staff and Period Information
  staff_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  payroll_period_id uuid REFERENCES staff_payroll_periods(id) ON DELETE SET NULL,
  
  -- Exported Data
  employee_number varchar(50),
  clock_number varchar(50),
  division_code varchar(10),
  department_code varchar(10),
  earnings_code varchar(10),
  amount_type varchar(1),
  amount decimal(10,2),
  rate decimal(10,2),
  
  -- CSV Row Information
  csv_row_number integer,
  csv_row_data text,
  
  -- Metadata
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Enhanced Staff Profiles for Heartland Integration
-- Add Heartland-specific fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS 
  employee_number varchar(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS 
  clock_number varchar(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS 
  department_code varchar(10);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS 
  hire_date date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS 
  employment_status varchar(20) DEFAULT 'active';

-- 7. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_heartland_exports_date ON heartland_exports(export_start_date, export_end_date);
CREATE INDEX IF NOT EXISTS idx_heartland_exports_status ON heartland_exports(status);
CREATE INDEX IF NOT EXISTS idx_heartland_exports_period ON heartland_exports(payroll_period_id);

CREATE INDEX IF NOT EXISTS idx_heartland_employee_mapping_staff ON heartland_employee_mapping(staff_id);
CREATE INDEX IF NOT EXISTS idx_heartland_employee_mapping_employee_num ON heartland_employee_mapping(heartland_employee_number);
CREATE INDEX IF NOT EXISTS idx_heartland_employee_mapping_clock_num ON heartland_employee_mapping(heartland_clock_number);

CREATE INDEX IF NOT EXISTS idx_heartland_earnings_codes_type ON heartland_earnings_codes(code_type);
CREATE INDEX IF NOT EXISTS idx_heartland_earnings_codes_active ON heartland_earnings_codes(is_active);

CREATE INDEX IF NOT EXISTS idx_heartland_export_details_export ON heartland_export_details(export_id);
CREATE INDEX IF NOT EXISTS idx_heartland_export_details_staff ON heartland_export_details(staff_id);

CREATE INDEX IF NOT EXISTS idx_profiles_employee_number ON profiles(employee_number);
CREATE INDEX IF NOT EXISTS idx_profiles_clock_number ON profiles(clock_number);

-- 8. Enable RLS on New Tables
ALTER TABLE heartland_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE heartland_employee_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE heartland_earnings_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE heartland_export_details ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for Heartland Tables

-- Heartland Exports - Admin only
CREATE POLICY "Admins can manage heartland exports" ON heartland_exports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Employee Mapping - Admin manage, staff view own
CREATE POLICY "Staff can view their own heartland mapping" ON heartland_employee_mapping
  FOR SELECT USING (staff_id = auth.uid());

CREATE POLICY "Admins can manage heartland employee mapping" ON heartland_employee_mapping
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Earnings Codes - Admin only
CREATE POLICY "Admins can manage heartland earnings codes" ON heartland_earnings_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Export Details - Admin only
CREATE POLICY "Admins can view heartland export details" ON heartland_export_details
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 10. Insert Default Heartland Earnings Codes
INSERT INTO heartland_earnings_codes (code, name, description, code_type, amount_type, rate_multiplier, is_default) VALUES
  ('01', 'Regular Hours', 'Standard hourly work time', 'regular', 'H', 1.0, true),
  ('02', 'Overtime Hours', 'Hours worked over 40 per week', 'overtime', 'H', 1.5, false),
  ('03', 'Holiday Hours', 'Hours worked on company holidays', 'holiday', 'H', 2.0, false),
  ('04', 'Weekend Hours', 'Hours worked on weekends', 'weekend', 'H', 1.0, false),
  ('05', 'Bonus Pay', 'Performance or other bonus payments', 'bonus', '$', 1.0, false),
  ('06', 'Sick Time', 'Paid sick leave hours', 'regular', 'H', 1.0, false),
  ('07', 'Vacation Time', 'Paid vacation hours', 'regular', 'H', 1.0, false),
  ('08', 'Personal Time', 'Paid personal time off', 'regular', 'H', 1.0, false)
ON CONFLICT (code) DO NOTHING;

-- 11. Create Function for Heartland CSV Generation
CREATE OR REPLACE FUNCTION generate_heartland_csv_data(
  p_start_date date,
  p_end_date date,
  p_company_identifier text DEFAULT '',
  p_default_division text DEFAULT '',
  p_default_department text DEFAULT ''
)
RETURNS TABLE (
  company_identifier text,
  employee_number text,
  division text,
  earnings_code text,
  amount_type text,
  amount text,
  plus_sign text,
  rate text,
  department text,
  clock_number text,
  employee_name text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(p_company_identifier, '') as company_identifier,
    COALESCE(p.employee_number, p.id::text) as employee_number,
    COALESCE(hem.heartland_division_code, p_default_division, '') as division,
    CASE 
      WHEN te.is_holiday THEN '03'
      WHEN te.calculated_overtime_hours > 0 THEN '02'
      ELSE '01'
    END as earnings_code,
    'H' as amount_type,
    CASE 
      WHEN te.is_holiday THEN (COALESCE(te.calculated_regular_hours, 0) + COALESCE(te.calculated_overtime_hours, 0))::text
      WHEN te.calculated_overtime_hours > 0 THEN te.calculated_overtime_hours::text
      ELSE COALESCE(te.calculated_regular_hours, 0)::text
    END as amount,
    '+' as plus_sign,
    COALESCE(te.hourly_rate_snapshot, spr.regular_hourly_rate, 0)::text as rate,
    COALESCE(hem.heartland_department_code, p.department_code, p_default_department, '') as department,
    COALESCE(hem.heartland_clock_number, p.clock_number, '') as clock_number,
    COALESCE(p.first_name || ' ' || p.last_name, p.name, '') as employee_name
  FROM timeclock_entries te
  JOIN profiles p ON te.staff_id = p.id
  LEFT JOIN heartland_employee_mapping hem ON p.id = hem.staff_id AND hem.is_active = true
  LEFT JOIN staff_pay_rates spr ON p.id = spr.staff_id AND spr.end_date IS NULL
  WHERE te.clock_in_time::date >= p_start_date
    AND te.clock_in_time::date <= p_end_date
    AND te.clock_out_time IS NOT NULL
    AND p.role = 'staff'
    AND p.employment_status = 'active'
  ORDER BY p.employee_number, te.clock_in_time;
END;
$$;

-- 12. Create Function for Export Logging
CREATE OR REPLACE FUNCTION log_heartland_export(
  p_filename text,
  p_record_count integer,
  p_export_settings jsonb,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_payroll_period_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  export_id uuid;
BEGIN
  INSERT INTO heartland_exports (
    filename,
    record_count,
    export_settings,
    export_start_date,
    export_end_date,
    payroll_period_id,
    exported_by,
    company_identifier
  ) VALUES (
    p_filename,
    p_record_count,
    p_export_settings,
    p_start_date,
    p_end_date,
    p_payroll_period_id,
    auth.uid(),
    p_export_settings->>'company_identifier'
  ) RETURNING id INTO export_id;
  
  RETURN export_id;
END;
$$;

-- 13. Update System Settings with Default Heartland Configuration
INSERT INTO system_settings (id, heartland_integration_enabled, heartland_integration_settings) 
VALUES (
  1, 
  false,
  '{
    "company_identifier": "",
    "default_division": "01",
    "default_department": "0100",
    "earnings_codes": {
      "regular": "01",
      "overtime": "02", 
      "holiday": "03",
      "weekend": "01"
    },
    "export_format": "csv",
    "auto_export": false
  }'::jsonb
) 
ON CONFLICT (id) DO UPDATE SET
  heartland_integration_settings = EXCLUDED.heartland_integration_settings
WHERE system_settings.heartland_integration_settings IS NULL;
