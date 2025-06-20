// Test script to debug signup process
import { supabase } from './src/lib/supabaseClient.js';

async function testSignup() {
  const testEmail = `test+${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  console.log('Testing signup with:', { email: testEmail, password: testPassword });
  
  try {
    // Test auth signup
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User'
        }
      }
    });
    
    console.log('Auth signup result:', { data, error });
    
    if (error) {
      console.error('Auth signup failed:', error);
      return;
    }
    
    if (data.user) {
      console.log('Auth user created:', data.user.id);
      
      // Test profile creation
      const profileData = {
        id: data.user.id,
        role: 'nonmember',
        first_name: 'Test',
        last_name: 'User',
        name: 'Test User',
        email: testEmail
      };
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();
        
      console.log('Profile creation result:', { profile, profileError });
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testSignup();
}

export { testSignup };
