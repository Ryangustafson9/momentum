/**
 * Test Remote Supabase Connection
 *
 * This script tests the connection to the remote Supabase database
 * Run with: node scripts/test_remote_connection.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration - Use correct environment variable names
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Remote Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase configuration in .env.local');
    process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        console.log('\n📡 Testing basic connection...');

        // Test 1: Try memberships table first (as in your script)
        const { data: membershipData, error: membershipError } = await supabase
            .from('memberships')
            .select('*')
            .limit(1);

        if (membershipError) {
            console.log('⚠️  Memberships table may not exist yet:', membershipError.message);
            console.log('   This is expected if database schema hasn\'t been set up');
        } else {
            console.log('✅ Successfully connected to remote database');
            console.log('📊 Sample membership data:', membershipData);
        }
        
        // Test 2: Auth connection
        console.log('\n🔐 Testing auth system...');
        const { data: authData, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
            console.log('⚠️  Auth test (expected for no session):', authError.message);
        } else {
            console.log('✅ Auth system accessible');
        }
        
        // Test 3: Try to get user (should fail gracefully)
        console.log('\n👤 Testing user retrieval...');
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
            console.log('⚠️  No user session (expected):', userError.message);
        } else {
            console.log('✅ User system accessible');
        }
        
        console.log('\n🎉 Remote connection test completed!');
        console.log('\n📋 Next steps:');
        console.log('1. Run the remote database setup script in Supabase Studio');
        console.log('2. Test admin login with the application');
        console.log('3. Verify all features work with remote database');
        
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testConnection();
