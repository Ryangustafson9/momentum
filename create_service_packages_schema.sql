-- Service Package Management System Database Schema
-- This creates the complete database structure for managing service packages

-- Service Categories (hierarchical structure)
CREATE TABLE IF NOT EXISTS service_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name varchar(100) NOT NULL,
  description text,
  parent_id uuid REFERENCES service_categories(id) ON DELETE CASCADE,
  icon varchar(50), -- Icon name for UI
  color varchar(20), -- Color code for UI
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Service Packages
CREATE TABLE IF NOT EXISTS service_packages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name varchar(200) NOT NULL,
  description text,
  short_description varchar(500),
  category_id uuid REFERENCES service_categories(id) ON DELETE SET NULL,
  
  -- Package Configuration
  package_type varchar(50) DEFAULT 'sessions', -- sessions, time_based, unlimited, one_time
  capacity integer, -- Number of sessions/visits included (null for unlimited)
  duration_minutes integer, -- Duration per session in minutes
  
  -- Pricing
  price decimal(10,2) NOT NULL,
  compare_at_price decimal(10,2), -- Original price for discount display
  cost decimal(10,2), -- Cost to business (for profit calculations)
  
  -- Expiration Rules
  expiration_type varchar(50) DEFAULT 'time_based', -- time_based, usage_based, never
  expiration_days integer, -- Days until expiration (for time_based)
  expiration_sessions integer, -- Sessions until expiration (for usage_based)
  
  -- Availability
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  requires_membership boolean DEFAULT false,
  min_age integer,
  max_age integer,
  
  -- Booking Rules
  advance_booking_days integer DEFAULT 30, -- How far in advance can be booked
  cancellation_hours integer DEFAULT 24, -- Hours before session for free cancellation
  reschedule_hours integer DEFAULT 12, -- Hours before session for free reschedule
  
  -- Metadata
  tags text[], -- Array of tags for searching
  image_url text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Package Location Availability
CREATE TABLE IF NOT EXISTS package_locations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id uuid REFERENCES service_packages(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(package_id, location_id)
);

-- Package Staff Assignment (which staff can provide this service)
CREATE TABLE IF NOT EXISTS package_staff (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id uuid REFERENCES service_packages(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false, -- Primary staff member for this service
  commission_rate decimal(5,2), -- Commission percentage for this staff member
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(package_id, staff_id)
);

-- Member Package Purchases (when a member buys a package)
CREATE TABLE IF NOT EXISTS member_packages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  package_id uuid REFERENCES service_packages(id) ON DELETE RESTRICT,
  
  -- Purchase Details
  purchase_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  purchase_price decimal(10,2) NOT NULL,
  payment_method varchar(50),
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  
  -- Package Status
  status varchar(50) DEFAULT 'active', -- active, expired, cancelled, completed
  sessions_remaining integer, -- Sessions left (null for unlimited)
  sessions_used integer DEFAULT 0,
  
  -- Expiration
  expires_at timestamp with time zone,
  activated_at timestamp with time zone,
  
  -- Metadata
  notes text,
  purchased_by uuid REFERENCES profiles(id) ON DELETE SET NULL, -- Staff who sold it
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Package Session Bookings (individual session bookings from packages)
CREATE TABLE IF NOT EXISTS package_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  member_package_id uuid REFERENCES member_packages(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  
  -- Session Details
  scheduled_at timestamp with time zone NOT NULL,
  duration_minutes integer NOT NULL,
  status varchar(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
  
  -- Session Notes
  pre_session_notes text, -- Notes before session
  post_session_notes text, -- Notes after session
  member_feedback text, -- Member feedback
  staff_rating integer CHECK (staff_rating >= 1 AND staff_rating <= 5),
  
  -- Booking Management
  booked_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  booked_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  cancelled_at timestamp with time zone,
  cancelled_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  cancellation_reason text,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Package Bundles (combine multiple packages)
CREATE TABLE IF NOT EXISTS package_bundles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name varchar(200) NOT NULL,
  description text,
  bundle_price decimal(10,2) NOT NULL,
  discount_amount decimal(10,2), -- Total discount from individual prices
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bundle Items (packages included in bundles)
CREATE TABLE IF NOT EXISTS bundle_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id uuid REFERENCES package_bundles(id) ON DELETE CASCADE,
  package_id uuid REFERENCES service_packages(id) ON DELETE CASCADE,
  quantity integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(bundle_id, package_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_categories_parent_id ON service_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_service_categories_is_active ON service_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_service_packages_category_id ON service_packages(category_id);
CREATE INDEX IF NOT EXISTS idx_service_packages_is_active ON service_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_service_packages_package_type ON service_packages(package_type);
CREATE INDEX IF NOT EXISTS idx_package_locations_package_id ON package_locations(package_id);
CREATE INDEX IF NOT EXISTS idx_package_locations_location_id ON package_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_package_staff_package_id ON package_staff(package_id);
CREATE INDEX IF NOT EXISTS idx_package_staff_staff_id ON package_staff(staff_id);
CREATE INDEX IF NOT EXISTS idx_member_packages_member_id ON member_packages(member_id);
CREATE INDEX IF NOT EXISTS idx_member_packages_package_id ON member_packages(package_id);
CREATE INDEX IF NOT EXISTS idx_member_packages_status ON member_packages(status);
CREATE INDEX IF NOT EXISTS idx_package_sessions_member_package_id ON package_sessions(member_package_id);
CREATE INDEX IF NOT EXISTS idx_package_sessions_staff_id ON package_sessions(staff_id);
CREATE INDEX IF NOT EXISTS idx_package_sessions_scheduled_at ON package_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_package_sessions_status ON package_sessions(status);

-- Enable RLS on all tables
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Service Categories
CREATE POLICY "Staff can view service categories" ON service_categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can manage service categories" ON service_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for Service Packages
CREATE POLICY "Staff can view service packages" ON service_packages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can manage service packages" ON service_packages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for Package Locations
CREATE POLICY "Staff can view package locations" ON package_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can manage package locations" ON package_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for Package Staff
CREATE POLICY "Staff can view package staff assignments" ON package_staff
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can manage package staff assignments" ON package_staff
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for Member Packages
CREATE POLICY "Staff can view member packages" ON member_packages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Members can view their own packages" ON member_packages
  FOR SELECT USING (member_id = auth.uid());

CREATE POLICY "Staff can manage member packages" ON member_packages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- RLS Policies for Package Sessions
CREATE POLICY "Staff can view package sessions" ON package_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Members can view their own sessions" ON package_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM member_packages
      WHERE member_packages.id = package_sessions.member_package_id
      AND member_packages.member_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage package sessions" ON package_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- RLS Policies for Package Bundles
CREATE POLICY "Staff can view package bundles" ON package_bundles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can manage package bundles" ON package_bundles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for Bundle Items
CREATE POLICY "Staff can view bundle items" ON bundle_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can manage bundle items" ON bundle_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
