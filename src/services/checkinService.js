import { supabase } from '@/lib/supabaseClient';
import { sanitizeError } from '@/utils/requestUtils';

/**
 * Comprehensive Check-In Service
 * Handles all check-in operations with validation, QR codes, and access cards
 */
export class CheckInService {
  
  /**
   * Validate member for check-in
   */
  static async validateMemberForCheckIn(profileId, locationId = null, options = {}) {
    try {
      const { skipDailyLimit = false, staffOverride = false } = options;

      // Get member profile with membership information
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          memberships(
            id,
            status,
            current_membership_type_id,
            join_date,
            membership_types(name, category, active)
          )
        `)
        .eq('id', profileId)
        .single();

      if (profileError || !profile) {
        return {
          valid: false,
          reason: 'member_not_found',
          message: 'Member not found in system'
        };
      }

      // Check if member is a guest (deny access)
      if (profile.role === 'guest' || profile.role === 'nonmember') {
        return {
          valid: false,
          reason: 'guest_denied',
          message: 'Guest access not permitted. Please contact staff for assistance.'
        };
      }

      // Check member status
      if (profile.status !== 'active' && !staffOverride) {
        return {
          valid: false,
          reason: profile.status === 'suspended' ? 'suspended' : 'inactive_member',
          message: `Member status is ${profile.status}. Access denied.`
        };
      }

      // Check membership status
      const activeMembership = profile.memberships?.find(m => m.status === 'active');
      if (!activeMembership && !staffOverride) {
        return {
          valid: false,
          reason: 'no_active_membership',
          message: 'No active membership found. Please contact staff.'
        };
      }

      // Check daily limit (unless skipped or staff override)
      if (!skipDailyLimit && !staffOverride) {
        const today = new Date().toISOString().split('T')[0];
        const { data: todayCheckins, error: checkinError } = await supabase
          .from('checkin_history')
          .select('id')
          .eq('profile_id', profileId)
          .gte('check_in_time', today)
          .lt('check_in_time', today + 'T23:59:59');

        if (checkinError) {
          console.error('Error checking daily limit:', checkinError);
        } else if (todayCheckins && todayCheckins.length > 0) {
          return {
            valid: false,
            reason: 'already_checked_in',
            message: 'Member has already checked in today'
          };
        }
      }

      // Get validation rules for location
      const validationResult = await this.applyValidationRules(profile, locationId, staffOverride);
      if (!validationResult.valid) {
        return validationResult;
      }

      return {
        valid: true,
        profile,
        membership: activeMembership
      };

    } catch (error) {
      console.error('Error validating member for check-in:', error);
      return {
        valid: false,
        reason: 'validation_error',
        message: 'Error validating member. Please try again.'
      };
    }
  }

  /**
   * Apply configurable validation rules
   */
  static async applyValidationRules(profile, locationId, staffOverride = false) {
    try {
      // Get validation rules for location (or global rules)
      const { data: rules, error } = await supabase
        .from('checkin_validation_rules')
        .select('*')
        .or(`location_id.is.null,location_id.eq.${locationId || 'null'}`)
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (error) {
        console.error('Error fetching validation rules:', error);
        return { valid: true }; // Default to allow if rules can't be fetched
      }

      // Apply each rule
      for (const rule of rules || []) {
        const ruleResult = await this.applyValidationRule(rule, profile, staffOverride);
        if (!ruleResult.valid) {
          return ruleResult;
        }
      }

      return { valid: true };

    } catch (error) {
      console.error('Error applying validation rules:', error);
      return { valid: true }; // Default to allow on error
    }
  }

  /**
   * Apply a single validation rule
   */
  static async applyValidationRule(rule, profile, staffOverride) {
    const config = rule.rule_config;

    switch (rule.rule_type) {
      case 'time_restriction':
        if (config.enforce_hours && !staffOverride) {
          const now = new Date();
          const currentHour = now.getHours();
          // This would check against operating hours - simplified for now
          // In production, you'd check against actual operating hours
        }
        break;

      case 'membership_requirement':
        if (config.deny_guests && profile.role === 'guest') {
          return {
            valid: false,
            reason: 'guest_denied',
            message: 'Guest access not permitted'
          };
        }
        break;

      case 'suspension_check':
        if (config.check_suspension && profile.status === 'suspended') {
          return {
            valid: false,
            reason: 'suspended',
            message: 'Member account is suspended'
          };
        }
        if (config.check_cancellation && profile.status === 'cancelled') {
          return {
            valid: false,
            reason: 'cancelled',
            message: 'Member account is cancelled'
          };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * Perform check-in operation
   */
  static async performCheckIn(profileId, options = {}) {
    try {
      const {
        method = 'manual',
        accessCardNumber = null,
        qrCodeData = null,
        staffMemberId = null,
        locationId = null,
        deviceInfo = {},
        notes = null,
        staffOverride = false
      } = options;

      // Validate member first
      const validation = await this.validateMemberForCheckIn(profileId, locationId, { staffOverride });
      
      if (!validation.valid) {
        // Still record the attempt for analytics
        await this.recordCheckInAttempt(profileId, {
          ...options,
          validationStatus: validation.reason,
          validationMessage: validation.message
        });

        return {
          success: false,
          reason: validation.reason,
          message: validation.message
        };
      }

      // Create check-in record
      const checkinData = {
        profile_id: profileId,
        member_id: validation.membership?.id || null,
        member_name: `${validation.profile.first_name || ''} ${validation.profile.last_name || ''}`.trim() || validation.profile.email,
        check_in_time: new Date().toISOString(),
        check_in_method: method,
        access_card_number: accessCardNumber,
        qr_code_data: qrCodeData,
        staff_member_id: staffMemberId,
        location_id: locationId,
        device_info: deviceInfo,
        validation_status: 'valid',
        status: 'checked_in',
        notes: notes,
        metadata: {
          staff_override: staffOverride,
          validation_timestamp: new Date().toISOString()
        }
      };

      const { data: checkinRecord, error: checkinError } = await supabase
        .from('checkin_history')
        .insert([checkinData])
        .select()
        .single();

      if (checkinError) {
        console.error('Error creating check-in record:', checkinError);
        return {
          success: false,
          reason: 'checkin_failed',
          message: 'Failed to record check-in. Please try again.'
        };
      }

      // Update member's last visit
      await supabase
        .from('profiles')
        .update({ 
          last_visit: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId);

      // Create active session record
      await supabase
        .from('checkin_sessions')
        .insert([{
          checkin_history_id: checkinRecord.id,
          profile_id: profileId,
          location_id: locationId,
          check_in_time: checkinRecord.check_in_time,
          status: 'active'
        }]);

      return {
        success: true,
        checkinRecord,
        member: validation.profile,
        membership: validation.membership
      };

    } catch (error) {
      console.error('Error performing check-in:', error);
      return {
        success: false,
        reason: 'system_error',
        message: 'System error during check-in. Please contact support.'
      };
    }
  }

  /**
   * Record failed check-in attempt for analytics
   */
  static async recordCheckInAttempt(profileId, options) {
    try {
      const attemptData = {
        profile_id: profileId,
        check_in_time: new Date().toISOString(),
        check_in_method: options.method || 'manual',
        access_card_number: options.accessCardNumber,
        qr_code_data: options.qrCodeData,
        staff_member_id: options.staffMemberId,
        location_id: options.locationId,
        device_info: options.deviceInfo || {},
        validation_status: options.validationStatus || 'denied',
        validation_message: options.validationMessage,
        status: 'denied',
        metadata: {
          attempt_only: true,
          timestamp: new Date().toISOString()
        }
      };

      await supabase
        .from('checkin_history')
        .insert([attemptData]);

    } catch (error) {
      console.error('Error recording check-in attempt:', error);
    }
  }

  /**
   * Check-in by QR code
   */
  static async checkInByQRCode(qrCodeData, options = {}) {
    try {
      // Decode QR code to get profile ID
      const profileId = await this.decodeQRCode(qrCodeData);
      if (!profileId) {
        return {
          success: false,
          reason: 'invalid_qr_code',
          message: 'Invalid or expired QR code'
        };
      }

      return await this.performCheckIn(profileId, {
        ...options,
        method: 'qr_scan',
        qrCodeData
      });

    } catch (error) {
      console.error('Error checking in by QR code:', error);
      return {
        success: false,
        reason: 'qr_scan_error',
        message: 'Error scanning QR code. Please try again.'
      };
    }
  }

  /**
   * Check-in by access card
   */
  static async checkInByAccessCard(cardNumber, options = {}) {
    try {
      // Find member by access card
      const { data: accessCard, error } = await supabase
        .from('member_access_cards')
        .select('profile_id, is_active, expires_date')
        .eq('card_number', cardNumber)
        .eq('is_active', true)
        .single();

      if (error || !accessCard) {
        return {
          success: false,
          reason: 'invalid_card',
          message: 'Access card not found or inactive'
        };
      }

      // Check if card is expired
      if (accessCard.expires_date && new Date(accessCard.expires_date) < new Date()) {
        return {
          success: false,
          reason: 'expired_card',
          message: 'Access card has expired'
        };
      }

      return await this.performCheckIn(accessCard.profile_id, {
        ...options,
        method: 'access_card',
        accessCardNumber: cardNumber
      });

    } catch (error) {
      console.error('Error checking in by access card:', error);
      return {
        success: false,
        reason: 'card_scan_error',
        message: 'Error reading access card. Please try again.'
      };
    }
  }

  /**
   * Manual check-in by staff
   */
  static async manualCheckIn(profileId, staffMemberId, options = {}) {
    return await this.performCheckIn(profileId, {
      ...options,
      method: 'manual',
      staffMemberId,
      staffOverride: options.staffOverride || false
    });
  }

  /**
   * Decode QR code data to extract profile ID
   */
  static async decodeQRCode(qrCodeData) {
    try {
      // For now, assume QR code contains encrypted profile ID
      // In production, you'd implement proper encryption/decryption
      
      // Check if QR code exists in database
      const { data: accessCard, error } = await supabase
        .from('member_access_cards')
        .select('profile_id')
        .eq('qr_code_data', qrCodeData)
        .eq('is_active', true)
        .single();

      if (error || !accessCard) {
        return null;
      }

      return accessCard.profile_id;

    } catch (error) {
      console.error('Error decoding QR code:', error);
      return null;
    }
  }

  /**
   * Check in member by access card/QR code
   */
  static async checkInByAccessCard(accessCode, options = {}) {
    try {
      const {
        locationId = null,
        staffMemberId = null,
        method = 'access_card',
        deviceInfo = {}
      } = options;

      // First, try to find the member by access card or system_member_id
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .or(`access_card.eq.${accessCode},system_member_id.eq.${accessCode}`)
        .eq('role', 'member')
        .limit(1);

      if (profileError) {
        throw sanitizeError(profileError, 'Find member by access card');
      }

      if (!profiles || profiles.length === 0) {
        return {
          success: false,
          message: 'Access card not found or invalid',
          member: null
        };
      }

      const member = profiles[0];

      // Validate member status
      if (member.status !== 'active') {
        return {
          success: false,
          message: `Member account is ${member.status}. Please contact staff.`,
          member
        };
      }

      // Create check-in record
      const checkInData = {
        profile_id: member.id,
        check_in_time: new Date().toISOString(),
        check_in_method: method,
        location_id: locationId,
        staff_member_id: staffMemberId,
        validation_status: 'valid',
        device_info: deviceInfo,
        access_card_used: accessCode
      };

      const { data: checkIn, error: checkInError } = await supabase
        .from('checkin_history')
        .insert(checkInData)
        .select('*')
        .single();

      if (checkInError) {
        throw sanitizeError(checkInError, 'Create check-in record');
      }

      return {
        success: true,
        message: `Welcome ${member.first_name}!`,
        member,
        checkIn
      };

    } catch (error) {
      console.error('Error in checkInByAccessCard:', error);
      return {
        success: false,
        message: error.message || 'Check-in failed. Please try again.',
        member: null
      };
    }
  }

  /**
   * Get recent check-ins for a location
   */
  static async getRecentCheckIns(locationId = null, limit = 50) {
    try {
      // First, let's get the basic checkin_history data without joins
      let query = supabase
        .from('checkin_history')
        .select('*')
        .order('check_in_time', { ascending: false })
        .limit(limit);

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query;

      if (error) throw sanitizeError(error, 'Get recent check-ins');

      // For now, return the basic data without profile joins
      // TODO: Add profile data fetching if needed by the UI
      const enrichedData = (data || []).map(checkin => ({
        ...checkin,
        profile: {
          id: checkin.profile_id,
          first_name: 'Member',
          last_name: '',
          email: '',
          profile_picture_url: null,
          role: 'member'
        },
        staff_member: checkin.staff_member_id ? {
          id: checkin.staff_member_id,
          first_name: 'Staff',
          last_name: 'Member'
        } : null
      }));

      return { data: enrichedData, error: null };

    } catch (error) {
      console.error('Error fetching recent check-ins:', error);
      return { data: [], error };
    }
  }

  /**
   * Get check-in analytics for a date range
   */
  static async getCheckInAnalytics(startDate, endDate, locationId = null) {
    try {
      let query = supabase
        .from('checkin_analytics')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query.order('date', { ascending: true });

      if (error) throw sanitizeError(error, 'Get check-in analytics');

      return { data: data || [], error: null };

    } catch (error) {
      console.error('Error fetching check-in analytics:', error);
      return { data: [], error };
    }
  }
}

export default CheckInService;
