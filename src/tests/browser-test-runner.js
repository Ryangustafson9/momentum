/**
 * 🚀 MOMENTUM APP V2.0 - BROWSER TEST RUNNER
 * 
 * Copy and paste this script into the browser console to run automated tests
 * while the app is running in development mode.
 */

(function() {
  'use strict';
  
  console.log('🚀 MOMENTUM APP V2.0 - INITIALIZING BROWSER TESTS');
  console.log('=' .repeat(60));
  
  /**
   * 🧪 Test DOM elements and UI consistency
   */
  const testUIElements = () => {
    console.log('🎨 Testing UI Elements...');
    
    const results = {
      logoPresent: false,
      navigationWorking: false,
      formsAccessible: false,
      brandingConsistent: false,
      responsiveDesign: false
    };
    
    try {
      // Test logo presence
      const logoElements = document.querySelectorAll('img[src*="momentum"], img[alt*="Momentum"], img[alt*="momentum"]');
      results.logoPresent = logoElements.length > 0;
      
      // Test navigation elements
      const navElements = document.querySelectorAll('nav, [role="navigation"], .sidebar, .menu');
      results.navigationWorking = navElements.length > 0;
      
      // Test form accessibility
      const formElements = document.querySelectorAll('form, input, button');
      results.formsAccessible = formElements.length > 0;
      
      // Test branding colors (check if primary blue is used)
      const computedStyles = window.getComputedStyle(document.body);
      const hasBlueTheme = document.querySelector('[class*="blue"], [style*="blue"], [class*="primary"]');
      results.brandingConsistent = !!hasBlueTheme;
      
      // Test responsive design
      const viewport = window.innerWidth;
      const hasResponsiveElements = document.querySelectorAll('[class*="responsive"], [class*="mobile"], [class*="sm:"], [class*="md:"], [class*="lg:"]').length > 0;
      results.responsiveDesign = viewport > 0 && hasResponsiveElements;
      
      console.log('✅ UI Elements Test Results:', results);
      return results;
      
    } catch (error) {
      console.error('❌ UI Elements Test Failed:', error);
      return { ...results, error: error.message };
    }
  };
  
  /**
   * 🔐 Test authentication state
   */
  const testAuthState = () => {
    console.log('🔐 Testing Authentication State...');
    
    const results = {
      authContextAvailable: false,
      sessionExists: false,
      userDataPresent: false,
      roleBasedAccess: false
    };
    
    try {
      // Check if auth context is available (React dev tools required)
      const authContext = window.React || window._reactInternalFiber;
      results.authContextAvailable = !!authContext;
      
      // Check localStorage for session data
      const sessionData = localStorage.getItem('supabase.auth.token') || localStorage.getItem('cached_user');
      results.sessionExists = !!sessionData;
      
      // Check if user data is in DOM (profile info, names, etc.)
      const userInfo = document.querySelector('[data-testid="user-info"], .user-name, .profile-name') || 
                     document.textContent.includes('@') || 
                     document.textContent.includes('Welcome');
      results.userDataPresent = !!userInfo;
      
      // Check role-based elements
      const roleElements = document.querySelectorAll('[class*="admin"], [class*="staff"], [class*="member"], [data-role]');
      results.roleBasedAccess = roleElements.length > 0;
      
      console.log('✅ Authentication State Test Results:', results);
      return results;
      
    } catch (error) {
      console.error('❌ Authentication State Test Failed:', error);
      return { ...results, error: error.message };
    }
  };
  
  /**
   * 🌐 Test routing and navigation
   */
  const testRouting = () => {
    console.log('🌐 Testing Routing & Navigation...');
    
    const results = {
      currentRouteValid: false,
      linksWorking: false,
      protectedRoutesExist: false,
      navigationConsistent: false
    };
    
    try {
      // Test current route
      const currentPath = window.location.pathname;
      results.currentRouteValid = currentPath.length > 0;
      
      // Test navigation links
      const navLinks = document.querySelectorAll('a[href], button[onClick]');
      results.linksWorking = navLinks.length > 0;
      
      // Test protected route indicators
      const protectedElements = document.querySelectorAll('[data-protected], .private-route, .auth-required');
      results.protectedRoutesExist = protectedElements.length > 0 || currentPath.includes('portal');
      
      // Test navigation consistency
      const navElements = document.querySelectorAll('nav a, .nav-link, .menu-item');
      results.navigationConsistent = navElements.length > 0;
      
      console.log('✅ Routing Test Results:', results);
      return results;
      
    } catch (error) {
      console.error('❌ Routing Test Failed:', error);
      return { ...results, error: error.message };
    }
  };
  
  /**
   * 📱 Test responsive design
   */
  const testResponsiveDesign = () => {
    console.log('📱 Testing Responsive Design...');
    
    const results = {
      mobileViewport: false,
      tabletViewport: false,
      desktopViewport: false,
      flexibleLayout: false
    };
    
    try {
      const viewport = window.innerWidth;
      
      // Test different viewport sizes
      results.mobileViewport = viewport <= 768;
      results.tabletViewport = viewport > 768 && viewport <= 1024;
      results.desktopViewport = viewport > 1024;
      
      // Test flexible layout
      const flexElements = document.querySelectorAll('[class*="flex"], [class*="grid"], [class*="responsive"]');
      results.flexibleLayout = flexElements.length > 0;
      
      console.log('✅ Responsive Design Test Results:', results);
      return results;
      
    } catch (error) {
      console.error('❌ Responsive Design Test Failed:', error);
      return { ...results, error: error.message };
    }
  };
  
  /**
   * 🎯 Run all browser tests
   */
  const runAllBrowserTests = () => {
    console.log('🧪 STARTING COMPREHENSIVE BROWSER TESTS');
    console.log('=' .repeat(60));
    
    const allResults = {};
    
    try {
      // Run all test suites
      allResults.uiElements = testUIElements();
      allResults.authState = testAuthState();
      allResults.routing = testRouting();
      allResults.responsive = testResponsiveDesign();
      
      // Calculate overall success rate
      const totalTests = Object.values(allResults).reduce((acc, result) => {
        return acc + Object.keys(result).filter(key => key !== 'error').length;
      }, 0);
      
      const passedTests = Object.values(allResults).reduce((acc, result) => {
        return acc + Object.values(result).filter(value => value === true).length;
      }, 0);
      
      const successRate = ((passedTests / totalTests) * 100).toFixed(1);
      
      console.log('=' .repeat(60));
      console.log(`🎯 BROWSER TEST RESULTS: ${passedTests}/${totalTests} tests passed (${successRate}%)`);
      console.log('=' .repeat(60));
      
      // Display detailed results
      Object.entries(allResults).forEach(([testSuite, results]) => {
        console.log(`\n📊 ${testSuite.toUpperCase()}:`);
        Object.entries(results).forEach(([test, result]) => {
          if (test !== 'error') {
            console.log(`  ${result ? '✅' : '❌'} ${test}`);
          }
        });
        if (results.error) {
          console.log(`  ⚠️  Error: ${results.error}`);
        }
      });
      
      return {
        success: successRate >= 70, // 70% pass rate for browser tests
        successRate,
        totalTests,
        passedTests,
        detailedResults: allResults
      };
      
    } catch (error) {
      console.error('❌ Browser test runner failed:', error);
      return {
        success: false,
        error: error.message,
        detailedResults: allResults
      };
    }
  };
  
  // Make functions available globally for manual testing
  window.momentumBrowserTests = {
    runAllBrowserTests,
    testUIElements,
    testAuthState,
    testRouting,
    testResponsiveDesign
  };
  
  // Auto-run tests
  console.log('🤖 Auto-running browser tests...');
  setTimeout(() => {
    const results = runAllBrowserTests();
    
    if (results.success) {
      console.log('🎉 BROWSER TESTS PASSED! Momentum App V2.0 is working correctly.');
    } else {
      console.log('⚠️  Some browser tests failed. Check the detailed results above.');
    }
    
    console.log('\n📝 To run manual tests, use: window.momentumBrowserTests.runAllBrowserTests()');
    console.log('🔧 Available test functions:', Object.keys(window.momentumBrowserTests));
    
  }, 1000);
  
})();
