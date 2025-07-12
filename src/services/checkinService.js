import { supabase } from '@/lib/supabaseClient';
import { sanitizeError } from '@/utils/requestUtils';

/**
 * Comprehensive Check-In Service
 * Handles all check-in operations with validation, QR codes, and access cards
 */
export class CheckInService {
  
  /**
   * Get status-based check-in rules
   */
  static getStatusCheckInRules(memberStatus, membershipStatus = null) {
    // Handle member status rules
    switch (memberStatus) {
      case 'active':
        return {
          allowed: true,
          requiresAttention: false,
          highlightColor: 'green',
          reason: 'active',
          message: 'Active member - check-in approved'
        };

      case 'suspended':
        return {
          allowed: false,
          allowOverride: true,
          requiresAttention: true,
          highlightColor: 'red',
          reason: 'suspended',
          message: 'Member is suspended. Staff override required.',
          displayStatus: 'SUSPENDED'
        };

      case 'cancelled':
        return {
          allowed: false,
          allowOverride: true,
          requiresAttention: true,
          highlightColor: 'red',
          reason: 'cancelled',
          message: 'Member is cancelled. Staff override required.',
          displayStatus: 'CANCELLED'
        };

      case 'expired':
        return {
          allowed: false,
          allowOverride: true,
          requiresAttention: true,
          highlightColor: 'red',
          reason: 'expired',
          message: 'Member is expired. Staff override required.',
          displayStatus: 'EXPIRED'
        };

      case 'frozen':
        return {
          allowed: false,
          allowOverride: true,
          requiresAttention: true,
          highlightColor: 'yellow',
          reason: 'frozen',
          message: 'Member is frozen. Staff override required.',
          displayStatus: 'FROZEN'
        };

      case 'guest':
        return {
          allowed: false,
          allowOverride: true,
          requiresAttention: true,
          highlightColor: 'yellow',
          reason: 'guest',
          message: 'Guest access. Staff override required.',
          displayStatus: 'GUEST'
        };

      case 'archived':
        return {
          allowed: false,
          allowOverride: false,
          requiresAttention: false,
          highlightColor: 'gray',
          reason: 'archived',
          message: 'Member is archived. Check-in denied.',
          displayStatus: 'ARCHIVED'
        };

      default:
        return {
          allowed: false,
          allowOverride: true,
          requiresAttention: true,
          highlightColor: 'gray',
          reason: 'unknown_status',
          message: 'Unknown member status. Staff override required.',
          displayStatus: 'UNKNOWN'
        };
    }
  }

