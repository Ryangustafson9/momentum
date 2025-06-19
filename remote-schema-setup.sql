-- ========================================
-- ESSENTIAL SCHEMA SETUP FOR MOMENTUM APP
-- Run this in Supabase SQL Editor
-- ========================================

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'nonmember' CHECK (role IN ('admin', 'staff', 'member', 'nonmember')),
  first_name TEXT,
  last_name TEXT,
  name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles
CREATE TRIGGER handle_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 2. Create membership_types table
CREATE TABLE IF NOT EXISTS membership_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  duration_months INTEGER,
  active BOOLEAN DEFAULT true,
  available_online BOOLEAN DEFAULT true,
  available_for_sale BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on membership_types
ALTER TABLE membership_types ENABLE ROW LEVEL SECURITY;

-- Create policy for membership_types
CREATE POLICY "Anyone can view membership types" ON membership_types
  FOR SELECT TO public USING (true);

-- 3. Insert some basic membership types
INSERT INTO membership_types (name, description, price, duration_months, active, available_online) VALUES
('Basic Monthly', 'Basic gym access for one month', 29.99, 1, true, true),
('Premium Monthly', 'Full gym access with classes for one month', 49.99, 1, true, true),
('Annual Basic', 'Basic gym access for one year', 299.99, 12, true, true),
('Annual Premium', 'Full gym access with classes for one year', 499.99, 12, true, true)
ON CONFLICT DO NOTHING;

-- 4. Create the admin user (you'll need to do this in the Auth section of Supabase dashboard)
-- Go to Authentication > Users and create a user with:
-- Email: admin@momentum.com
-- Password: Bu!!et0!
-- Then run this to create the profile:

-- Note: Replace 'USER_ID_HERE' with the actual UUID from the auth.users table
-- You can get this by running: SELECT id FROM auth.users WHERE email = 'admin@momentum.com';

-- INSERT INTO profiles (id, email, role, first_name, last_name, name) 
-- SELECT id, 'admin@momentum.com', 'admin', 'Admin', 'User', 'Admin User'
-- FROM auth.users 
-- WHERE email = 'admin@momentum.com';

SELECT 'Database schema setup complete!' as message;
