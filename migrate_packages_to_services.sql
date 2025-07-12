-- Migration Script: Rename Service Packages to Services
-- This script renames tables and columns to use "services" terminology

-- Step 1: Rename the main table from service_packages to services
ALTER TABLE service_packages RENAME TO services;

-- Step 2: Update related tables to reference "services" instead of "packages"
-- Rename package_locations to service_locations
ALTER TABLE package_locations RENAME TO service_locations;
ALTER TABLE service_locations RENAME COLUMN package_id TO service_id;

-- Rename package_staff to service_staff  
ALTER TABLE package_staff RENAME TO service_staff;
ALTER TABLE service_staff RENAME COLUMN package_id TO service_id;

-- Step 3: Update indexes to match new table names
-- Drop old indexes
DROP INDEX IF EXISTS idx_service_packages_category_id;
DROP INDEX IF EXISTS idx_service_packages_is_active;
DROP INDEX IF EXISTS idx_service_packages_package_type;
DROP INDEX IF EXISTS idx_package_locations_package_id;
DROP INDEX IF EXISTS idx_package_locations_location_id;
DROP INDEX IF EXISTS idx_package_staff_package_id;
DROP INDEX IF EXISTS idx_package_staff_staff_id;

-- Create new indexes with correct names
CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_service_type ON services(package_type); -- Will rename column next
CREATE INDEX IF NOT EXISTS idx_service_locations_service_id ON service_locations(service_id);
CREATE INDEX IF NOT EXISTS idx_service_locations_location_id ON service_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_service_staff_service_id ON service_staff(service_id);
CREATE INDEX IF NOT EXISTS idx_service_staff_staff_id ON service_staff(staff_id);

-- Step 4: Rename columns in services table to use service terminology
ALTER TABLE services RENAME COLUMN package_type TO service_type;

-- Step 5: Update RLS policies for renamed tables
-- Drop old policies
DROP POLICY IF EXISTS "Staff can view service packages" ON services;
DROP POLICY IF EXISTS "Admins can manage service packages" ON services;
DROP POLICY IF EXISTS "Staff can view package locations" ON service_locations;
DROP POLICY IF EXISTS "Admins can manage package locations" ON service_locations;
DROP POLICY IF EXISTS "Staff can view package staff assignments" ON service_staff;
DROP POLICY IF EXISTS "Admins can manage package staff assignments" ON service_staff;

-- Create new policies with correct names
CREATE POLICY "Staff can view services" ON services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can manage services" ON services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Staff can view service locations" ON service_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can manage service locations" ON service_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Staff can view service staff assignments" ON service_staff
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can manage service staff assignments" ON service_staff
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Step 6: Update foreign key constraints in future tables
-- Note: member_packages, package_sessions, etc. will be created later
-- When they are created, they should reference services(id) instead of service_packages(id)

-- Step 7: Update the sample data to use new terminology
UPDATE services SET service_type = 'sessions' WHERE service_type = 'sessions';
UPDATE services SET service_type = 'time_based' WHERE service_type = 'time_based';
UPDATE services SET service_type = 'unlimited' WHERE service_type = 'unlimited';
UPDATE services SET service_type = 'one_time' WHERE service_type = 'one_time';

-- Step 8: Create a function to help with the migration
CREATE OR REPLACE FUNCTION migrate_packages_to_services()
RETURNS void AS $$
BEGIN
  -- This function serves as a placeholder for any additional migration logic
  RAISE NOTICE 'Service packages have been successfully migrated to services';
END;
$$ LANGUAGE plpgsql;
