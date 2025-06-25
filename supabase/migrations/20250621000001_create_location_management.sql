-- Location Management Foundation - Phase 1A
-- Multi-location support with location-specific billing configurations
-- Created: June 21, 2025

-- ==================== PREREQUISITES ====================
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organizations table if it doesn't exist (required for locations)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  currency VARCHAR(3) DEFAULT 'USD',
  stripe_account_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default organization if none exists
INSERT INTO organizations (id, name, slug) 
SELECT gen_random_uuid(), 'Momentum Fitness', 'momentum'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE slug = 'momentum');

-- ==================== LOCATIONS TABLE ====================
-- Physical gym locations within an organization
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Location Identity
  name VARCHAR(255) NOT NULL, -- "Northpark", "Westlake"
  slug VARCHAR(100) NOT NULL, -- "northpark", "westlake" 
  display_name VARCHAR(255) NOT NULL, -- "Vanguard Fitness - Northpark"
  
  -- Address Information
  address_line_1 VARCHAR(255),
  address_line_2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  postal_code VARCHAR(20),
  country VARCHAR(3) DEFAULT 'USA',
  
  -- Contact Information
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  
  -- Operational Settings
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  currency VARCHAR(3) DEFAULT 'USD',
  tax_rate DECIMAL(5,4) DEFAULT 0.0000, -- Location-specific tax rate
  
  -- Business Hours (stored as JSON for flexibility)
  business_hours JSONB DEFAULT '{
    "monday": {"open": "05:00", "close": "23:00", "closed": false},
    "tuesday": {"open": "05:00", "close": "23:00", "closed": false},
    "wednesday": {"open": "05:00", "close": "23:00", "closed": false},
    "thursday": {"open": "05:00", "close": "23:00", "closed": false},
    "friday": {"open": "05:00", "close": "23:00", "closed": false},
    "saturday": {"open": "06:00", "close": "22:00", "closed": false},
    "sunday": {"open": "06:00", "close": "22:00", "closed": false}
  }',
  
  -- Status and Settings
  is_active BOOLEAN DEFAULT true,
  is_24_hour BOOLEAN DEFAULT false,
  max_capacity INTEGER DEFAULT 500,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(organization_id, slug),
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$')
);

