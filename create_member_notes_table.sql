-- Create member_notes table for tracking staff interactions with members
-- This table stores notes, communications, and important information about members

CREATE TABLE IF NOT EXISTS member_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  type varchar(50) DEFAULT 'general', -- general, important, billing, complaint, etc.
  priority varchar(20) DEFAULT 'normal', -- normal, high
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_member_notes_member_id ON member_notes(member_id);
CREATE INDEX IF NOT EXISTS idx_member_notes_created_by ON member_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_member_notes_created_at ON member_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_member_notes_type ON member_notes(type);
CREATE INDEX IF NOT EXISTS idx_member_notes_priority ON member_notes(priority);

-- Enable RLS
ALTER TABLE member_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can view all member notes" ON member_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Staff can create member notes" ON member_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Staff can update their own notes" ON member_notes
  FOR UPDATE USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Staff can delete their own notes" ON member_notes
  FOR DELETE USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Create function to create the table (for the component to call)
CREATE OR REPLACE FUNCTION create_member_notes_table()
RETURNS void AS $$
BEGIN
  -- This function is just a placeholder since the table is created above
  -- The component can call this to ensure the table exists
  RETURN;
END;
$$ LANGUAGE plpgsql;
