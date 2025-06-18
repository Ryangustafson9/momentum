
import { supabase } from '@/lib/supabaseClient.js';
import { initialDataSets } from '@/lib/initialData';
import { apiService } from '@/services/apiService';

const log = (level, message, ...args) => {
  const prefix = "[InitializationService]";
  if (level === 'error') console.error(prefix, message, ...args);
  else if (level === 'warn') console.warn(prefix, message, ...args);
  else console.log(prefix, message, ...args);
};

const initializeEntity = async (supabaseClient, entityName, initialEntities, fetchExistingCountFunc, insertFunc, additionalCheck = () => true, localDataService, localInvalidateCache) => {
  if (!initialEntities || initialEntities.length === 0) {
    log('info', `No initial ${entityName} provided, skipping.`);
    return;
  }

  if (supabaseClient) {
    try {
      const { count, error: countError } = await fetchExistingCountFunc();
      if (countError && countError.code !== '42P01') { 
        log('error', `Error counting ${entityName} (Supabase), table might not exist or RLS issue. Skipping initialization:`, countError.message);
        return;
      }
      if ((count === 0 || countError?.code === '42P01') && additionalCheck()) {
        const { error: insertError } = await insertFunc(initialEntities);
        if (insertError) log('error', `Error initializing ${entityName} in Supabase:`, insertError.message);
        else log('info', `Successfully initialized ${entityName} in Supabase.`);
      } else if (count > 0) {
        log('info', `${entityName} already exist in Supabase (${count} found), skipping Supabase initialization.`);
      } else if(!additionalCheck()) {
        log('info', `Additional check failed for ${entityName}, skipping Supabase initialization.`);
      }
    } catch (e) {
      log('error', `Exception during Supabase ${entityName} initialization:`, e.message);
    }
  } else {
    log('warn', `Supabase client not available. Initializing ${entityName} in localStorage.`);
    const serviceName = entityName.charAt(0).toLowerCase() + entityName.slice(1);
    const service = localDataService?.[`${serviceName}Service`];

    if (!service || typeof service.getAll !== 'function' || typeof service.create !== 'function') {
        log('error', `Data service methods not found for ${entityName} in localDataService.`);
        return;
    }
    
    const existing = await service.getAll();
    if ((!existing || existing.length === 0) && additionalCheck()) {
        for (const entity of initialEntities) {
            await service.create(entity);
        }
        log('info', `Successfully initialized ${entityName} in localStorage.`);
    } else if (existing && existing.length > 0) {
        log('info', `${entityName} already exist in localStorage, skipping localStorage initialization.`);
    }
    localInvalidateCache?.(entityName);
  }
};


export const initializeGeneralSettings = async (supabaseClient, initialSettings, localSettingsService, localInvalidateCache) => {
  if (!initialSettings) { log('info', "No initial general settings provided."); return; }
  
  if (supabaseClient) {
    const { data: existing, error } = await supabaseClient.from('general_settings').select('id').eq('id', 1).maybeSingle();
    if (error && error.code !== 'PGRST116' && error.code !== '42P01') { log('error', "Error fetching general_settings:", error.message); return; }
    if (!existing || error?.code === '42P01') {
      const { error: insertErr } = await supabaseClient.from('general_settings').insert([{ ...initialSettings, id: 1, updated_at: new Date().toISOString() }]);
      if (insertErr) log('error', "Error initializing general_settings in Supabase:", insertErr.message);
      else log('info', "Initialized general_settings in Supabase.");
    } else { log('info', "General settings already exist in Supabase."); }
  } else {
    log('warn', "Supabase N/A. Initializing general_settings in localStorage.");
    await localSettingsService?.updateGeneral(initialSettings); 
    localInvalidateCache?.('generalSettings');
  }
};

