/**
 * Report Management Dashboard Component
 * Comprehensive dashboard for managing all automated reports across corporate partners
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
  Clock,
  CheckCircle,
  AlertCircle,
  Building,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import CorporatePartnersService from '@/services/corporatePartnersService';
import CorporateReportingService from '@/services/corporateReportingService';
import ReportBuilderModal from './ReportBuilderModal';
import ReportPreviewModal from './ReportPreviewModal';

const ReportManagementDashboard = () => {
  const [reports, setReports] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [frequencyFilter, setFrequencyFilter] = useState('all');
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [previewReport, setPreviewReport] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all corporate partners
      const { data: partnersData, error: partnersError } = await CorporatePartnersService.getCorporatePartners({
        isActive: true
      });

      if (partnersError) {
        
        return;
      }

      setPartners(partnersData || []);

      // Load all report configurations
      const allReports = [];
      for (const partner of partnersData || []) {
        const { data: partnerReports, error: reportsError } = await CorporateReportingService.getReportConfigurations(partner.id);
        
        if (!reportsError && partnerReports) {
          const reportsWithPartner = partnerReports.map(report => ({
            ...report,
            partner_name: partner.company_name,
            partner_id: partner.id
          }));
          allReports.push(...reportsWithPartner);
        }
      }

      setReports(allReports);
    } catch (error) {
      
      toast({
        title: "Error",
        description: "Failed to load report data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const getFilteredReports = () => {
    return reports.filter(report => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!report.report_name.toLowerCase().includes(searchLower) &&
            !report.partner_name.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'enabled' && !report.is_enabled) return false;
        if (statusFilter === 'disabled' && report.is_enabled) return false;
        if (statusFilter === 'overdue') {
          const nextRun = new Date(report.next_run_date);
          const now = new Date();
          if (nextRun > now || !report.is_enabled) return false;
        }
      }

      // Partner filter
      if (partnerFilter !== 'all' && report.partner_id !== partnerFilter) {
        return false;
      }

      // Frequency filter
      if (frequencyFilter !== 'all' && report.frequency !== frequencyFilter) {
        return false;
      }

      return true;
    });
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

  const getReportStats = () => {
    const filteredReports = getFilteredReports();
    return {
      total: filteredReports.length,
      enabled: filteredReports.filter(r => r.is_enabled).length,
      overdue: filteredReports.filter(r => {
        const nextRun = new Date(r.next_run_date);
        return nextRun <= new Date() && r.is_enabled;
      }).length,
      partners: new Set(filteredReports.map(r => r.partner_id)).size
    };
  };

  const stats = getReportStats();
  const filteredReports = getFilteredReports();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Report Management</h2>
          <p className="text-gray-600 mt-1">
            Manage all automated reports across corporate partnerships
          </p>
        </div>
        
        <Button onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Reports</p>
                <p className="text-2xl font-bold">{stats.enabled}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue Reports</p>
                <p className="text-2xl font-bold">{stats.overdue}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Partners with Reports</p>
                <p className="text-2xl font-bold">{stats.partners}</p>
              </div>
              <Building className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search reports or partners..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={partnerFilter} onValueChange={setPartnerFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by partner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Partners</SelectItem>
                {partners.map(partner => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Frequencies</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Automated Reports ({filteredReports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
              <p className="text-gray-500">
                {reports.length === 0 
                  ? "No automated reports have been configured yet."
                  : "No reports match your current filters."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Corporate Partner</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
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
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{report.partner_name}</span>
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
                        {getStatusBadge(report)}
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Builder Modal */}
      <ReportBuilderModal
        isOpen={showReportBuilder}
        onClose={() => {
          setShowReportBuilder(false);
          setEditingReport(null);
        }}
        corporatePartnerId={editingReport?.partner_id}
        reportConfig={editingReport}
        onSuccess={() => {
          loadData();
          setEditingReport(null);
        }}
      />

      {/* Report Preview Modal */}
      <ReportPreviewModal
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          setPreviewReport(null);
        }}
        reportConfig={previewReport}
        corporatePartner={previewReport ?
          partners.find(p => p.id === previewReport.partner_id) || {
            id: previewReport.partner_id,
            company_name: previewReport.partner_name,
            company_code: 'N/A',
            industry: 'N/A',
            employee_count: 0
          } : null}
      />
    </div>
  );
};

export default ReportManagementDashboard;

