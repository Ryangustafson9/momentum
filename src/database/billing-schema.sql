-- 🚀 ADVANCED BILLING SYSTEM - Multi-tenant SaaS Database Schema
-- This schema supports complex billing configurations for multiple gym organizations

-- Organizations/Tenants table (if not exists)
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

-- Billing Configurations - Core billing settings per organization
CREATE TABLE billing_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Membership Billing Settings
  membership_billing_type VARCHAR(20) NOT NULL CHECK (membership_billing_type IN ('anniversary', 'unified')),
  unified_billing_day INTEGER CHECK (unified_billing_day >= 1 AND unified_billing_day <= 28),
  proration_enabled BOOLEAN DEFAULT true,
  
  -- House Charges Billing Settings
  house_charges_enabled BOOLEAN DEFAULT true,
  house_charges_frequency VARCHAR(20) DEFAULT 'monthly' CHECK (house_charges_frequency IN ('weekly', 'biweekly', 'monthly', 'custom')),
  house_charges_billing_day INTEGER CHECK (house_charges_billing_day >= 1 AND house_charges_billing_day <= 28),
  house_charges_custom_interval INTEGER, -- For custom frequency in days
  
  -- Failed Payment Settings
  failed_payment_retry_enabled BOOLEAN DEFAULT true,
  retry_intervals INTEGER[] DEFAULT ARRAY[3, 7, 14], -- Days between retries
  auto_suspend_after_retries INTEGER DEFAULT 3,
  auto_cancel_after_days INTEGER DEFAULT 30,
  
  -- Invoice Settings
  invoice_prefix VARCHAR(10) DEFAULT 'INV',
  invoice_numbering_start INTEGER DEFAULT 1000,
  invoice_due_days INTEGER DEFAULT 30,
  
  -- Notification Settings
  send_invoice_emails BOOLEAN DEFAULT true,
  send_payment_reminders BOOLEAN DEFAULT true,
  send_failed_payment_notifications BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id)
);

-- House Charges - Configurable additional charges
CREATE TABLE house_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  charge_type VARCHAR(20) NOT NULL CHECK (charge_type IN ('recurring', 'one_time', 'usage_based')),
  billing_frequency VARCHAR(20) CHECK (billing_frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'annually')),
  is_active BOOLEAN DEFAULT true,
  is_taxable BOOLEAN DEFAULT false,
  tax_rate DECIMAL(5,4) DEFAULT 0,
  
  -- Usage-based settings
  unit_name VARCHAR(50), -- e.g., "session", "hour", "visit"
  unit_price DECIMAL(10,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Member House Charges - Individual member assignments
CREATE TABLE member_house_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  house_charge_id UUID REFERENCES house_charges(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Assignment details
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE, -- NULL for ongoing charges
  
  -- Usage tracking for usage-based charges
  usage_quantity INTEGER DEFAULT 0,
  last_usage_date DATE,
  
  -- Override settings
  custom_amount DECIMAL(10,2), -- Override default amount
  custom_frequency VARCHAR(20), -- Override default frequency
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(member_id, house_charge_id)
);

-- Billing Schedules - Tracks when billing should occur
CREATE TABLE billing_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Schedule details
  billing_type VARCHAR(20) NOT NULL CHECK (billing_type IN ('membership', 'house_charges')),
  next_billing_date DATE NOT NULL,
  billing_frequency VARCHAR(20) NOT NULL,
  billing_amount DECIMAL(10,2) NOT NULL,
  
  -- Membership-specific
  membership_id UUID REFERENCES memberships(id) ON DELETE CASCADE,
  anniversary_date DATE, -- For anniversary billing
  
  -- House charges-specific
  house_charge_ids UUID[], -- Array of house charge IDs
  
  -- Status tracking
  is_active BOOLEAN DEFAULT true,
  last_billed_date DATE,
  failed_attempts INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices - Generated billing documents
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Invoice details
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  
  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  
  -- Payment details
  stripe_invoice_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  payment_method VARCHAR(50),
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  billing_period_start DATE,
  billing_period_end DATE,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice Line Items - Individual charges on invoices
CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Line item details
  description VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  
  -- References
  membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
  house_charge_id UUID REFERENCES house_charges(id) ON DELETE SET NULL,
  
  -- Categorization
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('membership', 'house_charge', 'addon', 'discount', 'tax')),
  
  -- Period for recurring items
  period_start DATE,
  period_end DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Billing Jobs - Background job tracking
