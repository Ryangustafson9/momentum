/**
 * Automated Reporting Summary Component
 * Provides a high-level overview of the automated reporting system status
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Building, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Mail,
  Calendar,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import CorporatePartnersService from '@/services/corporatePartnersService';
import CorporateReportingService from '@/services/corporateReportingService';

const AutomatedReportingSummary = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummaryData();
  }, []);

  const loadSummaryData = async () => {
    setLoading(true);
    try {
      // Load all corporate partners
      const { data: partners, error: partnersError } = await CorporatePartnersService.getCorporatePartners();
      
      if (partnersError) {
        
        return;
      }

      // Load all report configurations
      const allReports = [];
      const partnersWithReports = [];
      
      for (const partner of partners || []) {
        const { data: partnerReports, error: reportsError } = await CorporateReportingService.getReportConfigurations(partner.id);
        
        if (!reportsError && partnerReports && partnerReports.length > 0) {
          allReports.push(...partnerReports);
          partnersWithReports.push(partner);
        }
      }

      // Calculate summary statistics
      const now = new Date();
      const enabledReports = allReports.filter(r => r.is_enabled);
      const overdueReports = enabledReports.filter(r => {
        const nextRun = new Date(r.next_run_date);
        return nextRun <= now;
      });

      const upcomingReports = enabledReports.filter(r => {
        const nextRun = new Date(r.next_run_date);
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        return nextRun > now && nextRun <= tomorrow;
      });

      // Calculate frequency distribution
      const frequencyDistribution = allReports.reduce((acc, report) => {
        acc[report.frequency] = (acc[report.frequency] || 0) + 1;
        return acc;
      }, {});

      // Calculate total recipients
      const totalRecipients = allReports.reduce((total, report) => {
        return total + (report.corporate_report_recipients?.length || 0);
      }, 0);

      const summaryData = {
        totalPartners: partners?.length || 0,
        partnersWithReports: partnersWithReports.length,
        totalReports: allReports.length,
        enabledReports: enabledReports.length,
        overdueReports: overdueReports.length,
        upcomingReports: upcomingReports.length,
        totalRecipients,
        frequencyDistribution,
        reportsEnabledPercentage: allReports.length > 0 ? (enabledReports.length / allReports.length) * 100 : 0,
        partnersWithReportsPercentage: partners?.length > 0 ? (partnersWithReports.length / partners.length) * 100 : 0
      };

      setSummary(summaryData);
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (value, threshold = 0) => {
    if (value === 0) return 'text-gray-500';
    if (value > threshold) return 'text-red-500';
    return 'text-green-500';
  };

  const getFrequencyBadge = (frequency, count) => {
    const colors = {
      daily: 'bg-blue-100 text-blue-700',
      weekly: 'bg-green-100 text-green-700',
      monthly: 'bg-purple-100 text-purple-700',
      quarterly: 'bg-orange-100 text-orange-700'
    };

    return (
      <Badge key={frequency} className={colors[frequency] || 'bg-gray-100 text-gray-700'}>
        {frequency.charAt(0).toUpperCase() + frequency.slice(1)}: {count}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Failed to load reporting summary
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Overview Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Reporting Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{summary.totalReports}</div>
              <div className="text-sm text-gray-600">Total Reports</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{summary.enabledReports}</div>
              <div className="text-sm text-gray-600">Active Reports</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{summary.partnersWithReports}</div>
              <div className="text-sm text-gray-600">Partners with Reports</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{summary.totalRecipients}</div>
              <div className="text-sm text-gray-600">Total Recipients</div>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Reports Enabled</span>
                <span>{summary.reportsEnabledPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={summary.reportsEnabledPercentage} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Partners with Automated Reports</span>
                <span>{summary.partnersWithReportsPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={summary.partnersWithReportsPercentage} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status & Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Status & Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overdue Reports Alert */}
          {summary.overdueReports > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-800">
                  {summary.overdueReports} Overdue Report{summary.overdueReports !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                These reports are past their scheduled run time and need attention.
              </p>
            </div>
          )}

          {/* Upcoming Reports */}
          {summary.upcomingReports > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">
                  {summary.upcomingReports} Report{summary.upcomingReports !== 1 ? 's' : ''} Due Tomorrow
                </span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                These reports are scheduled to run within the next 24 hours.
              </p>
            </div>
          )}

          {/* All Good Status */}
          {summary.overdueReports === 0 && summary.upcomingReports === 0 && summary.enabledReports > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">All Reports On Schedule</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                All automated reports are running smoothly with no issues detected.
              </p>
            </div>
          )}

          {/* No Reports Warning */}
          {summary.totalReports === 0 && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <span className="font-medium text-gray-800">No Automated Reports</span>
              </div>
              <p className="text-sm text-gray-700 mt-1">
                No automated reports have been configured yet. Consider setting up reports for your corporate partners.
              </p>
            </div>
          )}

          {/* Frequency Distribution */}
          {Object.keys(summary.frequencyDistribution).length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Report Frequency Distribution</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(summary.frequencyDistribution).map(([frequency, count]) =>
                  getFrequencyBadge(frequency, count)
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Building className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-lg font-semibold">
                {summary.totalPartners - summary.partnersWithReports}
              </div>
              <div className="text-sm text-gray-600">
                Partners without automated reports
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Mail className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-lg font-semibold">
                {summary.totalRecipients > 0 ? (summary.totalRecipients / Math.max(summary.totalReports, 1)).toFixed(1) : 0}
              </div>
              <div className="text-sm text-gray-600">
                Average recipients per report
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Calendar className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <div className="text-lg font-semibold">
                {summary.enabledReports > 0 ? 
                  Object.entries(summary.frequencyDistribution)
                    .reduce((acc, [freq, count]) => acc + count, 0) : 0
                }
              </div>
              <div className="text-sm text-gray-600">
                Total scheduled deliveries
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomatedReportingSummary;

