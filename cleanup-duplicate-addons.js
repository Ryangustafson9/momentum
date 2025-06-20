// Clean up duplicate add-ons
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://udsmdrbnzplgbtmswyyl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkc21kcmJuenBsZ2J0bXN3eXlsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDE4NjUwOCwiZXhwIjoyMDQ5NzYyNTA4fQ.o9nBBjVglwmgxnw0H6b-0uRQPW9iFSJ_50mXhiTNLzI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
});

async function cleanupDuplicateAddons() {
  console.log('🧹 Starting duplicate add-ons cleanup...');
  
  try {
    // Get all add-ons
    const { data: addons, error } = await supabase
      .from('membership_types')
      .select('*')
      .or('category.eq.Add-ons,is_addon.eq.true')
      .order('name', { ascending: true })
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching add-ons:', error);
      return;
    }
    
    console.log(`📊 Found ${addons.length} add-ons total`);
    
    // Group by name to find duplicates
    const grouped = {};
    addons.forEach(addon => {
      const key = addon.name.toLowerCase().trim();
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(addon);
    });
    
    // Find and handle duplicates
    const duplicates = Object.entries(grouped).filter(([name, items]) => items.length > 1);
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicates found');
      return;
    }
    
    console.log(`🔄 Found ${duplicates.length} duplicate add-on groups:`);
    
    for (const [name, items] of duplicates) {
      console.log(`\n📋 Processing "${name}" (${items.length} duplicates):`);
      
      // Keep the first one (oldest), delete the rest
      const toKeep = items[0];
      const toDelete = items.slice(1);
      
      console.log(`  ✅ Keeping: ${toKeep.name} (${toKeep.id}) - Created: ${toKeep.created_at}`);
      
      for (const addon of toDelete) {
        console.log(`  🗑️  Deleting: ${addon.name} (${addon.id}) - Created: ${addon.created_at}`);
        
        const { error: deleteError } = await supabase
          .from('membership_types')
          .delete()
          .eq('id', addon.id);
        
        if (deleteError) {
          console.error(`    ❌ Error deleting ${addon.id}:`, deleteError);
        } else {
          console.log(`    ✅ Deleted successfully`);
        }
      }
    }
    
    // Now ensure all remaining add-ons have correct flags
    console.log('\n🔧 Updating remaining add-ons with correct flags...');
    
    const { data: remainingAddons, error: fetchError } = await supabase
      .from('membership_types')
      .select('*')
      .or('category.eq.Add-ons,is_addon.eq.true');
    
    if (fetchError) {
      console.error('❌ Error fetching remaining add-ons:', fetchError);
      return;
    }
    
    for (const addon of remainingAddons) {
      const updates = {
        category: 'Add-ons',
        is_addon: true,
        requires_primary_membership: true,
        available_online: true,
        available_for_sale: true,
        person_capacity: 1,
        max_family_members: 1,
        addon_billing_cycle: addon.addon_billing_cycle || 'monthly'
      };
      
      const { error: updateError } = await supabase
        .from('membership_types')
        .update(updates)
        .eq('id', addon.id);
      
      if (updateError) {
        console.error(`❌ Error updating ${addon.name}:`, updateError);
      } else {
        console.log(`✅ Updated ${addon.name} with correct flags`);
      }
    }
    
    console.log('\n🎉 Cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

cleanupDuplicateAddons();
