/**
 * Report Preview Modal Component
 * Shows a preview of what the automated report will look like
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  X,
  Download,
  Mail,
  FileText,
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Building,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CorporatePartnersService from '@/services/corporatePartnersService';
import CorporateDiscountCalculator from '@/utils/corporateDiscountCalculator';

const ReportPreviewModal = ({ 
  isOpen, 
  onClose, 
  reportConfig,
  corporatePartner 
}) => {
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && reportConfig && corporatePartner) {
      generatePreviewData();
    }
  }, [isOpen, reportConfig, corporatePartner]);

  const generatePreviewData = async () => {
    setLoading(true);
    try {
      // Generate sample data for preview
      const sampleData = {
        reportPeriod: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          end: new Date().toLocaleDateString(),
          frequency: reportConfig?.frequency || 'monthly'
        },
        companyInfo: {
          name: corporatePartner?.company_name || 'Unknown Company',
          code: corporatePartner?.company_code || 'N/A',
          industry: corporatePartner?.industry || 'N/A',
          employeeCount: corporatePartner?.employee_count || 0
        },
        metrics: {
          member_count: 45,
          new_enrollments: 8,
          active_members: 38,
          discount_usage: 52,
          total_savings: 2340.50,
          average_savings: 52.01,
          membership_types: {
            'Basic': 18,
            'Premium': 20,
            'Family': 7
          },
          facility_usage: {
            totalCheckIns: 342,
            averagePerMember: 7.6,
            peakHours: '6-8 PM'
          },
          class_participation: {
            totalClasses: 89,
            popularClasses: ['Yoga', 'HIIT', 'Spin']
          },
          retention_rate: 92.3
        },
        trends: {
          memberGrowth: '+12%',
          usageIncrease: '+8%',
          satisfactionScore: 4.7
        }
      };

      setPreviewData(sampleData);
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const getMetricIcon = (metricId) => {
    const iconMap = {
      member_count: <Users className="h-5 w-5" />,
      new_enrollments: <TrendingUp className="h-5 w-5" />,
      active_members: <Users className="h-5 w-5" />,
      discount_usage: <DollarSign className="h-5 w-5" />,
      total_savings: <DollarSign className="h-5 w-5" />,
      average_savings: <DollarSign className="h-5 w-5" />,
      membership_types: <BarChart3 className="h-5 w-5" />,
      facility_usage: <Building className="h-5 w-5" />,
      class_participation: <Calendar className="h-5 w-5" />,
      retention_rate: <TrendingUp className="h-5 w-5" />
    };
    return iconMap[metricId] || <BarChart3 className="h-5 w-5" />;
  };

  const getMetricValue = (metricId) => {
    if (!previewData) return 'Loading...';
    
    const { metrics } = previewData;
    
    switch (metricId) {
      case 'member_count':
        return metrics.member_count.toLocaleString();
      case 'new_enrollments':
        return `+${metrics.new_enrollments}`;
      case 'active_members':
        return `${metrics.active_members} (${((metrics.active_members / metrics.member_count) * 100).toFixed(1)}%)`;
      case 'discount_usage':
        return `${metrics.discount_usage} times`;
      case 'total_savings':
        return `$${metrics.total_savings.toLocaleString()}`;
      case 'average_savings':
        return `$${metrics.average_savings}`;
      case 'membership_types':
        return Object.entries(metrics.membership_types)
          .map(([type, count]) => `${type}: ${count}`)
          .join(', ');
      case 'facility_usage':
        return `${metrics.facility_usage.totalCheckIns} check-ins (avg: ${metrics.facility_usage.averagePerMember}/member)`;
      case 'class_participation':
        return `${metrics.class_participation.totalClasses} classes attended`;
      case 'retention_rate':
        return `${metrics.retention_rate}%`;
      default:
        return 'N/A';
    }
  };

  const renderEmailPreview = () => {
    if (!previewData || !reportConfig) return null;

    return (
      <div className="bg-white border rounded-lg p-6 max-w-2xl mx-auto">
        {/* Email Header */}
        <div className="border-b pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {reportConfig.custom_subject || `${reportConfig.frequency.charAt(0).toUpperCase() + reportConfig.frequency.slice(1)} Partnership Report`}
              </h2>
              <p className="text-sm text-gray-600">
                Report Period: {previewData.reportPeriod.start} - {previewData.reportPeriod.end}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Nordic Fitness</div>
              <div className="text-xs text-gray-500">Partnership Report</div>
            </div>
          </div>
        </div>

        {/* Custom Message */}
        {reportConfig.custom_message && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-gray-700 whitespace-pre-line">
              {reportConfig.custom_message.replace('[Company Name]', previewData.companyInfo.name)}
            </p>
          </div>
        )}

        {/* Company Summary */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Partnership Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">Company:</span>
              <p className="font-medium">{previewData.companyInfo.name}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Industry:</span>
              <p className="font-medium">{previewData.companyInfo.industry}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Employee Count:</span>
              <p className="font-medium">{previewData.companyInfo.employeeCount?.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Report Frequency:</span>
              <p className="font-medium capitalize">{previewData.reportPeriod.frequency}</p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(reportConfig.metrics || []).map(metricId => (
              <div key={metricId} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="text-blue-600 mr-3">
                  {getMetricIcon(metricId)}
                </div>
                <div>
                  <div className="text-sm text-gray-600 capitalize">
                    {metricId.replace('_', ' ')}
                  </div>
                  <div className="font-medium text-gray-900">
                    {getMetricValue(metricId)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trends & Insights */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Trends & Insights</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{previewData.trends.memberGrowth}</div>
              <div className="text-sm text-gray-600">Member Growth</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{previewData.trends.usageIncrease}</div>
              <div className="text-sm text-gray-600">Usage Increase</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{previewData.trends.satisfactionScore}/5</div>
              <div className="text-sm text-gray-600">Satisfaction</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-4 text-center">
          <p className="text-sm text-gray-600">
            This report was automatically generated by Nordic Fitness Partnership Analytics.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            For questions about this report, please contact your partnership manager.
          </p>
        </div>
      </div>
    );
  };

  const renderRecipientsList = () => {
    if (!reportConfig || !reportConfig.recipients || reportConfig.recipients.length === 0) {
      return (
        <div className="text-center py-8">
          <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No recipients configured</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {reportConfig.recipients.map((recipient, index) => (
          <Card key={index} className="border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{recipient.name || recipient.email}</div>
                  <div className="text-sm text-gray-500">{recipient.email}</div>
                  {recipient.role_title && (
                    <div className="text-xs text-gray-400">{recipient.role_title}</div>
                  )}
                </div>
                <div className="text-right">
                  {recipient.is_primary && (
                    <Badge className="bg-blue-100 text-blue-700">Primary</Badge>
                  )}
                  {recipient.department && (
                    <div className="text-xs text-gray-500 mt-1">{recipient.department}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Don't render if essential props are missing
  if (!reportConfig || !corporatePartner) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Preview</h3>
              <p className="text-gray-500">
                Missing report configuration or partner information.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Report Preview - {reportConfig?.report_name}
          </DialogTitle>
          <DialogDescription>
            Preview of the automated report that will be sent to {corporatePartner?.company_name}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email">Email Preview</TabsTrigger>
            <TabsTrigger value="recipients">Recipients</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Email Report Preview</h3>
              <p className="text-sm text-gray-600 mb-4">
                This is how the report will appear when sent to recipients.
              </p>
              {renderEmailPreview()}
            </div>
          </TabsContent>

          <TabsContent value="recipients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Report Recipients</CardTitle>
                <p className="text-sm text-gray-600">
                  The following people will receive this automated report.
                </p>
              </CardHeader>
              <CardContent>
                {renderRecipientsList()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Report Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Frequency:</span>
                    <p className="capitalize">{reportConfig?.frequency}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Format:</span>
                    <p className="capitalize">{reportConfig?.report_format?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Metrics Included:</span>
                    <p>{reportConfig?.metrics?.length || 0} metrics</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <Badge variant={reportConfig?.is_enabled ? "default" : "secondary"}>
                      {reportConfig?.is_enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </div>
                
                {reportConfig?.report_description && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Description:</span>
                    <p className="text-sm text-gray-600 mt-1">{reportConfig.report_description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-6 border-t">
          <div className="flex space-x-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Sample
            </Button>
            <Button variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Send Test Email
            </Button>
          </div>
          
          <Button onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportPreviewModal;