  /**
   * Validate member for check-in
   */
  static async validateMemberForCheckIn(profileId, locationId = null, options = {}) {
    try {
      const { skipDailyLimit = false, staffOverride = false } = options;

      // Get authenticated client (handles SSO sessions)
      const supabaseClient = this.getAuthenticatedClient();

      // Get member profile with membership information
      console.log('Fetching member profile for validation:', profileId);
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select(`
          *,
          memberships!memberships_user_id_fkey(
            id,
            status,
            membership_type_id,
            start_date,
            expiration_date,
            monthly_fee,
            plan_type,
            membership_types(name, category, active)
          )
        `)
        .eq('id', profileId)
        .single();

      console.log('Profile fetch result:', { profile, profileError });

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

      // Check member status with comprehensive business rules
      const memberStatus = profile.status?.toLowerCase();
      const activeMembership = profile.memberships?.find(m => m.status === 'active');
      const membershipStatus = activeMembership?.status?.toLowerCase();

      // Get status-based check-in rules
      const statusRules = this.getStatusCheckInRules(memberStatus, membershipStatus);

      if (!statusRules.allowed && !staffOverride) {
        return {
          valid: false,
          reason: statusRules.reason,
          message: statusRules.message,
          statusInfo: statusRules,
          requiresOverride: statusRules.allowOverride
        };
      }

      // If status requires special handling but is allowed
      if (statusRules.requiresAttention) {
        return {
          valid: true,
          profile,
          membership: activeMembership,
          statusWarning: statusRules,
          requiresStaffAttention: true
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
   * Get member's last visit from check-in history
   */
  static async getLastVisit(profileId) {
    try {
      const { data, error } = await supabase
        .from('checkin_history')
        .select('check_in_time')
        .eq('profile_id', profileId)
        .eq('validation_status', 'valid')
        .order('check_in_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching last visit:', error);
        return null;
      }

      return data?.check_in_time || null;
    } catch (error) {
      console.error('Error in getLastVisit:', error);
      return null;
    }
  }

  /**
   * Get member's total visit count from check-in history
   */
  static async getVisitCount(profileId) {
    try {
      const { count, error } = await supabase
        .from('checkin_history')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profileId)
        .eq('validation_status', 'valid');

      if (error) {
        console.error('Error fetching visit count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getVisitCount:', error);
      return 0;
    }
  }

  /**
   * Get member profile with visit information from check-in history
   */
  static async getMemberWithVisitInfo(profileId) {
    try {
      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (profileError || !profile) {
        return null;
      }

      // Get visit information from check-in history
      const [lastVisit, visitCount] = await Promise.all([
        this.getLastVisit(profileId),
        this.getVisitCount(profileId)
      ]);

      return {
        ...profile,
        last_visit: lastVisit,
        visit_count: visitCount
      };
    } catch (error) {
      console.error('Error in getMemberWithVisitInfo:', error);
      return null;
    }
  }

  /**
   * Get authenticated Supabase client (handles SSO sessions)
   */
  static getAuthenticatedClient() {
    // For now, since RLS is disabled, we can use the regular client
    // In the future, this could create a properly authenticated client for SSO
    return supabase;
  }

  /**
   * Check if current user has permission to perform check-ins
   */
  static async checkCheckInPermission() {
    try {
      console.log('Checking check-in permissions...');

      // First check for SSO session
      const ssoSession = localStorage.getItem('momentum_sso_session');
      console.log('SSO session found:', !!ssoSession);

      if (ssoSession) {
        try {
          const session = JSON.parse(ssoSession);
          console.log('SSO session data:', {
            email: session.user?.email,
            role: session.user?.role,
            is_global_admin: session.user?.is_global_admin,
            expires_at: new Date(session.expires_at).toISOString(),
            is_valid: session.expires_at > Date.now()
          });

          // Check if SSO session is still valid
          if (session.expires_at > Date.now()) {
            console.log('Using SSO session for permission check:', session.user.email);

            // SSO users are always global admins with full permissions
            const hasPermission = session.user.role === 'admin' || session.user.is_global_admin === true;
            console.log('SSO permission result:', hasPermission);
            return hasPermission;
          } else {
            console.log('SSO session expired, removing...');
            localStorage.removeItem('momentum_sso_session');
          }
        } catch (ssoError) {
          console.error('Invalid SSO session data:', ssoError);
          localStorage.removeItem('momentum_sso_session');
        }
      }

      // Fallback to regular Supabase auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error('Authentication error:', authError);
        return false;
      }

      // Get user profile to check role and permissions
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_global_admin')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('Profile fetch error:', profileError);
        return false;
      }

      // Allow staff, admin, or global admin to perform check-ins
      return profile.role === 'staff' ||
             profile.role === 'admin' ||
             profile.is_global_admin === true;

    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  /**
   * Apply configurable validation rules
   */
  static async applyValidationRules(profile, locationId, staffOverride = false) {
    try {
      // Get validation rules for location (or global rules)
      let query = supabase
        .from('checkin_validation_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });

      // Add location filter - get global rules (location_id is null) or location-specific rules
      if (locationId) {
        query = query.or(`location_id.is.null,location_id.eq.${locationId}`);
      } else {
        query = query.is('location_id', null);
      }

      const { data: rules, error } = await query;

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

      case 'daily_limit':
        // Allow multiple check-ins per day by default
        if (!staffOverride && !config.allow_multiple) {
          const today = new Date().toISOString().split('T')[0];
          const { count } = await supabase
            .from('checkin_history')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', profile.id)
            .gte('check_in_time', today)
            .lt('check_in_time', today + 'T23:59:59');

          const maxCheckins = config.max_checkins_per_day || 1;
          if (count >= maxCheckins) {
            return {
              valid: false,
              reason: 'daily_limit_exceeded',
              message: `Daily check-in limit of ${maxCheckins} exceeded. Contact staff for override.`
            };
          }
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
      console.log('Starting performCheckIn for profile:', profileId);

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

      console.log('Check-in options:', options);

      // Check if current user has permission to create check-ins
      console.log('Checking permissions...');
      const hasPermission = await this.checkCheckInPermission();
      console.log('Permission check result:', hasPermission);

      if (!hasPermission) {
        return {
          success: false,
          reason: 'permission_denied',
          message: 'You do not have permission to perform check-ins.'
        };
      }

      // Get current user ID for staff_member_id (handle SSO sessions)
      let currentUserId = staffMemberId;
      if (!currentUserId) {
        // Try to get from SSO session first
        const ssoSession = localStorage.getItem('momentum_sso_session');
        if (ssoSession) {
          try {
            const session = JSON.parse(ssoSession);
            if (session.expires_at > Date.now()) {
              currentUserId = session.user.id;
            }
          } catch (error) {
            console.warn('Failed to parse SSO session:', error);
          }
        }

        // Fallback to regular auth
        if (!currentUserId) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            currentUserId = user?.id;
          } catch (error) {
            console.warn('Failed to get current user ID:', error);
          }
        }
      }

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

      // Create check-in record with status information
      const checkinData = {
        profile_id: profileId,
        member_id: validation.membership?.id || null,
        member_name: `${validation.profile.first_name || ''} ${validation.profile.last_name || ''}`.trim() || validation.profile.email,
        check_in_time: new Date().toISOString(),
        check_in_method: method,
        access_card_number: accessCardNumber,
        qr_code_data: qrCodeData,
        staff_member_id: currentUserId,
        location_id: locationId,
        device_info: deviceInfo || {},
        validation_status: validation.statusWarning ? 'warning' : 'valid',
        status: 'checked_in',
        notes: notes,
        metadata: {
          staff_override: staffOverride,
          validation_timestamp: new Date().toISOString(),
          member_status: validation.profile.status,
          membership_status: validation.membership?.status,
          status_warning: validation.statusWarning,
          requires_staff_attention: validation.requiresStaffAttention
        }
      };

      console.log('Creating check-in record:', checkinData);

      const { data: checkinRecord, error: checkinError } = await supabase
        .from('checkin_history')
        .insert([checkinData])
        .select()
        .single();

      if (checkinError) {
        console.error('Error creating check-in record:', checkinError);
        console.error('Check-in data that failed:', checkinData);

        // Provide more specific error messages
        let errorMessage = 'Failed to record check-in. Please try again.';
        if (checkinError.code === '42501') {
          errorMessage = 'Permission denied. Please ensure you have the proper role to perform check-ins.';
        } else if (checkinError.code === '23505') {
          errorMessage = 'Duplicate check-in detected. Member may already be checked in.';
        } else if (checkinError.message) {
          errorMessage = `Check-in failed: ${checkinError.message}`;
        }

        return {
          success: false,
          reason: 'checkin_failed',
          message: errorMessage,
          error: checkinError
        };
      }

      // Note: Last visit is now tracked via check-in history table
      // No need to update profiles table

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

      // Dispatch real-time event for UI updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('checkin-success', {
          detail: {
            checkinRecord,
            member: validation.profile,
            membership: validation.membership,
            timestamp: new Date().toISOString()
          }
        }));
      }

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
      // Check permission before recording attempt
      const hasPermission = await this.checkCheckInPermission();
      if (!hasPermission) {
        console.warn('Permission denied for recording check-in attempt');
        return;
      }
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
        access_card_number: accessCode // Fixed: use correct column name
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
