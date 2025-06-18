/**
 * Development Script: Fetch Data with Access Token
 *
 * This script demonstrates how to authenticate and fetch data using Supabase.
 *
 * Usage:
 *   1. Set environment variables: TEST_EMAIL and TEST_PASSWORD
 *   2. Run: node src/scripts/dev/fetchWithAccessToken.js
 *
 * Security Note: Never commit credentials to version control.
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'TEST_EMAIL', 'TEST_PASSWORD'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('💡 Please set these in your .env file or environment');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Fetch data using an authenticated Supabase client
 */
const fetchDataWithAccessToken = async (accessToken) => {
  try {
    // Create authenticated Supabase client
    const supabaseWithAuth = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    // Fetch data from profiles table
    const { data, error } = await supabaseWithAuth
      .from("profiles")
      .select("id, email, role, created_at")
      .limit(5);

    if (error) {
      throw error;
    }

    console.log('✅ Data fetched successfully');
    console.log('📊 Profile count:', data.length);
    return data;

  } catch (error) {
    console.error('❌ Error fetching data:', error.message);
    throw error;
  }
};

/**
 * Test authentication and data fetching
 */
const testAccessToken = async () => {
  try {
    console.log('🔐 Attempting authentication...');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: process.env.TEST_EMAIL,
      password: process.env.TEST_PASSWORD,
    });

    if (error) {
      throw error;
    }

    console.log('✅ Authentication successful');

    const accessToken = data.session.access_token;
    const userData = await fetchDataWithAccessToken(accessToken);

    console.log('🎉 Test completed successfully');
    return userData;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
};

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAccessToken()
    .then(() => {
      console.log('✨ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error.message);
      process.exit(1);
    });
}

