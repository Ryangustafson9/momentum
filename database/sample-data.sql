-- 🚀 SPRINT 1: SAMPLE DATA FOR MEMBER DASHBOARD
-- This file provides sample data to test the member dashboard functionality

-- ==================== SAMPLE INSTRUCTORS ====================
INSERT INTO instructors (id, first_name, last_name, email, specializations, bio, certifications) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Sarah', 'Johnson', 'sarah.johnson@momentum.com', 
 ARRAY['yoga', 'pilates'], 
 'Certified yoga instructor with 8 years of experience in Hatha and Vinyasa yoga.',
 ARRAY['RYT-500', 'Pilates Certification']),

('550e8400-e29b-41d4-a716-446655440002', 'Mike', 'Chen', 'mike.chen@momentum.com',
 ARRAY['hiit', 'strength'],
 'Former personal trainer specializing in high-intensity workouts and strength training.',
 ARRAY['NASM-CPT', 'HIIT Specialist']),

('550e8400-e29b-41d4-a716-446655440003', 'Emma', 'Rodriguez', 'emma.rodriguez@momentum.com',
 ARRAY['dance', 'cardio'],
 'Professional dancer turned fitness instructor, bringing energy and fun to every class.',
 ARRAY['Dance Fitness Certification', 'Group Fitness Instructor']);

-- ==================== SAMPLE CLASSES ====================
-- Morning Classes
INSERT INTO classes (id, name, description, instructor_id, class_type, difficulty_level, duration_minutes, max_capacity, start_time, end_time, location) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'Morning Yoga Flow', 'Start your day with gentle yoga movements and breathing exercises', 
 '550e8400-e29b-41d4-a716-446655440001', 'yoga', 'beginner', 60, 15,
 NOW() + INTERVAL '1 day' + TIME '09:00:00', NOW() + INTERVAL '1 day' + TIME '10:00:00', 'Studio A'),

('650e8400-e29b-41d4-a716-446655440002', 'HIIT Blast', 'High-intensity interval training to boost your metabolism',
 '550e8400-e29b-41d4-a716-446655440002', 'hiit', 'intermediate', 45, 12,
 NOW() + INTERVAL '2 days' + TIME '18:00:00', NOW() + INTERVAL '2 days' + TIME '18:45:00', 'Main Gym'),

('650e8400-e29b-41d4-a716-446655440003', 'Strength & Conditioning', 'Build muscle and improve overall strength',
 '550e8400-e29b-41d4-a716-446655440002', 'strength', 'intermediate', 60, 10,
 NOW() + INTERVAL '3 days' + TIME '10:00:00', NOW() + INTERVAL '3 days' + TIME '11:00:00', 'Weight Room'),

('650e8400-e29b-41d4-a716-446655440004', 'Dance Cardio Party', 'Fun dance workout that will get your heart pumping',
 '550e8400-e29b-41d4-a716-446655440003', 'dance', 'beginner', 50, 20,
 NOW() + INTERVAL '4 days' + TIME '19:00:00', NOW() + INTERVAL '4 days' + TIME '19:50:00', 'Studio B'),

('650e8400-e29b-41d4-a716-446655440005', 'Evening Yoga Restore', 'Relaxing yoga session to unwind after a long day',
 '550e8400-e29b-41d4-a716-446655440001', 'yoga', 'beginner', 75, 15,
 NOW() + INTERVAL '5 days' + TIME '20:00:00', NOW() + INTERVAL '5 days' + TIME '21:15:00', 'Studio A');