-- ==================== LOCATION BILLING CONFIGURATIONS ====================
-- Location-specific billing rules and preferences
CREATE TABLE location_billing_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  
  -- === BILLING CYCLE SETTINGS ===
  -- Primary membership billing
  membership_billing_type VARCHAR(20) NOT NULL DEFAULT 'anniversary' 
    CHECK (membership_billing_type IN ('anniversary', 'unified', 'custom')),
  unified_billing_day INTEGER CHECK (unified_billing_day >= 1 AND unified_billing_day <= 28),
  custom_billing_schedule JSONB, -- For complex custom schedules
  
  -- Billing frequency options
  available_billing_frequencies TEXT[] DEFAULT ARRAY['monthly'],
  -- Options: 'weekly', 'biweekly', 'monthly', 'quarterly', 'semi_annual', 'annual'
  
  -- Proration settings
  proration_enabled BOOLEAN DEFAULT true,
  proration_type VARCHAR(20) DEFAULT 'daily' 
    CHECK (proration_type IN ('none', 'daily', 'weekly', 'monthly')),
  minimum_proration_days INTEGER DEFAULT 7,
  
  -- === PAYMENT SETTINGS ===
  -- Payment timing
  billing_timing VARCHAR(20) DEFAULT 'advance' 
    CHECK (billing_timing IN ('advance', 'arrears', 'mixed')),
  advance_billing_days INTEGER DEFAULT 0, -- Bill X days before service period
  
  -- Payment methods allowed
  payment_methods_enabled JSONB DEFAULT '{
    "auto_debit": true,
    "credit_card": true,
    "debit_card": true,
    "ach": true,
    "cash": false,
    "check": false,
    "apple_pay": true,
    "google_pay": true,
    "tap_to_pay": true
  }',
  
  -- Auto-debit preferences
  auto_debit_required BOOLEAN DEFAULT false,
  auto_debit_retry_days INTEGER[] DEFAULT ARRAY[3, 7, 14],
  
  -- === FAILED PAYMENT HANDLING ===
  failed_payment_strategy VARCHAR(20) DEFAULT 'retry_suspend' 
    CHECK (failed_payment_strategy IN ('retry_only', 'retry_suspend', 'retry_cancel', 'manual_review')),
  
  -- Grace periods
  payment_grace_period_days INTEGER DEFAULT 5,
  late_fee_grace_period_days INTEGER DEFAULT 10,
  
  -- Late fees
  late_fee_enabled BOOLEAN DEFAULT true,
  late_fee_type VARCHAR(20) DEFAULT 'flat' 
    CHECK (late_fee_type IN ('flat', 'percentage', 'escalating')),
  late_fee_amount DECIMAL(10,2) DEFAULT 25.00,
  late_fee_percentage DECIMAL(5,2) DEFAULT 0.05, -- 5%
  late_fee_max_amount DECIMAL(10,2) DEFAULT 100.00,
  
  -- Suspension and cancellation
  auto_suspend_after_days INTEGER DEFAULT 15,
  auto_cancel_after_days INTEGER DEFAULT 45,
  
  -- === DISCOUNTS AND REWARDS ===
  -- Referral program
  referral_program_enabled BOOLEAN DEFAULT false,
  referral_reward_type VARCHAR(20) DEFAULT 'credit' 
    CHECK (referral_reward_type IN ('credit', 'discount', 'free_month', 'cash')),
  referral_reward_amount DECIMAL(10,2) DEFAULT 50.00,
  
  -- Family discounts
  family_discount_enabled BOOLEAN DEFAULT true,
  family_discount_type VARCHAR(20) DEFAULT 'percentage' 
    CHECK (family_discount_type IN ('flat', 'percentage', 'tiered')),
  family_discount_amount DECIMAL(10,2) DEFAULT 10.00, -- $10 or 10%
  
  -- Group discounts
  group_discount_enabled BOOLEAN DEFAULT false,
  group_discount_min_members INTEGER DEFAULT 5,
  group_discount_percentage DECIMAL(5,2) DEFAULT 0.15, -- 15%
  
  -- === REVENUE STREAMS ===
  -- Additional revenue stream settings
  personal_training_enabled BOOLEAN DEFAULT true,
  retail_sales_enabled BOOLEAN DEFAULT false,
  locker_rental_enabled BOOLEAN DEFAULT true,
  towel_service_enabled BOOLEAN DEFAULT false,
  guest_pass_enabled BOOLEAN DEFAULT true,
  
  -- Guest pass pricing
  guest_pass_daily_rate DECIMAL(10,2) DEFAULT 15.00,
  guest_pass_monthly_limit INTEGER DEFAULT 4,
  
  -- === NOTIFICATION PREFERENCES ===
  -- Email notifications
  send_billing_reminders BOOLEAN DEFAULT true,
  billing_reminder_days INTEGER[] DEFAULT ARRAY[7, 3, 1], -- Days before billing
  
  send_payment_confirmations BOOLEAN DEFAULT true,
  send_failed_payment_notifications BOOLEAN DEFAULT true,
  send_suspension_warnings BOOLEAN DEFAULT true,
  
  -- SMS notifications
  sms_notifications_enabled BOOLEAN DEFAULT false,
  sms_failed_payments BOOLEAN DEFAULT false,
  sms_billing_reminders BOOLEAN DEFAULT false,
  
  -- === COMPLIANCE SETTINGS ===
  -- State-specific requirements
  state_regulations JSONB DEFAULT '{}',
  cancellation_notice_days INTEGER DEFAULT 30, -- State-required notice period
  contract_length_restrictions JSONB DEFAULT '{}',
  
  -- PCI compliance settings
  pci_compliant BOOLEAN DEFAULT true,
  data_retention_days INTEGER DEFAULT 2555, -- 7 years
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One config per location
  UNIQUE(location_id)
);