export const initializeNotificationSettings = async (supabaseClient, initialSettings, localSettingsService, localInvalidateCache) => {
  if (!initialSettings) { log('info', "No initial notification settings provided."); return; }

  if (supabaseClient) {
    const { data: existing, error } = await supabaseClient.from('notification_settings').select('id').eq('id', 1).maybeSingle();
    if (error && error.code !== 'PGRST116' && error.code !== '42P01') { log('error', "Error fetching notification_settings:", error.message); return; }
    if (!existing || error?.code === '42P01') {
      const { error: insertErr } = await supabaseClient.from('notification_settings').insert([{ ...initialSettings, id: 1, updated_at: new Date().toISOString() }]);
      if (insertErr) log('error', "Error initializing notification_settings in Supabase:", insertErr.message);
      else log('info', "Initialized notification_settings in Supabase.");
    } else { log('info', "Notification settings already exist in Supabase."); }
  } else {
    log('warn', "Supabase N/A. Initializing notification_settings in localStorage.");
    await localSettingsService?.updateNotification(initialSettings);
    localInvalidateCache?.('notificationSettings');
  }
};

export const initializeAdminPanelSettings = async (supabaseClient, initialSettings, localSettingsService, localInvalidateCache) => {
   if (!initialSettings) { log('info', "No initial admin panel settings provided."); return; }

  if (supabaseClient) {
    const { data: existing, error } = await supabaseClient.from('admin_panel_settings').select('id').eq('id', 1).maybeSingle();
    if (error && error.code !== 'PGRST116' && error.code !== '42P01') { log('error', "Error fetching admin_panel_settings:", error.message); return; }
    if (!existing || error?.code === '42P01') {
      const { error: insertErr } = await supabaseClient.from('admin_panel_settings').insert([{ ...initialSettings, id: 1, updated_at: new Date().toISOString() }]);
      if (insertErr) log('error', "Error initializing admin_panel_settings in Supabase:", insertErr.message);
      else log('info', "Initialized admin_panel_settings in Supabase.");
    } else { log('info', "Admin panel settings already exist in Supabase."); }
  } else {
    log('warn', "Supabase N/A. Initializing admin_panel_settings in localStorage.");
    await localSettingsService?.updateAdminPanel(initialSettings);
    localInvalidateCache?.('adminPanelSettings');
  }
};

export const initializeStaffRoles = async (supabaseClient, initialRoles, localStaffRoleService, localInvalidateCache) => {
  if (!initialRoles || initialRoles.length === 0) { log('info', "No initial staff roles."); return; }

  if (supabaseClient) {
    const rolesToUpsert = initialRoles.map(role => ({
      id: role.id || role.name.toLowerCase().replace(/\s+/g, '-'),
      name: role.name, description: role.description, permissions: role.permissions || {},
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    }));
    const { error } = await supabaseClient.from('staff_roles').upsert(rolesToUpsert, { onConflict: 'id' });
    if (error) log('error', `Error initializing/upserting staff_roles in Supabase: "${error.message}". RLS might be active or table missing.`);
    else log('info', "Initialized/upserted staff_roles in Supabase.");
  } else {
    log('warn', "Supabase N/A. Initializing staff_roles in localStorage.");
    const existingRoles = await localStaffRoleService?.getAll();
    const existingRoleIds = existingRoles?.map(r => r.id) || [];
    const rolesToCreate = [];
    for (const role of initialRoles) {
        const roleId = role.id || role.name.toLowerCase().replace(/\s+/g, '-');
        if (!existingRoleIds.includes(roleId)) {
             rolesToCreate.push({ ...role, id: roleId });
        }
    }
    if (rolesToCreate.length > 0) {
        await localStaffRoleService?.saveAll(rolesToCreate);
    }
    log('info', "Staff roles localStorage initialization complete.");
    localInvalidateCache?.('staffRoles');
  }
};

export const initializeMembershipTypes = async (supabaseClient, initialMembershipTypes, localDataService, localInvalidateCache) => {
  await initializeEntity(
    supabaseClient,
    'membershipTypes',
    initialMembershipTypes.map(mt => ({ ...mt, role_id: mt.role_id || null })),
    async () => supabaseClient.from('membership_types').select('id', { count: 'exact', head: true }),
    async (types) => supabaseClient.from('membership_types').insert(types.map(t => ({...t, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }))),
    () => true,
    localDataService,
    localInvalidateCache
  );
};

