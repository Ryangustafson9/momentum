// Utility to create sample add-on types for testing
import { supabase } from '../lib/supabaseClient.js';

export const createSampleAddons = async () => {
  const sampleAddons = [
    {
      name: 'Personal Training Sessions',
      price: 75.00,
      billing_type: 'monthly',
      duration_months: 1,
      category: 'Add-on',
      description: 'One-on-one personal training sessions with certified trainers',
      features: [
        '4 personal training sessions per month',
        'Customized workout plans',
        'Nutrition guidance',
        'Progress tracking'
      ],
      available_for_sale: true,
      available_online: true,
      active: true
    },
    {
      name: 'Group Fitness Classes',
      price: 25.00,
      billing_type: 'monthly',
      duration_months: 1,
      category: 'Add-on',
      description: 'Unlimited access to group fitness classes',
      features: [
        'Unlimited group classes',
        'Yoga, Pilates, Zumba, and more',
        'Expert instructors',
        'Small class sizes'
      ],
      available_for_sale: true,
      available_online: true,
      active: true
    },
    {
      name: 'Nutrition Coaching',
      price: 50.00,
      billing_type: 'monthly',
      duration_months: 1,
      category: 'Add-on',
      description: 'Professional nutrition coaching and meal planning',
      features: [
        'Monthly nutrition consultation',
        'Personalized meal plans',
        'Supplement recommendations',
        'Progress monitoring'
      ],
      available_for_sale: true,
      available_online: true,
      active: true
    },
    {
      name: 'Massage Therapy',
      price: 40.00,
      billing_type: 'monthly',
      duration_months: 1,
      category: 'Add-on',
      description: 'Monthly massage therapy sessions for recovery',
      features: [
        '1 massage session per month',
        'Sports massage therapy',
        'Recovery and relaxation',
        'Licensed massage therapists'
      ],
      available_for_sale: true,
      available_online: true,
      active: true
    },
    {
      name: 'Premium Locker',
      price: 15.00,
      billing_type: 'monthly',
      duration_months: 1,
      category: 'Add-on',
      description: 'Premium locker rental with enhanced amenities',
      features: [
        'Large premium locker',
        'Towel service included',
        'Priority locker room access',
        'Personal storage space'
      ],
      available_for_sale: true,
      available_online: true,
      active: true
    }
  ];

  try {
    console.log('Creating sample add-ons...');
    
    // Check if add-ons already exist
    const { data: existing, error: checkError } = await supabase
      .from('membership_types')
      .select('name')
      .eq('category', 'Add-on');

    if (checkError) {
      console.error('Error checking existing add-ons:', checkError);
      return;
    }

    const existingNames = existing?.map(item => item.name) || [];
    const newAddons = sampleAddons.filter(addon => !existingNames.includes(addon.name));

    if (newAddons.length === 0) {
      console.log('Sample add-ons already exist, skipping creation.');
      return;
    }

    const { data, error } = await supabase
      .from('membership_types')
      .insert(newAddons)
      .select();

    if (error) {
      console.error('Error creating sample add-ons:', error);
      return;
    }

    console.log('✅ Successfully created sample add-ons:', data);
    return data;
  } catch (error) {
    console.error('Error in createSampleAddons:', error);
  }
};

// Run this function if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createSampleAddons();
}
