// Test script to simulate the customize page flow
// Run this in browser console to test the checkout page with sessionStorage data

const testCheckoutData = {
  plan: 1, // Assuming plan ID 1 exists
  addons: [], // Empty for now
  familyMembers: [],
  totalCost: 50 // Sample cost
};

sessionStorage.setItem('membershipCheckoutData', JSON.stringify(testCheckoutData));
console.log('✅ Test checkout data stored in sessionStorage:', testCheckoutData);
console.log('🔄 Now navigate to /join-online/checkout to test');

// You can also clear the data with:
// sessionStorage.removeItem('membershipCheckoutData');
