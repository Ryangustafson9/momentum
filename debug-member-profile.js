/**
 * Debug script to check if member profile access is working
 */

// Check if running in browser console
if (typeof window !== 'undefined') {
  console.log('🔍 Debug: Checking member profile access...');
  
  // Check current URL
  console.log('📍 Current URL:', window.location.href);
  
  // Check if React Router is working
  console.log('🛣️ Current pathname:', window.location.pathname);
  
  // Check for any console errors
  console.log('❗ Check browser console for any errors...');
  
  // Try to access the member data
  if (window.supabase) {
    console.log('📊 Checking member data...');
    window.supabase
      .from('profiles')
      .select('*')
      .eq('system_member_id', 62)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ Error fetching member 62:', error);
        } else {
          console.log('✅ Member 62 data:', data);
        }
      });
  } else {
    console.log('⚠️ Supabase client not available in window object');
  }
  
  // Check if the member profile component is loaded
  const memberProfileElement = document.querySelector('[data-component="member-profile"]');
  if (memberProfileElement) {
    console.log('✅ Member profile component found in DOM');
  } else {
    console.log('❌ Member profile component not found in DOM');
  }
  
} else {
  console.log('This script should be run in the browser console');
}
