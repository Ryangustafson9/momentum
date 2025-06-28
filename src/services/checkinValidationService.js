/**
 * Enhanced Check-in Validation Service
 * Comprehensive validation logic with detailed error handling and business rules
 */

import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/utils/logger';

export class CheckinValidationService {
  
  /**
   * Comprehensive member validation for check-in
   */
  static async validateMemberForCheckIn(profileId, locationId = null, options = {}) {
    try {
      const { 
        skipDailyLimit = false, 
        staffOverride = false,
        skipMembershipCheck = false,
        allowGuests = false 
      } = options;

      // Sensitive data logging removed for security;

      // Step 1: Get member profile with comprehensive data
      const memberData = await this.getMemberWithDetails(profileId);
      if (!memberData.valid) {
        return memberData;
      }

      const { profile, membership, familyMembers } = memberData;

      // Step 2: Basic eligibility checks
      const eligibilityResult = await this.checkBasicEligibility(profile, { allowGuests, staffOverride });
      if (!eligibilityResult.valid) {
        return eligibilityResult;
      }

      // Step 3: Membership validation
      if (!skipMembershipCheck) {
        const membershipResult = await this.validateMembership(membership, profile, staffOverride);
        if (!membershipResult.valid) {
          return membershipResult;
        }
      }

      // Step 4: Daily check-in limit
      if (!skipDailyLimit) {
        const dailyLimitResult = await this.checkDailyLimit(profileId, staffOverride);
        if (!dailyLimitResult.valid) {
          return dailyLimitResult;
        }
      }

      // Step 5: Location-specific rules
      const locationResult = await this.validateLocationAccess(profile, locationId, staffOverride);
      if (!locationResult.valid) {
        return locationResult;
      }

      // Step 6: Time-based restrictions
      const timeResult = await this.validateTimeRestrictions(profile, membership, locationId, staffOverride);
      if (!timeResult.valid) {
        return timeResult;
      }

      // Step 7: Special conditions (family, corporate, etc.)
      const specialResult = await this.validateSpecialConditions(profile, membership, familyMembers, staffOverride);
      if (!specialResult.valid) {
        return specialResult;
      }

      // Sensitive data logging removed for security;
      return {
        valid: true,
        profile,
        membership,
        familyMembers,
        validationDetails: {
          membershipStatus: membership?.status || 'none',
          membershipType: membership?.membership_type?.name || 'none',
          lastCheckIn: await this.getLastCheckIn(profileId),
          accessLevel: this.determineAccessLevel(profile, membership)
        }
      };

    } catch (error) {
      logger.error('❌ Error in member validation:', error);
      return {
        valid: false,
        reason: 'validation_error',
        message: 'System error during validation. Please contact staff.',
        error: new Error('Validation failed')
      };
    }
  }

