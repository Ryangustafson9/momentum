/**
 * Load Comprehensive Test Data for Momentum Gym
 * Creates realistic member and staff profiles for testing
 */

import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const SUPABASE_URL = 'https://vuzurdmwqabyjjoaeghv.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1enVyZG13cWFieWpqb2FlZ2h2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MjA0MTU0NzE3N30.LHAo0wF-YTr3YNrWr3KhC-K0XSgHFr8CGNZELHJqfm4';

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function loadTestData() {
  console.log('🚀 Loading comprehensive test data for Momentum Gym...');
  console.log('📡 URL:', SUPABASE_URL);

  try {
    // Test connection first
    console.log('🔗 Testing connection...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (testError && !testError.message.includes('relation "profiles" does not exist')) {
      throw testError;
    }
    console.log('✅ Connection successful');

    // Read the SQL file
    console.log('📄 Reading test data SQL file...');
    const sqlFilePath = join(__dirname, 'momentum-comprehensive-test-data.sql');
    const sqlContent = await fs.readFile(sqlFilePath, 'utf8');
    
    // Split into smaller chunks to avoid execution limits
    const statements = sqlContent
      .split('-- ========================================')
      .filter(chunk => chunk.trim().length > 0)
      .map(chunk => chunk.trim());

    console.log(`📊 Found ${statements.length} SQL sections to execute`);

    // Execute each section
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length > 0) {
        console.log(`⚡ Executing section ${i + 1}/${statements.length}...`);
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', {
            sql_text: statement
          });
          
          if (error) {
            console.warn(`⚠️  Warning in section ${i + 1}:`, error.message);
            // Continue with other sections
          } else {
            console.log(`✅ Section ${i + 1} completed successfully`);
          }
        } catch (execError) {
          console.warn(`⚠️  Error in section ${i + 1}:`, execError.message);
          // Continue with other sections
        }
      }
    }

    // Verify the data was created
    console.log('🔍 Verifying test data creation...');
    
    // Check staff count
    const { data: staffData, error: staffError } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['admin', 'staff']);
    
    // Check member count
    const { data: memberData, error: memberError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'member');
    
    // Check membership count
    const { data: membershipData, error: membershipError } = await supabase
      .from('memberships')
      .select('*');

    console.log('');
    console.log('========================================');
    console.log('✅ TEST DATA CREATION SUMMARY');
    console.log('========================================');
    console.log(`👥 Staff Profiles: ${staffData?.length || 0}`);
    console.log(`🏃 Member Profiles: ${memberData?.length || 0}`);
    console.log(`💳 Memberships: ${membershipData?.length || 0}`);
    console.log('');
    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('  Password for ALL users: password405');
    console.log('  Admin: admin@momentumtest.com');
    console.log('  Manager: manager@momentumtest.com');
    console.log('  Sample Member: alex.johnson@testgym.com');
    console.log('  Sample Family: mike.smith@testgym.com');
    console.log('========================================');

  } catch (error) {
    console.error('❌ Error loading test data:', error);
    process.exit(1);
  }
}

// Run the script
loadTestData();
