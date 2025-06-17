-- 🚀 SPRINT 2: SAMPLE DATA FOR FITNESS MANAGEMENT SYSTEM
-- This provides realistic test data for the Member Dashboard and booking system

-- ==================== SAMPLE INSTRUCTORS ====================
INSERT INTO instructors (id, first_name, last_name, email, specializations, bio, certifications, hourly_rate) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Sarah', 'Johnson', 'sarah.johnson@momentum.com', 
 ARRAY['yoga', 'pilates'], 
 'Certified yoga instructor with 8 years of experience in Hatha and Vinyasa yoga. Passionate about helping students find balance and strength.',
 ARRAY['RYT-500', 'Pilates Certification'], 75.00),

('550e8400-e29b-41d4-a716-446655440002', 'Mike', 'Chen', 'mike.chen@momentum.com',
 ARRAY['hiit', 'strength'],
 'Former personal trainer specializing in high-intensity workouts and strength training. Believes in pushing limits safely.',
 ARRAY['NASM-CPT', 'HIIT Specialist'], 80.00),

('550e8400-e29b-41d4-a716-446655440003', 'Emma', 'Rodriguez', 'emma.rodriguez@momentum.com',
 ARRAY['dance', 'cardio'],
 'Professional dancer turned fitness instructor, bringing energy and fun to every class. Makes fitness feel like a party!',
 ARRAY['Dance Fitness Certification', 'Group Fitness Instructor'], 70.00),

('550e8400-e29b-41d4-a716-446655440004', 'David', 'Thompson', 'david.thompson@momentum.com',
 ARRAY['strength', 'martial_arts'],
 'Black belt in karate with 15 years of experience. Combines martial arts discipline with modern strength training.',
 ARRAY['Karate Black Belt', 'Strength & Conditioning Specialist'], 85.00);

-- ==================== SAMPLE CLASSES ====================
-- Morning Classes
INSERT INTO classes (id, name, description, instructor_id, class_type, difficulty_level, duration_minutes, max_capacity, start_time, end_time, location, equipment_needed) VALUES
-- Today's classes
('650e8400-e29b-41d4-a716-446655440001', 'Morning Yoga Flow', 'Start your day with gentle yoga movements and breathing exercises', 
 '550e8400-e29b-41d4-a716-446655440001', 'yoga', 'beginner', 60, 15,
 CURRENT_DATE + INTERVAL '1 day' + TIME '09:00:00', CURRENT_DATE + INTERVAL '1 day' + TIME '10:00:00', 
 'Studio A', ARRAY['yoga mat', 'blocks']),

('650e8400-e29b-41d4-a716-446655440002', 'HIIT Blast', 'High-intensity interval training to boost your metabolism',
 '550e8400-e29b-41d4-a716-446655440002', 'hiit', 'intermediate', 45, 12,
 CURRENT_DATE + INTERVAL '1 day' + TIME '18:00:00', CURRENT_DATE + INTERVAL '1 day' + TIME '18:45:00', 
 'Main Gym', ARRAY['dumbbells', 'kettlebells']),

-- Tomorrow's classes
('650e8400-e29b-41d4-a716-446655440003', 'Strength & Conditioning', 'Build muscle and improve overall strength',
 '550e8400-e29b-41d4-a716-446655440002', 'strength', 'intermediate', 60, 10,
 CURRENT_DATE + INTERVAL '2 days' + TIME '10:00:00', CURRENT_DATE + INTERVAL '2 days' + TIME '11:00:00', 
 'Weight Room', ARRAY['barbells', 'dumbbells', 'bench']),

('650e8400-e29b-41d4-a716-446655440004', 'Dance Cardio Party', 'Fun dance workout that will get your heart pumping',
 '550e8400-e29b-41d4-a716-446655440003', 'dance', 'beginner', 50, 20,
 CURRENT_DATE + INTERVAL '2 days' + TIME '19:00:00', CURRENT_DATE + INTERVAL '2 days' + TIME '19:50:00', 
 'Studio B', ARRAY['none']),

-- Day after tomorrow
('650e8400-e29b-41d4-a716-446655440005', 'Evening Yoga Restore', 'Relaxing yoga session to unwind after a long day',
 '550e8400-e29b-41d4-a716-446655440001', 'yoga', 'beginner', 75, 15,
 CURRENT_DATE + INTERVAL '3 days' + TIME '20:00:00', CURRENT_DATE + INTERVAL '3 days' + TIME '21:15:00', 
 'Studio A', ARRAY['yoga mat', 'bolsters', 'blankets']),

('650e8400-e29b-41d4-a716-446655440006', 'Martial Arts Fundamentals', 'Learn basic martial arts techniques and self-defense',
 '550e8400-e29b-41d4-a716-446655440004', 'martial_arts', 'beginner', 60, 8,
 CURRENT_DATE + INTERVAL '3 days' + TIME '17:00:00', CURRENT_DATE + INTERVAL '3 days' + TIME '18:00:00', 
 'Dojo', ARRAY['none']),

-- Next week classes
('650e8400-e29b-41d4-a716-446655440007', 'Advanced HIIT Challenge', 'Push your limits with this intense workout',
 '550e8400-e29b-41d4-a716-446655440002', 'hiit', 'advanced', 45, 8,
 CURRENT_DATE + INTERVAL '4 days' + TIME '06:00:00', CURRENT_DATE + INTERVAL '4 days' + TIME '06:45:00', 
 'Main Gym', ARRAY['battle ropes', 'kettlebells', 'medicine balls']),

