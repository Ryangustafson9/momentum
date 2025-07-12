-- Accounting System Database Schema
-- This creates the foundation for accounting functionality in Momentum

-- 1. Add accounting fields to system_settings table
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS 
  accounting_method varchar(20) DEFAULT 'accrual';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS 
  accounting_settings jsonb DEFAULT '{}';

-- 2. Create accounting_accounts table for Chart of Accounts
CREATE TABLE IF NOT EXISTS accounting_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Account Identification
  account_number varchar(20) NOT NULL,
  account_name varchar(100) NOT NULL,
  account_code varchar(50), -- Alternative code system
  
  -- Account Classification
  account_type varchar(50) NOT NULL, -- Asset, Liability, Equity, Revenue, Expense
  account_category varchar(100), -- More specific categorization
  account_subcategory varchar(100), -- Even more specific
  
  -- Account Details
  description text,
  normal_balance varchar(10) NOT NULL DEFAULT 'debit', -- debit or credit
  
  -- Account Settings
  is_active boolean DEFAULT true,
  is_system_account boolean DEFAULT false, -- Cannot be deleted
  allow_manual_entries boolean DEFAULT true,
  requires_department boolean DEFAULT false,
  requires_location boolean DEFAULT false,
  
  -- Hierarchy and Grouping
  parent_account_id uuid REFERENCES accounting_accounts(id) ON DELETE SET NULL,
  account_level integer DEFAULT 1, -- 1=main, 2=sub, 3=sub-sub, etc.
  sort_order integer DEFAULT 0,
  
  -- Integration
  quickbooks_account_id varchar(50), -- For QB integration
  external_account_id varchar(50), -- For other integrations
  
  -- Metadata
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Constraints
  CONSTRAINT unique_account_number UNIQUE (account_number),
  CONSTRAINT unique_account_name UNIQUE (account_name),
  CONSTRAINT valid_account_type CHECK (account_type IN ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense')),
  CONSTRAINT valid_normal_balance CHECK (normal_balance IN ('debit', 'credit')),
  CONSTRAINT valid_account_level CHECK (account_level > 0 AND account_level <= 5)
);