-- ==================== SAMPLE ANNOUNCEMENTS ====================
INSERT INTO announcements (title, content, announcement_type, priority, target_audience, start_date, end_date) VALUES
('Welcome to Momentum Fitness!', 
 'We''re excited to have you as part of our fitness community. Check out our class schedule and book your first session today!',
 'general', 'normal', 'members', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'),

('Special Offer: Bring a Friend Week', 
 'Bring a friend this week and get 10% off your next month''s membership! Valid for new member referrals only.',
 'promotion', 'high', 'members', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days'),

('Sauna Maintenance Notice', 
 'The sauna will be temporarily closed on May 20th for routine maintenance and upgrades. We apologize for any inconvenience.',
 'maintenance', 'normal', 'all', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '6 days'),

('New HIIT Classes Added!', 
 'Due to popular demand, we''ve added more HIIT classes to our schedule. Check out the new evening sessions!',
 'general', 'normal', 'members', CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days');

-- ==================== HELPER FUNCTIONS FOR TESTING ====================

-- Function to create a sample membership for a user
CREATE OR REPLACE FUNCTION create_sample_membership(user_id UUID)
RETURNS UUID AS $$
DECLARE
  membership_id UUID;
BEGIN
  INSERT INTO memberships (
    auth_user_id, 
    membership_type, 
    status, 
    join_date, 
    monthly_fee, 
    next_payment_date
  ) VALUES (
    user_id,
    'basic',
    'active',
    CURRENT_DATE - INTERVAL '30 days',
    49.99,
    CURRENT_DATE + INTERVAL '5 days'
  ) RETURNING id INTO membership_id;
  
  RETURN membership_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create sample bookings for a user
CREATE OR REPLACE FUNCTION create_sample_bookings(user_id UUID)
RETURNS VOID AS $$
DECLARE
  class_record RECORD;
BEGIN
  -- Book the user for the first 3 upcoming classes
  FOR class_record IN 
    SELECT id FROM classes 
    WHERE start_time > NOW() 
    ORDER BY start_time 
    LIMIT 3
  LOOP
    INSERT INTO bookings (member_id, class_id, booking_status, booking_date)
    VALUES (user_id, class_record.id, 'confirmed', NOW())
    ON CONFLICT (member_id, class_id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to create sample attendance records for a user
CREATE OR REPLACE FUNCTION create_sample_attendance(user_id UUID)
RETURNS VOID AS $$
DECLARE
  i INTEGER;
  class_id UUID;
  attendance_status TEXT;
BEGIN
  -- Create 12 attendance records (mix of present/absent)
  FOR i IN 1..12 LOOP
    -- Get a random past class (simulate past classes)
    SELECT gen_random_uuid() INTO class_id;
    
    -- 80% chance of being present
    IF random() < 0.8 THEN
      attendance_status := 'present';
    ELSE
      attendance_status := 'absent';
    END IF;
    
    INSERT INTO attendance (member_id, class_id, status, check_in_time)
    VALUES (
      user_id, 
      class_id, 
      attendance_status,
      CASE WHEN attendance_status = 'present' 
           THEN NOW() - INTERVAL '1 day' * i 
           ELSE NULL END
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==================== SETUP INSTRUCTIONS ====================
/*
To set up sample data for testing:

1. Run the schema.sql file first to create all tables
2. Run this sample-data.sql file to insert sample data
3. For each test user, run these functions:

-- Example for a user with ID 'your-user-id-here':
SELECT create_sample_membership('your-user-id-here');
SELECT create_sample_bookings('your-user-id-here');
SELECT create_sample_attendance('your-user-id-here');

This will give the user:
- An active membership with next payment due in 5 days
- Bookings for the next 3 upcoming classes
- 12 attendance records (mix of present/absent for realistic stats)
*/

-- ==================== VIEWS FOR DASHBOARD QUERIES ====================

-- View for member dashboard stats
CREATE OR REPLACE VIEW member_dashboard_stats AS
SELECT 
  m.auth_user_id,
  m.status as membership_status,
  m.next_payment_date,
  m.monthly_fee,
  COUNT(CASE WHEN a.status = 'present' THEN 1 END) as classes_attended,
  COUNT(a.id) as total_sessions,
  CASE 
    WHEN COUNT(a.id) > 0 
    THEN ROUND((COUNT(CASE WHEN a.status = 'present' THEN 1 END)::DECIMAL / COUNT(a.id)) * 100, 1)
    ELSE 0 
  END as attendance_percentage
FROM memberships m
LEFT JOIN attendance a ON a.member_id = m.auth_user_id
WHERE m.status = 'active'
GROUP BY m.auth_user_id, m.status, m.next_payment_date, m.monthly_fee;

-- View for upcoming classes with booking status
CREATE OR REPLACE VIEW member_upcoming_classes AS
SELECT 
  c.id,
  c.name,
  c.start_time,
  c.end_time,
  c.location,
  c.class_type,
  c.difficulty_level,
  i.first_name || ' ' || i.last_name as instructor_name,
  b.booking_status,
  b.member_id
FROM classes c
LEFT JOIN instructors i ON i.id = c.instructor_id
LEFT JOIN bookings b ON b.class_id = c.id
WHERE c.start_time > NOW() 
  AND c.is_cancelled = false
ORDER BY c.start_time;
