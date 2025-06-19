-- 🚀 SCHEDULING SYSTEM MIGRATION
-- Run this in Supabase SQL Editor to create all scheduling tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organizations table if it doesn't exist (for multi-tenant support)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  currency VARCHAR(3) DEFAULT 'USD',
  stripe_account_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default organization if none exists
INSERT INTO organizations (id, name, slug) 
SELECT 'default-org-id'::UUID, 'Default Organization', 'default'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE slug = 'default');

-- Trainers/Instructors table
CREATE TABLE IF NOT EXISTS trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID DEFAULT 'default-org-id'::UUID,
  
  -- Trainer Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  bio TEXT,
  avatar_url TEXT,
  
  -- Professional Details
  certifications TEXT[] DEFAULT '{}',
  specialties TEXT[] DEFAULT '{}',
  experience_years INTEGER DEFAULT 0,
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  
  -- Availability
  default_availability JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  hire_date DATE DEFAULT CURRENT_DATE,
  
  -- Settings
  can_substitute BOOLEAN DEFAULT true,
  max_classes_per_day INTEGER DEFAULT 8,
  preferred_class_types TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rooms/Spaces table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID DEFAULT 'default-org-id'::UUID,
  
  -- Room Information
  name VARCHAR(100) NOT NULL,
  description TEXT,
  room_type VARCHAR(50) NOT NULL DEFAULT 'studio',
  
  -- Capacity & Features
  capacity INTEGER NOT NULL DEFAULT 20,
  area_sqft INTEGER,
  features TEXT[] DEFAULT '{}',
  equipment_included TEXT[] DEFAULT '{}',
  
  -- Booking Settings
  is_bookable BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  advance_booking_days INTEGER DEFAULT 30,
  min_booking_duration INTEGER DEFAULT 60,
  max_booking_duration INTEGER DEFAULT 180,
  
  -- Pricing
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  maintenance_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID DEFAULT 'default-org-id'::UUID,
  
  -- Equipment Information
  name VARCHAR(100) NOT NULL,
  description TEXT,
  equipment_type VARCHAR(50) NOT NULL DEFAULT 'general',
  brand VARCHAR(50),
  model VARCHAR(50),
  serial_number VARCHAR(100),
  
  -- Availability
  quantity_total INTEGER NOT NULL DEFAULT 1,
  quantity_available INTEGER NOT NULL DEFAULT 1,
  is_bookable BOOLEAN DEFAULT false,
  
  -- Maintenance
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  maintenance_interval_days INTEGER DEFAULT 90,
  maintenance_notes TEXT,
  
  -- Location
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  location_notes TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'out_of_order', 'retired')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add scheduling columns to existing classes table
DO $$ 
BEGIN
  -- Add trainer_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'trainer_id') THEN
    ALTER TABLE classes ADD COLUMN trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL;
  END IF;
  
  -- Add room_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'room_id') THEN
    ALTER TABLE classes ADD COLUMN room_id UUID REFERENCES rooms(id) ON DELETE SET NULL;
  END IF;
  
  -- Add other scheduling columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'required_equipment') THEN
    ALTER TABLE classes ADD COLUMN required_equipment UUID[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'is_recurring') THEN
    ALTER TABLE classes ADD COLUMN is_recurring BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'recurrence_pattern') THEN
    ALTER TABLE classes ADD COLUMN recurrence_pattern JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'parent_class_id') THEN
    ALTER TABLE classes ADD COLUMN parent_class_id UUID REFERENCES classes(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'substitute_trainer_id') THEN
    ALTER TABLE classes ADD COLUMN substitute_trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'room_setup_time') THEN
    ALTER TABLE classes ADD COLUMN room_setup_time INTEGER DEFAULT 15;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'room_cleanup_time') THEN
    ALTER TABLE classes ADD COLUMN room_cleanup_time INTEGER DEFAULT 15;
  END IF;
END $$;

-- Trainer Availability table
CREATE TABLE IF NOT EXISTS trainer_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE,
  
  -- Time Period
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Availability Type
  availability_type VARCHAR(20) DEFAULT 'available' CHECK (availability_type IN ('available', 'unavailable', 'preferred')),
  
  -- Recurring Pattern
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(trainer_id, date, start_time, end_time)
);

-- Room Bookings table
CREATE TABLE IF NOT EXISTS room_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  organization_id UUID DEFAULT 'default-org-id'::UUID,
  
  -- Booking Details
  booked_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  booking_type VARCHAR(20) DEFAULT 'class' CHECK (booking_type IN ('class', 'private', 'maintenance', 'event')),
  
  -- Time
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  setup_time INTEGER DEFAULT 0,
  cleanup_time INTEGER DEFAULT 0,
  
  -- Associated Records
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  
  -- Notes
  purpose TEXT,
  special_requirements TEXT,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedule Conflicts table
