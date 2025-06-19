/**
 * Remote Database Setup Script
 * Fixes the auth schema and creates essential tables
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = 'https://vuzurdmwqabyjjoaeghv.supabase.co';

// You'll need to get your service role key from:
// https://supabase.com/dashboard/project/vuzurdmwqabyjjoaeghv/settings/api
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here';

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupRemoteDatabase() {
  console.log('🚀 Setting up remote Supabase database...');
  console.log('📡 URL:', SUPABASE_URL);

  try {
    // Test connection first
    console.log('� Testing connection...');
    const { data: testData, error: testError } = await supabase
      .from('_test')
      .select('*')
      .limit(1);
    
    // It's okay if this fails - we just want to test the connection
    console.log('✅ Connection test completed');

    // 1. Create profiles table with proper auth integration
    console.log('👤 Creating profiles table...');
    
    const profilesSQL = `
      -- Create profiles table
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        role TEXT DEFAULT 'nonmember' CHECK (role IN ('admin', 'staff', 'member', 'nonmember')),
        first_name TEXT,
        last_name TEXT,
        name TEXT,
        phone TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Enable RLS
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

      -- Create policies
      CREATE POLICY "Users can view own profile" ON public.profiles
        FOR SELECT USING (auth.uid() = id);

      CREATE POLICY "Users can update own profile" ON public.profiles
        FOR UPDATE USING (auth.uid() = id);

      CREATE POLICY "Admins can view all profiles" ON public.profiles
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
          )
        );

      -- Create updated_at trigger function
      CREATE OR REPLACE FUNCTION public.handle_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Create trigger
      DROP TRIGGER IF EXISTS handle_updated_at_profiles ON public.profiles;
      CREATE TRIGGER handle_updated_at_profiles
        BEFORE UPDATE ON public.profiles
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    `;

    const { error: profilesError } = await supabase.rpc('exec_sql', {
      sql: profilesSQL
    });

    if (profilesError) {
      console.error('❌ Error creating profiles table:', profilesError);
      // Try alternative approach
      console.log('🔄 Trying alternative approach...');
      
      const { error: altError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
        
      if (altError && altError.code === 'PGRST116') {
        console.log('📋 Profiles table does not exist, this is expected');
      }
    } else {
      console.log('✅ Profiles table created successfully');
    }

    // 2. Create membership_types table
    console.log('� Creating membership_types table...');
    
    const membershipTypesSQL = `
      CREATE TABLE IF NOT EXISTS public.membership_types (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2),
        duration_months INTEGER,
        active BOOLEAN DEFAULT true,
        available_online BOOLEAN DEFAULT true,
        available_for_sale BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Enable RLS
      ALTER TABLE public.membership_types ENABLE ROW LEVEL SECURITY;

      -- Create policy
      DROP POLICY IF EXISTS "Anyone can view membership types" ON public.membership_types;
      CREATE POLICY "Anyone can view membership types" ON public.membership_types
        FOR SELECT TO public USING (true);

      -- Insert basic membership types
      INSERT INTO public.membership_types (name, description, price, duration_months, active, available_online) VALUES
      ('Basic Monthly', 'Basic gym access for one month', 29.99, 1, true, true),
      ('Premium Monthly', 'Full gym access with classes for one month', 49.99, 1, true, true),
      ('Annual Basic', 'Basic gym access for one year', 299.99, 12, true, true),
      ('Annual Premium', 'Full gym access with classes for one year', 499.99, 12, true, true)
      ON CONFLICT (id) DO NOTHING;
    `;

    const { error: membershipError } = await supabase.rpc('exec_sql', {
      sql: membershipTypesSQL
    });

    if (membershipError) {
      console.error('❌ Error creating membership_types table:', membershipError);
    } else {
      console.log('✅ Membership types table created successfully');
    }

    // 3. Create admin user using Admin API
    console.log('�‍💼 Creating admin user...');
    
    const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@momentum.com',
      password: 'Bu!!et0!',
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        first_name: 'Admin',
        last_name: 'User'
      }
    });

    if (adminError) {
      if (adminError.message.includes('already registered')) {
        console.log('✅ Admin user already exists');
        
        // Get the existing user
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const adminUser = existingUsers.users.find(u => u.email === 'admin@momentum.com');
        
        if (adminUser) {
          console.log('👤 Found existing admin user:', adminUser.id);
          
          // Create/update profile
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: adminUser.id,
              email: 'admin@momentum.com',
              role: 'admin',
              first_name: 'Admin',
              last_name: 'User',
              name: 'Admin User'
            });

          if (profileError) {
            console.error('❌ Error creating admin profile:', profileError);
          } else {
            console.log('✅ Admin profile created/updated successfully');
          }
        }
      } else {
        console.error('❌ Error creating admin user:', adminError);
      }
    } else {
      console.log('✅ Admin user created successfully');
      
      // Create profile for new user
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: adminUser.user.id,
          email: 'admin@momentum.com',
          role: 'admin',
          first_name: 'Admin',
          last_name: 'User',
          name: 'Admin User'
        });

      if (profileError) {
        console.error('❌ Error creating admin profile:', profileError);
      } else {
        console.log('✅ Admin profile created successfully');
      }
    }

    console.log('\n🎉 Database setup completed!');
    console.log('📧 Admin email: admin@momentum.com');
    console.log('🔑 Admin password: Bu!!et0!');
    console.log('\n🔍 You can now test login in your application');

  } catch (error) {
    console.error('💥 Setup failed:', error);
    console.log('\n🔧 Manual setup required:');
    console.log('1. Go to your Supabase dashboard SQL editor');
    console.log('2. Run the SQL from remote-schema-setup.sql');
    console.log('3. Create admin user manually in Auth section');
  }
}

// Check for service key
if (SUPABASE_SERVICE_KEY === 'your-service-role-key-here') {
  console.log('❌ Please set your SUPABASE_SERVICE_ROLE_KEY');
  console.log('🔗 Get it from: https://supabase.com/dashboard/project/vuzurdmwqabyjjoaeghv/settings/api');
  console.log('📋 Then run: SUPABASE_SERVICE_ROLE_KEY=your-key node setup-remote-db.js');
  process.exit(1);
}

// Run setup
setupRemoteDatabase();
