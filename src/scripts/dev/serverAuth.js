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
    

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    

    // Store tokens in memory
    tokens.access_token = data.session.access_token;
    tokens.refresh_token = data.session.refresh_token;

    // Decode JWT to get expiry time
    const payload = JSON.parse(
      Buffer.from(tokens.access_token.split(".")[1], "base64").toString()
    );
    tokens.expiry_time = payload.exp * 1000; // Convert to milliseconds

    
    

    // Set up automatic token refresh
    setupAutoRefresh();

    return tokens;

  } catch (error) {
    
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

    

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: tokens.refresh_token,
    });

    if (error) {
      throw error;
    }

    

    // Update tokens in memory
    tokens.access_token = data.session.access_token;
    tokens.refresh_token = data.session.refresh_token;

    // Decode JWT to get new expiry time
    const payload = JSON.parse(
      Buffer.from(tokens.access_token.split(".")[1], "base64").toString()
    );
    tokens.expiry_time = payload.exp * 1000; // Convert to milliseconds

    
    

    // Reset the auto-refresh timer
    setupAutoRefresh();

    return tokens;

  } catch (error) {
    
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

    
    

    // Set timer to refresh token before expiry
    setTimeout(() => {
      refreshAccessToken().catch(error => {
        
      });
    }, refreshTime);

  } catch (error) {
    
  }
};

/**
 * Test authenticated API request
 */
const testAuthenticatedRequest = async () => {
  try {
    

    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, role, created_at")
      .limit(3);

    if (error) {
      throw error;
    }

    
    
    return data;

  } catch (error) {
    
    throw error;
  }
};

/**
 * Main demonstration function
 */
const main = async () => {
  try {
    

    // Step 1: Login and store tokens
    await loginAndStoreTokens(process.env.TEST_EMAIL, process.env.TEST_PASSWORD);

    // Step 2: Test authenticated request
    await testAuthenticatedRequest();

    
    

  } catch (error) {
    
    process.exit(1);
  }
};

// Run the demo if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}


