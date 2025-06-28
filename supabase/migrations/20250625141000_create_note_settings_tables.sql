-- Create note settings management tables
-- This migration creates tables for managing note subjects, templates, and general settings

-- Create note_subjects table for managing available subjects
CREATE TABLE IF NOT EXISTS note_subjects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name varchar(255) NOT NULL UNIQUE,
  icon varchar(10) DEFAULT '📝',
  color_class varchar(255) DEFAULT 'bg-gray-100 text-gray-800 border-gray-200',
  category varchar(100) DEFAULT 'general',
  description text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 999,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create note_templates table for default note templates
CREATE TABLE IF NOT EXISTS note_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name varchar(255) NOT NULL,
  subject varchar(255),
  content text NOT NULL,
  description text,
  category varchar(100) DEFAULT 'general',
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create note_settings table for general configuration
CREATE TABLE IF NOT EXISTS note_settings (
  id integer PRIMARY KEY DEFAULT 1,
  require_subject boolean DEFAULT false,
  auto_generate_subject boolean DEFAULT true,
  default_template_id uuid REFERENCES note_templates(id) ON DELETE SET NULL,
  max_note_length integer DEFAULT 2000,
  enable_templates boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT single_settings_row CHECK (id = 1)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_note_subjects_active ON note_subjects(is_active);
CREATE INDEX IF NOT EXISTS idx_note_subjects_category ON note_subjects(category);
CREATE INDEX IF NOT EXISTS idx_note_subjects_order ON note_subjects(display_order);
CREATE INDEX IF NOT EXISTS idx_note_templates_active ON note_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_note_templates_default ON note_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_note_templates_category ON note_templates(category);

-- Insert default subjects from the existing system
INSERT INTO note_subjects (name, icon, color_class, category, display_order) VALUES
('Follow-up Required', '🔄', 'bg-orange-100 text-orange-800 border-orange-200', 'action', 1),
('Personal Training', '💪', 'bg-blue-100 text-blue-800 border-blue-200', 'service', 2),
('Membership Issue', '🎫', 'bg-red-100 text-red-800 border-red-200', 'issue', 3),
('Payment Related', '💳', 'bg-green-100 text-green-800 border-green-200', 'financial', 4),
('Equipment Issue', '🔧', 'bg-yellow-100 text-yellow-800 border-yellow-200', 'facility', 5),
('Class Inquiry', '📅', 'bg-purple-100 text-purple-800 border-purple-200', 'service', 6),
('Complaint', '⚠️', 'bg-red-100 text-red-800 border-red-200', 'feedback', 7),
('Compliment', '👏', 'bg-emerald-100 text-emerald-800 border-emerald-200', 'feedback', 8),
('General Note', '📝', 'bg-gray-100 text-gray-800 border-gray-200', 'general', 9),
('Medical Information', '🏥', 'bg-pink-100 text-pink-800 border-pink-200', 'medical', 10),
('Emergency Contact', '🚨', 'bg-red-100 text-red-800 border-red-200', 'emergency', 11),
('Special Needs', '♿', 'bg-indigo-100 text-indigo-800 border-indigo-200', 'accessibility', 12)
ON CONFLICT (name) DO NOTHING;

-- Insert default note templates
INSERT INTO note_templates (name, subject, content, description, category, is_default) VALUES
('Follow-up Note', 'Follow-up Required', 'Follow-up needed for: [REASON]

Action required: [ACTION]
Timeline: [TIMELINE]
Assigned to: [STAFF]

Notes: [ADDITIONAL_NOTES]', 'Template for notes requiring follow-up action', 'action', false),

('Personal Training Consultation', 'Personal Training', 'PT Consultation with [MEMBER_NAME]

Goals discussed:
- [GOAL_1]
- [GOAL_2]
- [GOAL_3]

Recommended program: [PROGRAM]
Sessions per week: [FREQUENCY]
Next steps: [NEXT_STEPS]', 'Template for personal training consultations', 'service', false),

('Membership Issue Resolution', 'Membership Issue', 'Membership Issue: [ISSUE_TYPE]

Problem: [DESCRIPTION]
Resolution: [SOLUTION]
Status: [STATUS]

Member satisfaction: [SATISFIED/NEEDS_FOLLOW_UP]', 'Template for membership issue tracking', 'issue', false),

('Equipment Problem Report', 'Equipment Issue', 'Equipment: [EQUIPMENT_NAME]
Location: [LOCATION]
Issue: [PROBLEM_DESCRIPTION]

Severity: [LOW/MEDIUM/HIGH]
Safety concern: [YES/NO]
Reported to maintenance: [DATE/TIME]
Expected resolution: [TIMELINE]', 'Template for equipment issue reporting', 'facility', false),

('Member Compliment', 'Compliment', 'Positive feedback from [MEMBER_NAME]

Compliment about: [STAFF/SERVICE/FACILITY]
Details: [FEEDBACK_DETAILS]

Recognition given: [YES/NO]
Shared with team: [YES/NO]', 'Template for recording member compliments', 'feedback', false),

('General Member Note', 'General Note', 'Date: [DATE]
Staff: [STAFF_NAME]

Note: [CONTENT]

Follow-up needed: [YES/NO]
Priority: [LOW/MEDIUM/HIGH]', 'General purpose note template', 'general', true)
ON CONFLICT DO NOTHING;

-- Insert default settings
INSERT INTO note_settings (id, require_subject, auto_generate_subject, enable_templates) VALUES
(1, false, true, true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for note_subjects
ALTER TABLE note_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view note subjects" ON note_subjects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin can manage note subjects" ON note_subjects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create RLS policies for note_templates
ALTER TABLE note_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view note templates" ON note_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin can manage note templates" ON note_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create RLS policies for note_settings
ALTER TABLE note_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view note settings" ON note_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin can manage note settings" ON note_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_note_subjects_updated_at BEFORE UPDATE ON note_subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_note_templates_updated_at BEFORE UPDATE ON note_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_note_settings_updated_at BEFORE UPDATE ON note_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON note_subjects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON note_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON note_settings TO authenticated;
