-- Add subject field to member_notes table
-- This migration adds a subject field to enable better organization and AI features

-- Add subject column to member_notes table
ALTER TABLE member_notes 
ADD COLUMN IF NOT EXISTS subject varchar(255);

-- Add index for subject field for better search performance
CREATE INDEX IF NOT EXISTS idx_member_notes_subject ON member_notes(subject);

-- Add index for subject search (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_member_notes_subject_lower ON member_notes(LOWER(subject));

-- Update existing notes to have a default subject based on content
UPDATE member_notes 
SET subject = CASE 
  WHEN LENGTH(content) > 50 THEN LEFT(content, 47) || '...'
  ELSE content
END
WHERE subject IS NULL;

-- Add a constraint to ensure subject is not empty when provided
ALTER TABLE member_notes 
ADD CONSTRAINT check_subject_not_empty 
CHECK (subject IS NULL OR LENGTH(TRIM(subject)) > 0);

-- Create a function to auto-generate subject from content if not provided
CREATE OR REPLACE FUNCTION auto_generate_note_subject()
RETURNS TRIGGER AS $$
BEGIN
  -- If subject is null or empty, generate one from content
  IF NEW.subject IS NULL OR TRIM(NEW.subject) = '' THEN
    NEW.subject := CASE 
      WHEN LENGTH(NEW.content) > 50 THEN LEFT(NEW.content, 47) || '...'
      ELSE NEW.content
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate subject
DROP TRIGGER IF EXISTS trigger_auto_generate_note_subject ON member_notes;
CREATE TRIGGER trigger_auto_generate_note_subject
  BEFORE INSERT OR UPDATE ON member_notes
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_note_subject();

-- Add some sample subjects to existing notes for testing
UPDATE member_notes 
SET subject = 'General Note'
WHERE subject IS NULL OR subject = content;

-- Update specific notes with better subjects based on content patterns
UPDATE member_notes 
SET subject = 'Follow-up Required'
WHERE LOWER(content) LIKE '%follow%up%' OR LOWER(content) LIKE '%follow-up%';

UPDATE member_notes 
SET subject = 'Personal Training Inquiry'
WHERE LOWER(content) LIKE '%personal%training%' OR LOWER(content) LIKE '%pt%';

UPDATE member_notes 
SET subject = 'Membership Issue'
WHERE LOWER(content) LIKE '%membership%' AND (LOWER(content) LIKE '%issue%' OR LOWER(content) LIKE '%problem%');

UPDATE member_notes 
SET subject = 'Payment Related'
WHERE LOWER(content) LIKE '%payment%' OR LOWER(content) LIKE '%billing%' OR LOWER(content) LIKE '%invoice%';

UPDATE member_notes 
SET subject = 'Equipment Issue'
WHERE LOWER(content) LIKE '%equipment%' OR LOWER(content) LIKE '%machine%' OR LOWER(content) LIKE '%broken%';

UPDATE member_notes 
SET subject = 'Class Inquiry'
WHERE LOWER(content) LIKE '%class%' OR LOWER(content) LIKE '%schedule%';

UPDATE member_notes 
SET subject = 'Complaint'
WHERE LOWER(content) LIKE '%complaint%' OR LOWER(content) LIKE '%unhappy%' OR LOWER(content) LIKE '%dissatisfied%';

UPDATE member_notes 
SET subject = 'Compliment'
WHERE LOWER(content) LIKE '%compliment%' OR LOWER(content) LIKE '%happy%' OR LOWER(content) LIKE '%satisfied%' OR LOWER(content) LIKE '%great%';

-- Create a view for notes with subject categories for future AI features
CREATE OR REPLACE VIEW member_notes_categorized AS
SELECT 
  mn.*,
  p_member.first_name || ' ' || p_member.last_name as member_name,
  p_staff.first_name || ' ' || p_staff.last_name as staff_name,
  CASE 
    WHEN LOWER(mn.subject) LIKE '%follow%up%' THEN 'follow-up'
    WHEN LOWER(mn.subject) LIKE '%training%' THEN 'training'
    WHEN LOWER(mn.subject) LIKE '%membership%' THEN 'membership'
    WHEN LOWER(mn.subject) LIKE '%payment%' OR LOWER(mn.subject) LIKE '%billing%' THEN 'financial'
    WHEN LOWER(mn.subject) LIKE '%equipment%' THEN 'equipment'
    WHEN LOWER(mn.subject) LIKE '%class%' THEN 'classes'
    WHEN LOWER(mn.subject) LIKE '%complaint%' THEN 'complaint'
    WHEN LOWER(mn.subject) LIKE '%compliment%' THEN 'compliment'
    ELSE 'general'
  END as category
FROM member_notes mn
LEFT JOIN profiles p_member ON mn.member_id = p_member.id
LEFT JOIN profiles p_staff ON mn.staff_id = p_staff.id;

-- Grant permissions on the view
GRANT SELECT ON member_notes_categorized TO authenticated;
