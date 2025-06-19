/**
 * Load Comprehensive Test Data for Momentum Gym
 * Creates realistic member and staff profiles for testing using Supabase client
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = 'https://vuzurdmwqabyjjoaeghv.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1enVyZG13cWFieWpqb2FlZ2h2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI3ODkzNCwiZXhwIjoyMDY1ODU0OTM0fQ.RG4NNfYfPfcLBJKOy-dKgL9b0n05nrLh9-9G9ZuM5oo';

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test user data
const staffUsers = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@momentumtest.com',
    password: 'password405',
    firstName: 'Sarah',
    lastName: 'Chen',
    role: 'admin',
    phone: '555-0101',
    dateOfBirth: '1985-03-15'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'manager@momentumtest.com',
    password: 'password405',
    firstName: 'Michael',
    lastName: 'Rodriguez',
    role: 'staff',
    phone: '555-0201',
    dateOfBirth: '1988-07-22'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'frontdesk1@momentumtest.com',
    password: 'password405',
    firstName: 'Emma',
    lastName: 'Thompson',
    role: 'staff',
    phone: '555-0301',
    dateOfBirth: '1995-11-08'
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'frontdesk2@momentumtest.com',
    password: 'password405',
    firstName: 'James',
    lastName: 'Wilson',
    role: 'staff',
    phone: '555-0401',
    dateOfBirth: '1992-05-30'
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    email: 'instructor@momentumtest.com',
    password: 'password405',
    firstName: 'Lisa',
    lastName: 'Martinez',
    role: 'staff',
    phone: '555-0501',
    dateOfBirth: '1987-09-14'
  }
];

const memberUsers = [
  // Individual Members
  {
    id: 'aa111111-1111-1111-1111-111111111111',
    email: 'alex.johnson@testgym.com',
    password: 'password405',
    firstName: 'Alex',
    lastName: 'Johnson',
    role: 'member',
    phone: '555-1001',
    dateOfBirth: '1990-04-12',
    membershipType: 'individual',
    isPrimary: true
  },
  {
    id: 'bb111111-1111-1111-1111-111111111111',
    email: 'maria.garcia@testgym.com',
    password: 'password405',
    firstName: 'Maria',
    lastName: 'Garcia',
    role: 'member',
    phone: '555-1101',
    dateOfBirth: '1986-12-03',
    membershipType: 'individual',
    isPrimary: true
  },
  {
    id: 'cc111111-1111-1111-1111-111111111111',
    email: 'david.brown@testgym.com',
    password: 'password405',
    firstName: 'David',
    lastName: 'Brown',
    role: 'member',
    phone: '555-1201',
    dateOfBirth: '1993-08-25',
    membershipType: 'individual',
    isPrimary: true
  },
  
  // Couple Members - Davis
  {
    id: 'dd111111-1111-1111-1111-111111111111',
    email: 'john.davis@testgym.com',
    password: 'password405',
    firstName: 'John',
    lastName: 'Davis',
    role: 'member',
    phone: '555-2001',
    dateOfBirth: '1982-01-15',
    membershipType: 'couple',
    isPrimary: true,
    familyMembers: ['ee111111-1111-1111-1111-111111111111']
  },
  {
    id: 'ee111111-1111-1111-1111-111111111111',
    email: 'jennifer.davis@testgym.com',
    password: 'password405',
    firstName: 'Jennifer',
    lastName: 'Davis',
    role: 'member',
    phone: '555-2002',
    dateOfBirth: '1984-06-20',
    membershipType: 'couple',
    isPrimary: false,
    primaryMember: 'dd111111-1111-1111-1111-111111111111',
    relationship: 'spouse'
  },
  
  // Couple Members - Anderson
  {
    id: 'ff111111-1111-1111-1111-111111111111',
    email: 'robert.anderson@testgym.com',
    password: 'password405',
    firstName: 'Robert',
    lastName: 'Anderson',
    role: 'member',
    phone: '555-2101',
    dateOfBirth: '1979-10-08',
    membershipType: 'couple',
    isPrimary: true,
    familyMembers: ['gg111111-1111-1111-1111-111111111111']
  },
  {
    id: 'gg111111-1111-1111-1111-111111111111',
    email: 'lisa.anderson@testgym.com',
    password: 'password405',
    firstName: 'Lisa',
    lastName: 'Anderson',
    role: 'member',
    phone: '555-2102',
    dateOfBirth: '1981-03-12',
    membershipType: 'couple',
    isPrimary: false,
    primaryMember: 'ff111111-1111-1111-1111-111111111111',
    relationship: 'spouse'
  },
  
  // Couple Members - Miller
  {
    id: 'hh111111-1111-1111-1111-111111111111',
    email: 'kevin.miller@testgym.com',
    password: 'password405',
    firstName: 'Kevin',
    lastName: 'Miller',
    role: 'member',
    phone: '555-2201',
    dateOfBirth: '1988-07-04',
    membershipType: 'couple',
    isPrimary: true,
    familyMembers: ['ii111111-1111-1111-1111-111111111111']
  },
  {
    id: 'ii111111-1111-1111-1111-111111111111',
    email: 'sarah.miller@testgym.com',
    password: 'password405',
    firstName: 'Sarah',
    lastName: 'Miller',
    role: 'member',
    phone: '555-2202',
    dateOfBirth: '1990-11-18',
    membershipType: 'couple',
    isPrimary: false,
    primaryMember: 'hh111111-1111-1111-1111-111111111111',
    relationship: 'spouse'
  },
  
  // Family Members - Smith Family
  {
    id: 'jj111111-1111-1111-1111-111111111111',
    email: 'mike.smith@testgym.com',
    password: 'password405',
    firstName: 'Mike',
    lastName: 'Smith',
    role: 'member',
    phone: '555-3001',
    dateOfBirth: '1980-05-10',
    membershipType: 'family',
    isPrimary: true,
    familyMembers: ['kk111111-1111-1111-1111-111111111111', 'll111111-1111-1111-1111-111111111111', 'mm111111-1111-1111-1111-111111111111']
  },
  {
    id: 'kk111111-1111-1111-1111-111111111111',
    email: 'linda.smith@testgym.com',
    password: 'password405',
    firstName: 'Linda',
    lastName: 'Smith',
    role: 'member',
    phone: '555-3002',
    dateOfBirth: '1982-09-22',
    membershipType: 'family',
    isPrimary: false,
    primaryMember: 'jj111111-1111-1111-1111-111111111111',
    relationship: 'spouse'
  },
  {
    id: 'll111111-1111-1111-1111-111111111111',
    email: 'tyler.smith@testgym.com',
    password: 'password405',
    firstName: 'Tyler',
    lastName: 'Smith',
    role: 'member',
    phone: '555-3003',
    dateOfBirth: '2005-03-15',
    membershipType: 'family',
    isPrimary: false,
    primaryMember: 'jj111111-1111-1111-1111-111111111111',
    relationship: 'child'
  },
  {
    id: 'mm111111-1111-1111-1111-111111111111',
    email: 'emma.smith@testgym.com',
    password: 'password405',
    firstName: 'Emma',
    lastName: 'Smith',
    role: 'member',
    phone: '555-3004',
    dateOfBirth: '2007-08-08',
    membershipType: 'family',
    isPrimary: false,
    primaryMember: 'jj111111-1111-1111-1111-111111111111',
    relationship: 'child'
  }
];

async function clearExistingTestData() {
  console.log('🧹 Clearing existing test data...');
  
  try {
    // First get all test user IDs
    const { data: testUsers } = await supabase
      .from('profiles')
      .select('id')
      .or('email.like.%@testgym.com,email.like.%@momentumtest.com');
    
    const testUserIds = testUsers?.map(u => u.id) || [];
    
    if (testUserIds.length > 0) {
      // Delete family relationships
      await supabase
        .from('family_members')
        .delete()
        .or(`primary_member_id.in.(${testUserIds.join(',')}),family_member_id.in.(${testUserIds.join(',')})`);

      // Delete membership addons
      const { data: testMemberships } = await supabase
        .from('memberships')
        .select('id')
        .in('auth_user_id', testUserIds);
      
      const testMembershipIds = testMemberships?.map(m => m.id) || [];
      
      if (testMembershipIds.length > 0) {
        await supabase
          .from('membership_addons')
          .delete()
          .in('membership_id', testMembershipIds);
      }

      // Delete memberships
      await supabase
        .from('memberships')
        .delete()
        .in('auth_user_id', testUserIds);
      
      // Delete profiles
      await supabase
        .from('profiles')
        .delete()
        .in('id', testUserIds);
    }

    // Delete auth users
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    if (authUsers?.users) {
      for (const user of authUsers.users) {
        if (user.email?.includes('@testgym.com') || user.email?.includes('@momentumtest.com')) {
          await supabase.auth.admin.deleteUser(user.id);
        }
      }
    }
    
    console.log('✅ Existing test data cleared');
  } catch (error) {
    console.warn('⚠️  Error clearing test data:', error.message);
  }
}

async function createTestUsers() {
  console.log('👥 Creating test users...');
  
  const allUsers = [...staffUsers, ...memberUsers]; // Include all member users
  
  for (const user of allUsers) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          first_name: user.firstName,
          last_name: user.lastName,
          role: user.role
        }
      });
      
      if (authError) {
        console.warn(`⚠️  Could not create auth user for ${user.email}:`, authError.message);
        continue;
      }
        // Create profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          display_name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          phone: user.phone,
          dob: user.dateOfBirth,
          emergency_contact_name: `Emergency ${user.lastName}`,
          emergency_contact_phone: user.phone.replace('555-', '555-9'),
          status: 'active',
          created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }]);
        
      if (profileError) {
        console.warn(`⚠️  Could not create profile for ${user.email}:`, profileError.message);
        continue;
      }
      
      console.log(`✅ Created user: ${user.firstName} ${user.lastName} (${user.email})`);
      
    } catch (error) {
      console.warn(`⚠️  Error creating ${user.email}:`, error.message);
    }
  }
}

async function getMembershipTypes() {
  const { data, error } = await supabase
    .from('membership_types')
    .select('*')
    .eq('available_for_sale', true);
    
  if (error) {
    console.warn('⚠️  Could not fetch membership types:', error.message);
    return {};
  }
  
  const types = {};
  data.forEach(type => {
    if (type.member_type) {
      types[type.member_type] = type;
    }
  });
  
  return types;
}

async function createMemberships() {
  console.log('💳 Creating memberships...');
  
  const membershipTypes = await getMembershipTypes();
  console.log('Found membership types:', Object.keys(membershipTypes));
  
  // Get all member profiles
  const { data: members, error: membersError } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'member');
    
  if (membersError) {
    console.warn('⚠️  Could not fetch members:', membersError.message);
    return;
  }
    // Create memberships for primary members only
  const primaryMembers = memberUsers.filter(user => user.isPrimary).slice(0, 10); // Limit to prevent too many
  
  for (const user of primaryMembers) {
    const profile = members.find(m => m.email === user.email);
    if (!profile) continue;
    
    const membershipType = membershipTypes[user.membershipType];
    if (!membershipType) {
      console.warn(`⚠️  No membership type found for ${user.membershipType}`);
      continue;
    }
    
    try {      const { data: membershipData, error: membershipError } = await supabase
        .from('memberships')
        .insert([{
          auth_user_id: profile.id,
          current_membership_type_id: membershipType.id,
          status: 'active',
          join_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          monthly_fee: membershipType.price,
          auto_renew: true,
          is_primary_member: true,
          family_role: 'primary',
          family_member_count: (user.familyMembers?.length || 0) + 1,
          max_family_members: membershipType.max_family_members || 1,
          total_monthly_cost: membershipType.price
        }]);
        
      if (membershipError) {
        console.warn(`⚠️  Could not create membership for ${user.email}:`, membershipError.message);
        continue;
      }
      
      console.log(`✅ Created ${user.membershipType} membership for ${user.firstName} ${user.lastName}`);
      
    } catch (error) {
      console.warn(`⚠️  Error creating membership for ${user.email}:`, error.message);
    }
  }
}

async function createFamilyRelationships() {
  console.log('👨‍👩‍👧‍👦 Creating family relationships...');
  
  // Get all member profiles to map emails to actual UUIDs
  const { data: allProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('role', 'member');
    
  if (profilesError) {
    console.warn('⚠️  Could not fetch profiles for family relationships:', profilesError.message);
    return;
  }
  
  // Create email to ID mapping
  const emailToId = {};
  allProfiles.forEach(profile => {
    emailToId[profile.email] = profile.id;
  });
  
  const familyRelationships = [];
  
  // Process family members using actual profile IDs
  for (const user of memberUsers) {
    if (!user.isPrimary && user.primaryMember && user.relationship) {
      const primaryMemberId = emailToId[memberUsers.find(u => u.id === user.primaryMember)?.email];
      const familyMemberId = emailToId[user.email];
      
      if (primaryMemberId && familyMemberId) {
        familyRelationships.push({
          primary_member_id: primaryMemberId,
          family_member_id: familyMemberId,
          relationship: user.relationship
        });
      }
    }
  }
  
  if (familyRelationships.length > 0) {
    const { data, error } = await supabase
      .from('family_members')
      .insert(familyRelationships);
      
    if (error) {
      console.warn('⚠️  Could not create family relationships:', error.message);
    } else {
      console.log(`✅ Created ${familyRelationships.length} family relationships`);
    }
  }
}

async function createSampleAnnouncements() {
  console.log('📢 Creating sample announcements...');
    // Get admin user
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', 'admin@momentumtest.com')
    .single();
    
  if (!adminProfile) {
    console.warn('⚠️  No admin user found for announcements');
    return;
  }
  
  const announcements = [
    {
      title: 'Welcome New Members!',
      content: 'We are excited to welcome our new members to the Momentum Gym family! Please stop by the front desk to pick up your welcome package.',
      announcement_type: 'general',
      priority: 'normal',
      target_audience: 'members',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_active: true,
      created_by: adminProfile.id
    },
    {
      title: 'Holiday Hours Update',
      content: 'Please note modified hours during the upcoming holiday weekend. Check with front desk for details.',
      announcement_type: 'general',
      priority: 'high',
      target_audience: 'all',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_active: true,
      created_by: adminProfile.id
    }
  ];
  
  const { data, error } = await supabase
    .from('announcements')
    .insert(announcements);
    
  if (error) {
    console.warn('⚠️  Could not create announcements:', error.message);
  } else {
    console.log('✅ Created sample announcements');
  }
}

async function verifyData() {
  console.log('🔍 Verifying test data...');
  
  // Count staff
  const { data: staff } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['admin', 'staff']);
    
  // Count members
  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'member');
    
  // Count memberships
  const { data: memberships } = await supabase
    .from('memberships')
    .select('*');
    
  // Count family relationships
  const { data: familyRelations } = await supabase
    .from('family_members')
    .select('*');
  
  return {
    staff: staff?.length || 0,
    members: members?.length || 0,
    memberships: memberships?.length || 0,
    familyRelations: familyRelations?.length || 0
  };
}

async function loadTestData() {
  console.log('🚀 Loading comprehensive test data for Momentum Gym...');
  console.log('📡 URL:', SUPABASE_URL);

  try {
    // Test connection
    console.log('🔗 Testing connection...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
      
    console.log('✅ Connection successful');

    // Clear existing test data
    await clearExistingTestData();
    
    // Create test users and profiles
    await createTestUsers();
      // Create memberships
    await createMemberships();
    
    // Create membership add-ons
    await createMembershipAddons();
    
    // Create family relationships
    await createFamilyRelationships();
    
    // Create sample announcements
    await createSampleAnnouncements();
    
    // Verify data
    const stats = await verifyData();
    
    console.log('');
    console.log('========================================');
    console.log('✅ TEST DATA CREATION COMPLETE');
    console.log('========================================');
    console.log(`👥 Staff Profiles: ${stats.staff}`);
    console.log(`🏃 Member Profiles: ${stats.members}`);
    console.log(`💳 Memberships: ${stats.memberships}`);
    console.log(`👨‍👩‍👧‍👦 Family Relationships: ${stats.familyRelations}`);
    console.log('');
    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('  Password for ALL users: password405');
    console.log('  📧 Admin: admin@momentumtest.com');
    console.log('  📧 Manager: manager@momentumtest.com');
    console.log('  📧 Sample Member: alex.johnson@testgym.com');
    console.log('  📧 Sample Family: mike.smith@testgym.com');
    console.log('========================================');

  } catch (error) {
    console.error('❌ Error loading test data:', error);
    process.exit(1);
  }
}

// Run the script
loadTestData();

async function createMembershipAddons() {
  console.log('🎯 Creating membership add-ons...');
  
  // Get addon membership types
  const { data: addonTypes, error: addonError } = await supabase
    .from('membership_types')
    .select('*')
    .eq('is_addon', true);
    
  if (addonError || !addonTypes || addonTypes.length === 0) {
    console.warn('⚠️  No add-on types found');
    return;
  }
  
  // Get some memberships to add addons to
  const { data: memberships, error: membershipError } = await supabase
    .from('memberships')
    .select('*')
    .limit(5);
    
  if (membershipError || !memberships || memberships.length === 0) {
    console.warn('⚠️  No memberships found for add-ons');
    return;
  }
  
  const addonsToCreate = [];
  
  // Add varied add-ons to different members
  for (let i = 0; i < Math.min(memberships.length, 3); i++) {
    const membership = memberships[i];
    const randomAddon = addonTypes[Math.floor(Math.random() * addonTypes.length)];
    
    addonsToCreate.push({
      membership_id: membership.id,
      addon_type_id: randomAddon.id,
      status: 'active',
      start_date: new Date().toISOString().split('T')[0],
      monthly_cost: randomAddon.price,
      billing_cycle: 'monthly',
      auto_renew: true
    });
  }
  
  if (addonsToCreate.length > 0) {
    const { data, error } = await supabase
      .from('membership_addons')
      .insert(addonsToCreate);
      
    if (error) {
      console.warn('⚠️  Could not create membership add-ons:', error.message);
    } else {
      console.log(`✅ Created ${addonsToCreate.length} membership add-ons`);
    }
  }
}