export const initializeClasses = async (supabaseClient, initialClasses, localDataService, localInvalidateCache) => {
  await initializeEntity(
    supabaseClient,
    'classes',
    initialClasses,
    async () => supabaseClient.from('classes').select('id', { count: 'exact', head: true }),
    async (classes) => supabaseClient.from('classes').insert(classes.map(c => ({...c, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }))),
    () => true,
    localDataService,
    localInvalidateCache
  );
};

export const initializeTestMembers = async (supabaseClient, initialMembers, localMemberService, localInvalidateCache) => {
  if (!initialMembers || initialMembers.length === 0) { log('info', "No test members."); return; }
  log('info', `Initializing ${initialMembers.length} test members.`);
  let success = 0, errors = 0;

  if (supabaseClient) {
    const { data: existing, error: fetchErr } = await supabaseClient.from('profiles').select('email').in('email', initialMembers.map(m => m.email));
    
    if (fetchErr && fetchErr.code !== '42P01') { 
        log('error', "Error fetching existing test members (Supabase), table might not exist or RLS issue:", fetchErr.message); 
        return; 
    }
    
    const existingEmails = existing ? existing.map(m => m.email) : [];
    const toInsert = initialMembers.filter(m => !existingEmails.includes(m.email));
    if (toInsert.length === 0 && (!fetchErr || fetchErr.code !== '42P01')) { 
        log('info', "All test members already exist in Supabase."); 
        return; 
    }

    for (const member of toInsert) {
      const payload = { ...member, id: member.id || crypto.randomUUID(), system_member_id: member.system_member_id || Math.floor(100000 + Math.random() * 900000), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), profile_creation_date: new Date().toISOString(), join_date: new Date().toISOString().split('T')[0], status: 'Active', role: 'member' };
      const { error } = await supabaseClient.rpc('create_member_transactional', { member_payload: payload });
      if (error) { log('error', `Error inserting test member ${member.email} (Supabase RPC):`, error.message); errors++; }
      else success++;
    }
  } else {
    log('warn', "Supabase N/A. Initializing test members in localStorage.");
    const existingMembers = await localMemberService?.getAll();
    const existingEmails = existingMembers?.map(m => m.email) || [];
    const toInsert = initialMembers.filter(m => !existingEmails.includes(m.email));

    for (const member of toInsert) {
       try {
        await localMemberService?.create({ ...member });
        success++;
       } catch (e) {
        log('error', `Error inserting test member ${member.email} (localStorage):`, e.message); errors++;
       }
    }
    localInvalidateCache?.('members');
  }
  log('info', `Test member initialization complete. Success: ${success}, Errors: ${errors}.`);
};


export const initializeAllData = async (supabaseClient, allInitialDataSets) => {
  const isInitializedKey = 'appDataInitialized_v4'; // Updated version
  const isInitialized = localStorage.getItem(isInitializedKey) === 'true';

  if (isInitialized && supabaseClient) {
    log('info', "Application data already marked as initialized. Skipping full data load.");
    return;
  }

  log('info', "Starting simplified data initialization process...");

  // ⚠️ TODO: Implement simplified initialization using apiService
  // For now, just mark as initialized to prevent blocking the app
  localStorage.setItem(isInitializedKey, 'true');
  log('info', "Data initialization marked complete. Using apiService for data loading.");

  if (!supabaseClient) {
    // Fallback to apiService for data loading
    try {
      await apiService.getMembers();
      await apiService.getClasses();
      await apiService.getMembershipTypes();
      await apiService.getStaffRoles();
      await apiService.getSettings();
      log('info', "Fallback data loading complete via apiService.");
    } catch (error) {
      log('error', "Error during fallback data loading:", error);
    }
  }
};


