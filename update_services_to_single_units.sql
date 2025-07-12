-- Update Services to Always Represent Single Units
-- This removes the "capacity" concept and makes services always represent 1 unit

-- Step 1: Remove capacity field from services table since services are now always 1 unit
ALTER TABLE services DROP COLUMN IF EXISTS capacity;

-- Step 2: Update service_type values to be clearer about single units
UPDATE services SET service_type = 'single_session' WHERE service_type = 'sessions';
UPDATE services SET service_type = 'single_service' WHERE service_type = 'one_time';
-- Keep 'time_based' and 'unlimited' as they make sense for single units

-- Step 3: Create member_service_purchases table for tracking service purchases
CREATE TABLE IF NOT EXISTS member_service_purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE RESTRICT,
  
  -- Purchase Details
  quantity_purchased integer NOT NULL DEFAULT 1, -- How many units they bought
  quantity_used integer DEFAULT 0, -- How many they've used
  quantity_remaining integer GENERATED ALWAYS AS (quantity_purchased - quantity_used) STORED,
  
  -- Purchase Info
  purchase_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  unit_price decimal(10,2) NOT NULL, -- Price per unit at time of purchase
  total_price decimal(10,2) NOT NULL, -- Total amount paid
  payment_method varchar(50),
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  
  -- Status and Expiration
  status varchar(50) DEFAULT 'active', -- active, expired, cancelled, completed
  expires_at timestamp with time zone,
  activated_at timestamp with time zone,
  
  -- Metadata
  notes text,
  purchased_by uuid REFERENCES profiles(id) ON DELETE SET NULL, -- Staff who sold it
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Constraints
  CONSTRAINT positive_quantities CHECK (quantity_purchased > 0 AND quantity_used >= 0),
  CONSTRAINT valid_remaining CHECK (quantity_used <= quantity_purchased)
);

-- Step 4: Create service_sessions table for tracking individual session usage
CREATE TABLE IF NOT EXISTS service_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  member_service_purchase_id uuid REFERENCES member_service_purchases(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  
  -- Session Details
  scheduled_at timestamp with time zone NOT NULL,
  duration_minutes integer NOT NULL,
  status varchar(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
  
  -- Session Notes
  pre_session_notes text,
  post_session_notes text,
  member_feedback text,
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

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_member_service_purchases_member_id ON member_service_purchases(member_id);
CREATE INDEX IF NOT EXISTS idx_member_service_purchases_service_id ON member_service_purchases(service_id);
CREATE INDEX IF NOT EXISTS idx_member_service_purchases_status ON member_service_purchases(status);
CREATE INDEX IF NOT EXISTS idx_service_sessions_purchase_id ON service_sessions(member_service_purchase_id);
CREATE INDEX IF NOT EXISTS idx_service_sessions_staff_id ON service_sessions(staff_id);
CREATE INDEX IF NOT EXISTS idx_service_sessions_scheduled_at ON service_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_service_sessions_status ON service_sessions(status);

-- Step 6: Enable RLS on new tables
ALTER TABLE member_service_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_sessions ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for member_service_purchases
CREATE POLICY "Staff can view member service purchases" ON member_service_purchases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Members can view their own service purchases" ON member_service_purchases
  FOR SELECT USING (member_id = auth.uid());

CREATE POLICY "Staff can manage member service purchases" ON member_service_purchases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Step 8: Create RLS policies for service_sessions
CREATE POLICY "Staff can view service sessions" ON service_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Members can view their own sessions" ON service_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM member_service_purchases 
      WHERE member_service_purchases.id = service_sessions.member_service_purchase_id 
      AND member_service_purchases.member_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage service sessions" ON service_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Step 9: Create a function to automatically update quantity_used when sessions are completed
CREATE OR REPLACE FUNCTION update_service_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- When a session is marked as completed, increment quantity_used
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE member_service_purchases 
    SET quantity_used = quantity_used + 1,
        updated_at = timezone('utc'::text, now())
    WHERE id = NEW.member_service_purchase_id;
  END IF;
  
  -- When a session is unmarked as completed, decrement quantity_used
  IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
    UPDATE member_service_purchases 
    SET quantity_used = GREATEST(0, quantity_used - 1),
        updated_at = timezone('utc'::text, now())
    WHERE id = NEW.member_service_purchase_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create trigger to automatically update usage
CREATE TRIGGER trigger_update_service_usage
  AFTER UPDATE ON service_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_service_usage();

-- Step 11: Update sample data to reflect single units
UPDATE services 
SET 
  name = CASE 
    WHEN name LIKE '%Package%' THEN REPLACE(name, 'Package (5 Sessions)', 'Session')
    WHEN name LIKE '%5-session%' THEN REPLACE(name, '5-session personal training package', 'Session')
    ELSE name
  END,
  short_description = CASE
    WHEN short_description LIKE '%5-session%' THEN 'One-on-one training with certified trainer'
    WHEN short_description LIKE '%package%' THEN REPLACE(short_description, 'package', 'session')
    ELSE short_description
  END,
  description = CASE
    WHEN description LIKE '%package%' THEN REPLACE(description, 'package', 'session')
    WHEN description LIKE '%5-session%' THEN 'Personalized fitness training session with a certified personal trainer. Includes fitness assessment, custom workout plan, and ongoing support.'
    ELSE description
  END,
  service_type = 'single_session'
WHERE service_type IN ('sessions', 'one_time');

-- Step 12: Update pricing to reflect per-unit pricing
UPDATE services 
SET 
  price = CASE 
    WHEN name LIKE '%Personal Training%' AND price > 100 THEN 75.00  -- Convert package price to per-session
    ELSE price
  END,
  compare_at_price = CASE
    WHEN name LIKE '%Personal Training%' AND compare_at_price > 100 THEN 85.00  -- Convert package compare price
    ELSE compare_at_price
  END
WHERE price > 100; -- Only update what looks like package pricing