-- ==================== LOCATION TEMPLATES ====================
-- Pre-built configuration templates for new locations
CREATE TABLE location_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template Identity
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'budget_gym', 'premium_gym', 'boutique_fitness', 'yoga_studio'
  
  -- Template Configuration
  billing_config_template JSONB NOT NULL,
  payment_processor_template JSONB NOT NULL,
  membership_types_template JSONB NOT NULL,
  house_charges_template JSONB DEFAULT '[]',
  
  -- Template Metadata
  is_active BOOLEAN DEFAULT true,
  is_momentum_official BOOLEAN DEFAULT false, -- Created by Momentum staff
  usage_count INTEGER DEFAULT 0,
  
  -- Tags for filtering
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID -- Reference to Momentum staff member
);

-- ==================== BILLING RULE MIGRATIONS ====================
-- Track when billing rules change and what applies to existing memberships
CREATE TABLE billing_rule_migrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  
  -- Migration Details
  migration_type VARCHAR(50) NOT NULL, -- 'billing_cycle_change', 'payment_method_change', etc.
  old_config JSONB NOT NULL,
  new_config JSONB NOT NULL,
  
  -- Migration Strategy
  migration_strategy VARCHAR(20) NOT NULL 
    CHECK (migration_strategy IN ('grandfather_all', 'apply_to_all', 'selective', 'new_members_only')),
  
  -- Affected Memberships
  affected_membership_ids UUID[],
  grandfathered_membership_ids UUID[],
  
  -- Execution Details
  scheduled_date DATE,
  executed_at TIMESTAMP WITH TIME ZONE,
  executed_by UUID, -- Staff member who executed
  
  -- Results
  total_memberships INTEGER DEFAULT 0,
  migrated_memberships INTEGER DEFAULT 0,
  grandfathered_memberships INTEGER DEFAULT 0,
  failed_migrations INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' 
    CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
  
  notes TEXT,
  error_log JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== PAYMENT PROCESSOR CONFIGURATIONS ====================
-- Location-specific payment processor settings
CREATE TABLE location_payment_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  
  -- Primary processor
  primary_processor VARCHAR(20) NOT NULL DEFAULT 'stripe' 
    CHECK (primary_processor IN ('stripe', 'square', 'paypal', 'custom')),
  
  -- Stripe Configuration
  stripe_publishable_key VARCHAR(255),
  stripe_secret_key VARCHAR(255), -- Encrypted
  stripe_webhook_secret VARCHAR(255), -- Encrypted
  stripe_connect_account_id VARCHAR(255),
  
  -- Square Configuration
  square_application_id VARCHAR(255),
  square_access_token VARCHAR(255), -- Encrypted
  square_webhook_signature_key VARCHAR(255), -- Encrypted
  square_environment VARCHAR(20) DEFAULT 'sandbox' CHECK (square_environment IN ('sandbox', 'production')),
  
  -- PayPal Configuration
  paypal_client_id VARCHAR(255),
  paypal_client_secret VARCHAR(255), -- Encrypted
  paypal_webhook_id VARCHAR(255),
  paypal_environment VARCHAR(20) DEFAULT 'sandbox' CHECK (paypal_environment IN ('sandbox', 'production')),
  
  -- Processor Capabilities
  supports_subscriptions BOOLEAN DEFAULT true,
  supports_one_time_payments BOOLEAN DEFAULT true,
  supports_refunds BOOLEAN DEFAULT true,
  supports_disputes BOOLEAN DEFAULT true,
  supports_apple_pay BOOLEAN DEFAULT true,
  supports_google_pay BOOLEAN DEFAULT true,
  
  -- Fee Structure
  processor_fee_percentage DECIMAL(5,4) DEFAULT 0.029, -- 2.9%
  processor_fee_fixed DECIMAL(10,2) DEFAULT 0.30, -- $0.30
  
  -- Security and Compliance
  is_pci_compliant BOOLEAN DEFAULT true,
  encryption_enabled BOOLEAN DEFAULT true,
  
  -- Webhook Configuration
  webhook_url VARCHAR(500),
  webhook_events TEXT[] DEFAULT ARRAY['payment.succeeded', 'payment.failed', 'subscription.cancelled'],
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  test_mode BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(location_id)
);

-- ==================== CORPORATE PARTNERS MANAGEMENT ====================
-- Simplified tables for managing corporate partnerships

