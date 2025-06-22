/**
 * Corporate Partners Management Service
 * Handles CRUD operations, discount calculations, and partnership management
 */

import { supabase } from '@/lib/supabaseClient';

export class CorporatePartnersService {
  
  // ==================== CORPORATE PARTNERS CRUD ====================
  
  /**
   * Get all corporate partners with optional filtering
   */
  static async getCorporatePartners(filters = {}) {
    try {
      let query = supabase
        .from('corporate_partners')
        .select(`
          *,
          corporate_discounts(*)
        `)
        .order('company_name');

      // Apply filters
      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      
      if (filters.search) {
        query = query.or(`company_name.ilike.%${filters.search}%,company_code.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%`);
      }
      
      if (filters.industry) {
        query = query.eq('industry', filters.industry);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Get a single corporate partner by ID
   */
  static async getCorporatePartner(id) {
    try {
      const { data, error } = await supabase
        .from('corporate_partners')
        .select(`
          *,
          corporate_discounts(*),
          member_corporate_affiliations(
            *,
            profiles!member_corporate_affiliations_member_id_fkey(first_name, last_name, email)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Create a new corporate partner
   */
  static async createCorporatePartner(partnerData, userId) {
    try {
      const { data, error } = await supabase
        .from('corporate_partners')
        .insert({
          ...partnerData,
          created_by: userId,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Update a corporate partner
   */
  static async updateCorporatePartner(id, partnerData) {
    try {
      const { data, error } = await supabase
        .from('corporate_partners')
        .update({
          ...partnerData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Delete a corporate partner
   */
  static async deleteCorporatePartner(id) {
    try {
      const { error } = await supabase
        .from('corporate_partners')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      
      return { error };
    }
  }

  // ==================== CORPORATE DISCOUNTS ====================

  /**
   * Create a new corporate discount
   */
  static async createCorporateDiscount(discountData) {
    try {
      const { data, error } = await supabase
        .from('corporate_discounts')
        .insert({
          ...discountData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Update a corporate discount
   */
  static async updateCorporateDiscount(id, discountData) {
    try {
      const { data, error } = await supabase
        .from('corporate_discounts')
        .update({
          ...discountData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Delete a corporate discount
   */
  static async deleteCorporateDiscount(id) {
    try {
      const { error } = await supabase
        .from('corporate_discounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      
      return { error };
    }
  }

  // ==================== MEMBER AFFILIATIONS ====================

  /**
   * Get member affiliations for a corporate partner
   */
  static async getMemberAffiliations(corporatePartnerId) {
    try {
      const { data, error } = await supabase
        .from('member_corporate_affiliations')
        .select(`
          *,
          profiles!member_corporate_affiliations_member_id_fkey(
            id,
            first_name,
            last_name,
            email,
            system_member_id
          )
        `)
        .eq('corporate_partner_id', corporatePartnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to include member_name for easier display
      const transformedData = (data || []).map(affiliation => ({
        ...affiliation,
        member_name: affiliation.profiles
          ? `${affiliation.profiles.first_name || ''} ${affiliation.profiles.last_name || ''}`.trim()
          : 'Unknown',
        member_email: affiliation.profiles?.email || 'No email'
      }));

      return { data: transformedData, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Create member corporate affiliation
   */
  static async createMemberAffiliation(affiliationData) {
    try {
      const { data, error } = await supabase
        .from('member_corporate_affiliations')
        .insert({
          ...affiliationData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Update member affiliation verification status
   */
  static async updateAffiliationVerification(id, status, verifiedBy) {
    try {
      const { data, error } = await supabase
        .from('member_corporate_affiliations')
        .update({
          verification_status: status,
          verification_date: new Date().toISOString(),
          verified_by: verifiedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  // ==================== DISCOUNT CALCULATIONS ====================

  /**
   * Calculate discount for a member based on corporate affiliation
   */
  static async calculateMemberDiscount(memberId, membershipTypeId, basePrice) {
    try {
      // Get member's corporate affiliation
      const { data: affiliation, error: affiliationError } = await supabase
        .from('member_corporate_affiliations')
        .select(`
          *,
          corporate_partners(*),
          corporate_discounts(*)
        `)
        .eq('member_id', memberId)
        .eq('verification_status', 'approved')
        .single();

      if (affiliationError || !affiliation) {
        return { discountAmount: 0, discountDetails: null, error: null };
      }

      // Get applicable discounts for the corporate partner
      const { data: discounts, error: discountsError } = await supabase
        .from('corporate_discounts')
        .select('*')
        .eq('corporate_partner_id', affiliation.corporate_partner_id)
        .eq('is_active', true)
        .or(`membership_type_id.is.null,membership_type_id.eq.${membershipTypeId}`);

      if (discountsError) throw discountsError;

      let bestDiscount = null;
      let maxDiscountAmount = 0;

      // Calculate best applicable discount
      for (const discount of discounts) {
        let discountAmount = 0;

        switch (discount.discount_type) {
          case 'percentage':
            discountAmount = (basePrice * discount.discount_value) / 100;
            break;
          case 'fixed_amount':
            discountAmount = discount.discount_value;
            break;
          case 'tiered':
            const employeeCount = affiliation.corporate_partners.employee_count;
            if (employeeCount >= discount.tier_min_employees && 
                employeeCount <= discount.tier_max_employees) {
              discountAmount = (basePrice * discount.discount_value) / 100;
            }
            break;
          case 'membership_specific':
            if (discount.membership_type_id === membershipTypeId) {
              discountAmount = (basePrice * discount.discount_value) / 100;
            }
            break;
        }

        if (discountAmount > maxDiscountAmount) {
          maxDiscountAmount = discountAmount;
          bestDiscount = discount;
        }
      }

      return {
        discountAmount: maxDiscountAmount,
        discountDetails: bestDiscount,
        corporatePartner: affiliation.corporate_partners,
        error: null
      };
    } catch (error) {
      
      return { discountAmount: 0, discountDetails: null, error };
    }
  }

  // ==================== ANALYTICS ====================

  /**
   * Get corporate partnership analytics
   */
  static async getPartnershipAnalytics(partnerId = null) {
    try {
      let query = supabase
        .from('member_corporate_affiliations')
        .select(`
          *,
          corporate_partners(company_name),
          profiles!member_corporate_affiliations_member_id_fkey(*)
        `);

      if (partnerId) {
        query = query.eq('corporate_partner_id', partnerId);
      }

      const { data: affiliations, error } = await query;
      if (error) throw error;

      // Calculate metrics
      const totalMembers = affiliations.length;
      const approvedMembers = affiliations.filter(a => a.verification_status === 'approved').length;
      const pendingMembers = affiliations.filter(a => a.verification_status === 'pending').length;
      
      // Group by corporate partner
      const partnerMetrics = affiliations.reduce((acc, affiliation) => {
        const partnerName = affiliation.corporate_partners.company_name;
        if (!acc[partnerName]) {
          acc[partnerName] = {
            totalMembers: 0,
            approvedMembers: 0,
            pendingMembers: 0,
            totalDiscountApplied: 0
          };
        }
        
        acc[partnerName].totalMembers++;
        if (affiliation.verification_status === 'approved') {
          acc[partnerName].approvedMembers++;
          acc[partnerName].totalDiscountApplied += affiliation.discount_applied || 0;
        } else if (affiliation.verification_status === 'pending') {
          acc[partnerName].pendingMembers++;
        }
        
        return acc;
      }, {});

      return {
        data: {
          totalMembers,
          approvedMembers,
          pendingMembers,
          partnerMetrics
        },
        error: null
      };
    } catch (error) {
      
      return { data: null, error };
    }
  }
}

export default CorporatePartnersService;

