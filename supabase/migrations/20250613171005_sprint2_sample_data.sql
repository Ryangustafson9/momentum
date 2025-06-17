-- 🚀 SPRINT 2: SAMPLE DATA FOR MEMBER DASHBOARD TESTING
-- This provides realistic test data for the Member Dashboard

-- ==================== SAMPLE INSTRUCTORS ====================
INSERT INTO instructors (id, first_name, last_name, email, specializations, bio, certifications, hourly_rate) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Sarah', 'Johnson', 'sarah.johnson@momentum.com',
 ARRAY['yoga', 'pilates'],
 'Certified yoga instructor with 8 years of experience in Hatha and Vinyasa yoga.',
 ARRAY['RYT-500', 'Pilates Certification'], 75.00),

('550e8400-e29b-41d4-a716-446655440002', 'Mike', 'Chen', 'mike.chen@momentum.com',
 ARRAY['hiit', 'strength'],
 'Former personal trainer specializing in high-intensity workouts and strength training.',
 ARRAY['NASM-CPT', 'HIIT Specialist'], 80.00),

('550e8400-e29b-41d4-a716-446655440003', 'Emma', 'Rodriguez', 'emma.rodriguez@momentum.com',
 ARRAY['dance', 'cardio'],
 'Professional dancer turned fitness instructor, bringing energy and fun to every class.',
 ARRAY['Dance Fitness Certification', 'Group Fitness Instructor'], 70.00)
ON CONFLICT (id) DO NOTHING;

-- ==================== UPDATE EXISTING CLASSES WITH NEW DATA ====================
-- Update existing classes to have proper instructor references and new fields
UPDATE classes SET
  class_type = 'yoga',
  duration_minutes = 60,
  equipment_needed = ARRAY['yoga mat', 'blocks'],
  price = 0.00,
  is_cancelled = false
WHERE name ILIKE '%yoga%' OR description ILIKE '%yoga%';

UPDATE classes SET
  class_type = 'hiit',
  duration_minutes = 45,
  equipment_needed = ARRAY['dumbbells', 'kettlebells'],
  price = 0.00,
  is_cancelled = false
WHERE name ILIKE '%hiit%' OR description ILIKE '%hiit%' OR name ILIKE '%high%intensity%';

UPDATE classes SET
  class_type = 'strength',
  duration_minutes = 60,
  equipment_needed = ARRAY['barbells', 'dumbbells', 'bench'],
  price = 0.00,
  is_cancelled = false
WHERE name ILIKE '%strength%' OR description ILIKE '%strength%' OR name ILIKE '%weight%';

UPDATE classes SET
  class_type = 'cardio',
  duration_minutes = 50,
  equipment_needed = ARRAY['none'],
  price = 0.00,
  is_cancelled = false
WHERE name ILIKE '%cardio%' OR description ILIKE '%cardio%' OR name ILIKE '%dance%';

-- Set default values for classes that don't match any pattern
UPDATE classes SET
  class_type = 'cardio',
  duration_minutes = 60,
  equipment_needed = ARRAY['none'],
  price = 0.00,
  is_cancelled = false
WHERE class_type IS NULL;

-- ==================== SAMPLE CLASSES ====================
-- Add some new sample classes without instructor references for now
INSERT INTO classes (id, name, description, class_type, duration_minutes, start_time, end_time, location, equipment_needed, max_capacity) VALUES
-- Tomorrow's classes
('650e8400-e29b-41d4-a716-446655440001', 'Morning Yoga Flow', 'Start your day with gentle yoga movements and breathing exercises',
 'yoga', 60,
 CURRENT_DATE + INTERVAL '1 day' + TIME '09:00:00', CURRENT_DATE + INTERVAL '1 day' + TIME '10:00:00',
 'Studio A', ARRAY['yoga mat', 'blocks'], 15),

('650e8400-e29b-41d4-a716-446655440002', 'HIIT Blast', 'High-intensity interval training to boost your metabolism',
 'hiit', 45,
 CURRENT_DATE + INTERVAL '1 day' + TIME '18:00:00', CURRENT_DATE + INTERVAL '1 day' + TIME '18:45:00',
 'Main Gym', ARRAY['dumbbells', 'kettlebells'], 12),

-- Day after tomorrow
('650e8400-e29b-41d4-a716-446655440003', 'Strength & Conditioning', 'Build muscle and improve overall strength',
 'strength', 60,
 CURRENT_DATE + INTERVAL '2 days' + TIME '10:00:00', CURRENT_DATE + INTERVAL '2 days' + TIME '11:00:00',
 'Weight Room', ARRAY['barbells', 'dumbbells', 'bench'], 10),

('650e8400-e29b-41d4-a716-446655440004', 'Dance Cardio Party', 'Fun dance workout that will get your heart pumping',
 'cardio', 50,
 CURRENT_DATE + INTERVAL '2 days' + TIME '19:00:00', CURRENT_DATE + INTERVAL '2 days' + TIME '19:50:00',
 'Studio B', ARRAY['none'], 20)
ON CONFLICT (id) DO NOTHING;

-- ==================== SAMPLE ANNOUNCEMENTS ====================
INSERT INTO announcements (title, content, announcement_type, priority, target_audience, start_date, end_date) VALUES
('Welcome to Momentum Fitness!',
 'We''re excited to have you as part of our fitness community. Check out our class schedule and book your first session today!',
 'general', 'normal', 'members', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'),

('Special Offer: Bring a Friend Week',
 'Bring a friend this week and get 10% off your next month''s membership! Valid for new member referrals only.',
 'promotion', 'high', 'members', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days'),

('New HIIT Classes Added!',
 'Due to popular demand, we''ve added more HIIT classes to our schedule. Check out the new early morning sessions!',
 'general', 'normal', 'members', CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days')
ON CONFLICT DO NOTHING;

-- ==================== HELPER FUNCTIONS ====================

-- Function to set up member data for existing users
CREATE OR REPLACE FUNCTION setup_member_data(user_id UUID, user_email TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Update profiles table to link with auth.users
  UPDATE profiles SET
    id = user_id,
    email = user_email,
    status = 'active'
  WHERE email = user_email;

  -- If no profile exists, create one
  INSERT INTO profiles (id, email, first_name, last_name, role, status)
  VALUES (
    user_id,
    user_email,
    split_part(user_email, '@', 1),
    'Member',
    'member',
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    status = 'active';

  -- Update memberships to link with auth.users
  UPDATE memberships SET
    auth_user_id = user_id,
    monthly_fee = 49.99,
    next_payment_date = CURRENT_DATE + INTERVAL '5 days',
    start_date = CURRENT_DATE - INTERVAL '30 days'
  WHERE id IN (
    SELECT m.id FROM memberships m
    JOIN profiles p ON p.id = m.id
    WHERE p.email = user_email
  );

  -- Create sample bookings for upcoming classes
  INSERT INTO bookings (member_id, class_id, booking_status, booking_date)
  SELECT
    user_id,
    c.id,
    'confirmed',
    NOW()
  FROM classes c
  WHERE c.start_time > NOW()
  ORDER BY c.start_time
  LIMIT 3
  ON CONFLICT (member_id, class_id) DO NOTHING;

  -- Return summary
  SELECT json_build_object(
    'profile_updated', true,
    'membership_updated', true,
    'bookings_created', (SELECT COUNT(*) FROM bookings WHERE member_id = user_id),
    'message', 'Member data setup complete!'
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;