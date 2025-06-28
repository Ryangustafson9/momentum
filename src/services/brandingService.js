import { supabase } from '@/lib/supabaseClient';

const BRANDING_BUCKET = 'branding';
const CONFIG_TABLE = 'club_configuration';

export const brandingService = {
  /**
   * Uploads a file to Supabase Storage and returns the public URL
   */
  async uploadImage(file, type = 'logo') {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${type}-${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from(BRANDING_BUCKET).upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from(BRANDING_BUCKET).getPublicUrl(fileName);
    return urlData?.publicUrl || null;
  },

  /**
   * Save branding data to the club_configuration table (single row per club)
   */
  async saveBranding({ clubName, logoUrl, avatarUrl }) {
    // For single club, upsert row with id=1
    const updateData = { id: 1 };
    if (clubName !== undefined) updateData.club_name = clubName;
    if (logoUrl !== undefined) updateData.logo_url = logoUrl;
    if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;

    const { error } = await supabase
      .from(CONFIG_TABLE)
      .upsert([updateData], { onConflict: ['id'] });
    if (error) throw error;
    return true;
  },

  /**
   * Fetch all branding data from the club_configuration table
   */
  async getBranding() {
    const { data, error } = await supabase
      .from(CONFIG_TABLE)
      .select('club_name, logo_url, avatar_url')
      .eq('id', 1)
      .single();

    if (error) throw error;

    return {
      clubName: data?.club_name || 'Momentum Fitness',
      logoUrl: data?.logo_url || '',
      avatarUrl: data?.avatar_url || '',
      // Legacy support
      club_name: data?.club_name || 'Momentum Fitness',
      logo_url: data?.logo_url || '',
      avatar_url: data?.avatar_url || ''
    };
  },

  /**
   * Update just the club name
   */
  async updateClubName(clubName) {
    const { error } = await supabase
      .from(CONFIG_TABLE)
      .upsert([{ id: 1, club_name: clubName }], { onConflict: ['id'] });
    if (error) throw error;
    return true;
  },
};
