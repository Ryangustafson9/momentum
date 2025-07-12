-- Staff Pay Rate Management Schema
-- This extends the existing timeclock system with comprehensive pay rate management

-- 1. Staff Pay Rates Table (Current and Historical Rates)
CREATE TABLE IF NOT EXISTS staff_pay_rates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Rate Information
  regular_hourly_rate decimal(10,2) NOT NULL,
  overtime_hourly_rate decimal(10,2), -- If null, calculated as 1.5x regular
  holiday_hourly_rate decimal(10,2),  -- If null, calculated as 2x regular
  weekend_hourly_rate decimal(10,2),  -- If null, uses regular rate
  
  -- Rate Metadata
  rate_type varchar(50) DEFAULT 'hourly', -- hourly, salary, commission
  currency varchar(3) DEFAULT 'USD',
  pay_frequency varchar(20) DEFAULT 'weekly', -- weekly, biweekly, monthly
  
  -- Effective Period
  effective_date date NOT NULL,
  end_date date, -- NULL means current rate
  
  -- Approval & Audit
  approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at timestamp with time zone,
  notes text,
  
  -- Metadata
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Constraints
  CONSTRAINT positive_rates CHECK (
    regular_hourly_rate > 0 AND
    (overtime_hourly_rate IS NULL OR overtime_hourly_rate > 0) AND
    (holiday_hourly_rate IS NULL OR holiday_hourly_rate > 0) AND
    (weekend_hourly_rate IS NULL OR weekend_hourly_rate > 0)
  ),
  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= effective_date)
);

-- 2. Payroll Calculations Table (Calculated Pay Periods)
CREATE TABLE IF NOT EXISTS staff_payroll_periods (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Pay Period
  period_start date NOT NULL,
  period_end date NOT NULL,
  pay_frequency varchar(20) NOT NULL,
  
  -- Hours Summary
  regular_hours decimal(8,2) DEFAULT 0,
  overtime_hours decimal(8,2) DEFAULT 0,
  holiday_hours decimal(8,2) DEFAULT 0,
  weekend_hours decimal(8,2) DEFAULT 0,
  break_hours decimal(8,2) DEFAULT 0,
  total_hours decimal(8,2) DEFAULT 0,
  
  -- Pay Calculations
  regular_pay decimal(10,2) DEFAULT 0,
  overtime_pay decimal(10,2) DEFAULT 0,
  holiday_pay decimal(10,2) DEFAULT 0,
  weekend_pay decimal(10,2) DEFAULT 0,
  gross_pay decimal(10,2) DEFAULT 0,
  
  -- Rate Information (snapshot at time of calculation)
  regular_rate decimal(10,2) NOT NULL,
  overtime_rate decimal(10,2),
  holiday_rate decimal(10,2),
  weekend_rate decimal(10,2),
  
  -- Status
  status varchar(20) DEFAULT 'draft', -- draft, calculated, approved, paid
  calculated_at timestamp with time zone,
  approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at timestamp with time zone,
  
  -- Metadata
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_period CHECK (period_end >= period_start),
  CONSTRAINT positive_hours CHECK (
    regular_hours >= 0 AND overtime_hours >= 0 AND 
    holiday_hours >= 0 AND weekend_hours >= 0 AND break_hours >= 0
  )
);

-- 3. Enhanced Timeclock Entries (Add pay calculation fields)
ALTER TABLE timeclock_entries ADD COLUMN IF NOT EXISTS 
  calculated_regular_hours decimal(8,2) DEFAULT 0;
ALTER TABLE timeclock_entries ADD COLUMN IF NOT EXISTS 
  calculated_overtime_hours decimal(8,2) DEFAULT 0;
ALTER TABLE timeclock_entries ADD COLUMN IF NOT EXISTS 
  calculated_break_hours decimal(8,2) DEFAULT 0;
ALTER TABLE timeclock_entries ADD COLUMN IF NOT EXISTS 
  is_holiday boolean DEFAULT false;
ALTER TABLE timeclock_entries ADD COLUMN IF NOT EXISTS 
  is_weekend boolean DEFAULT false;
ALTER TABLE timeclock_entries ADD COLUMN IF NOT EXISTS 
  hourly_rate_snapshot decimal(10,2); -- Rate used for this shift
ALTER TABLE timeclock_entries ADD COLUMN IF NOT EXISTS 
  payroll_period_id uuid REFERENCES staff_payroll_periods(id) ON DELETE SET NULL;

-- 4. Pay Rate Templates (for bulk updates and new staff defaults)
CREATE TABLE IF NOT EXISTS pay_rate_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name varchar(100) NOT NULL,
  description text,
  
  -- Default Rates
  regular_hourly_rate decimal(10,2) NOT NULL,
  overtime_multiplier decimal(3,2) DEFAULT 1.5,
  holiday_multiplier decimal(3,2) DEFAULT 2.0,
  weekend_multiplier decimal(3,2) DEFAULT 1.0,
  
  -- Template Settings
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  
  -- Metadata
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_staff_pay_rates_staff_id ON staff_pay_rates(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_pay_rates_effective_date ON staff_pay_rates(effective_date);
CREATE INDEX IF NOT EXISTS idx_staff_pay_rates_current ON staff_pay_rates(staff_id, effective_date) 
  WHERE end_date IS NULL;

CREATE INDEX IF NOT EXISTS idx_payroll_periods_staff_id ON staff_payroll_periods(staff_id);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_dates ON staff_payroll_periods(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_status ON staff_payroll_periods(status);

CREATE INDEX IF NOT EXISTS idx_timeclock_payroll_period ON timeclock_entries(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_timeclock_rate_snapshot ON timeclock_entries(hourly_rate_snapshot);

-- 6. Enable RLS on New Tables
ALTER TABLE staff_pay_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_rate_templates ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for Staff Pay Rates
CREATE POLICY "Staff can view their own pay rates" ON staff_pay_rates
  FOR SELECT USING (staff_id = auth.uid());

CREATE POLICY "Admins can view all pay rates" ON staff_pay_rates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage pay rates" ON staff_pay_rates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 8. RLS Policies for Payroll Periods
CREATE POLICY "Staff can view their own payroll periods" ON staff_payroll_periods
  FOR SELECT USING (staff_id = auth.uid());

CREATE POLICY "Admins can manage payroll periods" ON staff_payroll_periods
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 9. RLS Policies for Pay Rate Templates
CREATE POLICY "Admins can manage pay rate templates" ON pay_rate_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 10. Add Permission for Pay Rate Management
INSERT INTO system_settings (timeclock_payroll_enabled) 
VALUES (false) 
ON CONFLICT (id) DO NOTHING;