-- 3. Create accounting_account_templates table for industry standards
CREATE TABLE IF NOT EXISTS accounting_account_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Template Information
  template_name varchar(100) NOT NULL,
  industry varchar(50) DEFAULT 'fitness',
  description text,
  
  -- Account Details
  account_number varchar(20) NOT NULL,
  account_name varchar(100) NOT NULL,
  account_type varchar(50) NOT NULL,
  account_category varchar(100),
  account_subcategory varchar(100),
  normal_balance varchar(10) NOT NULL DEFAULT 'debit',
  
  -- Template Settings
  is_required boolean DEFAULT false, -- Must be included
  is_recommended boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  
  -- Metadata
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_template_account_type CHECK (account_type IN ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense')),
  CONSTRAINT valid_template_normal_balance CHECK (normal_balance IN ('debit', 'credit'))
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounting_accounts_type ON accounting_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_accounting_accounts_category ON accounting_accounts(account_category);
CREATE INDEX IF NOT EXISTS idx_accounting_accounts_active ON accounting_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_accounting_accounts_number ON accounting_accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_accounting_accounts_parent ON accounting_accounts(parent_account_id);
CREATE INDEX IF NOT EXISTS idx_accounting_accounts_sort ON accounting_accounts(account_type, sort_order);

CREATE INDEX IF NOT EXISTS idx_accounting_templates_type ON accounting_account_templates(account_type);
CREATE INDEX IF NOT EXISTS idx_accounting_templates_industry ON accounting_account_templates(industry);

-- 5. Enable RLS on new tables
ALTER TABLE accounting_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_account_templates ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for accounting tables
CREATE POLICY "Admins can manage accounting accounts" ON accounting_accounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view accounting templates" ON accounting_account_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 7. Insert standard gym industry chart of accounts templates
INSERT INTO accounting_account_templates (
  template_name, industry, account_number, account_name, account_type, 
  account_category, account_subcategory, normal_balance, is_required, sort_order
) VALUES
  -- ASSETS (1000-1999)
  ('Standard Gym COA', 'fitness', '1000', 'Cash and Cash Equivalents', 'Asset', 'Current Assets', 'Cash', 'debit', true, 1),
  ('Standard Gym COA', 'fitness', '1010', 'Checking Account', 'Asset', 'Current Assets', 'Cash', 'debit', true, 2),
  ('Standard Gym COA', 'fitness', '1020', 'Savings Account', 'Asset', 'Current Assets', 'Cash', 'debit', false, 3),
  ('Standard Gym COA', 'fitness', '1030', 'Petty Cash', 'Asset', 'Current Assets', 'Cash', 'debit', false, 4),
  ('Standard Gym COA', 'fitness', '1100', 'Accounts Receivable', 'Asset', 'Current Assets', 'Receivables', 'debit', true, 5),
  ('Standard Gym COA', 'fitness', '1110', 'Member Accounts Receivable', 'Asset', 'Current Assets', 'Receivables', 'debit', true, 6),
  ('Standard Gym COA', 'fitness', '1120', 'Personal Training Receivable', 'Asset', 'Current Assets', 'Receivables', 'debit', false, 7),
  ('Standard Gym COA', 'fitness', '1200', 'Inventory', 'Asset', 'Current Assets', 'Inventory', 'debit', false, 8),
  ('Standard Gym COA', 'fitness', '1210', 'Retail Merchandise', 'Asset', 'Current Assets', 'Inventory', 'debit', false, 9),
  ('Standard Gym COA', 'fitness', '1220', 'Supplements Inventory', 'Asset', 'Current Assets', 'Inventory', 'debit', false, 10),
  ('Standard Gym COA', 'fitness', '1300', 'Prepaid Expenses', 'Asset', 'Current Assets', 'Prepaid', 'debit', false, 11),
  ('Standard Gym COA', 'fitness', '1500', 'Equipment', 'Asset', 'Fixed Assets', 'Equipment', 'debit', true, 12),
  ('Standard Gym COA', 'fitness', '1510', 'Gym Equipment', 'Asset', 'Fixed Assets', 'Equipment', 'debit', true, 13),
  ('Standard Gym COA', 'fitness', '1520', 'Office Equipment', 'Asset', 'Fixed Assets', 'Equipment', 'debit', false, 14),
  ('Standard Gym COA', 'fitness', '1530', 'Accumulated Depreciation - Equipment', 'Asset', 'Fixed Assets', 'Depreciation', 'credit', false, 15),
  
  -- LIABILITIES (2000-2999)
  ('Standard Gym COA', 'fitness', '2000', 'Accounts Payable', 'Liability', 'Current Liabilities', 'Payables', 'credit', true, 20),
  ('Standard Gym COA', 'fitness', '2100', 'Accrued Expenses', 'Liability', 'Current Liabilities', 'Accrued', 'credit', false, 21),
  ('Standard Gym COA', 'fitness', '2110', 'Accrued Payroll', 'Liability', 'Current Liabilities', 'Accrued', 'credit', true, 22),
  ('Standard Gym COA', 'fitness', '2120', 'Accrued Taxes', 'Liability', 'Current Liabilities', 'Accrued', 'credit', false, 23),
  ('Standard Gym COA', 'fitness', '2200', 'Deferred Revenue', 'Liability', 'Current Liabilities', 'Deferred', 'credit', true, 24),
  ('Standard Gym COA', 'fitness', '2210', 'Unearned Membership Fees', 'Liability', 'Current Liabilities', 'Deferred', 'credit', true, 25),
  ('Standard Gym COA', 'fitness', '2220', 'Unearned Personal Training', 'Liability', 'Current Liabilities', 'Deferred', 'credit', false, 26),
  ('Standard Gym COA', 'fitness', '2300', 'Short-term Loans', 'Liability', 'Current Liabilities', 'Loans', 'credit', false, 27),
  ('Standard Gym COA', 'fitness', '2500', 'Long-term Debt', 'Liability', 'Long-term Liabilities', 'Debt', 'credit', false, 28),
  
  -- EQUITY (3000-3999)
  ('Standard Gym COA', 'fitness', '3000', 'Owner''s Equity', 'Equity', 'Owner''s Equity', 'Capital', 'credit', true, 30),
  ('Standard Gym COA', 'fitness', '3100', 'Retained Earnings', 'Equity', 'Owner''s Equity', 'Retained Earnings', 'credit', true, 31),
  ('Standard Gym COA', 'fitness', '3200', 'Owner Draws', 'Equity', 'Owner''s Equity', 'Draws', 'debit', false, 32),
  
  -- REVENUE (4000-4999)
  ('Standard Gym COA', 'fitness', '4000', 'Membership Revenue', 'Revenue', 'Operating Revenue', 'Memberships', 'credit', true, 40),
  ('Standard Gym COA', 'fitness', '4010', 'Monthly Membership Fees', 'Revenue', 'Operating Revenue', 'Memberships', 'credit', true, 41),
  ('Standard Gym COA', 'fitness', '4020', 'Annual Membership Fees', 'Revenue', 'Operating Revenue', 'Memberships', 'credit', false, 42),
  ('Standard Gym COA', 'fitness', '4030', 'Initiation Fees', 'Revenue', 'Operating Revenue', 'Memberships', 'credit', false, 43),
  ('Standard Gym COA', 'fitness', '4100', 'Personal Training Revenue', 'Revenue', 'Operating Revenue', 'Services', 'credit', false, 44),
  ('Standard Gym COA', 'fitness', '4200', 'Group Class Revenue', 'Revenue', 'Operating Revenue', 'Services', 'credit', false, 45),
  ('Standard Gym COA', 'fitness', '4300', 'Retail Sales', 'Revenue', 'Operating Revenue', 'Retail', 'credit', false, 46),
  ('Standard Gym COA', 'fitness', '4310', 'Supplement Sales', 'Revenue', 'Operating Revenue', 'Retail', 'credit', false, 47),
  ('Standard Gym COA', 'fitness', '4320', 'Merchandise Sales', 'Revenue', 'Operating Revenue', 'Retail', 'credit', false, 48),
  ('Standard Gym COA', 'fitness', '4400', 'Other Revenue', 'Revenue', 'Other Revenue', 'Miscellaneous', 'credit', false, 49),
  
  -- EXPENSES (5000-9999)
  ('Standard Gym COA', 'fitness', '5000', 'Cost of Goods Sold', 'Expense', 'Cost of Sales', 'COGS', 'debit', false, 50),
  ('Standard Gym COA', 'fitness', '6000', 'Payroll Expenses', 'Expense', 'Operating Expenses', 'Payroll', 'debit', true, 60),
  ('Standard Gym COA', 'fitness', '6010', 'Salaries and Wages', 'Expense', 'Operating Expenses', 'Payroll', 'debit', true, 61),
  ('Standard Gym COA', 'fitness', '6020', 'Payroll Taxes', 'Expense', 'Operating Expenses', 'Payroll', 'debit', true, 62),
  ('Standard Gym COA', 'fitness', '6030', 'Employee Benefits', 'Expense', 'Operating Expenses', 'Payroll', 'debit', false, 63),
  ('Standard Gym COA', 'fitness', '6100', 'Rent Expense', 'Expense', 'Operating Expenses', 'Facility', 'debit', true, 64),
  ('Standard Gym COA', 'fitness', '6200', 'Utilities', 'Expense', 'Operating Expenses', 'Facility', 'debit', true, 65),
  ('Standard Gym COA', 'fitness', '6210', 'Electricity', 'Expense', 'Operating Expenses', 'Facility', 'debit', false, 66),
  ('Standard Gym COA', 'fitness', '6220', 'Water and Sewer', 'Expense', 'Operating Expenses', 'Facility', 'debit', false, 67),
  ('Standard Gym COA', 'fitness', '6230', 'Internet and Phone', 'Expense', 'Operating Expenses', 'Facility', 'debit', false, 68),
  ('Standard Gym COA', 'fitness', '6300', 'Equipment Maintenance', 'Expense', 'Operating Expenses', 'Maintenance', 'debit', true, 69),
  ('Standard Gym COA', 'fitness', '6400', 'Insurance', 'Expense', 'Operating Expenses', 'Insurance', 'debit', true, 70),
  ('Standard Gym COA', 'fitness', '6500', 'Marketing and Advertising', 'Expense', 'Operating Expenses', 'Marketing', 'debit', false, 71),
  ('Standard Gym COA', 'fitness', '6600', 'Professional Services', 'Expense', 'Operating Expenses', 'Professional', 'debit', false, 72),
  ('Standard Gym COA', 'fitness', '6700', 'Office Supplies', 'Expense', 'Operating Expenses', 'Supplies', 'debit', false, 73),
  ('Standard Gym COA', 'fitness', '6800', 'Cleaning Supplies', 'Expense', 'Operating Expenses', 'Supplies', 'debit', false, 74),
  ('Standard Gym COA', 'fitness', '7000', 'Depreciation Expense', 'Expense', 'Operating Expenses', 'Depreciation', 'debit', false, 75)
ON CONFLICT DO NOTHING;

-- 8. Update system_settings with default accounting configuration
INSERT INTO system_settings (id, accounting_method, accounting_settings) 
VALUES (
  1, 
  'accrual',
  '{
    "fiscal_year_start": "01-01",
    "default_currency": "USD",
    "enable_departments": false,
    "enable_locations": true,
    "account_number_format": "auto",
    "require_account_codes": false,
    "chart_of_accounts_template": "Standard Gym COA"
  }'::jsonb
) 
ON CONFLICT (id) DO UPDATE SET
  accounting_method = EXCLUDED.accounting_method,
  accounting_settings = EXCLUDED.accounting_settings
WHERE system_settings.accounting_method IS NULL;
