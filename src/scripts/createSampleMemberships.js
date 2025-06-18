// Script to create sample membership types for testing
import { supabase } from '../lib/supabaseClient.js';

const sampleMemberships = [
  {
    name: 'Basic Monthly',
    price: 29.99,
    billing_type: 'monthly',
    duration_months: 1,
    category: 'Membership',
    description: 'Perfect for getting started with your fitness journey',
    features: [
      'Access to gym equipment',
      'Locker room access',
      'Basic fitness assessment',
      'Mobile app access'
    ],
    available_for_sale: true,
    available_online: true,
    active: true,
    color: 'from-blue-400 to-blue-600'
  },
  {
    name: 'Premium Monthly',
    price: 49.99,
    billing_type: 'monthly',
    duration_months: 1,
    category: 'Membership',
    description: 'Our most popular plan with everything you need',
    features: [
      'All Basic features',
      'Group fitness classes',
      'Personal training session (1/month)',
      'Nutrition consultation',
      'Guest passes (2/month)'
    ],
    available_for_sale: true,
    available_online: true,
    active: true,
    color: 'from-purple-400 to-purple-600'
  },
  {
    name: 'Annual Premium',
    price: 499.99,
    billing_type: 'annual',
    duration_months: 12,
    category: 'Membership',
    description: 'Best value - save $100 with annual billing',
    features: [
      'All Premium features',
      'Priority class booking',
      'Free guest passes (unlimited)',
      'Personal training sessions (2/month)',
      'Massage therapy discount',
      'Nutrition meal planning'
    ],
    available_for_sale: true,
    available_online: true,
    active: true,
    color: 'from-green-400 to-green-600'
  }
];

async function createSampleMemberships() {
  console.log('🚀 Creating sample membership types...');
  
  try {
    // Check if memberships already exist
    const { data: existing, error: checkError } = await supabase
      .from('membership_types')
      .select('id, name')
      .eq('available_online', true);
      
    if (checkError) {
      console.error('❌ Error checking existing memberships:', checkError);
      return;
    }
    
    if (existing && existing.length > 0) {
      console.log('✅ Sample memberships already exist:', existing.map(m => m.name));
      return;
    }
    
    // Insert sample memberships
    const { data, error } = await supabase
      .from('membership_types')
      .insert(sampleMemberships)
      .select();
      
    if (error) {
      console.error('❌ Error creating sample memberships:', error);
      return;
    }
    
    console.log('✅ Successfully created sample memberships:', data);
    console.log('🎉 You can now test the join-online page!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
createSampleMemberships();
