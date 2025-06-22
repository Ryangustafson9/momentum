/**
 * Custom Report Modal Component
 * Allows creation of one-time custom reports or special report configurations
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, 
  X, 
  Calendar, 
  Mail, 
  FileText, 
  BarChart3,
  Users,
  DollarSign,
  Clock,
  Download,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import CorporateReportingService from '@/services/corporateReportingService';

const AVAILABLE_METRICS = [
  { id: 'member_count', label: 'Total Members', icon: <Users className="h-4 w-4" /> },
  { id: 'new_enrollments', label: 'New Enrollments', icon: <Users className="h-4 w-4" /> },
  { id: 'active_members', label: 'Active Members', icon: <Users className="h-4 w-4" /> },
  { id: 'discount_usage', label: 'Discount Usage', icon: <DollarSign className="h-4 w-4" /> },
  { id: 'total_savings', label: 'Total Savings', icon: <DollarSign className="h-4 w-4" /> },
  { id: 'average_savings', label: 'Average Savings per Member', icon: <DollarSign className="h-4 w-4" /> },
  { id: 'membership_types', label: 'Membership Type Breakdown', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'facility_usage', label: 'Facility Usage Statistics', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'class_participation', label: 'Class Participation', icon: <Calendar className="h-4 w-4" /> },
  { id: 'retention_rate', label: 'Member Retention Rate', icon: <BarChart3 className="h-4 w-4" /> }
];

const CustomReportModal = ({ 
  isOpen, 
  onClose, 
  corporatePartner,
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    report_name: '',
    report_description: '',
    date_range_start: '',
    date_range_end: '',
    metrics: [],
    recipients: '',
    custom_message: '',
    report_format: 'email_html',
    send_immediately: true
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMetricToggle = (metricId) => {
    setFormData(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metricId)
        ? prev.metrics.filter(id => id !== metricId)
        : [...prev.metrics, metricId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.report_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a report name",
        variant: "destructive",
      });
      return;
    }

    if (formData.metrics.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one metric",
        variant: "destructive",
      });
      return;
    }

    if (!formData.recipients.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter at least one recipient email",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Parse recipients
      const recipientEmails = formData.recipients
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);

      const reportData = {
        corporate_partner_id: corporatePartner.id,
        report_name: formData.report_name,
        report_description: formData.report_description,
        report_type: 'custom',
        frequency: 'one_time',
        metrics: formData.metrics,
        report_format: formData.report_format,
        custom_message: formData.custom_message,
        date_range_start: formData.date_range_start,
        date_range_end: formData.date_range_end,
        recipients: recipientEmails,
        send_immediately: formData.send_immediately,
        is_enabled: false // Custom reports are one-time only
      };

      const { error } = await CorporateReportingService.createCustomReport(reportData);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create custom report",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: formData.send_immediately 
          ? "Custom report created and sent successfully"
          : "Custom report created successfully",
      });

      if (onSuccess) onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        report_name: '',
        report_description: '',
        date_range_start: '',
        date_range_end: '',
        metrics: [],
        recipients: '',
        custom_message: '',
        report_format: 'email_html',
        send_immediately: true
      });
    } catch (error) {
      
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  // Set default date range when modal opens
  React.useEffect(() => {
    if (isOpen && !formData.date_range_start) {
      const defaultRange = getDefaultDateRange();
      setFormData(prev => ({
        ...prev,
        date_range_start: defaultRange.start,
        date_range_end: defaultRange.end
      }));
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Create Custom Report - {corporatePartner?.company_name}
          </DialogTitle>
          <DialogDescription>
            Generate a one-time custom report with specific metrics and date ranges
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="report_name">Report Name *</Label>
                  <Input
                    id="report_name"
                    value={formData.report_name}
                    onChange={(e) => handleInputChange('report_name', e.target.value)}
                    placeholder="e.g., Q4 2024 Custom Analysis"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="report_format">Report Format</Label>
                  <Select
                    value={formData.report_format}
                    onValueChange={(value) => handleInputChange('report_format', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email_html">HTML Email</SelectItem>
                      <SelectItem value="pdf_attachment">PDF Attachment</SelectItem>
                      <SelectItem value="csv_data">CSV Data Export</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="report_description">Description</Label>
                <Textarea
                  id="report_description"
                  value={formData.report_description}
                  onChange={(e) => handleInputChange('report_description', e.target.value)}
                  placeholder="Brief description of this custom report..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Date Range */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Date Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date_range_start">Start Date</Label>
                  <Input
                    id="date_range_start"
                    type="date"
                    value={formData.date_range_start}
                    onChange={(e) => handleInputChange('date_range_start', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="date_range_end">End Date</Label>
                  <Input
                    id="date_range_end"
                    type="date"
                    value={formData.date_range_end}
                    onChange={(e) => handleInputChange('date_range_end', e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metrics Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metrics to Include *</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AVAILABLE_METRICS.map((metric) => (
                  <div key={metric.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={metric.id}
                      checked={formData.metrics.includes(metric.id)}
                      onCheckedChange={() => handleMetricToggle(metric.id)}
                    />
                    <Label htmlFor={metric.id} className="flex items-center gap-2 cursor-pointer">
                      {metric.icon}
                      {metric.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recipients */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recipients *</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="recipients">Email Addresses</Label>
                <Textarea
                  id="recipients"
                  value={formData.recipients}
                  onChange={(e) => handleInputChange('recipients', e.target.value)}
                  placeholder="Enter email addresses separated by commas (e.g., john@company.com, jane@company.com)"
                  rows={3}
                  required
                />
                <p className="text-sm text-gray-600 mt-1">
                  Separate multiple email addresses with commas
                </p>
              </div>

              <div>
                <Label htmlFor="custom_message">Custom Message</Label>
                <Textarea
                  id="custom_message"
                  value={formData.custom_message}
                  onChange={(e) => handleInputChange('custom_message', e.target.value)}
                  placeholder="Optional custom message to include in the report..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Delivery Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Delivery Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="send_immediately"
                  checked={formData.send_immediately}
                  onCheckedChange={(checked) => handleInputChange('send_immediately', checked)}
                />
                <Label htmlFor="send_immediately">
                  Send report immediately after creation
                </Label>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                If unchecked, the report will be created but not sent automatically
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                disabled={loading || formData.metrics.length === 0}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {formData.send_immediately ? 'Create & Send' : 'Create Report'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomReportModal;

