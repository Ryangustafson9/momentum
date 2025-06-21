-- Enhanced Club Configuration System
-- This migration adds comprehensive club-specific settings to handle various operational models

-- Create club_configuration table for flexible settings
CREATE TABLE IF NOT EXISTS club_configuration (
    id INTEGER PRIMARY KEY DEFAULT 1,
    
    -- Basic Club Information
    club_name TEXT DEFAULT 'Fitness Club',
    club_type TEXT DEFAULT 'standard', -- 'standard', 'boutique', 'chain', 'franchise'
    business_model TEXT DEFAULT 'membership', -- 'membership', 'day_pass', 'hybrid'
    
    -- Billing Configuration
    billing_cycle TEXT DEFAULT 'monthly', -- 'daily', 'weekly', 'monthly', 'quarterly', 'annual'
    billing_day INTEGER DEFAULT 1, -- Day of month for monthly billing (1-31)
    anniversary_billing BOOLEAN DEFAULT false, -- Bill on member's sign-up anniversary
    prorated_billing BOOLEAN DEFAULT true, -- Allow prorated first month
    late_payment_grace_period INTEGER DEFAULT 3, -- Days before late fees
    auto_suspend_on_failure INTEGER DEFAULT 30, -- Days before auto-suspension
    
    -- Payment Processing
    payment_processor TEXT DEFAULT 'stripe', -- 'stripe', 'square', 'paypal', 'manual'
    currency TEXT DEFAULT 'USD',
    tax_rate DECIMAL(5,4) DEFAULT 0.0000,
    processing_fees_charged_to TEXT DEFAULT 'club', -- 'club', 'member'
    
    -- Access Control & Security
    access_system TEXT DEFAULT 'key_fob', -- 'key_fob', 'mobile_app', 'pin_code', 'biometric'
    guest_policy TEXT DEFAULT 'limited', -- 'none', 'limited', 'unlimited'
    guest_limit_per_month INTEGER DEFAULT 4,
    guest_fee DECIMAL(10,2) DEFAULT 0.00,
    
    -- Operating Hours & Scheduling
    timezone TEXT DEFAULT 'America/New_York',
    operating_hours JSONB DEFAULT '{}', -- Daily hours configuration
    class_booking_window INTEGER DEFAULT 7, -- Days in advance for booking
    class_cancellation_window INTEGER DEFAULT 2, -- Hours before class for cancellation
    waitlist_enabled BOOLEAN DEFAULT true,
    
    -- Membership Management
    freeze_policy_enabled BOOLEAN DEFAULT true,
    max_freeze_days_per_year INTEGER DEFAULT 60,
    min_freeze_duration INTEGER DEFAULT 7, -- Minimum days for a freeze
    contract_required BOOLEAN DEFAULT false,
    family_membership_enabled BOOLEAN DEFAULT true,
    corporate_membership_enabled BOOLEAN DEFAULT false,
    
    -- Check-in & Attendance
    check_in_method TEXT DEFAULT 'scan', -- 'scan', 'manual', 'app'
    daily_visit_limit INTEGER DEFAULT 1,
    guest_check_in_enabled BOOLEAN DEFAULT true,
    attendance_tracking BOOLEAN DEFAULT true,
    
    -- Communication Preferences
    sms_notifications_enabled BOOLEAN DEFAULT true,
    email_notifications_enabled BOOLEAN DEFAULT true,
    marketing_communications BOOLEAN DEFAULT true,
    automated_reminders BOOLEAN DEFAULT true,
    
    -- Equipment & Amenities
    equipment_reservation_enabled BOOLEAN DEFAULT false,
    locker_rental_enabled BOOLEAN DEFAULT true,
    towel_service_enabled BOOLEAN DEFAULT false,
    personal_training_enabled BOOLEAN DEFAULT true,
    
    -- Reporting & Analytics
    financial_reporting_level TEXT DEFAULT 'detailed', -- 'basic', 'detailed', 'advanced'
    member_analytics_enabled BOOLEAN DEFAULT true,
    staff_performance_tracking BOOLEAN DEFAULT false,
    
    -- Integration Settings
    mailchimp_integration BOOLEAN DEFAULT false,
    quickbooks_integration BOOLEAN DEFAULT false,
    social_media_sync BOOLEAN DEFAULT false,
    
    -- Compliance & Legal
    liability_waiver_required BOOLEAN DEFAULT true,
    age_verification_required BOOLEAN DEFAULT true,
    photo_id_required BOOLEAN DEFAULT true,
    emergency_contact_required BOOLEAN DEFAULT true,
    
    -- Custom Fields & Branding
    custom_member_fields JSONB DEFAULT '[]',
    brand_colors JSONB DEFAULT '{}',
    logo_url TEXT,
    custom_css TEXT,
    
    -- Operational Preferences
    staff_commission_enabled BOOLEAN DEFAULT false,
    inventory_tracking BOOLEAN DEFAULT false,
    retail_pos_enabled BOOLEAN DEFAULT false,
    membership_sales_goals BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create billing_rules table for complex billing scenarios
CREATE TABLE IF NOT EXISTS billing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id INTEGER REFERENCES club_configuration(id) DEFAULT 1,
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL, -- 'membership_start', 'payment_failure', 'freeze', 'cancellation'
    conditions JSONB DEFAULT '{}',
    actions JSONB DEFAULT '{}',
    priority INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create operating_hours table for detailed schedule management
CREATE TABLE IF NOT EXISTS operating_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id INTEGER REFERENCES club_configuration(id) DEFAULT 1,
    day_of_week INTEGER NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT false,
    special_hours_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create holiday_hours table for special operating days
CREATE TABLE IF NOT EXISTS holiday_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id INTEGER REFERENCES club_configuration(id) DEFAULT 1,
    holiday_date DATE NOT NULL,
    holiday_name TEXT NOT NULL,
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT false,
    special_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default club configuration
INSERT INTO club_configuration (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Insert default operating hours (Monday-Friday 5am-10pm, Saturday-Sunday 6am-8pm)
INSERT INTO operating_hours (club_id, day_of_week, open_time, close_time) VALUES
(1, 1, '05:00', '22:00'), -- Monday
(1, 2, '05:00', '22:00'), -- Tuesday
(1, 3, '05:00', '22:00'), -- Wednesday
(1, 4, '05:00', '22:00'), -- Thursday
(1, 5, '05:00', '22:00'), -- Friday
(1, 6, '06:00', '20:00'), -- Saturday
(1, 0, '06:00', '20:00')  -- Sunday
ON CONFLICT DO NOTHING;

-- Insert common US holidays with typical gym closures
INSERT INTO holiday_hours (club_id, holiday_date, holiday_name, is_closed) VALUES
(1, '2025-01-01', 'New Year''s Day', true),
(1, '2025-07-04', 'Independence Day', true),
(1, '2025-11-27', 'Thanksgiving Day', true),
(1, '2025-12-25', 'Christmas Day', true)
ON CONFLICT DO NOTHING;

-- Insert sample billing rules for different scenarios
INSERT INTO billing_rules (club_id, rule_name, rule_type, conditions, actions) VALUES
(1, 'Anniversary Billing', 'membership_start', 
 '{"billing_type": "anniversary"}', 
 '{"charge_on": "signup_date", "prorate_first": true}'),
(1, 'Monthly 1st Billing', 'membership_start', 
 '{"billing_type": "monthly_fixed"}', 
 '{"charge_on": 1, "prorate_first": true}'),
(1, 'Payment Failure Grace Period', 'payment_failure', 
 '{"attempt_count": 1}', 
 '{"grace_period_days": 3, "send_reminder": true}'),
(1, 'Auto Suspend After Failures', 'payment_failure', 
 '{"attempt_count": 3, "days_past_due": 30}', 
 '{"action": "suspend_membership", "notify_member": true}')
ON CONFLICT DO NOTHING;

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_club_configuration_updated_at 
    BEFORE UPDATE ON club_configuration 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_operating_hours_club_day ON operating_hours(club_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_holiday_hours_club_date ON holiday_hours(club_id, holiday_date);
CREATE INDEX IF NOT EXISTS idx_billing_rules_club_type ON billing_rules(club_id, rule_type);

-- Add RLS policies if needed
ALTER TABLE club_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE operating_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_hours ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read club configuration
CREATE POLICY "Allow authenticated users to read club config" ON club_configuration
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admin users to update club configuration
CREATE POLICY "Allow admin users to update club config" ON club_configuration
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Similar policies for other tables
CREATE POLICY "Allow authenticated users to read billing rules" ON billing_rules
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin users to manage billing rules" ON billing_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Allow authenticated users to read operating hours" ON operating_hours
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin users to manage operating hours" ON operating_hours
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Allow authenticated users to read holiday hours" ON holiday_hours
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin users to manage holiday hours" ON holiday_hours
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Create a view for easy access to complete club settings
CREATE OR REPLACE VIEW club_settings_complete AS
SELECT 
    cc.*,
    (
        SELECT json_agg(
            json_build_object(
                'day', oh.day_of_week,
                'open_time', oh.open_time,
                'close_time', oh.close_time,
                'is_closed', oh.is_closed,
                'note', oh.special_hours_note
            ) ORDER BY oh.day_of_week
        )
        FROM operating_hours oh 
        WHERE oh.club_id = cc.id
    ) as operating_hours_schedule,
    (
        SELECT json_agg(
            json_build_object(
                'date', hh.holiday_date,
                'name', hh.holiday_name,
                'open_time', hh.open_time,
                'close_time', hh.close_time,
                'is_closed', hh.is_closed,
                'note', hh.special_note
            ) ORDER BY hh.holiday_date
        )
        FROM holiday_hours hh 
        WHERE hh.club_id = cc.id
    ) as holiday_schedule,
    (
        SELECT json_agg(
            json_build_object(
                'id', br.id,
                'name', br.rule_name,
                'type', br.rule_type,
                'conditions', br.conditions,
                'actions', br.actions,
                'priority', br.priority,
                'active', br.active
            ) ORDER BY br.priority
        )
        FROM billing_rules br 
        WHERE br.club_id = cc.id AND br.active = true
    ) as billing_rules_active
FROM club_configuration cc;

COMMENT ON TABLE club_configuration IS 'Comprehensive club-specific configuration settings';
COMMENT ON TABLE billing_rules IS 'Flexible billing rules for different scenarios';
COMMENT ON TABLE operating_hours IS 'Regular operating hours by day of week';
COMMENT ON TABLE holiday_hours IS 'Special hours for holidays and events';
COMMENT ON VIEW club_settings_complete IS 'Complete view of all club settings including schedules and rules';
