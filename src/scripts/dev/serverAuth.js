/**
 * Development Script: Server Authentication Demo
 *
 * This script demonstrates server-side authentication patterns including:
 * - Login with credentials
 * - Token storage and management
 * - Automatic token refresh
 *
 * Usage:
 *   1. Set environment variables: TEST_EMAIL and TEST_PASSWORD
 *   2. Run: node src/scripts/dev/serverAuth.js
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

// In-memory token storage (for demonstration only)
let tokens = {
  access_token: null,
  refresh_token: null,
  expiry_time: null,
};

/**
 * Login and store authentication tokens
 */
const loginAndStoreTokens = async (email, password) => {
  try {
    console.log('🔐 Attempting login...');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    console.log('✅ Login successful');

    // Store tokens in memory
    tokens.access_token = data.session.access_token;
    tokens.refresh_token = data.session.refresh_token;

    // Decode JWT to get expiry time
    const payload = JSON.parse(
      Buffer.from(tokens.access_token.split(".")[1], "base64").toString()
    );
    tokens.expiry_time = payload.exp * 1000; // Convert to milliseconds

    console.log('💾 Tokens stored in memory');
    console.log('⏰ Token expires at:', new Date(tokens.expiry_time).toISOString());

    // Set up automatic token refresh
    setupAutoRefresh();

    return tokens;

  } catch (error) {
    console.error('❌ Login failed:', error.message);
    throw error;
  }
};

/**
 * Refresh the access token using the refresh token
 */
const refreshAccessToken = async () => {
  try {
    if (!tokens.refresh_token) {
      throw new Error('No refresh token available');
    }

    console.log('🔄 Refreshing access token...');

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: tokens.refresh_token,
    });

    if (error) {
      throw error;
    }

    console.log('✅ Session refreshed successfully');

    // Update tokens in memory
    tokens.access_token = data.session.access_token;
    tokens.refresh_token = data.session.refresh_token;

    // Decode JWT to get new expiry time
    const payload = JSON.parse(
      Buffer.from(tokens.access_token.split(".")[1], "base64").toString()
    );
    tokens.expiry_time = payload.exp * 1000; // Convert to milliseconds

    console.log('💾 Tokens updated in memory');
    console.log('⏰ New token expires at:', new Date(tokens.expiry_time).toISOString());

    // Reset the auto-refresh timer
    setupAutoRefresh();

    return tokens;

  } catch (error) {
    console.error('❌ Error refreshing session:', error.message);
    throw error;
  }
};

/**
 * Set up automatic token refresh
 */
const setupAutoRefresh = () => {
  try {
    if (!tokens.expiry_time) {
      throw new Error('No expiry time found for access token');
    }

    const currentTime = Date.now();
    const timeUntilExpiry = tokens.expiry_time - currentTime;
    const refreshTime = Math.max(timeUntilExpiry - 60000, 5000); // Refresh 1 min before expiry, minimum 5 seconds

    console.log(`⏱️  Token expires in ${Math.round(timeUntilExpiry / 1000)} seconds`);
    console.log(`🔄 Auto-refresh scheduled in ${Math.round(refreshTime / 1000)} seconds`);

    // Set timer to refresh token before expiry
    setTimeout(() => {
      refreshAccessToken().catch(error => {
        console.error('❌ Auto-refresh failed:', error.message);
      });
    }, refreshTime);

  } catch (error) {
    console.error('❌ Error setting up auto-refresh:', error.message);
  }
};

/**
 * Test authenticated API request
 */
const testAuthenticatedRequest = async () => {
  try {
    console.log('📊 Testing authenticated API request...');

    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, role, created_at")
      .limit(3);

    if (error) {
      throw error;
    }

    console.log('✅ API request successful');
    console.log('📋 Profile count:', data.length);
    return data;

  } catch (error) {
    console.error('❌ API request failed:', error.message);
    throw error;
  }
};

/**
 * Main demonstration function
 */
const main = async () => {
  try {
    console.log('🚀 Starting server authentication demo...\n');

    // Step 1: Login and store tokens
    await loginAndStoreTokens(process.env.TEST_EMAIL, process.env.TEST_PASSWORD);

    // Step 2: Test authenticated request
    await testAuthenticatedRequest();

    console.log('\n✨ Demo completed successfully');
    console.log('💡 Token will auto-refresh before expiry');

  } catch (error) {
    console.error('\n💥 Demo failed:', error.message);
    process.exit(1);
  }
};

// Run the demo if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

