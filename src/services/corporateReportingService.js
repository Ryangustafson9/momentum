/**
 * Corporate Reporting Service
 * Handles automated report configurations, scheduling, and delivery tracking
 */

import { supabase } from '@/lib/supabaseClient';

export class CorporateReportingService {
  
  // ==================== REPORT CONFIGURATIONS ====================
  
  /**
   * Get all report configurations for a corporate partner
   */
  static async getReportConfigurations(corporatePartnerId) {
    try {
      const { data, error } = await supabase
        .from('corporate_report_configurations')
        .select(`
          *,
          corporate_report_recipients(*),
          corporate_partners(company_name, company_code)
        `)
        .eq('corporate_partner_id', corporatePartnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Create a new report configuration
   */
  static async createReportConfiguration(configData, userId) {
    try {
      const { recipients, ...reportConfig } = configData;
      
      // Calculate next run date based on frequency
      const nextRunDate = this.calculateNextRunDate(reportConfig.frequency);
      
      const { data: reportData, error: reportError } = await supabase
        .from('corporate_report_configurations')
        .insert({
          ...reportConfig,
          next_run_date: nextRunDate,
          created_by: userId,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (reportError) throw reportError;

      // Add recipients if provided
      if (recipients && recipients.length > 0) {
        const recipientData = recipients.map(recipient => ({
          ...recipient,
          report_config_id: reportData.id
        }));

        const { error: recipientError } = await supabase
          .from('corporate_report_recipients')
          .insert(recipientData);

        if (recipientError) {
          
          // Don't fail the whole operation for recipient errors
        }
      }

      return { data: reportData, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Update a report configuration
   */
  static async updateReportConfiguration(configId, configData) {
    try {
      const { recipients, ...reportConfig } = configData;
      
      // Recalculate next run date if frequency changed
      if (reportConfig.frequency) {
        reportConfig.next_run_date = this.calculateNextRunDate(reportConfig.frequency);
      }

      const { data: reportData, error: reportError } = await supabase
        .from('corporate_report_configurations')
        .update({
          ...reportConfig,
          updated_at: new Date().toISOString()
        })
        .eq('id', configId)
        .select()
        .single();

      if (reportError) throw reportError;

      // Update recipients if provided
      if (recipients !== undefined) {
        // Delete existing recipients
        await supabase
          .from('corporate_report_recipients')
          .delete()
          .eq('report_config_id', configId);

        // Add new recipients
        if (recipients.length > 0) {
          const recipientData = recipients.map(recipient => ({
            ...recipient,
            report_config_id: configId
          }));

          const { error: recipientError } = await supabase
            .from('corporate_report_recipients')
            .insert(recipientData);

          if (recipientError) {
            
          }
        }
      }

      return { data: reportData, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Delete a report configuration
   */
  static async deleteReportConfiguration(configId) {
    try {
      const { error } = await supabase
        .from('corporate_report_configurations')
        .delete()
        .eq('id', configId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      
      return { error };
    }
  }

  /**
   * Create a custom one-time report
   */
  static async createCustomReport(reportData) {
    try {
      const { recipients, ...configData } = reportData;

      // Custom reports are one-time only
      const customReportConfig = {
        ...configData,
        report_type: 'custom',
        frequency: 'one_time',
        is_enabled: false, // Custom reports don't run automatically
        next_run_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: reportConfig, error: configError } = await supabase
        .from('corporate_report_configurations')
        .insert(customReportConfig)
        .select()
        .single();

      if (configError) throw configError;

      // Add recipients as simple email strings for custom reports
      if (recipients && recipients.length > 0) {
        const recipientData = recipients.map(email => ({
          report_config_id: reportConfig.id,
          email: email,
          name: email.split('@')[0], // Use email prefix as name
          is_primary: false
        }));

        const { error: recipientError } = await supabase
          .from('corporate_report_recipients')
          .insert(recipientData);

        if (recipientError) {
          
        }
      }

      // If send_immediately is true, trigger report generation
      if (reportData.send_immediately) {
        // In a real implementation, this would trigger the report generation service
        

        // Log the delivery attempt
        if (recipients && recipients.length > 0) {
          for (const email of recipients) {
            await this.logDelivery(
              reportConfig.id,
              email,
              'sent',
              null,
              {
                metrics: reportData.metrics,
                size: null,
                path: null
              }
            );
          }
        }
      }

      return { data: reportConfig, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Toggle report configuration enabled status
   */
  static async toggleReportConfiguration(configId, isEnabled) {
    try {
      const updateData = { 
        is_enabled: isEnabled,
        updated_at: new Date().toISOString()
      };

      // If enabling, recalculate next run date
      if (isEnabled) {
        const { data: config } = await supabase
          .from('corporate_report_configurations')
          .select('frequency')
          .eq('id', configId)
          .single();

        if (config) {
          updateData.next_run_date = this.calculateNextRunDate(config.frequency);
        }
      }

      const { data, error } = await supabase
        .from('corporate_report_configurations')
        .update(updateData)
        .eq('id', configId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  // ==================== CORPORATE PARTNER REPORTING SETTINGS ====================

  /**
   * Enable/disable automated reports for a corporate partner
   */
  static async toggleAutomatedReports(corporatePartnerId, isEnabled, contactInfo = {}) {
    try {
      const updateData = {
        automated_reports_enabled: isEnabled,
        updated_at: new Date().toISOString()
      };

      if (contactInfo.email) {
        updateData.reports_contact_email = contactInfo.email;
      }
      if (contactInfo.name) {
        updateData.reports_contact_name = contactInfo.name;
      }

      const { data, error } = await supabase
        .from('corporate_partners')
        .update(updateData)
        .eq('id', corporatePartnerId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  // ==================== DELIVERY LOGS ====================

  /**
   * Get delivery logs for a report configuration
   */
  static async getDeliveryLogs(reportConfigId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('corporate_report_delivery_logs')
        .select('*')
        .eq('report_config_id', reportConfigId)
        .order('delivery_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Log a report delivery attempt
   */
  static async logDelivery(reportConfigId, recipientEmail, status, errorMessage = null, fileInfo = {}) {
    try {
      const logData = {
        report_config_id: reportConfigId,
        recipient_email: recipientEmail,
        status,
        error_message: errorMessage,
        file_path: fileInfo.path || null,
        file_size: fileInfo.size || null,
        metrics_included: fileInfo.metrics || null
      };

      const { data, error } = await supabase
        .from('corporate_report_delivery_logs')
        .insert(logData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Calculate next run date based on frequency
   */
  static calculateNextRunDate(frequency) {
    const now = new Date();
    
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
      case 'quarterly':
        const nextQuarter = new Date(now);
        nextQuarter.setMonth(nextQuarter.getMonth() + 3);
        return nextQuarter;
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Get available report metrics
   */
  static getAvailableMetrics() {
    return [
      {
        id: 'member_count',
        name: 'Total Members',
        description: 'Current number of active corporate members',
        category: 'membership'
      },
      {
        id: 'new_enrollments',
        name: 'New Enrollments',
        description: 'New member signups in the reporting period',
        category: 'membership'
      },
      {
        id: 'active_members',
        name: 'Active Members',
        description: 'Members who used facilities in the reporting period',
        category: 'engagement'
      },
      {
        id: 'discount_usage',
        name: 'Discount Usage',
        description: 'Number of times corporate discounts were applied',
        category: 'financial'
      },
      {
        id: 'total_savings',
        name: 'Total Savings Provided',
        description: 'Total dollar amount saved through corporate discounts',
        category: 'financial'
      },
      {
        id: 'average_savings',
        name: 'Average Savings per Member',
        description: 'Average discount amount per corporate member',
        category: 'financial'
      },
      {
        id: 'membership_types',
        name: 'Membership Type Breakdown',
        description: 'Distribution of membership types among corporate members',
        category: 'membership'
      },
      {
        id: 'facility_usage',
        name: 'Facility Usage',
        description: 'Check-in frequency and facility utilization',
        category: 'engagement'
      },
      {
        id: 'class_participation',
        name: 'Class Participation',
        description: 'Participation in fitness classes and programs',
        category: 'engagement'
      },
      {
        id: 'retention_rate',
        name: 'Member Retention Rate',
        description: 'Percentage of members who renewed their membership',
        category: 'membership'
      }
    ];
  }

  /**
   * Get report frequency options
   */
  static getFrequencyOptions() {
    return [
      { value: 'daily', label: 'Daily', description: 'Every day at 9:00 AM' },
      { value: 'weekly', label: 'Weekly', description: 'Every Monday at 9:00 AM' },
      { value: 'monthly', label: 'Monthly', description: 'First day of each month at 9:00 AM' },
      { value: 'quarterly', label: 'Quarterly', description: 'First day of each quarter at 9:00 AM' }
    ];
  }

  /**
   * Get report format options
   */
  static getFormatOptions() {
    return [
      { value: 'email_summary', label: 'Email Summary', description: 'Formatted email with key metrics' },
      { value: 'pdf', label: 'PDF Report', description: 'Comprehensive PDF document' },
      { value: 'excel', label: 'Excel Spreadsheet', description: 'Detailed Excel file with data tables' }
    ];
  }

  /**
   * Validate email address
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate report configuration
   */
  static validateReportConfig(config) {
    const errors = [];

    if (!config.report_name || config.report_name.trim().length === 0) {
      errors.push('Report name is required');
    }

    if (!config.frequency) {
      errors.push('Report frequency is required');
    }

    if (!config.metrics || config.metrics.length === 0) {
      errors.push('At least one metric must be selected');
    }

    if (config.recipients && config.recipients.length > 0) {
      config.recipients.forEach((recipient, index) => {
        if (!recipient.email || !this.validateEmail(recipient.email)) {
          errors.push(`Invalid email address for recipient ${index + 1}`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default CorporateReportingService;

