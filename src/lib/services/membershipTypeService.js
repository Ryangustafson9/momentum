
export const getMembershipTypes = async (supabase, isCacheValid, updateCache, getCache) => {
  if (isCacheValid?.('membershipTypes')) {
    const cachedData = getCache?.('membershipTypes');
    if (cachedData) return cachedData;
  }
  const selectString = 'id, name, price, billing_type, duration_months, features, available_for_sale, available_online, category, color, created_at, updated_at, role_id';
  const { data, error } = await supabase.from('membership_types').select(selectString);
  if (error) { 
      console.error('Error fetching membership types:', error.message); 
      console.error('Actual Supabase query attempted:', `from('membership_types').select('${selectString}')`);
      throw new Error(`Failed to fetch membership types: ${error.message}. Ensure the 'role_id' column exists on the 'membership_types' table and RLS policies are permissive.`); 
  }
  updateCache?.('membershipTypes', data);
  return data ?? [];
};

export const addMembershipType = async (supabase, planData, isValidUUID, invalidateCache) => {
  const newPlan = { 
      id: planData.id && isValidUUID?.(planData.id) ? planData.id : crypto.randomUUID(), 
      name: planData.name,
      price: planData.price,
      billing_type: planData.billing_type,
      duration_months: planData.duration_months,
      features: planData.features || [],
      available_for_sale: planData.available_for_sale !== undefined ? planData.available_for_sale : true,
      available_online: planData.available_online !== undefined ? planData.available_online : true,
      category: planData.category,
      color: planData.color,
      role_id: planData.role_id || null,
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('membership_types').insert([newPlan]).select().single();
  if (error) { 
    console.error('Error adding membership type:', error); 
    throw new Error(`Failed to add membership type: ${error.message}. Ensure RLS policies are permissive and the 'role_id' column exists.`); 
  }
  if (!data) {
    throw new Error('Failed to add membership type: No data returned after insert. This might indicate a silent failure, RLS issue, or schema mismatch.');
  }
  invalidateCache?.('membershipTypes'); 
  return data;
};

export const updateMembershipType = async (supabase, id, updatedData, isValidUUID, invalidateCache) => {
  if (!isValidUUID?.(id)) {
      console.error(`Invalid UUID provided for updateMembershipType: ${id}`);
      throw new Error("Invalid membership type ID for update.");
  }
  const dataToUpdate = { ...updatedData };
  dataToUpdate.updated_at = new Date().toISOString();
  
  const validKeys = ['name', 'price', 'billing_type', 'duration_months', 'features', 'available_for_sale', 'available_online', 'category', 'color', 'updated_at', 'role_id'];
  const finalUpdateData = {};
  for (const key of validKeys) {
      if (dataToUpdate.hasOwnProperty(key)) {
          finalUpdateData[key] = dataToUpdate[key];
      }
  }

  const { data, error } = await supabase.from('membership_types').update(finalUpdateData).eq('id', id).select().single();
  if (error) { 
    console.error('Error updating membership type:', error); 
    throw new Error(`Failed to update membership type: ${error.message}. Ensure RLS policies are permissive and the 'role_id' column exists.`); 
  }
  invalidateCache?.('membershipTypes'); 
  return data;
};

export const deleteMembershipType = async (supabase, id, isValidUUID, invalidateCache) => {
   if (!isValidUUID?.(id)) {
      console.error(`Attempted to delete membership type with invalid UUID: ${id}. This operation is blocked.`);
      throw new Error(`Cannot delete membership type with non-UUID ID: "${id}".`);
   }
  const { error } = await supabase.from('membership_types').delete().eq('id', id);
  if (error) { 
    console.error('Error deleting membership type:', error); 
    throw new Error(`Failed to delete membership type: ${error.message}. Ensure RLS policies are permissive.`); 
  }
  invalidateCache?.('membershipTypes'); 
  return true;
};


