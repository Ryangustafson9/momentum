/**
 * Check Memberships Table Schema
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

async function checkSchema() {
  try {
    // Try to get one membership to see available columns
    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .limit(1);
      
    if (error) {
      console.log('Error:', error.message);
    } else {
      console.log('Memberships table columns:', data.length > 0 ? Object.keys(data[0]) : 'No data available');
    }
    
    // Also check membership_types
    const { data: typesData, error: typesError } = await supabase
      .from('membership_types')
      .select('*')
      .limit(1);
      
    if (typesError) {
      console.log('Membership Types Error:', typesError.message);
    } else {
      console.log('Membership Types table columns:', typesData.length > 0 ? Object.keys(typesData[0]) : 'No data available');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSchema();
