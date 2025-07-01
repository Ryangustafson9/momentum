-- Create basic invoices table to eliminate 404 errors across the application
-- This is a minimal implementation to stop the console errors

CREATE TABLE IF NOT EXISTS invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  total_amount decimal(10,2) DEFAULT 0.00,
  status varchar(50) DEFAULT 'pending',
  invoice_number varchar(100),
  description text,
  due_date timestamp with time zone,
  paid_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_location_id ON invoices(location_id);
CREATE INDEX IF NOT EXISTS idx_invoices_profile_id ON invoices(profile_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own invoices" ON invoices
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Staff can view all invoices" ON invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Staff can manage invoices" ON invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Add some sample data to test analytics (optional)
INSERT INTO invoices (location_id, total_amount, status, created_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 99.99, 'paid', NOW() - INTERVAL '1 month'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 149.99, 'paid', NOW() - INTERVAL '2 weeks'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 79.99, 'paid', NOW() - INTERVAL '1 week'),
  ('fb15743b-fbba-49f1-8aca-1f5ee9b5d52d', 199.99, 'paid', NOW() - INTERVAL '3 days'),
  ('5514dc85-1ff7-47b5-b1eb-1cc9412e6276', 129.99, 'paid', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000001', 89.99, 'paid', NOW())
ON CONFLICT DO NOTHING;
