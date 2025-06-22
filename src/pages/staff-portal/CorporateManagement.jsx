/**
 * Corporate Partners Management Page
 * Main interface for managing corporate partnerships and discounts
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Users,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  BarChart3,
  Columns,
  Settings,
  MoreHorizontal,
  Download,
  Copy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import CorporatePartnersService from '@/services/corporatePartnersService';
import CorporatePartnerForm from '@/components/corporate/CorporatePartnerForm';
import CorporateAnalyticsDashboard from '@/components/corporate/CorporateAnalyticsDashboard';
import AutomatedReportsManager from '@/components/corporate/AutomatedReportsManager';
import ReportManagementDashboard from '@/components/corporate/ReportManagementDashboard';
import CorporatePartnerDetailsModal from '@/components/corporate/CorporatePartnerDetailsModal';
import StaffPageHeader from '@/components/staff/StaffPageHeader';
import StaffPageContainer from '@/components/staff/StaffPageContainer';

const CorporateManagement = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [analytics, setAnalytics] = useState(null);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [showReportsManager, setShowReportsManager] = useState(false);
  const [reportsPartner, setReportsPartner] = useState(null);
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsPartner, setDetailsPartner] = useState(null);
  const [selectedPartners, setSelectedPartners] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('corporatePartnersVisibleColumns');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        
      }
    }
    return {
      company: true,
      contact: true,
      industry: true,
      employees: true,
      agreement: true,
      status: true,
      discounts: true,
      reports: true,
      actions: true
    };
  });
  const { toast } = useToast();

  // Load corporate partners
  useEffect(() => {
    loadPartners();
    loadAnalytics();
  }, []);

  const toggleColumnVisibility = (columnKey) => {
    setVisibleColumns(prev => {
      const newVisibility = {
        ...prev,
        [columnKey]: !prev[columnKey]
      };
      localStorage.setItem('corporatePartnersVisibleColumns', JSON.stringify(newVisibility));
      return newVisibility;
    });
  };

  const getColumnDefinitions = () => [
    { key: 'company', label: 'Company', required: true },
    { key: 'contact', label: 'Contact' },
    { key: 'industry', label: 'Industry' },
    { key: 'employees', label: 'Employees' },
    { key: 'agreement', label: 'Agreement' },
    { key: 'status', label: 'Status' },
    { key: 'discounts', label: 'Discounts' },
    { key: 'reports', label: 'Reports' },
    { key: 'actions', label: 'Actions', required: true }
  ];

  const loadPartners = async () => {
    setLoading(true);
    try {
      const filters = {};
      
      if (statusFilter !== 'all') {
        filters.isActive = statusFilter === 'active';
      }
      
      if (searchTerm) {
        filters.search = searchTerm;
      }
      
      if (industryFilter !== 'all') {
        filters.industry = industryFilter;
      }

      const { data, error } = await CorporatePartnersService.getCorporatePartners(filters);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to load corporate partners",
          variant: "destructive",
        });
        return;
      }

      setPartners(data || []);
    } catch (error) {
      
      toast({
        title: "Error",
        description: "Failed to load corporate partners",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const { data, error } = await CorporatePartnersService.getPartnershipAnalytics();
      
      if (error) {
        
        return;
      }

      setAnalytics(data);
    } catch (error) {
      
    }
  };

  // Apply filters when they change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadPartners();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, industryFilter]);

  const handleSelectPartner = (partnerId) => {
    setSelectedPartners(prev => {
      const newSet = new Set(prev);
      if (newSet.has(partnerId)) {
        newSet.delete(partnerId);
      } else {
        newSet.add(partnerId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedPartners.size === partners.length) {
      setSelectedPartners(new Set());
    } else {
      setSelectedPartners(new Set(partners.map(p => p.id)));
    }
  };

  const handleBulkActivate = async () => {
    const partnerIds = Array.from(selectedPartners);
    let successCount = 0;

    for (const partnerId of partnerIds) {
      try {
        const { error } = await CorporatePartnersService.updateCorporatePartner(partnerId, {
          is_active: true
        });

        if (!error) {
          successCount++;
        }
      } catch (error) {
        
      }
    }

    toast({
      title: "Bulk Action Complete",
      description: `${successCount} of ${partnerIds.length} partners activated successfully`,
    });

    setSelectedPartners(new Set());
    loadPartners();
  };

  const handleBulkDeactivate = async () => {
    const partnerIds = Array.from(selectedPartners);
    let successCount = 0;

    for (const partnerId of partnerIds) {
      try {
        const { error } = await CorporatePartnersService.updateCorporatePartner(partnerId, {
          is_active: false
        });

        if (!error) {
          successCount++;
        }
      } catch (error) {
        
      }
    }

    toast({
      title: "Bulk Action Complete",
      description: `${successCount} of ${partnerIds.length} partners deactivated successfully`,
    });

    setSelectedPartners(new Set());
    loadPartners();
  };

  const handleBulkExport = () => {
    const selectedPartnersData = partners.filter(p => selectedPartners.has(p.id));
    const csvContent = [
      ['Company Name', 'Company Code', 'Industry', 'Employees', 'Contact Person', 'Contact Email', 'Status'].join(','),
      ...selectedPartnersData.map(partner => [
        partner.company_name,
        partner.company_code,
        partner.industry,
        partner.employee_count,
        partner.contact_person,
        partner.contact_email,
        partner.is_active ? 'Active' : 'Inactive'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corporate-partners-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `${selectedPartnersData.length} partners exported successfully`,
    });
  };

  const handleExportAll = () => {
    const csvContent = [
      ['Company Name', 'Company Code', 'Industry', 'Employees', 'Contact Person', 'Contact Email', 'Contact Phone', 'Status', 'Agreement Start', 'Agreement End'].join(','),
      ...partners.map(partner => [
        partner.company_name,
        partner.company_code,
        partner.industry,
        partner.employee_count,
        partner.contact_person,
        partner.contact_email,
        partner.contact_phone || '',
        partner.is_active ? 'Active' : 'Inactive',
        new Date(partner.agreement_start_date).toLocaleDateString(),
        new Date(partner.agreement_end_date).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-corporate-partners-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `${partners.length} partners exported successfully`,
    });
  };

  const handleToggleStatus = async (partnerId, currentStatus) => {
    try {
      const { error } = await CorporatePartnersService.updateCorporatePartner(partnerId, {
        is_active: !currentStatus
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update partner status",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Partner ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });

      loadPartners();
    } catch (error) {
      
      toast({
        title: "Error",
        description: "Failed to update partner status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (isActive, agreementEndDate) => {
    const endDate = new Date(agreementEndDate);
    const today = new Date();
    const isExpired = endDate < today;

    if (!isActive) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-600">Inactive</Badge>;
    }
    
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    // Check if expiring soon (within 30 days)
    const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 30) {
      return <Badge variant="outline" className="border-yellow-400 text-yellow-600">Expiring Soon</Badge>;
    }
    
    return <Badge variant="default" className="bg-green-100 text-green-700">Active</Badge>;
  };

  const getIndustries = () => {
    const industries = [...new Set(partners.map(p => p.industry).filter(Boolean))];
    return industries.sort();
  };

  return (
    <StaffPageContainer>
      <StaffPageHeader
        title="Corporate Partners"
        subtitle="Manage corporate partnerships and employee discount programs"
        actions={
          <Button
            className="flex items-center gap-2"
            onClick={() => {
              setEditingPartner(null);
              setShowPartnerForm(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Corporate Partner
          </Button>
        }
      />

      {/* Main Content Tabs */}
      <Tabs defaultValue="partners" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="partners" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Partner Management
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Report Management
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics & Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="partners" className="space-y-6">
          {/* Analytics Cards */}
          {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Partners</p>
                  <p className="text-2xl font-bold">{partners.length}</p>
                </div>
                <Building className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Corporate Members</p>
                  <p className="text-2xl font-bold">{analytics.approvedMembers}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Approvals</p>
                  <p className="text-2xl font-bold">{analytics.pendingMembers}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Partnerships</p>
                  <p className="text-2xl font-bold">
                    {partners.filter(p => p.is_active).length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search partners, companies, or contacts..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {getIndustries().map(industry => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedPartners.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-medium text-blue-900">
                  {selectedPartners.size} partner{selectedPartners.size !== 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPartners(new Set())}
                >
                  Clear Selection
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkActivate}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Activate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDeactivate}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Deactivate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkExport}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Partners Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Corporate Partners</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAll}
              >
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
              <Popover open={showColumnFilter} onOpenChange={setShowColumnFilter}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns className="h-4 w-4 mr-2" />
                  Columns ({Object.values(visibleColumns).filter(Boolean).length}/{Object.keys(visibleColumns).length})
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="end">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Show/Hide Columns</h4>
                  <div className="space-y-2">
                    {getColumnDefinitions().map((column) => (
                      <div key={column.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`column-${column.key}`}
                          checked={visibleColumns[column.key]}
                          onCheckedChange={() => toggleColumnVisibility(column.key)}
                          disabled={column.required}
                        />
                        <Label
                          htmlFor={`column-${column.key}`}
                          className={`text-sm ${column.required ? 'text-gray-500' : 'cursor-pointer'}`}
                        >
                          {column.label}
                          {column.required && <span className="text-xs ml-1">(Required)</span>}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newVisibility = {};
                        getColumnDefinitions().forEach(col => {
                          newVisibility[col.key] = col.required || true;
                        });
                        localStorage.setItem('corporatePartnersVisibleColumns', JSON.stringify(newVisibility));
                        setVisibleColumns(newVisibility);
                      }}
                      className="w-full"
                    >
                      Show All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newVisibility = {};
                        getColumnDefinitions().forEach(col => {
                          newVisibility[col.key] = col.required || (col.key === 'company' || col.key === 'contact' || col.key === 'status' || col.key === 'actions');
                        });
                        localStorage.setItem('corporatePartnersVisibleColumns', JSON.stringify(newVisibility));
                        setVisibleColumns(newVisibility);
                      }}
                      className="w-full"
                    >
                      Reset to Default
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : partners.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Corporate Partners</h3>
              <p className="text-gray-500 mb-4">
                Get started by adding your first corporate partnership.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Corporate Partner
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedPartners.size === partners.length && partners.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    {visibleColumns.company && <TableHead>Company</TableHead>}
                    {visibleColumns.contact && <TableHead>Contact</TableHead>}
                    {visibleColumns.industry && <TableHead>Industry</TableHead>}
                    {visibleColumns.employees && <TableHead>Employees</TableHead>}
                    {visibleColumns.agreement && <TableHead>Agreement</TableHead>}
                    {visibleColumns.status && <TableHead>Status</TableHead>}
                    {visibleColumns.discounts && <TableHead>Discounts</TableHead>}
                    {visibleColumns.reports && <TableHead>Reports</TableHead>}
                    {visibleColumns.actions && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPartners.has(partner.id)}
                          onCheckedChange={() => handleSelectPartner(partner.id)}
                        />
                      </TableCell>
                      {visibleColumns.company && (
                        <TableCell>
                          <div>
                            <div className="font-medium">{partner.company_name}</div>
                            <div className="text-sm text-gray-500">{partner.company_code}</div>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.contact && (
                        <TableCell>
                          <div>
                            <div className="font-medium">{partner.contact_person}</div>
                            <div className="text-sm text-gray-500">{partner.contact_email}</div>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.industry && (
                        <TableCell>{partner.industry}</TableCell>
                      )}
                      {visibleColumns.employees && (
                        <TableCell>{partner.employee_count?.toLocaleString()}</TableCell>
                      )}
                      {visibleColumns.agreement && (
                        <TableCell>
                          <div className="text-sm">
                            <div>{new Date(partner.agreement_start_date).toLocaleDateString()}</div>
                            <div className="text-gray-500">
                              to {new Date(partner.agreement_end_date).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.status && (
                        <TableCell>
                          {getStatusBadge(partner.is_active, partner.agreement_end_date)}
                        </TableCell>
                      )}
                      {visibleColumns.discounts && (
                        <TableCell>
                          <Badge variant="outline">
                            {partner.corporate_discounts?.length || 0} discount{partner.corporate_discounts?.length !== 1 ? 's' : ''}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.reports && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {partner.automated_reports_enabled ? (
                              <Badge className="bg-green-100 text-green-700">
                                <BarChart3 className="h-3 w-3 mr-1" />
                                Enabled
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">
                                Disabled
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setReportsPartner(partner);
                                setShowReportsManager(true);
                              }}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.actions && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDetailsPartner(partner);
                                setShowDetailsModal(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingPartner(partner);
                                setShowPartnerForm(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(partner.id, partner.is_active)}
                            >
                              {partner.is_active ? (
                                <XCircle className="h-4 w-4 text-red-500" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setDetailsPartner(partner);
                                    setShowDetailsModal(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingPartner(partner);
                                    setShowPartnerForm(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Partner
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setReportsPartner(partner);
                                    setShowReportsManager(true);
                                  }}
                                >
                                  <BarChart3 className="h-4 w-4 mr-2" />
                                  Manage Reports
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    const partnerData = [
                                      ['Field', 'Value'],
                                      ['Company Name', partner.company_name],
                                      ['Company Code', partner.company_code],
                                      ['Industry', partner.industry],
                                      ['Employees', partner.employee_count],
                                      ['Contact Person', partner.contact_person],
                                      ['Contact Email', partner.contact_email],
                                      ['Contact Phone', partner.contact_phone || ''],
                                      ['Status', partner.is_active ? 'Active' : 'Inactive']
                                    ].map(row => row.join(',')).join('\n');

                                    const blob = new Blob([partnerData], { type: 'text/csv' });
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${partner.company_name.replace(/[^a-zA-Z0-9]/g, '_')}-details.csv`;
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                  }}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Export Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      `${partner.company_name} (${partner.company_code})\n` +
                                      `Contact: ${partner.contact_person} - ${partner.contact_email}\n` +
                                      `Industry: ${partner.industry} | Employees: ${partner.employee_count}`
                                    );
                                    toast({
                                      title: "Copied to Clipboard",
                                      description: "Partner details copied successfully",
                                    });
                                  }}
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="reports">
          <ReportManagementDashboard />
        </TabsContent>

        <TabsContent value="analytics">
          <CorporateAnalyticsDashboard />
        </TabsContent>
      </Tabs>

      {/* Corporate Partner Form Modal */}
      <CorporatePartnerForm
        isOpen={showPartnerForm}
        onClose={() => {
          setShowPartnerForm(false);
          setEditingPartner(null);
        }}
        partner={editingPartner}
        onSuccess={() => {
          loadPartners();
          loadAnalytics();
        }}
      />

      {/* Automated Reports Manager Modal */}
      {reportsPartner && (
        <Dialog open={showReportsManager} onOpenChange={setShowReportsManager}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Automated Reports - {reportsPartner.company_name}
              </DialogTitle>
              <DialogDescription>
                Configure and manage automated reports for {reportsPartner.company_name}
              </DialogDescription>
            </DialogHeader>

            <AutomatedReportsManager
              corporatePartner={reportsPartner}
              onPartnerUpdate={(updatedPartner) => {
                setReportsPartner(updatedPartner);
                loadPartners(); // Refresh the main list
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Corporate Partner Details Modal */}
      <CorporatePartnerDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setDetailsPartner(null);
        }}
        partner={detailsPartner}
        onEdit={(partner) => {
          setEditingPartner(partner);
          setShowPartnerForm(true);
          setShowDetailsModal(false);
        }}
        onToggleStatus={(partnerId, isActive) => {
          handleToggleStatus(partnerId, isActive);
          setShowDetailsModal(false);
        }}
      />
    </StaffPageContainer>
  );
};

export default CorporateManagement;

