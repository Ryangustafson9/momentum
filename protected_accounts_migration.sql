-- Protected G/L Accounts Migration
-- This adds protection for critical accounting accounts that cannot be deleted

-- 1. Add is_protected column to accounting_accounts table
ALTER TABLE accounting_accounts ADD COLUMN IF NOT EXISTS is_protected BOOLEAN DEFAULT false;

-- 2. Create index for performance on protected accounts
CREATE INDEX IF NOT EXISTS idx_accounting_accounts_protected ON accounting_accounts(is_protected);

-- 3. Set protection for critical standard accounts
UPDATE accounting_accounts 
SET is_protected = true 
WHERE account_number IN ('1000', '2000', '4000', '5000', '6000')
   OR account_name IN (
     'Cash and Cash Equivalents',
     'Checking Account', 
     'Unearned Membership Fees',
     'Prepaid Membership Revenue',
     'Membership Revenue',
     'Monthly Membership Fees',
     'Payroll Expenses',
     'Salaries and Wages',
     'Rent Expense'
   );

-- 4. Insert protected accounts if they don't exist
INSERT INTO accounting_accounts (
  account_number, account_name, account_type, account_category, 
  normal_balance, is_active, is_protected, is_system_account
) VALUES
  ('1000', 'Cash and Cash Equivalents', 'Asset', 'Current Assets', 'debit', true, true, true),
  ('2000', 'Unearned Membership Fees', 'Liability', 'Current Liabilities', 'credit', true, true, true),
  ('4000', 'Membership Revenue', 'Revenue', 'Operating Revenue', 'credit', true, true, true),
  ('5000', 'Payroll Expenses', 'Expense', 'Operating Expenses', 'debit', true, true, true),
  ('6000', 'Rent Expense', 'Expense', 'Operating Expenses', 'debit', true, true, true)
ON CONFLICT (account_number) DO UPDATE SET
  is_protected = true,
  is_system_account = true;

-- 5. Add constraint to prevent deletion of protected accounts
-- Note: This will be enforced in application logic rather than database constraint
-- to provide better error messages to users

-- 6. Create function to check if account can be deleted (optional helper)
CREATE OR REPLACE FUNCTION can_delete_account(account_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_protected_account BOOLEAN;
BEGIN
  SELECT is_protected INTO is_protected_account
  FROM accounting_accounts
  WHERE id = account_id;
  
  RETURN NOT COALESCE(is_protected_account, false);
END;
$$ LANGUAGE plpgsql;

-- 7. Update RLS policies to handle protected accounts
-- Admins can view all accounts but deletion is controlled by application logic
DROP POLICY IF EXISTS "Admins can manage accounting accounts" ON accounting_accounts;
CREATE POLICY "Admins can manage accounting accounts" ON accounting_accounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 8. Add audit logging for protected account operations (optional)
CREATE TABLE IF NOT EXISTS accounting_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid REFERENCES accounting_accounts(id),
  action varchar(50) NOT NULL, -- 'DELETE_ATTEMPTED', 'PROTECTION_CHANGED', etc.
  user_id uuid REFERENCES profiles(id),
  details jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on audit log
ALTER TABLE accounting_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log" ON accounting_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 9. Create function to log protected account operations
CREATE OR REPLACE FUNCTION log_protected_account_operation(
  p_account_id UUID,
  p_action VARCHAR(50),
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO accounting_audit_log (account_id, action, user_id, details)
  VALUES (
    p_account_id, 
    p_action, 
    auth.uid(), 
    p_details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Verify protected accounts are set correctly
SELECT 
  account_number,
  account_name,
  account_type,
  is_protected,
  is_system_account
FROM accounting_accounts 
WHERE is_protected = true
ORDER BY account_number;
