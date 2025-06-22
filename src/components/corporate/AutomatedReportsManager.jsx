/**
 * Automated Reports Manager Component
 * Manages all automated reports for a corporate partner
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Power, 
  PowerOff, 
  Calendar, 
  Mail, 
  FileText, 
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import CorporateReportingService from '@/services/corporateReportingService';
import ReportBuilderModal from './ReportBuilderModal';

const AutomatedReportsManager = ({ corporatePartner, onPartnerUpdate }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [deletingReport, setDeletingReport] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (corporatePartner?.id) {
      loadReports();
    }
  }, [corporatePartner?.id]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await CorporateReportingService.getReportConfigurations(corporatePartner.id);
      
      if (error) {
        
        toast({
          title: "Error",
          description: "Failed to load automated reports",
          variant: "destructive",
        });
        return;
      }

      setReports(data || []);
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutomatedReports = async (enabled) => {
    try {
      const { error } = await CorporateReportingService.toggleAutomatedReports(
        corporatePartner.id, 
        enabled
      );

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update automated reports setting",
          variant: "destructive",
        });
        return;
      }

      // Update parent component
      onPartnerUpdate({
        ...corporatePartner,
        automated_reports_enabled: enabled
      });

      toast({
        title: "Success",
        description: `Automated reports ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      
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

  const handleDeleteReport = async () => {
    if (!deletingReport) return;

    try {
      const { error } = await CorporateReportingService.deleteReportConfiguration(deletingReport.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete report configuration",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setReports(prev => prev.filter(report => report.id !== deletingReport.id));
      setDeletingReport(null);

      toast({
        title: "Success",
        description: "Report configuration deleted",
      });
    } catch (error) {
      
    }
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

  const getStatusBadge = (isEnabled, nextRunDate) => {
    if (!isEnabled) {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
          <PowerOff className="h-3 w-3 mr-1" />
          Disabled
        </Badge>
      );
    }

    const now = new Date();
    const nextRun = new Date(nextRunDate);
    
    if (nextRun <= now) {
      return (
        <Badge className="bg-yellow-100 text-yellow-700">
          <Clock className="h-3 w-3 mr-1" />
          Pending
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Automated Reports
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Configure automated reports to be sent to {corporatePartner.company_name}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">
                {corporatePartner.automated_reports_enabled ? 'Enabled' : 'Disabled'}
              </span>
              <Switch
                checked={corporatePartner.automated_reports_enabled}
                onCheckedChange={handleToggleAutomatedReports}
              />
            </div>
          </div>
        </CardHeader>
        
        {corporatePartner.automated_reports_enabled && (
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {reports.length} report{reports.length !== 1 ? 's' : ''} configured
                {reports.filter(r => r.is_enabled).length > 0 && (
                  <span className="ml-2">
                    • {reports.filter(r => r.is_enabled).length} active
                  </span>
                )}
              </div>
              
              <Button onClick={() => setShowReportBuilder(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Report
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Reports List */}
      {corporatePartner.automated_reports_enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Report Configurations</CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Configured</h3>
                <p className="text-gray-500 mb-4">
                  Create your first automated report to start sending regular updates to {corporatePartner.company_name}.
                </p>
                <Button onClick={() => setShowReportBuilder(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Report
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
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
                        <div className="text-sm">
                          {formatNextRunDate(report.next_run_date)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(report.is_enabled, report.next_run_date)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={report.is_enabled}
                            onCheckedChange={(enabled) => handleToggleReport(report.id, enabled)}
                            size="sm"
                          />
                          
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
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingReport(report)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Report Builder Modal */}
      <ReportBuilderModal
        isOpen={showReportBuilder}
        onClose={() => {
          setShowReportBuilder(false);
          setEditingReport(null);
        }}
        corporatePartnerId={corporatePartner.id}
        reportConfig={editingReport}
        onSuccess={() => {
          loadReports();
          setEditingReport(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingReport} onOpenChange={() => setDeletingReport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingReport?.report_name}"? 
              This action cannot be undone and will stop all future automated reports for this configuration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReport} className="bg-red-600 hover:bg-red-700">
              Delete Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AutomatedReportsManager;

