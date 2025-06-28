-- Add address fields to profiles table
-- Migration: Add city, state, zip, and address_2 columns to profiles table

-- Add the new address columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(50),
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS address_2 VARCHAR(255);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.city IS 'City for mailing address';
COMMENT ON COLUMN public.profiles.state IS 'State/Province for mailing address';
COMMENT ON COLUMN public.profiles.zip_code IS 'ZIP/Postal code for mailing address';
COMMENT ON COLUMN public.profiles.address_2 IS 'Secondary address line (apartment, suite, etc.)';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_state ON public.profiles(state);
CREATE INDEX IF NOT EXISTS idx_profiles_zip_code ON public.profiles(zip_code);
