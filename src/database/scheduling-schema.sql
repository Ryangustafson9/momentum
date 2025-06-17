-- 🚀 ENHANCED SCHEDULING & RESOURCE MANAGEMENT SYSTEM
-- Comprehensive scheduling with trainer, room, and equipment management

-- Trainers/Instructors table
CREATE TABLE IF NOT EXISTS trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Trainer Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  bio TEXT,
  avatar_url TEXT,
  
  -- Professional Details
  certifications TEXT[], -- Array of certification names
  specialties TEXT[], -- Array of specialties (yoga, pilates, etc.)
  experience_years INTEGER DEFAULT 0,
  hourly_rate DECIMAL(10,2),
  
  -- Availability
  default_availability JSONB, -- Weekly availability schedule
  is_active BOOLEAN DEFAULT true,
  hire_date DATE DEFAULT CURRENT_DATE,
  
  -- Settings
  can_substitute BOOLEAN DEFAULT true,
  max_classes_per_day INTEGER DEFAULT 8,
  preferred_class_types TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rooms/Spaces table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Room Information
  name VARCHAR(100) NOT NULL,
  description TEXT,
  room_type VARCHAR(50) NOT NULL, -- 'studio', 'gym_floor', 'pool', 'court', etc.
  
  -- Capacity & Features
  capacity INTEGER NOT NULL DEFAULT 20,
  area_sqft INTEGER,
  features TEXT[], -- Array of features (mirrors, sound_system, etc.)
  equipment_included TEXT[], -- Built-in equipment
  
  -- Booking Settings
  is_bookable BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  advance_booking_days INTEGER DEFAULT 30,
  min_booking_duration INTEGER DEFAULT 60, -- minutes
  max_booking_duration INTEGER DEFAULT 180, -- minutes
  
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
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Equipment Information
  name VARCHAR(100) NOT NULL,
  description TEXT,
  equipment_type VARCHAR(50) NOT NULL, -- 'cardio', 'strength', 'free_weights', etc.
  brand VARCHAR(50),
  model VARCHAR(50),
  serial_number VARCHAR(100),
  
  -- Availability
  quantity_total INTEGER NOT NULL DEFAULT 1,
  quantity_available INTEGER NOT NULL DEFAULT 1,
  is_bookable BOOLEAN DEFAULT false, -- Some equipment can be reserved
  
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

-- Enhanced Classes table (extends existing classes)
-- Note: This assumes the existing classes table, we'll add columns
ALTER TABLE classes ADD COLUMN IF NOT EXISTS trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id) ON DELETE SET NULL;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS required_equipment UUID[] DEFAULT '{}';
ALTER TABLE classes ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS parent_class_id UUID REFERENCES classes(id) ON DELETE CASCADE;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS substitute_trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS room_setup_time INTEGER DEFAULT 15; -- minutes before class
ALTER TABLE classes ADD COLUMN IF NOT EXISTS room_cleanup_time INTEGER DEFAULT 15; -- minutes after class

-- Trainer Availability table
CREATE TABLE trainer_availability (
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
  recurrence_pattern JSONB, -- Weekly pattern, end date, etc.
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(trainer_id, date, start_time, end_time)
);

-- Room Bookings table
CREATE TABLE room_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Booking Details
  booked_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  booking_type VARCHAR(20) DEFAULT 'class' CHECK (booking_type IN ('class', 'private', 'maintenance', 'event')),
  
  -- Time
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  setup_time INTEGER DEFAULT 0, -- minutes before
  cleanup_time INTEGER DEFAULT 0, -- minutes after
  
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

-- Equipment Bookings table
CREATE TABLE equipment_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Booking Details
  booked_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quantity_booked INTEGER NOT NULL DEFAULT 1,
  
  -- Time
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Associated Records
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  room_booking_id UUID REFERENCES room_bookings(id) ON DELETE CASCADE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  
  -- Notes
  purpose TEXT,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Class Templates table (for recurring classes)
