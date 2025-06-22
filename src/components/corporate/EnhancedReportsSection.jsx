/**
 * Enhanced Reports Section Component
 * Comprehensive automated reports management interface for corporate partners
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Calendar, 
  Mail, 
  Power, 
  PowerOff, 
  Edit, 
  Eye, 
  Trash2,
  Plus,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  BarChart3,
  Send,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import CorporateReportingService from '@/services/corporateReportingService';
import ReportBuilderModal from './ReportBuilderModal';
import ReportPreviewModal from './ReportPreviewModal';
import CustomReportModal from './CustomReportModal';

const EnhancedReportsSection = ({ 
  corporatePartner, 
  formData, 
  onFormDataChange,
  onReportsUpdate 
}) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showCustomReport, setShowCustomReport] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [previewReport, setPreviewReport] = useState(null);
  const [deletingReport, setDeletingReport] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (corporatePartner?.id && formData.automated_reports_enabled) {
      loadReports();
    }
  }, [corporatePartner?.id, formData.automated_reports_enabled]);

  const loadReports = async () => {
    if (!corporatePartner?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await CorporateReportingService.getReportConfigurations(corporatePartner.id);
      
      if (error) {
        
        return;
      }

      setReports(data || []);
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReports = async (enabled) => {
    onFormDataChange('automated_reports_enabled', enabled);
    
    if (enabled && corporatePartner?.id) {
      loadReports();
    } else {
      setReports([]);
    }
  };

  const handleToggleReport = async (reportId, enabled) => {
    try {
      const { error } = await CorporateReportingService.toggleReportConfiguration(reportId, enabled);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update report status",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, is_enabled: enabled }
          : report
      ));

      toast({
        title: "Success",
        description: `Report ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      
    }
  };

  const handleDeleteReport = async (reportId) => {
    try {
      const { error } = await CorporateReportingService.deleteReportConfiguration(reportId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete report",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setReports(prev => prev.filter(report => report.id !== reportId));
      setDeletingReport(null);

      toast({
        title: "Success",
        description: "Report deleted successfully",
      });
    } catch (error) {
      
    }
  };

  const getStatusBadge = (report) => {
    if (!report.is_enabled) {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
          <PowerOff className="h-3 w-3 mr-1" />
          Disabled
        </Badge>
      );
    }

    const now = new Date();
    const nextRun = new Date(report.next_run_date);
    
    if (nextRun <= now) {
      return (
        <Badge className="bg-red-100 text-red-700">
          <AlertCircle className="h-3 w-3 mr-1" />
          Overdue
        </Badge>
      );
    }

    return (
      <Badge className="bg-green-100 text-green-700">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    );
  };

  const getFrequencyBadge = (frequency) => {
    const colors = {
      daily: 'bg-blue-100 text-blue-700',
      weekly: 'bg-green-100 text-green-700',
      monthly: 'bg-purple-100 text-purple-700',
      quarterly: 'bg-orange-100 text-orange-700'
    };

    return (
      <Badge className={colors[frequency] || 'bg-gray-100 text-gray-700'}>
        {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatNextRunDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    
    const date = new Date(dateString);
    const now = new Date();
    
    if (date <= now) {
      return 'Overdue';
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Automated Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Switch
              id="automated_reports_enabled"
              checked={formData.automated_reports_enabled}
              onCheckedChange={handleToggleReports}
            />
            <div>
              <Label htmlFor="automated_reports_enabled" className="font-medium">
                Enable Automated Reports
              </Label>
              <p className="text-sm text-gray-600">
                Send automated membership and usage reports to this corporate partner
              </p>
            </div>
          </div>
          {formData.automated_reports_enabled && (
            <Badge className="bg-green-100 text-green-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Enabled
            </Badge>
          )}
        </div>



        {/* Reports Management Interface */}
        {formData.automated_reports_enabled ? (
          !corporatePartner?.id ? (
            <div className="text-center py-6 border-2 border-dashed border-yellow-200 bg-yellow-50 rounded-lg">
              <BarChart3 className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <h3 className="font-medium text-yellow-800 mb-1">Save Partner First</h3>
              <p className="text-yellow-600 text-sm">
                Please save the corporate partner information before configuring automated reports.
              </p>
            </div>
          ) : (
          <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Configured Reports</h4>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadReports}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!corporatePartner?.id) {
                      toast({
                        title: "Save Partner First",
                        description: "Please save the corporate partner before creating custom reports.",
                        variant: "destructive",
                      });
                      return;
                    }
                    setShowCustomReport(true);
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Custom Report
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (!corporatePartner?.id) {
                      toast({
                        title: "Save Partner First",
                        description: "Please save the corporate partner before creating reports.",
                        variant: "destructive",
                      });
                      return;
                    }
                    setEditingReport(null);
                    setShowReportBuilder(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Report
                </Button>
              </div>
            </div>

            {/* Reports List */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Configured</h3>
                <p className="text-gray-500 mb-4">
                  Get started by creating your first automated report for {corporatePartner?.company_name || 'this partner'}.
                </p>
                <Button
                  onClick={() => {
                    if (!corporatePartner?.id) {
                      toast({
                        title: "Save Partner First",
                        description: "Please save the corporate partner before creating reports.",
                        variant: "destructive",
                      });
                      return;
                    }
                    setEditingReport(null);
                    setShowReportBuilder(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Report
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report Name</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Sent</TableHead>
                      <TableHead>Next Run</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{report.report_name}</div>
                            {report.report_description && (
                              <div className="text-sm text-gray-500 mt-1">
                                {report.report_description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {getFrequencyBadge(report.frequency)}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {report.corporate_report_recipients?.length || 0}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {getStatusBadge(report)}
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(report.last_run_date)}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-sm">
                            {formatNextRunDate(report.next_run_date)}
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Switch
                              checked={report.is_enabled}
                              onCheckedChange={(enabled) => handleToggleReport(report.id, enabled)}
                              size="sm"
                            />
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setPreviewReport(report);
                                setShowPreview(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingReport(report);
                                setShowReportBuilder(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeletingReport(report)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Report</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{report.report_name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setDeletingReport(null)}>
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteReport(report.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          )
        ) : (
          <div className="text-center py-6 text-gray-500">
            <BarChart3 className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p>Enable automated reports to configure and manage report schedules for this corporate partner.</p>
          </div>
        )}

        {/* Modals */}
        <ReportBuilderModal
          isOpen={showReportBuilder}
          onClose={() => {
            setShowReportBuilder(false);
            setEditingReport(null);
          }}
          corporatePartnerId={corporatePartner?.id}
          reportConfig={editingReport}
          onSuccess={() => {
            loadReports();
            setEditingReport(null);
            if (onReportsUpdate) onReportsUpdate();
          }}
        />

        <ReportPreviewModal
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false);
            setPreviewReport(null);
          }}
          reportConfig={previewReport}
          corporatePartner={corporatePartner}
        />

        <CustomReportModal
          isOpen={showCustomReport}
          onClose={() => setShowCustomReport(false)}
          corporatePartner={corporatePartner}
          onSuccess={() => {
            if (onReportsUpdate) onReportsUpdate();
          }}
        />
      </CardContent>
    </Card>
  );
};

export default EnhancedReportsSection;

