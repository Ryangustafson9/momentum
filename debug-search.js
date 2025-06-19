/**
 * Debug Profile Search Data
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = 'https://vuzurdmwqabyjjoaeghv.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1enVyZG13cWFieWpqb2FlZ2h2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI3ODkzNCwiZXhwIjoyMDY1ODU0OTM0fQ.RG4NNfYfPfcLBJKOy-dKgL9b0n05nrLh9-9G9ZuM5oo';

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugProfileData() {
  console.log('🔍 Debugging profile search data...');

  try {
    // Check what's actually in the profiles table
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, display_name, email, role, system_member_id, phone')
      .order('first_name', { ascending: true });
      
    if (error) {
      console.error('❌ Error fetching profiles:', error);
      return;
    }
    
    console.log(`📊 Found ${profiles?.length || 0} profiles in database`);
    
    if (profiles && profiles.length > 0) {
      console.log('\n📋 First 5 profiles:');
      profiles.slice(0, 5).forEach((profile, index) => {
        console.log(`${index + 1}. ID: ${profile.id}`);
        console.log(`   Name: ${profile.first_name} ${profile.last_name}`);
        console.log(`   Display Name: ${profile.display_name}`);
        console.log(`   Email: ${profile.email}`);
        console.log(`   Role: ${profile.role}`);
        console.log(`   System Member ID: ${profile.system_member_id}`);
        console.log(`   Phone: ${profile.phone}`);
        console.log('   ---');
      });
      
      // Transform data like the layout does
      const transformedMembers = profiles.map(profile => ({
        id: profile.id,
        name: profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        full_name: profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        role: profile.role,
        system_member_id: profile.system_member_id,
        phone: profile.phone
      }));
      
      console.log('\n🔄 Transformed data for search:');
      transformedMembers.slice(0, 3).forEach((member, index) => {
        console.log(`${index + 1}. Transformed:`);
        console.log(`   ID: ${member.id}`);
        console.log(`   Name: ${member.name}`);
        console.log(`   Full Name: ${member.full_name}`);
        console.log(`   Email: ${member.email}`);
        console.log(`   Role: ${member.role}`);
        console.log('   ---');
      });
      
      // Test a search
      const searchTerm = 'alex';
      console.log(`\n🔍 Testing search for "${searchTerm}":`)
      
      const filtered = transformedMembers.filter(member => {
        if (!member) return false;

        const name = member.name || member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim();
        const email = member.email || '';
        const phone = member.phone || '';
        const role = member.role || '';
        const systemMemberId = member.system_member_id || '';

        const searchLower = searchTerm.toLowerCase();

        const matches = name.toLowerCase().includes(searchLower) ||
               email.toLowerCase().includes(searchLower) ||
               phone.includes(searchTerm) ||
               role.toLowerCase().includes(searchLower) ||
               String(systemMemberId).toLowerCase().includes(searchLower);
               
        if (matches) {
          console.log(`✅ Match found: ${name} (${email})`);
        }
        
        return matches;
      });
      
      console.log(`\n📊 Search results: ${filtered.length} matches`);
      
    } else {
      console.log('⚠️  No profiles found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugProfileData();