CREATE TABLE billing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Job details
  job_type VARCHAR(50) NOT NULL, -- 'membership_billing', 'house_charges_billing', 'failed_payment_retry'
  scheduled_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  
  -- Processing details
  total_members INTEGER DEFAULT 0,
  processed_members INTEGER DEFAULT 0,
  successful_billings INTEGER DEFAULT 0,
  failed_billings INTEGER DEFAULT 0,
  
  -- Results
  error_message TEXT,
  processing_log JSONB,
  
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Retry Attempts - Track failed payment retries
CREATE TABLE payment_retry_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Retry details
  attempt_number INTEGER NOT NULL,
  retry_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  
  -- Results
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
  stripe_payment_intent_id VARCHAR(255),
  failure_reason TEXT,
  
  -- Next retry
  next_retry_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Billing Analytics - Aggregated billing metrics
CREATE TABLE billing_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Time period
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Revenue metrics
  membership_revenue DECIMAL(10,2) DEFAULT 0,
  house_charges_revenue DECIMAL(10,2) DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  
  -- Member metrics
  active_members INTEGER DEFAULT 0,
  new_members INTEGER DEFAULT 0,
  cancelled_members INTEGER DEFAULT 0,
  
  -- Billing metrics
  successful_billings INTEGER DEFAULT 0,
  failed_billings INTEGER DEFAULT 0,
  retry_success_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Proration metrics
  prorated_amount DECIMAL(10,2) DEFAULT 0,
  proration_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, period_type, period_start)
);

-- Indexes for performance
CREATE INDEX idx_billing_configurations_org ON billing_configurations(organization_id);
CREATE INDEX idx_house_charges_org ON house_charges(organization_id);
CREATE INDEX idx_member_house_charges_member ON member_house_charges(member_id);
CREATE INDEX idx_member_house_charges_org ON member_house_charges(organization_id);
CREATE INDEX idx_billing_schedules_org ON billing_schedules(organization_id);
CREATE INDEX idx_billing_schedules_next_date ON billing_schedules(next_billing_date) WHERE is_active = true;
CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_invoices_member ON invoices(member_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date) WHERE status IN ('sent', 'overdue');
CREATE INDEX idx_billing_jobs_scheduled ON billing_jobs(scheduled_date, status);
CREATE INDEX idx_payment_retries_next_date ON payment_retry_attempts(next_retry_date) WHERE status = 'pending';

-- Row Level Security (RLS) for multi-tenant isolation
ALTER TABLE billing_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE house_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_house_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_retry_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies (example for billing_configurations)
CREATE POLICY "Users can only access their organization's billing config" ON billing_configurations
  FOR ALL USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- Functions for automated billing calculations
CREATE OR REPLACE FUNCTION calculate_proration(
  start_date DATE,
  end_date DATE,
  monthly_amount DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  days_in_month INTEGER;
  days_used INTEGER;
BEGIN
  days_in_month := EXTRACT(DAY FROM (DATE_TRUNC('month', start_date) + INTERVAL '1 month - 1 day'));
  days_used := LEAST(EXTRACT(DAY FROM end_date) - EXTRACT(DAY FROM start_date) + 1, days_in_month);
  
  RETURN ROUND((monthly_amount * days_used / days_in_month), 2);
END;
$$ LANGUAGE plpgsql;

-- Function to generate next invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number(org_id UUID) RETURNS VARCHAR AS $$
DECLARE
  config_row billing_configurations%ROWTYPE;
  next_number INTEGER;
  invoice_number VARCHAR;
BEGIN
  SELECT * INTO config_row FROM billing_configurations WHERE organization_id = org_id;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM LENGTH(config_row.invoice_prefix) + 1) AS INTEGER)), config_row.invoice_numbering_start - 1) + 1
  INTO next_number
  FROM invoices 
  WHERE organization_id = org_id 
    AND invoice_number ~ ('^' || config_row.invoice_prefix || '[0-9]+$');
  
  invoice_number := config_row.invoice_prefix || next_number::VARCHAR;
  
  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;
