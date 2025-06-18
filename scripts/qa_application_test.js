/**
 * QA Application Test Script
 * 
 * This script performs comprehensive testing of the application functionality
 * Run this in the browser console or as a Node.js script
 */

// QA Test Configuration
const QA_CONFIG = {
  supabaseUrl: 'http://127.0.0.1:54321',
  supabaseAnonKey: 'your-anon-key', // Replace with actual key
  testTimeout: 10000, // 10 seconds
  adminCredentials: {
    email: 'admin@momentum.com',
    password: 'SecureAdminPassword123!'
  }
};

// QA Test Results Storage
let qaResults = [];

// Utility Functions
function logQAResult(category, status, details, error = null) {
  const result = {
    category,
    status, // 'PASS', 'FAIL', 'WARNING', 'INFO'
    details,
    error: error?.message || null,
    timestamp: new Date().toISOString()
  };
  
  qaResults.push(result);
  
  const emoji = {
    'PASS': '✅',
    'FAIL': '❌', 
    'WARNING': '⚠️',
    'INFO': 'ℹ️'
  }[status] || '🔍';
  
  console.log(`${emoji} [${category}] ${status}: ${details}`);
  if (error) {
    console.error(`   Error: ${error.message}`);
  }
}

// QA Test 1: Supabase Connection
async function testSupabaseConnection() {
  try {
    // Test if we can reach Supabase
    const response = await fetch(`${QA_CONFIG.supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': QA_CONFIG.supabaseAnonKey
      }
    });
    
    if (response.ok) {
      logQAResult('SUPABASE_CONNECTION', 'PASS', 'Supabase API is reachable');
    } else {
      logQAResult('SUPABASE_CONNECTION', 'FAIL', `HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    logQAResult('SUPABASE_CONNECTION', 'FAIL', 'Cannot reach Supabase API', error);
  }
}

// QA Test 2: Database Tables Access
async function testDatabaseAccess() {
  const criticalTables = ['profiles', 'membership_types', 'memberships', 'classes'];
  
  for (const table of criticalTables) {
    try {
      const response = await fetch(`${QA_CONFIG.supabaseUrl}/rest/v1/${table}?select=count`, {
        headers: {
          'apikey': QA_CONFIG.supabaseAnonKey,
          'Authorization': `Bearer ${QA_CONFIG.supabaseAnonKey}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        logQAResult('DATABASE_ACCESS', 'PASS', `Table '${table}' is accessible`);
      } else {
        logQAResult('DATABASE_ACCESS', 'FAIL', `Cannot access table '${table}': HTTP ${response.status}`);
      }
    } catch (error) {
      logQAResult('DATABASE_ACCESS', 'FAIL', `Error accessing table '${table}'`, error);
    }
  }
}

// QA Test 3: Auth System Test
async function testAuthSystem() {
  try {
    // Test auth endpoint
    const response = await fetch(`${QA_CONFIG.supabaseUrl}/auth/v1/settings`, {
      headers: {
        'apikey': QA_CONFIG.supabaseAnonKey
      }
    });
    
    if (response.ok) {
      logQAResult('AUTH_SYSTEM', 'PASS', 'Auth system is accessible');
    } else {
      logQAResult('AUTH_SYSTEM', 'FAIL', `Auth system error: HTTP ${response.status}`);
    }
  } catch (error) {
    logQAResult('AUTH_SYSTEM', 'FAIL', 'Auth system is not accessible', error);
  }
}

// QA Test 4: Admin Login Test
async function testAdminLogin() {
  try {
    const response = await fetch(`${QA_CONFIG.supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': QA_CONFIG.supabaseAnonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: QA_CONFIG.adminCredentials.email,
        password: QA_CONFIG.adminCredentials.password
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.access_token) {
        logQAResult('ADMIN_LOGIN', 'PASS', 'Admin login successful');
        return data.access_token;
      } else {
        logQAResult('ADMIN_LOGIN', 'FAIL', 'No access token returned');
      }
    } else {
      const errorData = await response.json();
      logQAResult('ADMIN_LOGIN', 'FAIL', `Login failed: ${errorData.error_description || errorData.message}`);
    }
  } catch (error) {
    logQAResult('ADMIN_LOGIN', 'FAIL', 'Admin login request failed', error);
  }
  
  return null;
}

// QA Test 5: Profile Data Test
async function testProfileData(accessToken) {
  if (!accessToken) {
    logQAResult('PROFILE_DATA', 'FAIL', 'No access token available for profile test');
    return;
  }
  
  try {
    const response = await fetch(`${QA_CONFIG.supabaseUrl}/rest/v1/profiles?email=eq.${QA_CONFIG.adminCredentials.email}`, {
      headers: {
        'apikey': QA_CONFIG.supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.length > 0 && data[0].role === 'admin') {
        logQAResult('PROFILE_DATA', 'PASS', 'Admin profile found with correct role');
      } else {
        logQAResult('PROFILE_DATA', 'WARNING', 'Admin profile found but role may be incorrect');
      }
    } else {
      logQAResult('PROFILE_DATA', 'FAIL', `Cannot fetch profile data: HTTP ${response.status}`);
    }
  } catch (error) {
    logQAResult('PROFILE_DATA', 'FAIL', 'Profile data request failed', error);
  }
}

// QA Test 6: Membership Types Test
async function testMembershipTypes() {
  try {
    const response = await fetch(`${QA_CONFIG.supabaseUrl}/rest/v1/membership_types?select=*`, {
      headers: {
        'apikey': QA_CONFIG.supabaseAnonKey
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const staffTypes = data.filter(mt => mt.category === 'Staff');
      const adminType = data.find(mt => mt.name?.includes('Admin'));
      
      if (data.length > 0) {
        logQAResult('MEMBERSHIP_TYPES', 'PASS', `Found ${data.length} membership types, ${staffTypes.length} staff types`);
      } else {
        logQAResult('MEMBERSHIP_TYPES', 'WARNING', 'No membership types found');
      }
      
      if (adminType) {
        logQAResult('MEMBERSHIP_TYPES', 'PASS', 'Admin membership type exists');
      } else {
        logQAResult('MEMBERSHIP_TYPES', 'WARNING', 'No admin membership type found');
      }
    } else {
      logQAResult('MEMBERSHIP_TYPES', 'FAIL', `Cannot fetch membership types: HTTP ${response.status}`);
    }
  } catch (error) {
    logQAResult('MEMBERSHIP_TYPES', 'FAIL', 'Membership types request failed', error);
  }
}

// QA Test 7: Application Routes Test
async function testApplicationRoutes() {
  const routes = [
    '/',
    '/login',
    '/signup',
    '/dashboard',
    '/staff/staffdashboard'
  ];
  
  for (const route of routes) {
    try {
      const response = await fetch(`http://localhost:3000${route}`, {
        method: 'HEAD'
      });
      
      if (response.ok || response.status === 200) {
        logQAResult('APPLICATION_ROUTES', 'PASS', `Route '${route}' is accessible`);
      } else if (response.status === 404) {
        logQAResult('APPLICATION_ROUTES', 'WARNING', `Route '${route}' returns 404`);
      } else {
        logQAResult('APPLICATION_ROUTES', 'FAIL', `Route '${route}' returns HTTP ${response.status}`);
      }
    } catch (error) {
      logQAResult('APPLICATION_ROUTES', 'FAIL', `Cannot reach route '${route}'`, error);
    }
  }
}

// QA Test 8: Environment Variables Test
function testEnvironmentVariables() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  // This test would need to be run in the actual application context
  logQAResult('ENVIRONMENT_VARS', 'INFO', 'Environment variables test requires application context');
}

// QA Test 9: Console Errors Check
function testConsoleErrors() {
  // Check if there are any console errors
  const originalError = console.error;
  let errorCount = 0;
  
  console.error = function(...args) {
    errorCount++;
    originalError.apply(console, args);
  };
  
  setTimeout(() => {
    console.error = originalError;
    if (errorCount === 0) {
      logQAResult('CONSOLE_ERRORS', 'PASS', 'No console errors detected during test period');
    } else {
      logQAResult('CONSOLE_ERRORS', 'WARNING', `${errorCount} console errors detected`);
    }
  }, 5000);
}

// Main QA Test Runner
async function runQATests() {
  console.log('🚀 Starting Comprehensive QA Tests...\n');
  
  // Initialize results
  qaResults = [];
  
  // Run all tests
  await testSupabaseConnection();
  await testDatabaseAccess();
  await testAuthSystem();
  
  const accessToken = await testAdminLogin();
  await testProfileData(accessToken);
  
  await testMembershipTypes();
  await testApplicationRoutes();
  testEnvironmentVariables();
  testConsoleErrors();
  
  // Generate summary
  setTimeout(() => {
    generateQASummary();
  }, 6000);
}

// Generate QA Summary
function generateQASummary() {
  console.log('\n📊 QA TEST SUMMARY');
  console.log('==================');
  
  const summary = qaResults.reduce((acc, result) => {
    acc[result.status] = (acc[result.status] || 0) + 1;
    return acc;
  }, {});
  
  console.log(`✅ PASSED: ${summary.PASS || 0}`);
  console.log(`❌ FAILED: ${summary.FAIL || 0}`);
  console.log(`⚠️ WARNINGS: ${summary.WARNING || 0}`);
  console.log(`ℹ️ INFO: ${summary.INFO || 0}`);
  console.log(`📋 TOTAL TESTS: ${qaResults.length}`);
  
  // Show failed tests
  const failedTests = qaResults.filter(r => r.status === 'FAIL');
  if (failedTests.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    failedTests.forEach(test => {
      console.log(`   • ${test.category}: ${test.details}`);
    });
  }
  
  // Show warnings
  const warningTests = qaResults.filter(r => r.status === 'WARNING');
  if (warningTests.length > 0) {
    console.log('\n⚠️ WARNINGS:');
    warningTests.forEach(test => {
      console.log(`   • ${test.category}: ${test.details}`);
    });
  }
  
  // Overall status
  const overallStatus = summary.FAIL > 0 ? 'FAILED' : 
                       summary.WARNING > 0 ? 'WARNINGS' : 'PASSED';
  
  console.log(`\n🎯 OVERALL STATUS: ${overallStatus}`);
  
  return {
    summary,
    failedTests,
    warningTests,
    overallStatus,
    results: qaResults
  };
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runQATests,
    generateQASummary,
    qaResults
  };
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  console.log('QA Test Script Loaded. Run runQATests() to start testing.');
}
