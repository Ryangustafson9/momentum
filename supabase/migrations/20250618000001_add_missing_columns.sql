-- Add missing columns to membership_types table
ALTER TABLE "public"."membership_types" 
ADD COLUMN IF NOT EXISTS "available_online" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS "description" text;

-- Update existing membership types to be available online for testing
UPDATE "public"."membership_types" 
SET "available_online" = true, "active" = true 
WHERE "category" = 'Membership' AND "available_for_sale" = true;

-- Update existing add-on types to be available online for testing
UPDATE "public"."membership_types" 
SET "available_online" = true, "active" = true 
WHERE "category" = 'Add-on' AND "available_for_sale" = true;
