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
   * Save branding URLs to the club_configuration table (single row per club)
   */
  async saveBranding({ logoUrl, avatarUrl }) {
    // For single club, upsert row with id=1
    const { error } = await supabase
      .from(CONFIG_TABLE)
      .upsert([{ id: 1, logo_url: logoUrl, avatar_url: avatarUrl }], { onConflict: ['id'] });
    if (error) throw error;
    return true;
  },

  /**
   * Fetch branding URLs from the club_configuration table
   */
  async getBranding() {
    const { data, error } = await supabase
      .from(CONFIG_TABLE)
      .select('logo_url, avatar_url')
      .eq('id', 1)
      .single();
    if (error) throw error;
    return data;
  },
};