CREATE TABLE class_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Template Information
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Default Settings
  default_trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
  default_room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  default_capacity INTEGER DEFAULT 20,
  default_duration INTEGER DEFAULT 60, -- minutes
  default_price DECIMAL(10,2) DEFAULT 0,
  
  -- Requirements
  required_equipment UUID[],
  required_certifications TEXT[],
  
  -- Recurrence Settings
  recurrence_pattern JSONB NOT NULL, -- Day of week, time, frequency
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Substitutions table
CREATE TABLE class_substitutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Original Details
  original_trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
  original_room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  original_start_time TIMESTAMP WITH TIME ZONE,
  
  -- Substitute Details
  substitute_trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
  substitute_room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  new_start_time TIMESTAMP WITH TIME ZONE,
  
  -- Substitution Info
  substitution_type VARCHAR(20) DEFAULT 'trainer' CHECK (substitution_type IN ('trainer', 'room', 'time', 'cancellation')),
  reason TEXT,
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  
  -- Notifications
  members_notified BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Waitlist Management (enhanced)
CREATE TABLE class_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Waitlist Position
  position INTEGER NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Preferences
  auto_book BOOLEAN DEFAULT true,
  notification_preferences JSONB DEFAULT '{"email": true, "sms": false}',
  
  -- Status
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'offered', 'booked', 'expired', 'cancelled')),
  
  -- Offer Management
  offer_expires_at TIMESTAMP WITH TIME ZONE,
  offer_sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(class_id, member_id)
);

-- Schedule Conflicts table (for tracking and resolving conflicts)
CREATE TABLE schedule_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
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

-- Indexes for performance
CREATE INDEX idx_trainers_org ON trainers(organization_id);
CREATE INDEX idx_trainers_active ON trainers(is_active) WHERE is_active = true;
CREATE INDEX idx_rooms_org ON rooms(organization_id);
CREATE INDEX idx_rooms_bookable ON rooms(is_bookable) WHERE is_bookable = true;
CREATE INDEX idx_equipment_org ON equipment(organization_id);
CREATE INDEX idx_equipment_bookable ON equipment(is_bookable) WHERE is_bookable = true;
CREATE INDEX idx_trainer_availability_date ON trainer_availability(trainer_id, date);
CREATE INDEX idx_room_bookings_time ON room_bookings(room_id, start_time, end_time);
CREATE INDEX idx_equipment_bookings_time ON equipment_bookings(equipment_id, start_time, end_time);
CREATE INDEX idx_class_templates_active ON class_templates(organization_id, is_active);
CREATE INDEX idx_class_substitutions_class ON class_substitutions(class_id, status);
CREATE INDEX idx_waitlist_class_position ON class_waitlist(class_id, position);
CREATE INDEX idx_schedule_conflicts_unresolved ON schedule_conflicts(organization_id, status) WHERE status = 'unresolved';

-- Enhanced classes indexes
CREATE INDEX IF NOT EXISTS idx_classes_trainer ON classes(trainer_id);
CREATE INDEX IF NOT EXISTS idx_classes_room ON classes(room_id);
CREATE INDEX IF NOT EXISTS idx_classes_recurring ON classes(is_recurring, parent_class_id);

-- Row Level Security
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_substitutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_conflicts ENABLE ROW LEVEL SECURITY;

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

-- Function to auto-promote waitlist
CREATE OR REPLACE FUNCTION promote_from_waitlist(class_id UUID) RETURNS VOID AS $$
DECLARE
  waitlist_member RECORD;
  available_spots INTEGER;
BEGIN
  -- Get available spots
  SELECT (c.capacity - COUNT(cb.id)) INTO available_spots
  FROM classes c
  LEFT JOIN class_bookings cb ON c.id = cb.class_id AND cb.status = 'confirmed'
  WHERE c.id = promote_from_waitlist.class_id
  GROUP BY c.capacity;
  
  -- Promote members from waitlist
  FOR waitlist_member IN 
    SELECT * FROM class_waitlist 
    WHERE class_waitlist.class_id = promote_from_waitlist.class_id 
      AND status = 'waiting'
      AND auto_book = true
    ORDER BY position
    LIMIT available_spots
  LOOP
    -- Create booking
    INSERT INTO class_bookings (class_id, member_id, status, booked_at)
    VALUES (promote_from_waitlist.class_id, waitlist_member.member_id, 'confirmed', NOW());
    
    -- Update waitlist status
    UPDATE class_waitlist 
    SET status = 'booked'
    WHERE id = waitlist_member.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