('650e8400-e29b-41d4-a716-446655440008', 'Pilates Core Focus', 'Strengthen your core with targeted pilates exercises',
 '550e8400-e29b-41d4-a716-446655440001', 'pilates', 'intermediate', 50, 12,
 CURRENT_DATE + INTERVAL '5 days' + TIME '12:00:00', CURRENT_DATE + INTERVAL '5 days' + TIME '12:50:00', 
 'Studio A', ARRAY['pilates mat', 'resistance bands']);

-- ==================== SAMPLE ANNOUNCEMENTS ====================
INSERT INTO announcements (title, content, announcement_type, priority, target_audience, start_date, end_date) VALUES
('Welcome to Momentum Fitness!', 
 'We''re excited to have you as part of our fitness community. Check out our class schedule and book your first session today! Don''t forget to download our mobile app for easy booking and tracking.',
 'general', 'normal', 'members', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'),

('Special Offer: Bring a Friend Week', 
 'Bring a friend this week and get 10% off your next month''s membership! Valid for new member referrals only. Your friend will also receive a free trial week. Spread the fitness love!',
 'promotion', 'high', 'members', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days'),

('New HIIT Classes Added!', 
 'Due to popular demand, we''ve added more HIIT classes to our schedule. Check out the new early morning sessions at 6:00 AM for those who want to start their day with energy!',
 'general', 'normal', 'members', CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days'),

('Equipment Maintenance Notice', 
 'Some cardio equipment will be temporarily unavailable on Saturday morning (8 AM - 12 PM) for routine maintenance and upgrades. All classes will proceed as scheduled. Thank you for your patience!',
 'maintenance', 'normal', 'all', CURRENT_DATE + INTERVAL '2 days', CURRENT_DATE + INTERVAL '3 days'),

('New Instructor: David Thompson', 
 'We''re thrilled to welcome David Thompson to our team! David brings 15 years of martial arts experience and will be teaching our new Martial Arts Fundamentals class. Join us in welcoming him!',
 'general', 'normal', 'all', CURRENT_DATE, CURRENT_DATE + INTERVAL '21 days');

-- ==================== HELPER FUNCTIONS FOR USER SETUP ====================

-- Function to create a complete member profile with membership and sample data
CREATE OR REPLACE FUNCTION setup_member_data(user_id UUID, user_email TEXT)
RETURNS JSON AS $$
DECLARE
  membership_id UUID;
  result JSON;
BEGIN
  -- Create or update profile
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
    updated_at = NOW();

  -- Create membership
  INSERT INTO memberships (auth_user_id, membership_type, status, start_date, monthly_fee, next_payment_date)
  VALUES (
    user_id,
    'basic',
    'active',
    CURRENT_DATE - INTERVAL '30 days',
    49.99,
    CURRENT_DATE + INTERVAL '5 days'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO membership_id;

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

  -- Create sample attendance records (80% attendance rate)
  INSERT INTO attendance (member_id, member_name, class_name, status, check_in_time)
  SELECT 
    user_id,
    split_part(user_email, '@', 1) || ' Member',
    'Sample Class ' || generate_series,
    CASE WHEN random() < 0.8 THEN 'Present' ELSE 'Absent' END,
    CASE WHEN random() < 0.8 THEN NOW() - INTERVAL '1 day' * generate_series ELSE NULL END
  FROM generate_series(1, 12);

  -- Return summary
  SELECT json_build_object(
    'profile_created', true,
    'membership_id', membership_id,
    'bookings_created', (SELECT COUNT(*) FROM bookings WHERE member_id = user_id),
    'attendance_records', (SELECT COUNT(*) FROM attendance WHERE member_id = user_id),
    'message', 'Member data setup complete!'
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get member dashboard stats
CREATE OR REPLACE FUNCTION get_member_dashboard_stats(user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'membership', (
      SELECT json_build_object(
        'status', status,
        'type', membership_type,
        'next_payment_date', next_payment_date,
        'monthly_fee', monthly_fee
      )
      FROM memberships 
      WHERE auth_user_id = user_id
      LIMIT 1
    ),
    'attendance', (
      SELECT json_build_object(
        'total_sessions', COUNT(*),
        'present_sessions', COUNT(*) FILTER (WHERE status = 'Present'),
        'attendance_rate', ROUND(
          (COUNT(*) FILTER (WHERE status = 'Present')::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 1
        )
      )
      FROM attendance 
      WHERE member_id = user_id
    ),
    'upcoming_classes', (
      SELECT json_agg(
        json_build_object(
          'id', c.id,
          'name', c.name,
          'start_time', c.start_time,
          'location', c.location,
          'instructor', i.first_name || ' ' || i.last_name
        )
      )
      FROM bookings b
      JOIN classes c ON c.id = b.class_id
      LEFT JOIN instructors i ON i.id = c.instructor_id
      WHERE b.member_id = user_id 
        AND c.start_time > NOW()
        AND b.booking_status = 'confirmed'
      ORDER BY c.start_time
      LIMIT 5
    ),
    'announcements', (
      SELECT json_agg(
        json_build_object(
          'title', title,
          'content', content,
          'type', announcement_type,
          'priority', priority
        )
      )
      FROM announcements
      WHERE is_active = true
        AND (start_date IS NULL OR start_date <= CURRENT_DATE)
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
      ORDER BY priority DESC, created_at DESC
      LIMIT 3
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
