/**
 * Report Builder Modal Component
 * Intuitive interface for creating and editing automated report configurations
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Mail, 
  Calendar, 
  FileText, 
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import CorporateReportingService from '@/services/corporateReportingService';
import ReportPreviewModal from './ReportPreviewModal';

const ReportBuilderModal = ({ 
  isOpen, 
  onClose, 
  corporatePartnerId,
  reportConfig = null, 
  onSuccess 
}) => {
  const [currentTab, setCurrentTab] = useState('basic');
  const [formData, setFormData] = useState({
    report_name: '',
    report_description: '',
    frequency: 'monthly',
    report_format: 'email_summary',
    metrics: [],
    custom_subject: '',
    custom_message: '',
    is_enabled: true
  });
  
  const [recipients, setRecipients] = useState([]);
  const [loading, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [availableMetrics] = useState(CorporateReportingService.getAvailableMetrics());
  const [frequencyOptions] = useState(CorporateReportingService.getFrequencyOptions());
  const [formatOptions] = useState(CorporateReportingService.getFormatOptions());
  const { toast } = useToast();

  // Initialize form data when report config changes
  useEffect(() => {
    if (reportConfig) {
      setFormData({
        report_name: reportConfig.report_name || '',
        report_description: reportConfig.report_description || '',
        frequency: reportConfig.frequency || 'monthly',
        report_format: reportConfig.report_format || 'email_summary',
        metrics: reportConfig.metrics || [],
        custom_subject: reportConfig.custom_subject || '',
        custom_message: reportConfig.custom_message || '',
        is_enabled: reportConfig.is_enabled ?? true
      });
      setRecipients(reportConfig.corporate_report_recipients || []);
    } else {
      // Reset form for new report
      setFormData({
        report_name: '',
        report_description: '',
        frequency: 'monthly',
        report_format: 'email_summary',
        metrics: [],
        custom_subject: '',
        custom_message: '',
        is_enabled: true
      });
      setRecipients([]);
    }
    setCurrentTab('basic');
  }, [reportConfig, isOpen]);

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

  const addRecipient = () => {
    setRecipients(prev => [...prev, {
      email: '',
      name: '',
      role_title: '',
      department: '',
      is_primary: false
    }]);
  };

  const updateRecipient = (index, field, value) => {
    setRecipients(prev => prev.map((recipient, i) => 
      i === index ? { ...recipient, [field]: value } : recipient
    ));
  };

  const removeRecipient = (index) => {
    setRecipients(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const validation = CorporateReportingService.validateReportConfig({
      ...formData,
      recipients
    });

    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(', '),
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const configData = {
        ...formData,
        corporate_partner_id: corporatePartnerId,
        recipients: recipients.filter(r => r.email) // Only include recipients with email
      };

      let result;
      if (reportConfig) {
        // Update existing report
        result = await CorporateReportingService.updateReportConfiguration(reportConfig.id, configData);
      } else {
        // Create new report - get current user ID from auth context
        const { data: { user } } = await supabase.auth.getUser();
        result = await CorporateReportingService.createReportConfiguration(configData, user?.id);
      }

      if (result.error) {
        toast({
          title: "Error",
          description: result.error.message || "Failed to save report configuration",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Report configuration ${reportConfig ? 'updated' : 'created'} successfully`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      
      toast({
        title: "Error",
        description: "Failed to save report configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getMetricIcon = (category) => {
    switch (category) {
      case 'membership': return <Users className="h-4 w-4" />;
      case 'financial': return <DollarSign className="h-4 w-4" />;
      case 'engagement': return <TrendingUp className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getMetricsByCategory = () => {
    return availableMetrics.reduce((acc, metric) => {
      if (!acc[metric.category]) {
        acc[metric.category] = [];
      }
      acc[metric.category].push(metric);
      return acc;
    }, {});
  };

  // Don't render if no corporate partner ID is provided
  if (!corporatePartnerId) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {reportConfig ? 'Edit Report Configuration' : 'Create Automated Report'}
          </DialogTitle>
          <DialogDescription>
            Configure automated reports to be sent to corporate partners with customizable metrics and schedules.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="recipients">Recipients</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Report Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="report_name">Report Name *</Label>
                    <Input
                      id="report_name"
                      value={formData.report_name}
                      onChange={(e) => handleInputChange('report_name', e.target.value)}
                      placeholder="e.g., Monthly Membership Report"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="frequency">Frequency *</Label>
                    <Select value={formData.frequency} onValueChange={(value) => handleInputChange('frequency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencyOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-gray-500">{option.description}</div>
                            </div>
                          </SelectItem>
                        ))}
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
                    placeholder="Brief description of what this report includes..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="report_format">Report Format</Label>
                  <Select value={formData.report_format} onValueChange={(value) => handleInputChange('report_format', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formatOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-gray-500">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metrics Selection Tab */}
          <TabsContent value="metrics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Metrics to Include</CardTitle>
                <p className="text-sm text-gray-600">
                  Choose which metrics to include in your automated reports. Selected: {formData.metrics.length}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(getMetricsByCategory()).map(([category, metrics]) => (
                    <div key={category}>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        {getMetricIcon(category)}
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {metrics.map(metric => (
                          <div key={metric.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                            <Checkbox
                              id={metric.id}
                              checked={formData.metrics.includes(metric.id)}
                              onCheckedChange={() => handleMetricToggle(metric.id)}
                            />
                            <div className="flex-1">
                              <Label htmlFor={metric.id} className="font-medium cursor-pointer">
                                {metric.name}
                              </Label>
                              <p className="text-sm text-gray-600 mt-1">{metric.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recipients Tab */}
          <TabsContent value="recipients" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Email Recipients</CardTitle>
                  <Button onClick={addRecipient} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recipient
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recipients.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Recipients Added</h3>
                    <p className="text-gray-500 mb-4">
                      Add email recipients who should receive this automated report.
                    </p>
                    <Button onClick={addRecipient}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Recipient
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recipients.map((recipient, index) => (
                      <Card key={index} className="border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-medium">Recipient {index + 1}</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRecipient(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor={`email-${index}`}>Email Address *</Label>
                              <Input
                                id={`email-${index}`}
                                type="email"
                                value={recipient.email}
                                onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                                placeholder="recipient@company.com"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`name-${index}`}>Name</Label>
                              <Input
                                id={`name-${index}`}
                                value={recipient.name}
                                onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                                placeholder="John Doe"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`role-${index}`}>Role/Title</Label>
                              <Input
                                id={`role-${index}`}
                                value={recipient.role_title}
                                onChange={(e) => updateRecipient(index, 'role_title', e.target.value)}
                                placeholder="HR Director"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`department-${index}`}>Department</Label>
                              <Input
                                id={`department-${index}`}
                                value={recipient.department}
                                onChange={(e) => updateRecipient(index, 'department', e.target.value)}
                                placeholder="Human Resources"
                              />
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`primary-${index}`}
                                checked={recipient.is_primary}
                                onCheckedChange={(checked) => updateRecipient(index, 'is_primary', checked)}
                              />
                              <Label htmlFor={`primary-${index}`} className="text-sm">
                                Primary contact for this report
                              </Label>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Settings Tab */}
          <TabsContent value="delivery" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Email Customization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="custom_subject">Custom Email Subject</Label>
                  <Input
                    id="custom_subject"
                    value={formData.custom_subject}
                    onChange={(e) => handleInputChange('custom_subject', e.target.value)}
                    placeholder="e.g., Monthly Fitness Partnership Report - [Company Name]"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Leave empty to use default subject line
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="custom_message">Custom Email Message</Label>
                  <Textarea
                    id="custom_message"
                    value={formData.custom_message}
                    onChange={(e) => handleInputChange('custom_message', e.target.value)}
                    placeholder="Dear [Company Name] Team,&#10;&#10;Please find your monthly fitness partnership report attached...&#10;&#10;Best regards,&#10;Nordic Fitness Team"
                    rows={6}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    This message will appear at the beginning of each report email
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <div className="flex justify-between pt-6 border-t">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_enabled"
              checked={formData.is_enabled}
              onCheckedChange={(checked) => handleInputChange('is_enabled', checked)}
            />
            <Label htmlFor="is_enabled">Enable this report immediately</Label>
          </div>
          
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              disabled={!formData.report_name || formData.metrics.length === 0}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Report
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : (reportConfig ? 'Update Report' : 'Create Report')}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Report Preview Modal */}
      <ReportPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        reportConfig={{
          ...formData,
          recipients: recipients.filter(r => r.email)
        }}
        corporatePartner={{ id: corporatePartnerId }}
      />
    </Dialog>
  );
};

export default ReportBuilderModal;