  /**
   * Get member with comprehensive details
   */
  static async getMemberWithDetails(profileId) {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          memberships:memberships!user_id(
            id,
            status,
            start_date,
            expiration_date,
            next_payment_date,
            membership_type:membership_types!membership_type_id(
              id,
              name,
              category
            )
          ),
          family_members:family_members!primary_member_id(
            id,
            relationship,
            family_member:profiles!family_member_id(
              id,
              first_name,
              last_name,
              status
            )
          )
        `)
        .eq('id', profileId)
        .single();

      if (profileError || !profile) {
        return {
          valid: false,
          reason: 'member_not_found',
          message: 'Member not found in system',
          details: profileError
        };
      }

      // Get active membership
      const activeMembership = profile.memberships?.find(m => m.status === 'active') || null;

      return {
        valid: true,
        profile,
        membership: activeMembership,
        familyMembers: profile.family_members || []
      };

    } catch (error) {
      logger.error('Error fetching member details:', error);
      return {
        valid: false,
        reason: 'data_fetch_error',
        message: 'Unable to retrieve member information'
      };
    }
  }

  /**
   * Check basic member eligibility
   */
  static async checkBasicEligibility(profile, options = {}) {
    const { allowGuests = false, staffOverride = false } = options;

    // Check if member is a guest
    if ((profile.role === 'guest' || profile.role === 'nonmember') && !allowGuests && !staffOverride) {
      return {
        valid: false,
        reason: 'guest_denied',
        message: 'Guest access not permitted. Please contact staff for day pass or membership information.',
        severity: 'error'
      };
    }

    // Check member status
    if (profile.status === 'suspended' && !staffOverride) {
      return {
        valid: false,
        reason: 'member_suspended',
        message: 'Member account is suspended. Please contact staff to resolve account issues.',
        severity: 'error'
      };
    }

    if (profile.status === 'cancelled' && !staffOverride) {
      return {
        valid: false,
        reason: 'member_cancelled',
        message: 'Member account is cancelled. Please renew membership to access the facility.',
        severity: 'error'
      };
    }

    if (profile.status === 'inactive' && !staffOverride) {
      return {
        valid: false,
        reason: 'member_inactive',
        message: 'Member account is inactive. Please contact staff to reactivate your account.',
        severity: 'warning'
      };
    }

    return { valid: true };
  }

  /**
   * Validate membership status and details
   */
  static async validateMembership(membership, profile, staffOverride = false) {
    if (!membership && !staffOverride) {
      return {
        valid: false,
        reason: 'no_active_membership',
        message: 'No active membership found. Please purchase a membership or contact staff.',
        severity: 'error',
        actionRequired: 'purchase_membership'
      };
    }

    if (membership) {
      // Check membership expiration
      if (membership.end_date) {
        const endDate = new Date(membership.end_date);
        const now = new Date();
        
        if (endDate < now && !staffOverride) {
          return {
            valid: false,
            reason: 'membership_expired',
            message: `Membership expired on ${endDate.toLocaleDateString()}. Please renew to continue access.`,
            severity: 'error',
            actionRequired: 'renew_membership',
            expiredDate: endDate
          };
        }

        // Check if membership expires soon (within 7 days)
        const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
          // Allow access but warn about upcoming expiration
          return {
            valid: true,
            warning: true,
            reason: 'membership_expiring_soon',
            message: `Membership expires in ${daysUntilExpiry} day(s). Please renew soon.`,
            severity: 'warning',
            actionRequired: 'renew_membership_soon',
            expiryDate: endDate
          };
        }
      }

      // Check payment status
      if (membership.next_payment_date) {
        const nextPayment = new Date(membership.next_payment_date);
        const now = new Date();
        const daysPastDue = Math.ceil((now - nextPayment) / (1000 * 60 * 60 * 24));
        
        if (daysPastDue > 7 && !staffOverride) {
          return {
            valid: false,
            reason: 'payment_overdue',
            message: `Payment is ${daysPastDue} days overdue. Please update payment method.`,
            severity: 'error',
            actionRequired: 'update_payment',
            daysPastDue
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Check daily check-in limit
   */
  static async checkDailyLimit(profileId, staffOverride = false) {
    if (staffOverride) return { valid: true };

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: todayCheckins, error } = await supabase
        .from('checkin_history')
        .select('id, check_in_time')
        .eq('profile_id', profileId)
        .gte('check_in_time', `${today}T00:00:00`)
        .lt('check_in_time', `${today}T23:59:59`);

      if (error) {
        logger.error('Error checking daily limit:', error);
        return { valid: true }; // Allow on error
      }

      if (todayCheckins && todayCheckins.length > 0) {
        const lastCheckIn = new Date(todayCheckins[0].check_in_time);
        return {
          valid: false,
          reason: 'already_checked_in',
          message: `Already checked in today at ${lastCheckIn.toLocaleTimeString()}.`,
          severity: 'info',
          lastCheckIn: lastCheckIn
        };
      }

      return { valid: true };

    } catch (error) {
      logger.error('Error checking daily limit:', error);
      return { valid: true }; // Allow on error
    }
  }

  /**
   * Validate location-specific access
   */
  static async validateLocationAccess(profile, locationId, staffOverride = false) {
    // For now, allow access to all locations
    // In the future, this would check location-specific permissions
    return { valid: true };
  }

  /**
   * Validate time-based restrictions
   */
  static async validateTimeRestrictions(profile, membership, locationId, staffOverride = false) {
    if (staffOverride) return { valid: true };

    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

    // Basic operating hours (6 AM to 10 PM)
    if (currentHour < 6 || currentHour >= 22) {
      return {
        valid: false,
        reason: 'outside_operating_hours',
        message: 'Facility is closed. Operating hours: 6:00 AM - 10:00 PM',
        severity: 'info',
        operatingHours: '6:00 AM - 10:00 PM'
      };
    }

    return { valid: true };
  }

  /**
   * Validate special conditions
   */
  static async validateSpecialConditions(profile, membership, familyMembers, staffOverride = false) {
    // Check for any special membership conditions
    // This could include family plan limits, corporate restrictions, etc.
    return { valid: true };
  }

  /**
   * Get last check-in for member
   */
  static async getLastCheckIn(profileId) {
    try {
      const { data, error } = await supabase
        .from('checkin_history')
        .select('check_in_time')
        .eq('profile_id', profileId)
        .order('check_in_time', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;
      return new Date(data.check_in_time);
    } catch (error) {
      return null;
    }
  }

  /**
   * Determine member access level
   */
  static determineAccessLevel(profile, membership) {
    if (profile.role === 'admin' || profile.role === 'staff') {
      return 'full_access';
    }
    
    if (membership?.membership_type?.access_level) {
      return membership.membership_type.access_level;
    }

    return 'basic_access';
  }
}

export default CheckinValidationService;
