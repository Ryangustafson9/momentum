/**
 * Note Settings Service
 * Manages note subjects and default templates configuration
 */

import { supabase } from '@/lib/supabaseClient';

export class NoteSettingsService {
  static SETTINGS_TABLE = 'note_settings';
  static SUBJECTS_TABLE = 'note_subjects';
  static TEMPLATES_TABLE = 'note_templates';

  /**
   * Get all note subjects
   */
  static async getNoteSubjects() {
    try {
      const { data, error } = await supabase
        .from(this.SUBJECTS_TABLE)
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('❌ Error getting note subjects:', error);
      throw new Error('Failed to get note subjects');
    }
  }

  /**
   * Create a new note subject
   */
  static async createNoteSubject(subjectData) {
    try {
      const { data, error } = await supabase
        .from(this.SUBJECTS_TABLE)
        .insert([{
          name: subjectData.name,
          icon: subjectData.icon || '📝',
          color_class: subjectData.colorClass || 'bg-gray-100 text-gray-800 border-gray-200',
          category: subjectData.category || 'general',
          is_active: subjectData.isActive !== false,
          display_order: subjectData.displayOrder || 999,
          description: subjectData.description || null
        }])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('❌ Error creating note subject:', error);
      throw new Error('Failed to create note subject');
    }
  }

  /**
   * Update a note subject
   */
  static async updateNoteSubject(subjectId, updates) {
    try {
      const updateData = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.icon !== undefined) updateData.icon = updates.icon;
      if (updates.colorClass !== undefined) updateData.color_class = updates.colorClass;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.displayOrder !== undefined) updateData.display_order = updates.displayOrder;
      if (updates.description !== undefined) updateData.description = updates.description;

      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from(this.SUBJECTS_TABLE)
        .update(updateData)
        .eq('id', subjectId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('❌ Error updating note subject:', error);
      throw new Error('Failed to update note subject');
    }
  }

  /**
   * Delete a note subject
   */
  static async deleteNoteSubject(subjectId) {
    try {
      const { error } = await supabase
        .from(this.SUBJECTS_TABLE)
        .delete()
        .eq('id', subjectId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting note subject:', error);
      throw new Error('Failed to delete note subject');
    }
  }

  /**
   * Get all note templates
   */
  static async getNoteTemplates() {
    try {
      const { data, error } = await supabase
        .from(this.TEMPLATES_TABLE)
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('❌ Error getting note templates:', error);
      throw new Error('Failed to get note templates');
    }
  }

  /**
   * Create a new note template
   */
  static async createNoteTemplate(templateData) {
    try {
      const { data, error } = await supabase
        .from(this.TEMPLATES_TABLE)
        .insert([{
          name: templateData.name,
          subject: templateData.subject || null,
          content: templateData.content,
          description: templateData.description || null,
          is_active: templateData.isActive !== false,
          is_default: templateData.isDefault || false,
          category: templateData.category || 'general'
        }])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('❌ Error creating note template:', error);
      throw new Error('Failed to create note template');
    }
  }

  /**
   * Update a note template
   */
  static async updateNoteTemplate(templateId, updates) {
    try {
      const updateData = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.subject !== undefined) updateData.subject = updates.subject;
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault;
      if (updates.category !== undefined) updateData.category = updates.category;

      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from(this.TEMPLATES_TABLE)
        .update(updateData)
        .eq('id', templateId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('❌ Error updating note template:', error);
      throw new Error('Failed to update note template');
    }
  }

  /**
   * Delete a note template
   */
  static async deleteNoteTemplate(templateId) {
    try {
      const { error } = await supabase
        .from(this.TEMPLATES_TABLE)
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting note template:', error);
      throw new Error('Failed to delete note template');
    }
  }

  /**
   * Get general note settings
   */
  static async getNoteSettings() {
    try {
      const { data, error } = await supabase
        .from(this.SETTINGS_TABLE)
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is OK
        throw error;
      }

      return data || {
        require_subject: false,
        auto_generate_subject: true,
        default_template_id: null,
        max_note_length: 2000,
        enable_templates: true
      };
    } catch (error) {
      console.error('❌ Error getting note settings:', error);
      throw new Error('Failed to get note settings');
    }
  }

  /**
   * Update general note settings
   */
  static async updateNoteSettings(settings) {
    try {
      const { data, error } = await supabase
        .from(this.SETTINGS_TABLE)
        .upsert([{
          id: 1, // Single settings record
          require_subject: settings.requireSubject,
          auto_generate_subject: settings.autoGenerateSubject,
          default_template_id: settings.defaultTemplateId,
          max_note_length: settings.maxNoteLength,
          enable_templates: settings.enableTemplates,
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('❌ Error updating note settings:', error);
      throw new Error('Failed to update note settings');
    }
  }

  /**
   * Get active subjects for dropdown
   */
  static async getActiveSubjects() {
    try {
      const { data, error } = await supabase
        .from(this.SUBJECTS_TABLE)
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('❌ Error getting active subjects:', error);
      throw new Error('Failed to get active subjects');
    }
  }

  /**
   * Get default template
   */
  static async getDefaultTemplate() {
    try {
      const { data, error } = await supabase
        .from(this.TEMPLATES_TABLE)
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is OK
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('❌ Error getting default template:', error);
      throw new Error('Failed to get default template');
    }
  }

  /**
   * Reorder subjects
   */
  static async reorderSubjects(subjectOrders) {
    try {
      const updates = subjectOrders.map(({ id, displayOrder }) => ({
        id,
        display_order: displayOrder,
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from(this.SUBJECTS_TABLE)
        .upsert(updates)
        .select();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('❌ Error reordering subjects:', error);
      throw new Error('Failed to reorder subjects');
    }
  }
}

export default NoteSettingsService;
