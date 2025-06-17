// Script to create test membership data for Greg and Lauren
import { supabase } from '../lib/supabaseClient.js';

export const createTestMemberships = async () => {
  try {
    console.log('🔄 Creating test memberships for Greg and Lauren...');

    // First, get or create a basic membership type
    let { data: membershipTypes, error: typesError } = await supabase
      .from('membership_types')
      .select('*')
      .eq('name', 'Basic Membership')
      .limit(1);

    if (typesError) {
      console.error('Error fetching membership types:', typesError);
      return;
    }

    let membershipTypeId;
    if (!membershipTypes || membershipTypes.length === 0) {
      // Create a basic membership type
      const { data: newType, error: createTypeError } = await supabase
        .from('membership_types')
        .insert({
          name: 'Basic Membership',
          price: 49.99,
          billing_type: 'Monthly',
          category: 'Member Plans',
          available_for_sale: true,
          available_online: true,
          features: ['Gym Access', 'Basic Classes']
        })
        .select()
        .single();

      if (createTypeError) {
        console.error('Error creating membership type:', createTypeError);
        return;
      }
      membershipTypeId = newType.id;
      console.log('✅ Created Basic Membership type:', membershipTypeId);
    } else {
      membershipTypeId = membershipTypes[0].id;
      console.log('✅ Using existing Basic Membership type:', membershipTypeId);
    }

    // Get Greg and Lauren's user IDs from auth.users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    const gregUser = users.users.find(u => u.email === 'greg@test.com');
    const laurenUser = users.users.find(u => u.email === 'lauren@test.com');

    if (!gregUser) {
      console.warn('⚠️ Greg user not found in auth.users');
      return;
    }

    if (!laurenUser) {
      console.warn('⚠️ Lauren user not found in auth.users');
      return;
    }

    console.log('✅ Found users:', { greg: gregUser.id, lauren: laurenUser.id });

    // Create memberships for Greg and Lauren
    const membershipsToCreate = [
      {
        auth_user_id: gregUser.id,
        user_id: gregUser.id,
        current_membership_type_id: membershipTypeId,
        status: 'active',
        join_date: '2024-01-15',
        next_payment_date: '2024-07-15',
        monthly_fee: 49.99
      },
      {
        auth_user_id: laurenUser.id,
        user_id: laurenUser.id,
        current_membership_type_id: membershipTypeId,
        status: 'active',
        join_date: '2024-02-01',
        next_payment_date: '2024-07-01',
        monthly_fee: 49.99
      }
    ];

    // Check if memberships already exist
    for (const membership of membershipsToCreate) {
      const { data: existing, error: checkError } = await supabase
        .from('memberships')
        .select('id')
        .eq('auth_user_id', membership.auth_user_id)
        .limit(1);

      if (checkError) {
        console.error('Error checking existing membership:', checkError);
        continue;
      }

      if (existing && existing.length > 0) {
        console.log(`✅ Membership already exists for user ${membership.auth_user_id}`);
        continue;
      }

      // Create the membership
      const { data: newMembership, error: createError } = await supabase
        .from('memberships')
        .insert(membership)
        .select()
        .single();

      if (createError) {
        console.error('Error creating membership:', createError);
        continue;
      }

      console.log(`✅ Created membership for user ${membership.auth_user_id}:`, newMembership.id);
    }

    // Update profiles to ensure they have the correct role
    const profileUpdates = [
      {
        id: gregUser.id,
        email: 'greg@test.com',
        first_name: 'Greg',
        last_name: 'Test',
        role: 'member'
      },
      {
        id: laurenUser.id,
        email: 'lauren@test.com',
        first_name: 'Lauren',
        last_name: 'Test',
        role: 'member'
      }
    ];

    for (const profile of profileUpdates) {
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert(profile, { onConflict: 'id' });

      if (updateError) {
        console.error('Error updating profile:', updateError);
      } else {
        console.log(`✅ Updated profile for ${profile.email}`);
      }
    }

    console.log('🎉 Test memberships created successfully!');
    return true;

  } catch (error) {
    console.error('❌ Error creating test memberships:', error);
    return false;
  }
};

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestMemberships();
}
