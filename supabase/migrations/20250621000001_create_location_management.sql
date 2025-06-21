-- Location Management Foundation - Phase 1A
-- Multi-location support with location-specific billing configurations
-- Created: June 21, 2025

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

-- ==================== UPDATE EXISTING TABLES FOR LOCATION SUPPORT ====================

-- Add location_id to existing tables
ALTER TABLE memberships 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE CASCADE;

ALTER TABLE membership_types 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE CASCADE;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS primary_location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Update billing tables to be location-aware
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE CASCADE;

ALTER TABLE house_charges 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE CASCADE;

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

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS on new tables
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_billing_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_rule_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_payment_configs ENABLE ROW LEVEL SECURITY;

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

COMMENT ON TABLE locations IS 'Physical gym locations within an organization with location-specific settings';
COMMENT ON TABLE location_billing_configs IS 'Comprehensive billing configurations specific to each location';
COMMENT ON TABLE location_templates IS 'Pre-built configuration templates for quick location setup';
COMMENT ON TABLE billing_rule_migrations IS 'Track billing rule changes and migration strategies for existing memberships';
COMMENT ON TABLE location_payment_configs IS 'Payment processor configurations and capabilities per location';
