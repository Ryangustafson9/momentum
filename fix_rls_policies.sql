-- Fix RLS policies for accounting_accounts table

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations on accounting_accounts" ON accounting_accounts;
DROP POLICY IF EXISTS "Admins can manage accounting accounts" ON accounting_accounts;

-- Create a simple policy that allows all operations for now
CREATE POLICY "Allow all operations" ON accounting_accounts
  FOR ALL USING (true);

-- Also fix the templates table
DROP POLICY IF EXISTS "Allow all operations on accounting_templates" ON accounting_account_templates;
CREATE POLICY "Allow all operations on templates" ON accounting_account_templates
  FOR ALL USING (true);

-- Verify the policies
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('accounting_accounts', 'accounting_account_templates');
