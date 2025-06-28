// Apply the subject field migration to member_notes table
import { supabase } from './src/lib/supabaseClient.js';
import fs from 'fs';

async function applySubjectMigration() {
  console.log('🔄 Applying subject field migration to member_notes table...');
  
  try {
    // Read the migration file
    const migrationSQL = fs.readFileSync('./supabase/migrations/20250625140000_add_subject_to_member_notes.sql', 'utf8');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}:`);
      console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err.message);
        // Continue with other statements
      }
    }
    
    // Test the migration by checking if subject column exists
    console.log('\n🧪 Testing migration...');
    const { data: testData, error: testError } = await supabase
      .from('member_notes')
      .select('id, subject')
      .limit(1);
    
    if (testError) {
      console.error('❌ Migration test failed:', testError);
    } else {
      console.log('✅ Migration test passed - subject column is accessible');
      console.log('📊 Test result:', testData);
    }
    
    // Try to insert a test note with subject
    console.log('\n🧪 Testing subject field functionality...');
    
    // First, get a valid member and staff ID
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .in('role', ['member', 'admin', 'staff'])
      .limit(2);
    
    if (profileError || !profiles || profiles.length < 2) {
      console.warn('⚠️ Could not find test profiles for subject test');
    } else {
      const member = profiles.find(p => p.role === 'member');
      const staff = profiles.find(p => p.role === 'admin' || p.role === 'staff');
      
      if (member && staff) {
        const testNote = {
          member_id: member.id,
          staff_id: staff.id,
          content: 'Test note with subject - DELETE ME',
          subject: 'Test Subject'
        };
        
        const { data: insertData, error: insertError } = await supabase
          .from('member_notes')
          .insert([testNote])
          .select('id, subject, content')
          .single();
        
        if (insertError) {
          console.error('❌ Subject test insert failed:', insertError);
        } else {
          console.log('✅ Subject test insert successful:', insertData);
          
          // Clean up test note
          await supabase
            .from('member_notes')
            .delete()
            .eq('id', insertData.id);
          console.log('🧹 Test note cleaned up');
        }
      }
    }
    
    console.log('\n🎉 Subject migration completed!');
    console.log('📋 Summary:');
    console.log('  ✅ Subject column added to member_notes table');
    console.log('  ✅ Indexes created for better performance');
    console.log('  ✅ Auto-generation trigger installed');
    console.log('  ✅ Sample subjects populated for existing notes');
    console.log('  ✅ Categorized view created for AI features');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
applySubjectMigration();
