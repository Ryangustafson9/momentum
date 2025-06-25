-- Add billing preferences to profiles table
-- This migration adds a JSONB column to store member billing preferences

-- Add billing_preferences column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS billing_preferences JSONB DEFAULT '{}';

-- Add a comment explaining the structure
COMMENT ON COLUMN profiles.billing_preferences IS 'JSON object containing billing preferences: house_charge_allowed, house_charge_payment_method, tax_exempt, tax_exempt_id, statement_delivery, statement_frequency, payment_reminders, billing_email, special_notes';

-- Create an index for better performance when querying billing preferences
CREATE INDEX IF NOT EXISTS idx_profiles_billing_preferences 
ON profiles USING GIN (billing_preferences);

-- Add some sample billing preferences for existing members (optional)
-- You can run this to populate some test data
UPDATE profiles SET billing_preferences = '{
  "house_charge_allowed": false,
  "house_charge_payment_method": "same_as_membership",
  "tax_exempt": false,
  "statement_delivery": "email",
  "statement_frequency": "monthly",
  "payment_reminders": true
}'::jsonb
WHERE billing_preferences = '{}' AND role = 'member';
