-- Revenue Mapping System Database Schema
-- This creates the infrastructure for connecting all revenue sources to GL accounts

-- Revenue Mappings Table
-- Maps revenue sources (memberships, services, POS items) to GL accounts
CREATE TABLE IF NOT EXISTS revenue_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type VARCHAR(50) NOT NULL, -- 'membership', 'service', 'pos_item', 'addon', 'guest_fee', etc.
    source_id UUID NOT NULL, -- ID of the revenue source (membership_type.id, service.id, etc.)
    source_name VARCHAR(255) NOT NULL, -- Cached name for reporting
    gl_account_id UUID NOT NULL REFERENCES accounting_accounts(id),
    percentage DECIMAL(5,2) DEFAULT 100.00, -- Percentage of revenue to allocate (for split accounting)
    is_active BOOLEAN DEFAULT true,
    effective_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Ensure one active mapping per source at a time
    CONSTRAINT unique_active_mapping UNIQUE (source_type, source_id, is_active) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Revenue Transactions Table
-- Records all revenue transactions with proper GL account assignments
CREATE TABLE IF NOT EXISTS revenue_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source_type VARCHAR(50) NOT NULL,
    source_id UUID NOT NULL,
    source_name VARCHAR(255) NOT NULL,
    member_id UUID REFERENCES members(id),
    amount DECIMAL(10,2) NOT NULL,
    gl_account_id UUID NOT NULL REFERENCES accounting_accounts(id),
    ar_account_id UUID REFERENCES accounting_accounts(id), -- For receivables
    deferred_revenue_account_id UUID REFERENCES accounting_accounts(id), -- For prepaid services
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    invoice_number VARCHAR(100),
    description TEXT,
    is_refund BOOLEAN DEFAULT false,
    refund_reference UUID REFERENCES revenue_transactions(id),
    posted_to_gl BOOLEAN DEFAULT false,
    posted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- GL Account Assignments Table
-- Tracks automatic GL account assignments for different revenue sources
CREATE TABLE IF NOT EXISTS gl_account_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_type VARCHAR(50) NOT NULL, -- 'membership_category', 'service_type', 'pos_category', etc.
    assignment_value VARCHAR(255) NOT NULL, -- The category or type value
    gl_account_id UUID NOT NULL REFERENCES accounting_accounts(id),
    priority INTEGER DEFAULT 1, -- For handling multiple matches
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_assignment UNIQUE (assignment_type, assignment_value, is_active)
);

-- Deferred Revenue Tracking Table
-- Tracks prepaid services and memberships that haven't been delivered
CREATE TABLE IF NOT EXISTS deferred_revenue_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    revenue_transaction_id UUID NOT NULL REFERENCES revenue_transactions(id),
    member_id UUID NOT NULL REFERENCES members(id),
    source_type VARCHAR(50) NOT NULL,
    source_id UUID NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    recognized_amount DECIMAL(10,2) DEFAULT 0.00,
    remaining_amount DECIMAL(10,2) NOT NULL,
    recognition_start_date DATE,
    recognition_end_date DATE,
    recognition_method VARCHAR(50) DEFAULT 'straight_line', -- 'straight_line', 'usage_based', 'manual'
    is_fully_recognized BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accounts Receivable Tracking Table
-- Tracks outstanding member balances and payment schedules
CREATE TABLE IF NOT EXISTS accounts_receivable_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id),
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    original_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0.00,
    outstanding_amount DECIMAL(10,2) NOT NULL,
    ar_account_id UUID NOT NULL REFERENCES accounting_accounts(id),
    status VARCHAR(50) DEFAULT 'outstanding', -- 'outstanding', 'paid', 'overdue', 'written_off'
    days_overdue INTEGER DEFAULT 0,
    last_payment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revenue Recognition Rules Table
-- Defines how different types of revenue should be recognized
CREATE TABLE IF NOT EXISTS revenue_recognition_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type VARCHAR(50) NOT NULL,
    source_category VARCHAR(100),
    recognition_method VARCHAR(50) NOT NULL, -- 'immediate', 'deferred', 'usage_based'
    recognition_period_months INTEGER,
    requires_delivery_confirmation BOOLEAN DEFAULT false,
    gl_revenue_account_id UUID REFERENCES accounting_accounts(id),
    gl_deferred_account_id UUID REFERENCES accounting_accounts(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_revenue_mappings_source ON revenue_mappings(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_revenue_mappings_gl_account ON revenue_mappings(gl_account_id);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_date ON revenue_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_member ON revenue_transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_gl_account ON revenue_transactions(gl_account_id);
CREATE INDEX IF NOT EXISTS idx_deferred_revenue_member ON deferred_revenue_tracking(member_id);
CREATE INDEX IF NOT EXISTS idx_ar_tracking_member ON accounts_receivable_tracking(member_id);
CREATE INDEX IF NOT EXISTS idx_ar_tracking_status ON accounts_receivable_tracking(status);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_revenue_mappings_updated_at 
    BEFORE UPDATE ON revenue_mappings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revenue_transactions_updated_at 
    BEFORE UPDATE ON revenue_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gl_account_assignments_updated_at 
    BEFORE UPDATE ON gl_account_assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deferred_revenue_tracking_updated_at 
    BEFORE UPDATE ON deferred_revenue_tracking 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ar_tracking_updated_at 
    BEFORE UPDATE ON accounts_receivable_tracking 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE revenue_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gl_account_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deferred_revenue_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_receivable_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_recognition_rules ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be customized based on your auth system)
CREATE POLICY "Users can view revenue mappings" ON revenue_mappings
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage revenue mappings" ON revenue_mappings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role_name IN ('admin', 'manager', 'accountant')
        )
    );

CREATE POLICY "Users can view revenue transactions" ON revenue_transactions
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage revenue transactions" ON revenue_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role_name IN ('admin', 'manager', 'accountant')
        )
    );

-- Insert default financial accounts if they don't exist
INSERT INTO accounting_accounts (account_number, account_name, account_type, normal_balance, is_protected, is_active)
VALUES 
    ('1200', 'Accounts Receivable', 'Asset', 'debit', true, true),
    ('2100', 'Deferred Revenue', 'Liability', 'credit', true, true),
    ('1100', 'Cash - Checking Account', 'Asset', 'debit', true, true),
    ('1150', 'Credit Card Clearing', 'Asset', 'debit', true, true)
ON CONFLICT (account_number) DO NOTHING;

-- Insert default revenue recognition rules
INSERT INTO revenue_recognition_rules (source_type, recognition_method, recognition_period_months, is_active)
VALUES 
    ('membership', 'deferred', 1, true),
    ('service', 'immediate', null, true),
    ('pos_item', 'immediate', null, true),
    ('guest_fee', 'immediate', null, true),
    ('late_fee', 'immediate', null, true)
ON CONFLICT DO NOTHING;
