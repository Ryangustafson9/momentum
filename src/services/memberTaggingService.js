import { supabase } from '@/lib/supabaseClient';

/**
 * Comprehensive Member Tagging Service
 * Handles all tag-related operations including CRUD, bulk operations, and analytics
 */
export class MemberTaggingService {

  // ==================== TAG CATEGORIES ====================

  /**
   * Get all tag categories with hierarchical structure
   */
  static async getTagCategories() {
    try {
      const { data, error } = await supabase
        .from('tag_categories')
        .select(`
          *,
          member_tags(
            id,
            name,
            color,
            usage_count,
            is_system_tag
          )
        `)
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Create new tag category
   */
  static async createTagCategory(categoryData) {
    try {
      const { data, error } = await supabase
        .from('tag_categories')
        .insert({
          name: categoryData.name,
          description: categoryData.description,
          color: categoryData.color || '#3B82F6',
          parent_category_id: categoryData.parentCategoryId || null,
          sort_order: categoryData.sortOrder || 0,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  // ==================== MEMBER TAGS ====================

  /**
   * Get all member tags with category information
   */
  static async getMemberTags(filters = {}) {
    try {
      let query = supabase
        .from('member_tags')
        .select(`
          *,
          tag_categories(
            id,
            name,
            color
          )
        `)
        .eq('is_active', true);

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      if (filters.isSystemTag !== undefined) {
        query = query.eq('is_system_tag', filters.isSystemTag);
      }

      const { data, error } = await query.order('usage_count', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Create new member tag
   */
  static async createMemberTag(tagData) {
    try {
      const { data, error } = await supabase
        .from('member_tags')
        .insert({
          name: tagData.name,
          description: tagData.description,
          category_id: tagData.categoryId,
          color: tagData.color || '#10B981',
          is_system_tag: tagData.isSystemTag || false,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select(`
          *,
          tag_categories(
            id,
            name,
            color
          )
        `)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Update member tag
   */
  static async updateMemberTag(tagId, updates) {
    try {
      const { data, error } = await supabase
        .from('member_tags')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', tagId)
        .select(`
          *,
          tag_categories(
            id,
            name,
            color
          )
        `)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Delete member tag (soft delete by setting is_active = false)
   */
  static async deleteMemberTag(tagId) {
    try {
      const { data, error } = await supabase
        .from('member_tags')
        .update({ is_active: false })
        .eq('id', tagId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  // ==================== TAG ASSIGNMENTS ====================

  /**
   * Get member tags for a specific member
   */
  static async getMemberTags(memberId) {
    try {
      const { data, error } = await supabase
        .from('member_tag_assignments')
        .select(`
          *,
          member_tags(
            id,
            name,
            description,
            color,
            tag_categories(
              id,
              name,
              color
            )
          )
        `)
        .eq('member_id', memberId)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Assign tag to member
   */
  static async assignTagToMember(memberId, tagId, notes = null) {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      
      const { data, error } = await supabase
        .from('member_tag_assignments')
        .insert({
          member_id: memberId,
          tag_id: tagId,
          assigned_by: currentUser?.id,
          notes: notes
        })
        .select(`
          *,
          member_tags(
            id,
            name,
            description,
            color,
            tag_categories(
              id,
              name,
              color
            )
          )
        `)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Remove tag from member
   */
  static async removeTagFromMember(memberId, tagId) {
    try {
      const { error } = await supabase
        .from('member_tag_assignments')
        .delete()
        .eq('member_id', memberId)
        .eq('tag_id', tagId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      
      return { error };
    }
  }

  /**
   * Bulk assign tags to multiple members
   */
  static async bulkAssignTags(memberIds, tagIds, notes = null) {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      const assignments = [];

      // Create all combinations of members and tags
      for (const memberId of memberIds) {
        for (const tagId of tagIds) {
          assignments.push({
            member_id: memberId,
            tag_id: tagId,
            assigned_by: currentUser?.id,
            notes: notes
          });
        }
      }

      const { data, error } = await supabase
        .from('member_tag_assignments')
        .upsert(assignments, { 
          onConflict: 'member_id,tag_id',
          ignoreDuplicates: true 
        })
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Bulk remove tags from multiple members
   */
  static async bulkRemoveTags(memberIds, tagIds) {
    try {
      const { error } = await supabase
        .from('member_tag_assignments')
        .delete()
        .in('member_id', memberIds)
        .in('tag_id', tagIds);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      
      return { error };
    }
  }

  // ==================== TAG ANALYTICS ====================

  /**
   * Get tag usage statistics
   */
  static async getTagAnalytics() {
    try {
      const { data, error } = await supabase
        .from('member_tags')
        .select(`
          id,
          name,
          usage_count,
          color,
          tag_categories(
            id,
            name,
            color
          )
        `)
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
        .limit(20);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Get members by tag with pagination
   */
  static async getMembersByTag(tagId, options = {}) {
    try {
      const { page = 1, limit = 50, includeProfile = true } = options;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('member_tag_assignments')
        .select(`
          *,
          ${includeProfile ? `
            profiles!member_tag_assignments_member_id_fkey(
              id,
              system_member_id,
              first_name,
              last_name,
              email,
              phone,
              status,
              role
            )
          ` : ''}
        `)
        .eq('tag_id', tagId)
        .order('assigned_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Get tag assignment history for a member
   */
  static async getMemberTagHistory(memberId) {
    try {
      const { data, error } = await supabase
        .from('member_tag_history')
        .select(`
          *,
          member_tags(
            id,
            name,
            color
          ),
          profiles!member_tag_history_performed_by_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .eq('member_id', memberId)
        .order('performed_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  // ==================== SEARCH AND FILTERING ====================

  /**
   * Search members with tag filters
   */
  static async searchMembersWithTags(searchOptions = {}) {
    try {
      const {
        searchTerm = '',
        tagIds = [],
        excludeTagIds = [],
        page = 1,
        limit = 50
      } = searchOptions;

      const offset = (page - 1) * limit;

      // Build the query based on tag filters
      let query = supabase
        .from('profiles')
        .select(`
          *,
          member_tag_assignments!inner(
            tag_id,
            assigned_at,
            member_tags(
              id,
              name,
              color
            )
          )
        `);

      // Apply tag filters
      if (tagIds.length > 0) {
        query = query.in('member_tag_assignments.tag_id', tagIds);
      }

      // Apply search term if provided
      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Validate tag name uniqueness
   */
  static async isTagNameUnique(name, excludeId = null) {
    try {
      let query = supabase
        .from('member_tags')
        .select('id')
        .eq('name', name)
        .eq('is_active', true);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data.length === 0;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * Get suggested tags based on member profile
   */
  static async getSuggestedTags(memberId) {
    try {
      // This could be enhanced with ML/AI suggestions
      // For now, return system tags that aren't already assigned
      const { data: existingTags } = await this.getMemberTags(memberId);
      const existingTagIds = existingTags?.map(t => t.member_tags.id) || [];

      const { data, error } = await supabase
        .from('member_tags')
        .select('*')
        .eq('is_system_tag', true)
        .eq('is_active', true)
        .not('id', 'in', `(${existingTagIds.join(',') || 'null'})`);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }
}

export default MemberTaggingService;

/**
 * Cross-Report Analytics Service
 * Handles report generation with tag-based filtering and cohort analysis
 */
export class CrossReportAnalyticsService {

  // ==================== REPORT TEMPLATES ====================

  /**
   * Get all report templates
   */
  static async getReportTemplates(reportType = null) {
    try {
      let query = supabase
        .from('report_templates')
        .select(`
          *,
          profiles!report_templates_created_by_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .order('usage_count', { ascending: false });

      if (reportType) {
        query = query.eq('report_type', reportType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Create report template
   */
  static async createReportTemplate(templateData) {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;

      const { data, error } = await supabase
        .from('report_templates')
        .insert({
          name: templateData.name,
          description: templateData.description,
          report_type: templateData.reportType,
          configuration: templateData.configuration,
          is_public: templateData.isPublic || false,
          created_by: currentUser?.id
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  // ==================== REPORT EXECUTION ====================

  /**
   * Execute member registration report with tag filtering
   */
  static async generateMemberRegistrationReport(filters = {}) {
    try {
      const startTime = Date.now();

      let query = supabase
        .from('profiles')
        .select(`
          id,
          system_member_id,
          first_name,
          last_name,
          email,
          phone,
          status,
          role,
          created_at,
          join_date,
          memberships(
            id,
            status,
            start_date,
            membership_types(
              id,
              name,
              category,
              price
            )
          ),
          member_tag_assignments(
            member_tags(
              id,
              name,
              color
            )
          )
        `)
        .eq('role', 'member');

      // Apply date filters
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Apply tag filters
      if (filters.tagIds && filters.tagIds.length > 0) {
        query = query.in('member_tag_assignments.tag_id', filters.tagIds);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Log report execution
      await this.logReportExecution({
        reportType: 'member_registration',
        configuration: filters,
        recordCount: data?.length || 0,
        executionTime: Date.now() - startTime
      });

      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Execute retention analysis report
   */
  static async generateRetentionAnalysisReport(filters = {}) {
    try {
      const startTime = Date.now();

      // This would be a complex query analyzing member retention patterns
      // For now, we'll create a simplified version
      const { data, error } = await supabase.rpc('analyze_member_retention', {
        start_date: filters.dateFrom,
        end_date: filters.dateTo,
        tag_ids: filters.tagIds || []
      });

      if (error) throw error;

      await this.logReportExecution({
        reportType: 'retention_analysis',
        configuration: filters,
        recordCount: data?.length || 0,
        executionTime: Date.now() - startTime
      });

      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  // ==================== COHORT ANALYSIS ====================

  /**
   * Create member cohort based on tags
   */
  static async createTagBasedCohort(cohortData) {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;

      const { data, error } = await supabase
        .from('member_cohorts')
        .insert({
          name: cohortData.name,
          description: cohortData.description,
          definition_type: 'tag_based',
          definition_config: {
            tagIds: cohortData.tagIds,
            includeAll: cohortData.includeAll || false // AND vs OR logic
          },
          created_by: currentUser?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Calculate initial member count
      await this.calculateCohortMembers(data.id);

      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Calculate cohort members and update count
   */
  static async calculateCohortMembers(cohortId) {
    try {
      const { data: cohort } = await supabase
        .from('member_cohorts')
        .select('*')
        .eq('id', cohortId)
        .single();

      if (!cohort) throw new Error('Cohort not found');

      let memberQuery = supabase.from('profiles').select('id');

      if (cohort.definition_type === 'tag_based') {
        const { tagIds, includeAll } = cohort.definition_config;

        if (includeAll) {
          // Member must have ALL specified tags (AND logic)
          for (const tagId of tagIds) {
            memberQuery = memberQuery.in('id',
              supabase.from('member_tag_assignments')
                .select('member_id')
                .eq('tag_id', tagId)
            );
          }
        } else {
          // Member must have ANY of the specified tags (OR logic)
          memberQuery = memberQuery.in('id',
            supabase.from('member_tag_assignments')
              .select('member_id')
              .in('tag_id', tagIds)
          );
        }
      }

      const { data: members, error } = await memberQuery;

      if (error) throw error;

      // Update cohort member count
      await supabase
        .from('member_cohorts')
        .update({
          member_count: members?.length || 0,
          last_calculated_at: new Date().toISOString()
        })
        .eq('id', cohortId);

      return { memberCount: members?.length || 0, error: null };
    } catch (error) {
      
      return { memberCount: 0, error };
    }
  }

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Log report execution for analytics
   */
  static async logReportExecution(executionData) {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;

      await supabase
        .from('report_execution_log')
        .insert({
          template_id: executionData.templateId || null,
          report_type: executionData.reportType,
          configuration: executionData.configuration,
          executed_by: currentUser?.id,
          execution_time_ms: executionData.executionTime,
          record_count: executionData.recordCount,
          export_format: executionData.exportFormat || 'json',
          filters_applied: executionData.configuration
        });
    } catch (error) {
      
    }
  }

  /**
   * Get report execution analytics
   */
  static async getReportAnalytics(dateRange = {}) {
    try {
      let query = supabase
        .from('report_execution_log')
        .select(`
          report_type,
          executed_at,
          execution_time_ms,
          record_count,
          profiles!report_execution_log_executed_by_fkey(
            first_name,
            last_name
          )
        `)
        .order('executed_at', { ascending: false });

      if (dateRange.from) {
        query = query.gte('executed_at', dateRange.from);
      }
      if (dateRange.to) {
        query = query.lte('executed_at', dateRange.to);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }
}