-- Corporate Partners - Companies with membership discount programs
CREATE TABLE IF NOT EXISTS corporate_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  company_code VARCHAR(50) UNIQUE NOT NULL,
  industry VARCHAR(100),
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  contract_status VARCHAR(20) DEFAULT 'active',
  partnership_type VARCHAR(50) DEFAULT 'discount',
  employee_count_estimated INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Corporate Discounts - Discount programs available to corporate partners
CREATE TABLE IF NOT EXISTS corporate_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_partner_id UUID REFERENCES corporate_partners(id) ON DELETE CASCADE,
  discount_name VARCHAR(255) NOT NULL,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL,
  applies_to VARCHAR(50) DEFAULT 'membership_fees',
  is_active BOOLEAN DEFAULT true,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Corporate Employee Verifications - Track verified employees
CREATE TABLE IF NOT EXISTS corporate_employee_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_partner_id UUID REFERENCES corporate_partners(id) ON DELETE CASCADE,
  member_id UUID,
  employee_id VARCHAR(100),
  work_email VARCHAR(255),
  employee_name VARCHAR(255),
  verification_status VARCHAR(20) DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Corporate Partnership Analytics - Track partnership performance
CREATE TABLE IF NOT EXISTS corporate_partnership_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_partner_id UUID REFERENCES corporate_partners(id) ON DELETE CASCADE,
  analytics_date DATE NOT NULL,
  period_type VARCHAR(20) DEFAULT 'monthly',
  total_members INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0.00,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Corporate Report Configurations - Automated report settings
CREATE TABLE IF NOT EXISTS corporate_report_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_partner_id UUID REFERENCES corporate_partners(id) ON DELETE CASCADE,
  
  -- Report Configuration
  report_name VARCHAR(255) NOT NULL,
  report_type VARCHAR(50) NOT NULL DEFAULT 'membership_summary',
  frequency VARCHAR(20) NOT NULL DEFAULT 'monthly',
  schedule_time TIME DEFAULT '09:00:00',
  schedule_day_of_week INTEGER, -- 1=Monday, 7=Sunday (for weekly reports)
  schedule_day_of_month INTEGER, -- 1-28 (for monthly reports)
  
  -- Report Content
  metrics_included JSONB DEFAULT '[]',
  date_range_type VARCHAR(20) DEFAULT 'previous_period',
  custom_date_range JSONB,
  include_charts BOOLEAN DEFAULT true,
  include_member_details BOOLEAN DEFAULT false,
  
  -- Delivery Settings
  delivery_method VARCHAR(20) DEFAULT 'email',
  email_subject_template VARCHAR(255),
  email_body_template TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_run_date TIMESTAMP WITH TIME ZONE,
  next_run_date TIMESTAMP WITH TIME ZONE,
  last_status VARCHAR(20),
  last_error_message TEXT,
  
  -- Metadata
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Corporate Report Recipients - Email recipients for automated reports
CREATE TABLE IF NOT EXISTS corporate_report_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_configuration_id UUID REFERENCES corporate_report_configurations(id) ON DELETE CASCADE,
  
  -- Recipient Information
  recipient_name VARCHAR(255),
  recipient_email VARCHAR(255) NOT NULL,
  recipient_type VARCHAR(20) DEFAULT 'primary',
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Corporate Report Delivery Log - Track report delivery history
CREATE TABLE IF NOT EXISTS corporate_report_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_configuration_id UUID REFERENCES corporate_report_configurations(id) ON DELETE CASCADE,
  
  -- Delivery Details
  delivery_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivery_status VARCHAR(20) NOT NULL,
  recipients_count INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,
  
  -- Report Content
  report_data JSONB,
  file_size_bytes INTEGER,
  
  -- Error Information
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== UPDATE EXISTING TABLES FOR LOCATION SUPPORT ====================

-- Add location_id to existing tables
ALTER TABLE memberships 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE CASCADE;

ALTER TABLE membership_types 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE CASCADE;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS primary_location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- ==================== INDEXES FOR PERFORMANCE ====================

-- Location indexes
CREATE INDEX IF NOT EXISTS idx_locations_organization_slug ON locations(organization_id, slug);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active) WHERE is_active = true;

-- Billing config indexes
CREATE INDEX IF NOT EXISTS idx_location_billing_configs_location ON location_billing_configs(location_id);

