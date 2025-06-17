-- Add sample membership types for the join online page
-- This provides realistic membership options for new users

-- Insert sample membership types
INSERT INTO membership_types (id, name, price, billing_type, duration_months, features, available_for_sale, category, color) VALUES
-- Basic Plan
('650e8400-e29b-41d4-a716-446655440101', 'Basic Membership', 49.99, 'monthly', 1,
 ARRAY['Access to gym equipment', 'Locker room access', 'Free fitness assessment'],
 true, 'Standard', 'blue'),

-- Premium Plan
('650e8400-e29b-41d4-a716-446655440102', 'Premium Membership', 79.99, 'monthly', 1,
 ARRAY['All Basic features', 'Unlimited group classes', 'Personal training session (1/month)', 'Nutrition consultation', 'Guest passes (2/month)'],
 true, 'Premium', 'purple'),

-- VIP Plan
('650e8400-e29b-41d4-a716-446655440103', 'VIP Membership', 129.99, 'monthly', 1,
 ARRAY['All Premium features', 'Unlimited personal training', 'Priority class booking', 'Massage therapy (2/month)', 'Exclusive VIP lounge access', 'Meal planning service'],
 true, 'VIP', 'gold')

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  billing_type = EXCLUDED.billing_type,
  duration_months = EXCLUDED.duration_months,
  features = EXCLUDED.features,
  available_for_sale = EXCLUDED.available_for_sale,
  category = EXCLUDED.category,
  color = EXCLUDED.color;

-- Log the changes
DO $$
BEGIN
  RAISE NOTICE 'Added sample membership types for join online functionality';
END $$;