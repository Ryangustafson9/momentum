/**
 * Report Generator Utility
 * Handles the generation of corporate partnership reports
 */

import CorporatePartnersService from '@/services/corporatePartnersService';
import CorporateDiscountCalculator from './corporateDiscountCalculator';

export class ReportGenerator {
  
  /**
   * Generate report data for a corporate partner
   */
  static async generateReportData(corporatePartnerId, reportConfig, dateRange = null) {
    try {
      // Set default date range if not provided
      if (!dateRange) {
        const endDate = new Date();
        const startDate = new Date();
        
        switch (reportConfig.frequency) {
          case 'daily':
            startDate.setDate(startDate.getDate() - 1);
            break;
          case 'weekly':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'monthly':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          case 'quarterly':
            startDate.setMonth(startDate.getMonth() - 3);
            break;
          default:
            startDate.setMonth(startDate.getMonth() - 1);
        }
        
        dateRange = { startDate, endDate };
      }

      // Get corporate partner information
      const { data: partner, error: partnerError } = await CorporatePartnersService.getCorporatePartner(corporatePartnerId);
      
      if (partnerError || !partner) {
        throw new Error('Failed to load corporate partner information');
      }

      // Get member affiliations for this partner
      const { data: affiliations, error: affiliationsError } = await CorporatePartnersService.getMemberAffiliations(corporatePartnerId);
      
      if (affiliationsError) {
        throw new Error('Failed to load member affiliations');
      }

      // Calculate metrics based on selected metrics in report config
      const reportData = {
        partner: partner,
        reportPeriod: {
          start: dateRange.startDate.toLocaleDateString(),
          end: dateRange.endDate.toLocaleDateString(),
          frequency: reportConfig.frequency
        },
        generatedAt: new Date().toISOString(),
        metrics: {}
      };

      // Generate each requested metric
      for (const metricId of reportConfig.metrics) {
        reportData.metrics[metricId] = await this.calculateMetric(metricId, affiliations, partner, dateRange);
      }

      return { data: reportData, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Calculate a specific metric
   */
  static async calculateMetric(metricId, affiliations, partner, dateRange) {
    const approvedAffiliations = affiliations.filter(a => a.verification_status === 'approved');
    
    switch (metricId) {
      case 'member_count':
        return {
          value: approvedAffiliations.length,
          description: 'Total number of active corporate members',
          trend: this.calculateTrend(approvedAffiliations.length, 'member_count', dateRange)
        };

      case 'new_enrollments':
        const newMembers = approvedAffiliations.filter(a => {
          const joinDate = new Date(a.created_at);
          return joinDate >= dateRange.startDate && joinDate <= dateRange.endDate;
        });
        return {
          value: newMembers.length,
          description: 'New member enrollments in the reporting period',
          trend: this.calculateTrend(newMembers.length, 'new_enrollments', dateRange)
        };

      case 'active_members':
        // This would typically query check-in data or activity logs
        // For now, we'll estimate based on membership status
        const activeCount = Math.floor(approvedAffiliations.length * 0.85); // 85% activity rate
        return {
          value: activeCount,
          percentage: approvedAffiliations.length > 0 ? (activeCount / approvedAffiliations.length * 100).toFixed(1) : 0,
          description: 'Members who used facilities in the reporting period',
          trend: this.calculateTrend(activeCount, 'active_members', dateRange)
        };

      case 'discount_usage':
        // Calculate total discount applications
        const discountUsage = approvedAffiliations.length * 2; // Assume 2 discount uses per member on average
        return {
          value: discountUsage,
          description: 'Number of times corporate discounts were applied',
          trend: this.calculateTrend(discountUsage, 'discount_usage', dateRange)
        };

      case 'total_savings':
        // Calculate total savings using the discount calculator
        const totalSavings = this.calculateTotalSavings(approvedAffiliations, partner.corporate_discounts);
        return {
          value: totalSavings,
          formatted: `$${totalSavings.toLocaleString()}`,
          description: 'Total dollar amount saved through corporate discounts',
          trend: this.calculateTrend(totalSavings, 'total_savings', dateRange)
        };

      case 'average_savings':
        const totalSavingsForAvg = this.calculateTotalSavings(approvedAffiliations, partner.corporate_discounts);
        const avgSavings = approvedAffiliations.length > 0 ? totalSavingsForAvg / approvedAffiliations.length : 0;
        return {
          value: avgSavings,
          formatted: `$${avgSavings.toFixed(2)}`,
          description: 'Average discount amount per corporate member',
          trend: this.calculateTrend(avgSavings, 'average_savings', dateRange)
        };

      case 'membership_types':
        const membershipBreakdown = {};
        approvedAffiliations.forEach(affiliation => {
          const membershipType = affiliation.membership_type_name || 'Unknown';
          membershipBreakdown[membershipType] = (membershipBreakdown[membershipType] || 0) + 1;
        });
        return {
          breakdown: membershipBreakdown,
          description: 'Distribution of membership types among corporate members',
          total: approvedAffiliations.length
        };

      case 'facility_usage':
        // This would typically query check-in logs
        // For now, we'll generate sample data
        const totalCheckIns = approvedAffiliations.length * 8; // 8 check-ins per member on average
        return {
          totalCheckIns,
          averagePerMember: approvedAffiliations.length > 0 ? (totalCheckIns / approvedAffiliations.length).toFixed(1) : 0,
          peakHours: '6-8 PM',
          description: 'Facility usage statistics for the reporting period',
          trend: this.calculateTrend(totalCheckIns, 'facility_usage', dateRange)
        };

      case 'class_participation':
        // Sample class participation data
        const totalClasses = Math.floor(approvedAffiliations.length * 1.5); // 1.5 classes per member
        return {
          totalClasses,
          averagePerMember: approvedAffiliations.length > 0 ? (totalClasses / approvedAffiliations.length).toFixed(1) : 0,
          popularClasses: ['Yoga', 'HIIT', 'Spin', 'Pilates'],
          description: 'Class participation statistics',
          trend: this.calculateTrend(totalClasses, 'class_participation', dateRange)
        };

      case 'retention_rate':
        // Calculate retention rate (simplified)
        const retentionRate = 92.3; // Sample retention rate
        return {
          value: retentionRate,
          formatted: `${retentionRate}%`,
          description: 'Percentage of members who renewed their membership',
          trend: this.calculateTrend(retentionRate, 'retention_rate', dateRange)
        };

      default:
        return {
          value: 0,
          description: 'Metric not implemented',
          error: `Unknown metric: ${metricId}`
        };
    }
  }

  /**
   * Calculate total savings for affiliations
   */
  static calculateTotalSavings(affiliations, discounts) {
    if (!discounts || discounts.length === 0) return 0;

    let totalSavings = 0;
    
    affiliations.forEach(affiliation => {
      // Simulate membership details
      const membershipDetails = {
        membershipTypeId: affiliation.membership_type_id,
        basePrice: 89.99, // Sample base price
        isFamily: false
      };

      const discountResult = CorporateDiscountCalculator.calculateBestDiscount(
        affiliation,
        discounts,
        membershipDetails
      );

      totalSavings += discountResult.discountAmount;
    });

    return totalSavings;
  }

  /**
   * Calculate trend for a metric (simplified)
   */
  static calculateTrend(currentValue, metricId, dateRange) {
    // This would typically compare with previous period data
    // For now, we'll generate sample trends
    const trendPercentages = {
      member_count: 12,
      new_enrollments: 8,
      active_members: 5,
      discount_usage: 15,
      total_savings: 18,
      average_savings: 3,
      facility_usage: 7,
      class_participation: 10,
      retention_rate: 2
    };

    const trend = trendPercentages[metricId] || 0;
    return {
      percentage: trend,
      direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
      formatted: trend > 0 ? `+${trend}%` : `${trend}%`
    };
  }

  /**
   * Format report data for email
   */
  static formatReportForEmail(reportData, reportConfig) {
    const { partner, reportPeriod, metrics } = reportData;
    
    let emailContent = `
# ${reportConfig.custom_subject || `${reportConfig.frequency.charAt(0).toUpperCase() + reportConfig.frequency.slice(1)} Partnership Report`}

**Report Period:** ${reportPeriod.start} - ${reportPeriod.end}
**Generated:** ${new Date(reportData.generatedAt).toLocaleString()}

---

## Partnership Overview

**Company:** ${partner.company_name}
**Industry:** ${partner.industry}
**Employee Count:** ${partner.employee_count?.toLocaleString()}
**Partnership Status:** ${partner.is_active ? 'Active' : 'Inactive'}

---

## Key Metrics

`;

    // Add each metric to the email
    Object.entries(metrics).forEach(([metricId, metricData]) => {
      const metricName = metricId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      emailContent += `### ${metricName}\n`;
      
      if (metricData.formatted) {
        emailContent += `**Value:** ${metricData.formatted}`;
      } else if (typeof metricData.value === 'number') {
        emailContent += `**Value:** ${metricData.value.toLocaleString()}`;
      } else if (metricData.breakdown) {
        emailContent += `**Breakdown:**\n`;
        Object.entries(metricData.breakdown).forEach(([key, value]) => {
          emailContent += `- ${key}: ${value}\n`;
        });
      }
      
      if (metricData.trend && metricData.trend.formatted) {
        emailContent += ` (${metricData.trend.formatted} vs. previous period)`;
      }
      
      emailContent += `\n\n${metricData.description}\n\n`;
    });

    // Add custom message if provided
    if (reportConfig.custom_message) {
      emailContent += `---\n\n${reportConfig.custom_message.replace('[Company Name]', partner.company_name)}\n\n`;
    }

    emailContent += `---\n\n*This report was automatically generated by Nordic Fitness Partnership Analytics.*\n*For questions about this report, please contact your partnership manager.*`;

    return emailContent;
  }

  /**
   * Generate sample report for preview
   */
  static generateSampleReport(reportConfig, partner) {
    const sampleData = {
      partner: partner,
      reportPeriod: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        end: new Date().toLocaleDateString(),
        frequency: reportConfig.frequency
      },
      generatedAt: new Date().toISOString(),
      metrics: {}
    };

    // Generate sample metrics
    const sampleMetrics = {
      member_count: { value: 45, description: 'Total number of active corporate members' },
      new_enrollments: { value: 8, description: 'New member enrollments in the reporting period' },
      active_members: { value: 38, percentage: '84.4', description: 'Members who used facilities in the reporting period' },
      discount_usage: { value: 52, description: 'Number of times corporate discounts were applied' },
      total_savings: { value: 2340.50, formatted: '$2,341', description: 'Total dollar amount saved through corporate discounts' },
      average_savings: { value: 52.01, formatted: '$52.01', description: 'Average discount amount per corporate member' },
      membership_types: { 
        breakdown: { 'Basic': 18, 'Premium': 20, 'Family': 7 }, 
        description: 'Distribution of membership types among corporate members',
        total: 45
      },
      facility_usage: { 
        totalCheckIns: 342, 
        averagePerMember: '7.6', 
        peakHours: '6-8 PM',
        description: 'Facility usage statistics for the reporting period'
      },
      class_participation: { 
        totalClasses: 89, 
        averagePerMember: '2.0',
        popularClasses: ['Yoga', 'HIIT', 'Spin', 'Pilates'],
        description: 'Class participation statistics'
      },
      retention_rate: { value: 92.3, formatted: '92.3%', description: 'Percentage of members who renewed their membership' }
    };

    // Only include metrics that are selected in the report config
    reportConfig.metrics.forEach(metricId => {
      if (sampleMetrics[metricId]) {
        sampleData.metrics[metricId] = {
          ...sampleMetrics[metricId],
          trend: {
            percentage: Math.floor(Math.random() * 20) - 5, // Random trend between -5% and +15%
            direction: 'up',
            formatted: '+12%'
          }
        };
      }
    });

    return sampleData;
  }
}

export default ReportGenerator;