-- Payment config indexes
CREATE INDEX IF NOT EXISTS idx_location_payment_configs_location ON location_payment_configs(location_id);
CREATE INDEX IF NOT EXISTS idx_location_payment_configs_processor ON location_payment_configs(primary_processor);

-- Migration tracking indexes
CREATE INDEX IF NOT EXISTS idx_billing_rule_migrations_location ON billing_rule_migrations(location_id);
CREATE INDEX IF NOT EXISTS idx_billing_rule_migrations_status ON billing_rule_migrations(status);

-- Template indexes
CREATE INDEX IF NOT EXISTS idx_location_templates_category ON location_templates(category);
CREATE INDEX IF NOT EXISTS idx_location_templates_active ON location_templates(is_active) WHERE is_active = true;

-- Corporate partner indexes
CREATE INDEX IF NOT EXISTS idx_corporate_partners_company_code ON corporate_partners(company_code);
CREATE INDEX IF NOT EXISTS idx_corporate_partners_is_active ON corporate_partners(is_active);
CREATE INDEX IF NOT EXISTS idx_corporate_partners_industry ON corporate_partners(industry);

-- Corporate discount indexes
CREATE INDEX IF NOT EXISTS idx_corporate_discounts_partner ON corporate_discounts(corporate_partner_id);
CREATE INDEX IF NOT EXISTS idx_corporate_discounts_active ON corporate_discounts(is_active, valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_corporate_discounts_code ON corporate_discounts(discount_code) WHERE discount_code IS NOT NULL;

-- Employee verification indexes
CREATE INDEX IF NOT EXISTS idx_employee_verifications_partner ON corporate_employee_verifications(corporate_partner_id);
CREATE INDEX IF NOT EXISTS idx_employee_verifications_member ON corporate_employee_verifications(member_id);
CREATE INDEX IF NOT EXISTS idx_employee_verifications_status ON corporate_employee_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_employee_verifications_work_email ON corporate_employee_verifications(work_email);

-- Partnership analytics indexes
CREATE INDEX IF NOT EXISTS idx_partnership_analytics_partner_date ON corporate_partnership_analytics(corporate_partner_id, analytics_date);

-- Corporate report indexes
CREATE INDEX IF NOT EXISTS idx_report_configurations_partner ON corporate_report_configurations(corporate_partner_id);
CREATE INDEX IF NOT EXISTS idx_report_configurations_active ON corporate_report_configurations(is_active, next_run_date);
CREATE INDEX IF NOT EXISTS idx_report_configurations_frequency ON corporate_report_configurations(frequency, is_active);

CREATE INDEX IF NOT EXISTS idx_report_recipients_config ON corporate_report_recipients(report_configuration_id);
CREATE INDEX IF NOT EXISTS idx_report_recipients_email ON corporate_report_recipients(recipient_email);

CREATE INDEX IF NOT EXISTS idx_report_delivery_log_config ON corporate_report_delivery_log(report_configuration_id);
CREATE INDEX IF NOT EXISTS idx_report_delivery_log_date ON corporate_report_delivery_log(delivery_date);
CREATE INDEX IF NOT EXISTS idx_report_delivery_log_status ON corporate_report_delivery_log(delivery_status);

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS on new tables
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_billing_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_rule_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_payment_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_employee_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_partnership_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_report_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_report_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_report_delivery_log ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (will be enhanced based on auth requirements)
CREATE POLICY "Users can view their organization's locations" ON locations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage their organization's locations" ON locations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ==================== FUNCTIONS FOR COMMON OPERATIONS ====================

-- Function to create a new location with default billing config
CREATE OR REPLACE FUNCTION create_location_with_defaults(
  p_organization_id UUID,
  p_name VARCHAR,
  p_slug VARCHAR,
  p_template_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_location_id UUID;
  template_config JSONB;
BEGIN
  -- Create the location
  INSERT INTO locations (organization_id, name, slug, display_name)
  VALUES (p_organization_id, p_name, p_slug, 
    (SELECT name FROM organizations WHERE id = p_organization_id) || ' - ' || p_name)
  RETURNING id INTO new_location_id;
  
  -- Get template config if provided
  IF p_template_id IS NOT NULL THEN
    SELECT billing_config_template INTO template_config 
    FROM location_templates WHERE id = p_template_id;
    
    -- Create billing config from template
    INSERT INTO location_billing_configs (location_id)
    VALUES (new_location_id);
    
    -- Update usage count
    UPDATE location_templates 
    SET usage_count = usage_count + 1 
    WHERE id = p_template_id;
  ELSE
    -- Create default billing config
    INSERT INTO location_billing_configs (location_id)
    VALUES (new_location_id);
  END IF;
  
  -- Create default payment config
  INSERT INTO location_payment_configs (location_id)
  VALUES (new_location_id);
  
  RETURN new_location_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== SAMPLE DATA ====================

-- Insert default organization if it doesn't exist
INSERT INTO organizations (name, slug, timezone, currency)
VALUES ('Momentum Fitness', 'momentum', 'America/New_York', 'USD')
ON CONFLICT (slug) DO NOTHING;

-- Get the organization ID for sample data
DO $$
DECLARE
  momentum_org_id UUID;
BEGIN
  SELECT id INTO momentum_org_id FROM organizations WHERE slug = 'momentum';
  
  -- Insert sample location templates
  INSERT INTO location_templates (name, description, category, billing_config_template, payment_processor_template, membership_types_template, is_momentum_official, tags) VALUES
  ('Budget Gym Template', 'Configuration for budget-friendly gyms with basic amenities', 'budget_gym', 
   '{"membership_billing_type": "unified", "unified_billing_day": 1, "late_fee_amount": 15.00, "family_discount_enabled": true}',
   '{"primary_processor": "stripe", "supports_apple_pay": true}',
   '[{"name": "Basic Monthly", "price": 29.99, "billing_frequency": "monthly"}]',
   true, ARRAY['budget', 'basic', 'monthly']),
   
  ('Premium Gym Template', 'Configuration for full-service premium gyms', 'premium_gym',
   '{"membership_billing_type": "anniversary", "late_fee_amount": 35.00, "personal_training_enabled": true, "locker_rental_enabled": true}',
   '{"primary_processor": "stripe", "supports_apple_pay": true, "supports_google_pay": true}',
   '[{"name": "Premium Monthly", "price": 89.99, "billing_frequency": "monthly"}, {"name": "Premium Annual", "price": 899.99, "billing_frequency": "annual"}]',
   true, ARRAY['premium', 'full_service', 'training']),
   
  ('Boutique Fitness Template', 'Configuration for specialized boutique fitness studios', 'boutique_fitness',
   '{"membership_billing_type": "anniversary", "payment_methods_enabled": {"cash": true, "check": false}, "guest_pass_daily_rate": 25.00}',
   '{"primary_processor": "square", "supports_apple_pay": true}',
   '[{"name": "Unlimited Classes", "price": 149.99, "billing_frequency": "monthly"}, {"name": "8 Classes/Month", "price": 99.99, "billing_frequency": "monthly"}]',
   true, ARRAY['boutique', 'classes', 'specialized']);
   
END $$;

-- Sample corporate partners data
INSERT INTO corporate_partners (company_name, company_code, industry, contact_person, contact_email) VALUES
('TechCorp Solutions', 'TECHCORP', 'Technology', 'Sarah Johnson', 'hr@techcorp.com'),
('City Municipal', 'CITY_MUNICIPAL', 'Government', 'Mike Chen', 'benefits@cityoffice.gov'),
('Green Energy Inc', 'GREEN_ENERGY', 'Energy', 'Lisa Rodriguez', 'lisa.r@greenenergy.com')
ON CONFLICT (company_code) DO NOTHING;

-- Sample corporate discounts
DO $$
DECLARE
  techcorp_id UUID;
  municipal_id UUID;
  green_energy_id UUID;
BEGIN
  SELECT id INTO techcorp_id FROM corporate_partners WHERE company_code = 'TECHCORP';
  SELECT id INTO municipal_id FROM corporate_partners WHERE company_code = 'CITY_MUNICIPAL';
  SELECT id INTO green_energy_id FROM corporate_partners WHERE company_code = 'GREEN_ENERGY';
    -- Insert sample discounts
  INSERT INTO corporate_discounts (corporate_partner_id, discount_name, discount_type, discount_value) VALUES
  (techcorp_id, 'TechCorp Employee Discount', 'percentage', 15.00),
  (municipal_id, 'City Employee Wellness Program', 'percentage', 20.00),
  (green_energy_id, 'Green Team Corporate Rate', 'fixed_amount', 25.00);
END $$;

COMMENT ON TABLE locations IS 'Physical gym locations within an organization with location-specific settings';
COMMENT ON TABLE location_billing_configs IS 'Comprehensive billing configurations specific to each location';
COMMENT ON TABLE location_templates IS 'Pre-built configuration templates for quick location setup';
COMMENT ON TABLE billing_rule_migrations IS 'Track billing rule changes and migration strategies for existing memberships';
COMMENT ON TABLE location_payment_configs IS 'Payment processor configurations and capabilities per location';
COMMENT ON TABLE corporate_partners IS 'Companies with membership discount programs and employee verification systems';
COMMENT ON TABLE corporate_discounts IS 'Discount programs and pricing rules available to corporate partner employees';
COMMENT ON TABLE corporate_employee_verifications IS 'Employee verification records linking members to corporate partners';
COMMENT ON TABLE corporate_partnership_analytics IS 'Performance metrics and analytics for corporate partnerships';
COMMENT ON TABLE corporate_report_configurations IS 'Automated report configuration and scheduling for corporate partners';
COMMENT ON TABLE corporate_report_recipients IS 'Email recipients for automated corporate reports';
COMMENT ON TABLE corporate_report_delivery_log IS 'Delivery history and status tracking for automated reports';

-- ==================== CREATE CORPORATE PARTNER INDEXES ====================
-- Create indexes after all tables and data are successfully created

-- Corporate partner indexes
CREATE INDEX IF NOT EXISTS idx_corporate_partners_company_code ON corporate_partners(company_code);
CREATE INDEX IF NOT EXISTS idx_corporate_partners_is_active ON corporate_partners(is_active);
CREATE INDEX IF NOT EXISTS idx_corporate_partners_industry ON corporate_partners(industry);

-- Corporate discount indexes
CREATE INDEX IF NOT EXISTS idx_corporate_discounts_partner ON corporate_discounts(corporate_partner_id);
CREATE INDEX IF NOT EXISTS idx_corporate_discounts_active ON corporate_discounts(is_active, valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_corporate_discounts_code ON corporate_discounts(discount_code) WHERE discount_code IS NOT NULL;

-- Employee verification indexes
CREATE INDEX IF NOT EXISTS idx_employee_verifications_partner ON corporate_employee_verifications(corporate_partner_id);
CREATE INDEX IF NOT EXISTS idx_employee_verifications_member ON corporate_employee_verifications(member_id);
CREATE INDEX IF NOT EXISTS idx_employee_verifications_status ON corporate_employee_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_employee_verifications_work_email ON corporate_employee_verifications(work_email);

-- Partnership analytics indexes
CREATE INDEX IF NOT EXISTS idx_partnership_analytics_partner_date ON corporate_partnership_analytics(corporate_partner_id, analytics_date);

-- Report configuration indexes
CREATE INDEX IF NOT EXISTS idx_corporate_report_configs_partner ON corporate_report_configurations(corporate_partner_id);
CREATE INDEX IF NOT EXISTS idx_corporate_report_configs_active ON corporate_report_configurations(is_active, next_run_date);
CREATE INDEX IF NOT EXISTS idx_corporate_report_configs_frequency ON corporate_report_configurations(frequency, is_active);

-- Report recipient indexes
CREATE INDEX IF NOT EXISTS idx_corporate_report_recipients_config ON corporate_report_recipients(report_configuration_id);
CREATE INDEX IF NOT EXISTS idx_corporate_report_recipients_email ON corporate_report_recipients(recipient_email);

-- Report delivery log indexes
CREATE INDEX IF NOT EXISTS idx_corporate_report_delivery_log_config ON corporate_report_delivery_log(report_configuration_id);
CREATE INDEX IF NOT EXISTS idx_corporate_report_delivery_log_date ON corporate_report_delivery_log(delivery_date);
CREATE INDEX IF NOT EXISTS idx_corporate_report_delivery_log_status ON corporate_report_delivery_log(delivery_status);
