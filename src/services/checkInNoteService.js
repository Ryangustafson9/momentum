/**
 * Check-In Note Service
 * Automatically generates notes based on check-in patterns and events
 */

import { supabase } from '@/lib/supabaseClient';
import { format, differenceInDays, differenceInHours } from 'date-fns';

export class CheckInNoteService {
  /**
   * Generate automatic note based on check-in event
   */
  static async generateCheckInNote(checkInData, memberData, options = {}) {
    try {
      const {
        autoNote = true,
        staffId = null,
        noteSubject = null,
        customContent = null
      } = options;

      if (!autoNote && !customContent) return null;

      // Get recent check-in history for pattern analysis
      const recentCheckIns = await this.getRecentMemberCheckIns(memberData.id, 30);
      
      // Analyze patterns and generate appropriate note
      const noteData = await this.analyzeAndGenerateNote(
        checkInData, 
        memberData, 
        recentCheckIns,
        { staffId, noteSubject, customContent }
      );

      if (noteData) {
        // Create the note
        const { data, error } = await supabase
          .from('member_notes')
          .insert([{
            member_id: memberData.id,
            staff_id: staffId || null,
            content: noteData.content,
            subject: noteData.subject,
            auto_generated: true,
            check_in_id: checkInData.id,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) throw error;

        return data;
      }

      return null;
    } catch (error) {
      console.error('Error generating check-in note:', error);
      throw new Error('Failed to generate check-in note');
    }
  }

  /**
   * Get recent check-ins for a member
   */
  static async getRecentMemberCheckIns(memberId, days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('profile_id', memberId)
        .eq('validation_status', 'valid')
        .gte('check_in_time', cutoffDate.toISOString())
        .order('check_in_time', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting recent check-ins:', error);
      return [];
    }
  }

  /**
   * Analyze check-in patterns and generate appropriate note
   */
  static async analyzeAndGenerateNote(checkInData, memberData, recentCheckIns, options) {
    const { staffId, noteSubject, customContent } = options;

    // If custom content provided, use it
    if (customContent) {
      return {
        content: customContent,
        subject: noteSubject || 'Check-in Note'
      };
    }

    // Analyze patterns
    const patterns = this.analyzeCheckInPatterns(checkInData, memberData, recentCheckIns);
    
    // Generate note based on patterns
    return this.generateNoteFromPatterns(patterns, checkInData, memberData, staffId);
  }

  /**
   * Analyze check-in patterns
   */
  static analyzeCheckInPatterns(checkInData, memberData, recentCheckIns) {
    const now = new Date(checkInData.check_in_time);
    const patterns = {
      isFirstVisit: recentCheckIns.length === 0,
      isNewMember: false,
      daysSinceLastVisit: 0,
      isReturnAfterBreak: false,
      isFrequentVisitor: false,
      isUnusualTime: false,
      isWeekend: false,
      isEarlyMorning: false,
      isLateEvening: false,
      checkInMethod: checkInData.check_in_method,
      visitCount: recentCheckIns.length + 1,
      streak: 0
    };

    // Check if new member (joined within last 7 days)
    if (memberData.join_date) {
      const joinDate = new Date(memberData.join_date);
      const daysSinceJoin = differenceInDays(now, joinDate);
      patterns.isNewMember = daysSinceJoin <= 7;
    }

    // Days since last visit
    if (recentCheckIns.length > 0) {
      const lastVisit = new Date(recentCheckIns[0].check_in_time);
      patterns.daysSinceLastVisit = differenceInDays(now, lastVisit);
      patterns.isReturnAfterBreak = patterns.daysSinceLastVisit >= 7;
    }

    // Frequency analysis
    patterns.isFrequentVisitor = recentCheckIns.length >= 15; // 15+ visits in 30 days

    // Time analysis
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    
    patterns.isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    patterns.isEarlyMorning = hour >= 5 && hour <= 7;
    patterns.isLateEvening = hour >= 20 && hour <= 23;

    // Calculate current streak
    patterns.streak = this.calculateStreak(recentCheckIns);

    return patterns;
  }

  /**
   * Calculate current check-in streak
   */
  static calculateStreak(recentCheckIns) {
    if (recentCheckIns.length === 0) return 1;

    const checkInDates = [...new Set(recentCheckIns.map(checkin => 
      new Date(checkin.check_in_time).toDateString()
    ))].sort((a, b) => new Date(b) - new Date(a));

    let streak = 1; // Include today
    const today = new Date().toDateString();
    
    for (let i = 1; i < 30; i++) {
      const checkDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toDateString();
      if (checkInDates.includes(checkDate)) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Generate note content based on patterns
   */
  static generateNoteFromPatterns(patterns, checkInData, memberData, staffId) {
    let content = '';
    let subject = 'Check-in Note';

    const memberName = `${memberData.first_name || ''} ${memberData.last_name || ''}`.trim() || memberData.email;
    const checkInTime = format(new Date(checkInData.check_in_time), 'h:mm a');
    const checkInDate = format(new Date(checkInData.check_in_time), 'MMM d, yyyy');

    // Determine note type and content based on patterns
    if (patterns.isFirstVisit) {
      subject = 'First Visit';
      content = `🎉 First gym visit for ${memberName}!

Check-in Details:
• Time: ${checkInTime} on ${checkInDate}
• Method: ${patterns.checkInMethod?.replace('_', ' ')}
${patterns.isNewMember ? '• New member (joined recently)' : ''}

Welcome Actions:
• Provide gym tour if needed
• Explain equipment and safety rules
• Introduce to staff and trainers
• Offer assistance with workout planning

Follow-up: Check in with member after first workout to ensure positive experience.`;

    } else if (patterns.isReturnAfterBreak) {
      subject = 'Return After Break';
      content = `👋 ${memberName} returned after ${patterns.daysSinceLastVisit} days!

Check-in Details:
• Time: ${checkInTime} on ${checkInDate}
• Last visit: ${patterns.daysSinceLastVisit} days ago
• Method: ${patterns.checkInMethod?.replace('_', ' ')}

Welcome Back Actions:
• Greet warmly and acknowledge return
• Ask about time away (vacation, illness, etc.)
• Offer refresher on any new equipment or programs
• Check if goals or needs have changed

Follow-up: Monitor engagement to ensure successful return to routine.`;

    } else if (patterns.streak >= 7) {
      subject = 'Streak Achievement';
      content = `🔥 ${memberName} is on a ${patterns.streak}-day streak!

Check-in Details:
• Time: ${checkInTime} on ${checkInDate}
• Current streak: ${patterns.streak} consecutive days
• Method: ${patterns.checkInMethod?.replace('_', ' ')}

Recognition:
• Acknowledge their dedication and consistency
• Consider offering encouragement or small reward
• Share achievement with team for recognition

Note: Consistent members like this are great candidates for referral programs or testimonials.`;

    } else if (patterns.isFrequentVisitor) {
      subject = 'Frequent Visitor';
      content = `⭐ Regular member ${memberName} checked in

Check-in Details:
• Time: ${checkInTime} on ${checkInDate}
• Visit #${patterns.visitCount} this month
• Method: ${patterns.checkInMethod?.replace('_', ' ')}

Member Status: Highly engaged regular
• Consider for loyalty program benefits
• Potential candidate for member referrals
• May be interested in advanced programs or personal training

Follow-up: Check satisfaction and explore additional services.`;

    } else if (patterns.isEarlyMorning) {
      subject = 'Early Bird Visit';
      content = `🌅 Early morning check-in for ${memberName}

Check-in Details:
• Time: ${checkInTime} on ${checkInDate} (Early Bird!)
• Method: ${patterns.checkInMethod?.replace('_', ' ')}

Notes:
• Dedicated member working out during off-peak hours
• May prefer quieter gym environment
• Good candidate for early morning classes or programs

Staff Note: Ensure early morning amenities are available (lighting, music, etc.).`;

    } else if (patterns.isLateEvening) {
      subject = 'Evening Visit';
      content = `🌙 Late evening check-in for ${memberName}

Check-in Details:
• Time: ${checkInTime} on ${checkInDate} (Evening)
• Method: ${patterns.checkInMethod?.replace('_', ' ')}

Notes:
• Member prefers evening workout schedule
• May have work/family commitments during day
• Ensure evening staff availability for assistance

Staff Note: Monitor late-hour facility needs and safety.`;

    } else if (patterns.isWeekend) {
      subject = 'Weekend Visit';
      content = `🏃‍♂️ Weekend warrior ${memberName} checked in

Check-in Details:
• Time: ${checkInTime} on ${checkInDate} (Weekend)
• Method: ${patterns.checkInMethod?.replace('_', ' ')}

Notes:
• Member maintains fitness routine on weekends
• May have more time for longer workouts
• Good candidate for weekend classes or events

Staff Note: Weekend members often appreciate social aspects of fitness.`;

    } else {
      // Standard check-in note
      subject = 'Regular Check-in';
      content = `✅ ${memberName} checked in

Check-in Details:
• Time: ${checkInTime} on ${checkInDate}
• Method: ${patterns.checkInMethod?.replace('_', ' ')}
• Visit frequency: Regular member

Notes: Standard check-in, member maintaining consistent routine.`;
    }

    return { content, subject };
  }

  /**
   * Get check-in note suggestions for staff
   */
  static async getCheckInNoteSuggestions(memberId, checkInData) {
    try {
      const memberData = await this.getMemberData(memberId);
      const recentCheckIns = await this.getRecentMemberCheckIns(memberId, 30);
      const patterns = this.analyzeCheckInPatterns(checkInData, memberData, recentCheckIns);
      
      const suggestions = [];

      // Generate multiple note suggestions
      if (patterns.isFirstVisit) {
        suggestions.push({
          subject: 'First Visit',
          content: 'Welcome new member! Provide tour and orientation.',
          priority: 'high'
        });
      }

      if (patterns.isReturnAfterBreak) {
        suggestions.push({
          subject: 'Return After Break',
          content: `Welcome back after ${patterns.daysSinceLastVisit} days away.`,
          priority: 'medium'
        });
      }

      if (patterns.streak >= 5) {
        suggestions.push({
          subject: 'Streak Achievement',
          content: `Acknowledge ${patterns.streak}-day streak!`,
          priority: 'medium'
        });
      }

      return suggestions;
    } catch (error) {
      console.error('Error getting note suggestions:', error);
      return [];
    }
  }

  /**
   * Get member data for note generation
   */
  static async getMemberData(memberId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', memberId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting member data:', error);
      return {};
    }
  }
}

export default CheckInNoteService;