CREATE TABLE IF NOT EXISTS schedule_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID DEFAULT 'default-org-id'::UUID,
  
  -- Conflict Details
  conflict_type VARCHAR(30) NOT NULL CHECK (conflict_type IN ('trainer_double_booked', 'room_double_booked', 'equipment_unavailable', 'trainer_unavailable')),
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Affected Resources
  trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  
  -- Affected Classes
  class_ids UUID[] NOT NULL,
  
  -- Time Period
  conflict_start TIMESTAMP WITH TIME ZONE NOT NULL,
  conflict_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Resolution
  status VARCHAR(20) DEFAULT 'unresolved' CHECK (status IN ('unresolved', 'resolved', 'ignored')),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trainers_active ON trainers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_rooms_bookable ON rooms(is_bookable) WHERE is_bookable = true;
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_trainer_availability_date ON trainer_availability(trainer_id, date);
CREATE INDEX IF NOT EXISTS idx_room_bookings_time ON room_bookings(room_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_classes_trainer ON classes(trainer_id) WHERE trainer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_classes_room ON classes(room_id) WHERE room_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_schedule_conflicts_unresolved ON schedule_conflicts(organization_id, status) WHERE status = 'unresolved';

-- Functions for conflict detection
CREATE OR REPLACE FUNCTION check_trainer_availability(
  trainer_id UUID,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  exclude_class_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  -- Check for existing classes
  SELECT COUNT(*) INTO conflict_count
  FROM classes c
  WHERE c.trainer_id = check_trainer_availability.trainer_id
    AND c.id != COALESCE(exclude_class_id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND c.status != 'cancelled'
    AND (
      (c.start_time, c.end_time) OVERLAPS (start_time, end_time)
    );
  
  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_room_availability(
  room_id UUID,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  exclude_booking_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  -- Check for existing bookings
  SELECT COUNT(*) INTO conflict_count
  FROM room_bookings rb
  WHERE rb.room_id = check_room_availability.room_id
    AND rb.id != COALESCE(exclude_booking_id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND rb.status != 'cancelled'
    AND (
      (rb.start_time - INTERVAL '1 minute' * rb.setup_time, 
       rb.end_time + INTERVAL '1 minute' * rb.cleanup_time) 
      OVERLAPS (start_time, end_time)
    );
  
  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing
INSERT INTO trainers (first_name, last_name, email, specialties, hourly_rate, is_active) VALUES
('Sarah', 'Johnson', 'sarah.johnson@momentum.gym', ARRAY['Yoga', 'Pilates'], 45.00, true),
('Mike', 'Chen', 'mike.chen@momentum.gym', ARRAY['CrossFit', 'Strength Training'], 50.00, true),
('Emma', 'Davis', 'emma.davis@momentum.gym', ARRAY['Spin', 'Cardio'], 40.00, true),
('Alex', 'Rodriguez', 'alex.rodriguez@momentum.gym', ARRAY['Boxing', 'HIIT'], 48.00, true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO rooms (name, room_type, capacity, features) VALUES
('Studio A', 'studio', 25, ARRAY['Mirrors', 'Sound System', 'Air Conditioning']),
('Studio B', 'studio', 20, ARRAY['Mirrors', 'Sound System']),
('Spin Room', 'cardio', 30, ARRAY['Spin Bikes', 'Sound System', 'Ventilation']),
('Boxing Ring', 'specialty', 15, ARRAY['Boxing Ring', 'Heavy Bags', 'Sound System']),
('Main Gym Floor', 'gym_floor', 50, ARRAY['Free Weights', 'Machines', 'Functional Training Area'])
ON CONFLICT DO NOTHING;

INSERT INTO equipment (name, equipment_type, quantity_total, quantity_available, room_id) VALUES
('Yoga Mats', 'yoga', 30, 30, (SELECT id FROM rooms WHERE name = 'Studio A' LIMIT 1)),
('Dumbbells Set', 'strength', 1, 1, (SELECT id FROM rooms WHERE name = 'Main Gym Floor' LIMIT 1)),
('Spin Bikes', 'cardio', 25, 25, (SELECT id FROM rooms WHERE name = 'Spin Room' LIMIT 1)),
('Boxing Gloves', 'boxing', 20, 20, (SELECT id FROM rooms WHERE name = 'Boxing Ring' LIMIT 1)),
('Resistance Bands', 'general', 15, 15, (SELECT id FROM rooms WHERE name = 'Studio B' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Scheduling system database schema created successfully!' as message;
