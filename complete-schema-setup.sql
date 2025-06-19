-- ========================================
-- COMPREHENSIVE SCHEMA SETUP FOR MOMENTUM APP
-- Run this in Supabase SQL Editor to create all essential tables
-- ========================================

-- 1. Create profiles table (if not exists)
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

-- 2. Create membership_types table (if not exists)
CREATE TABLE IF NOT EXISTS membership_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2),
  duration_months INTEGER,
  active BOOLEAN DEFAULT true,
  available_online BOOLEAN DEFAULT true,
  available_for_sale BOOLEAN DEFAULT true,
  category TEXT DEFAULT 'Member Plans' CHECK (category IN ('Member Plans', 'Staff Plans', 'Add-ons', 'Guest Plans')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create memberships table
CREATE TABLE IF NOT EXISTS memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_type_id UUID REFERENCES membership_types(id),
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Cancelled', 'Suspended')),
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create instructors table
CREATE TABLE IF NOT EXISTS instructors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  specialties TEXT[],
  bio TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES instructors(id),
  day_of_week TEXT CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INTEGER DEFAULT 20,
  location TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  booking_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'no-show')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(auth_user_id, class_id, booking_date)
);

-- 7. Create check_ins table
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_time TIMESTAMPTZ DEFAULT NOW(),
  check_out_time TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create basic policies for public read access
CREATE POLICY "Anyone can view membership types" ON membership_types
  FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can view classes" ON classes
  FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can view instructors" ON instructors
  FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can view announcements" ON announcements
  FOR SELECT TO public USING (active = true);

-- Create policies for user data
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own memberships" ON memberships
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can view own check-ins" ON check_ins
  FOR SELECT USING (auth.uid() = auth_user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_membership_types
  BEFORE UPDATE ON membership_types
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_memberships
  BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_instructors
  BEFORE UPDATE ON instructors
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_classes
  BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_announcements
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Insert sample membership types
INSERT INTO membership_types (name, description, price, duration_months, active, available_online, category) VALUES
('Basic Monthly', 'Basic gym access for one month', 29.99, 1, true, true, 'Member Plans'),
('Premium Monthly', 'Full gym access with classes for one month', 49.99, 1, true, true, 'Member Plans'),
('Annual Basic', 'Basic gym access for one year', 299.99, 12, true, true, 'Member Plans'),
('Annual Premium', 'Full gym access with classes for one year', 499.99, 12, true, true, 'Member Plans'),
('Student Monthly', 'Discounted membership for students', 19.99, 1, true, true, 'Member Plans'),
('Day Pass', 'Single day access', 15.00, 0, true, true, 'Guest Plans')
ON CONFLICT DO NOTHING;

-- Insert sample instructors
INSERT INTO instructors (first_name, last_name, email, specialties, bio, active) VALUES
('Sarah', 'Johnson', 'sarah.johnson@momentum.com', ARRAY['Yoga', 'Pilates'], 'Certified yoga instructor with 10+ years experience', true),
('Mike', 'Chen', 'mike.chen@momentum.com', ARRAY['Strength Training', 'CrossFit'], 'Former competitive athlete and strength coach', true),
('Lisa', 'Rodriguez', 'lisa.rodriguez@momentum.com', ARRAY['Cardio', 'HIIT'], 'High-energy fitness instructor specializing in cardio workouts', true),
('David', 'Wilson', 'david.wilson@momentum.com', ARRAY['Swimming', 'Aqua Fitness'], 'Swimming coach and aqua fitness specialist', true)
ON CONFLICT DO NOTHING;

-- Insert sample classes
INSERT INTO classes (name, description, instructor_id, day_of_week, start_time, end_time, capacity, location, status) VALUES
('Morning Yoga', 'Gentle yoga to start your day', (SELECT id FROM instructors WHERE first_name = 'Sarah' LIMIT 1), 'Monday', '07:00', '08:00', 15, 'Studio A', 'active'),
('Strength Training', 'Build muscle and strength', (SELECT id FROM instructors WHERE first_name = 'Mike' LIMIT 1), 'Tuesday', '18:00', '19:00', 12, 'Gym Floor', 'active'),
('HIIT Cardio', 'High-intensity interval training', (SELECT id FROM instructors WHERE first_name = 'Lisa' LIMIT 1), 'Wednesday', '19:00', '20:00', 20, 'Studio B', 'active'),
('Aqua Fitness', 'Low-impact water workout', (SELECT id FROM instructors WHERE first_name = 'David' LIMIT 1), 'Thursday', '10:00', '11:00', 10, 'Pool', 'active'),
('Evening Yoga', 'Relaxing yoga to end your day', (SELECT id FROM instructors WHERE first_name = 'Sarah' LIMIT 1), 'Thursday', '20:00', '21:00', 15, 'Studio A', 'active'),
('Weekend Strength', 'Weekend strength training session', (SELECT id FROM instructors WHERE first_name = 'Mike' LIMIT 1), 'Saturday', '10:00', '11:30', 15, 'Gym Floor', 'active')
ON CONFLICT DO NOTHING;

-- Insert sample announcement
INSERT INTO announcements (title, content, priority, active) VALUES
('Welcome to Momentum Gym!', 'We are excited to have you as a member. Check out our class schedule and book your first session today!', 'normal', true),
('New Equipment Arriving', 'We are getting new cardio equipment next week. Stay tuned for updates!', 'normal', true)
ON CONFLICT DO NOTHING;

SELECT 'All essential tables and sample data created successfully!' as message;
