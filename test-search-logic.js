/**
 * Test Search Functionality
 */

// Sample data like what should be in the component
const sampleMembers = [
  {
    id: 'b96f3215-a423-4fd0-816b-1c0d7a4fda94',
    name: 'Alex Johnson',
    full_name: 'Alex Johnson',
    first_name: 'Alex',
    last_name: 'Johnson',
    email: 'alex.johnson@testgym.com',
    role: 'member',
    system_member_id: 59,
    phone: '555-1001'
  },
  {
    id: '2e729a56-4723-42d2-90e8-1a7ab7d48d2e',
    name: 'David Brown',
    full_name: 'David Brown', 
    first_name: 'David',
    last_name: 'Brown',
    email: 'david.brown@testgym.com',
    role: 'member',
    system_member_id: 61,
    phone: '555-1201'
  },
  {
    id: 'd75a3820-ff9c-4122-8758-1dc5ce42f971',
    name: 'Emma Thompson',
    full_name: 'Emma Thompson',
    first_name: 'Emma',
    last_name: 'Thompson',
    email: 'frontdesk1@momentumtest.com',
    role: 'staff',
    system_member_id: 56,
    phone: '555-0301'
  }
];

// Replicate the search logic from MemberSearch component
function testSearch(allMembers, searchTerm) {
  console.log(`\n🔍 Testing search for: "${searchTerm}"`);
  console.log(`📊 Total members to search: ${allMembers.length}`);
  
  if (searchTerm.length < 2) {
    console.log('❌ Search term too short (< 2 characters)');
    return [];
  }

  const filtered = allMembers.filter(member => {
    if (!member) return false;

    const name = member.name || member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim();
    const email = member.email || '';
    const phone = member.phone || '';
    const role = member.role || '';
    const systemMemberId = member.system_member_id || '';

    const searchLower = searchTerm.toLowerCase();

    const nameMatch = name.toLowerCase().includes(searchLower);
    const emailMatch = email.toLowerCase().includes(searchLower);
    const phoneMatch = phone.includes(searchTerm);
    const roleMatch = role.toLowerCase().includes(searchLower);
    const idMatch = String(systemMemberId).toLowerCase().includes(searchLower);

    const matches = nameMatch || emailMatch || phoneMatch || roleMatch || idMatch;
    
    if (matches) {
      console.log(`✅ Match: ${name} (${email}) - Matched on:`, {
        name: nameMatch,
        email: emailMatch,
        phone: phoneMatch,
        role: roleMatch,
        id: idMatch
      });
    }

    return matches;
  }).slice(0, 8);

  console.log(`📊 Results: ${filtered.length} matches found`);
  return filtered;
}

// Test various searches
console.log('🧪 Testing MemberSearch functionality...');

testSearch(sampleMembers, 'alex');
testSearch(sampleMembers, 'Alex');
testSearch(sampleMembers, 'johnson');
testSearch(sampleMembers, 'david');
testSearch(sampleMembers, 'staff');
testSearch(sampleMembers, '59');
testSearch(sampleMembers, '555');
testSearch(sampleMembers, 'test');
testSearch(sampleMembers, 'xyz'); // Should return no results

console.log('\n✅ Search functionality test completed!');
