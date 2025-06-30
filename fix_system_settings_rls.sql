-- Fix RLS policies for system_settings table
-- The current policies are preventing admin users from updating settings

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read system settings" ON system_settings;
DROP POLICY IF EXISTS "Allow admin users to manage system settings" ON system_settings;

-- Create new, more permissive policies for system_settings
-- Allow all authenticated users to read system settings
CREATE POLICY "authenticated_users_can_read_system_settings" ON system_settings
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Allow admin users to manage system settings (more permissive check)
CREATE POLICY "admin_users_can_manage_system_settings" ON system_settings
  FOR ALL 
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Alternative: If the above still doesn't work, create a very permissive policy for testing
-- Uncomment the lines below if needed:

-- DROP POLICY IF EXISTS "admin_users_can_manage_system_settings" ON system_settings;
-- CREATE POLICY "temp_permissive_system_settings" ON system_settings
--   FOR ALL 
--   USING (auth.role() = 'authenticated');
