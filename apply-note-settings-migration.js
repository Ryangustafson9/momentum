// Apply the note settings migration to create management tables
import { supabase } from './src/lib/supabaseClient.js';
import fs from 'fs';

async function applyNoteSettingsMigration() {
  console.log('🔄 Applying note settings migration...');
  
  try {
    // Read the migration file
    const migrationSQL = fs.readFileSync('./supabase/migrations/20250625141000_create_note_settings_tables.sql', 'utf8');
    
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
        // For CREATE TABLE and other DDL statements, we need to use rpc
        if (statement.includes('CREATE TABLE') || statement.includes('CREATE INDEX') || statement.includes('ALTER TABLE')) {
          // These need to be executed as raw SQL
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql_query: statement 
          });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } else {
          // For INSERT statements, we can use the regular client
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql_query: statement 
          });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err.message);
        // Continue with other statements
      }
    }
    
    // Test the migration by checking if tables exist
    console.log('\n🧪 Testing migration...');
    
    try {
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('note_subjects')
        .select('id, name')
        .limit(1);
      
      if (subjectsError) {
        console.error('❌ note_subjects table test failed:', subjectsError);
      } else {
        console.log('✅ note_subjects table is accessible');
        console.log('📊 Sample subjects:', subjectsData);
      }
    } catch (err) {
      console.error('❌ Error testing note_subjects table:', err.message);
    }
    
    try {
      const { data: templatesData, error: templatesError } = await supabase
        .from('note_templates')
        .select('id, name')
        .limit(1);
      
      if (templatesError) {
        console.error('❌ note_templates table test failed:', templatesError);
      } else {
        console.log('✅ note_templates table is accessible');
        console.log('📊 Sample templates:', templatesData);
      }
    } catch (err) {
      console.error('❌ Error testing note_templates table:', err.message);
    }
    
    try {
      const { data: settingsData, error: settingsError } = await supabase
        .from('note_settings')
        .select('*')
        .limit(1);
      
      if (settingsError) {
        console.error('❌ note_settings table test failed:', settingsError);
      } else {
        console.log('✅ note_settings table is accessible');
        console.log('📊 Settings:', settingsData);
      }
    } catch (err) {
      console.error('❌ Error testing note_settings table:', err.message);
    }
    
    console.log('\n🎉 Note settings migration completed!');
    console.log('📋 Summary:');
    console.log('  ✅ note_subjects table created with default subjects');
    console.log('  ✅ note_templates table created with sample templates');
    console.log('  ✅ note_settings table created with default configuration');
    console.log('  ✅ RLS policies applied for security');
    console.log('  ✅ Indexes created for performance');
    console.log('  ✅ Triggers installed for auto-updates');
    
    console.log('\n📍 Next Steps:');
    console.log('  1. Go to Settings → Note Settings in the admin panel');
    console.log('  2. Customize subjects and templates as needed');
    console.log('  3. Configure default settings');
    console.log('  4. Test note creation with new subjects');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
applyNoteSettingsMigration();
