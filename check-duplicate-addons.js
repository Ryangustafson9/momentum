// Check for duplicate add-ons in the database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://udsmdrbnzplgbtmswyyl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkc21kcmJuenBsZ2J0bXN3eXlsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDE4NjUwOCwiZXhwIjoyMDQ5NzYyNTA4fQ.o9nBBjVglwmgxnw0H6b-0uRQPW9iFSJ_50mXhiTNLzI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDuplicateAddons() {
  console.log('🔍 Checking for duplicate add-ons...');
  
  try {
    // Get all add-ons
    const { data: addons, error } = await supabase
      .from('membership_types')
      .select('*')
      .eq('category', 'Add-ons')
      .order('name');
    
    if (error) {
      console.error('❌ Error fetching add-ons:', error);
      return;
    }
    
    console.log(`📊 Found ${addons.length} add-ons total:`);
    
    // Group by name to find duplicates
    const grouped = {};
    addons.forEach(addon => {
      if (!grouped[addon.name]) {
        grouped[addon.name] = [];
      }
      grouped[addon.name].push(addon);
    });
    
    // Find duplicates
    const duplicates = Object.entries(grouped).filter(([name, items]) => items.length > 1);
    
    if (duplicates.length > 0) {
      console.log('\n❌ DUPLICATE ADD-ONS FOUND:');
      duplicates.forEach(([name, items]) => {
        console.log(`\n🔄 "${name}" appears ${items.length} times:`);
        items.forEach((item, index) => {
          console.log(`   ${index + 1}. ID: ${item.id} | Price: $${item.price} | Created: ${item.created_at}`);
        });
      });
    } else {
      console.log('✅ No duplicate add-ons found');
    }
    
    // List all add-ons
    console.log('\n📋 All add-ons:');
    addons.forEach(addon => {
      console.log(`   - ${addon.name} ($${addon.price}) [${addon.id}]`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDuplicateAddons();
