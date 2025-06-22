/**
 * Corporate Analytics Dashboard Component
 * Provides comprehensive reporting and analytics for corporate partnerships
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Building, 
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import CorporatePartnersService from '@/services/corporatePartnersService';
import CorporateDiscountCalculator from '@/utils/corporateDiscountCalculator';
import AutomatedReportingSummary from './AutomatedReportingSummary';

const CorporateAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [partners, setPartners] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedPartner, setSelectedPartner] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod, selectedPartner]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Load corporate partners
      const { data: partnersData, error: partnersError } = await CorporatePartnersService.getCorporatePartners({
        isActive: true
      });

      if (partnersError) {
        throw partnersError;
      }

      setPartners(partnersData || []);

      // Load analytics data
      const partnerId = selectedPartner === 'all' ? null : selectedPartner;
      const { data: analyticsData, error: analyticsError } = await CorporatePartnersService.getPartnershipAnalytics(partnerId);

      if (analyticsError) {
        throw analyticsError;
      }

      setAnalytics(analyticsData);
    } catch (error) {
      
      toast({
        title: "Error",
        description: "Failed to load corporate analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
    
    toast({
      title: "Success",
      description: "Analytics data refreshed",
    });
  };

  const exportData = () => {
    // This would implement CSV/Excel export functionality
    toast({
      title: "Export Started",
      description: "Your analytics report is being prepared for download",
    });
  };

  const calculateTotalSavings = () => {
    if (!analytics?.partnerMetrics) return 0;
    
    return Object.values(analytics.partnerMetrics).reduce(
      (total, partner) => total + (partner.totalDiscountApplied || 0), 
      0
    );
  };

  const getTopPerformingPartners = () => {
    if (!analytics?.partnerMetrics) return [];
    
    return Object.entries(analytics.partnerMetrics)
      .map(([name, metrics]) => ({ name, ...metrics }))
      .sort((a, b) => b.approvedMembers - a.approvedMembers)
      .slice(0, 5);
  };

  const getConversionRate = () => {
    if (!analytics || analytics.totalMembers === 0) return 0;
    return ((analytics.approvedMembers / analytics.totalMembers) * 100).toFixed(1);
  };

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
          <h2 className="text-2xl font-bold text-gray-900">Corporate Partnership Analytics</h2>
          <p className="text-gray-600 mt-1">
            Track performance, member engagement, and revenue impact
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Time Period
              </label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 3 months</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Corporate Partner
              </label>
              <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                <SelectTrigger>
                  <SelectValue />
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Corporate Members</p>
                <p className="text-2xl font-bold">{analytics?.approvedMembers || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                {getConversionRate()}% approval rate
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Partnerships</p>
                <p className="text-2xl font-bold">{partners.filter(p => p.is_active).length}</p>
              </div>
              <Building className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                {partners.length} total partners
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Savings Provided</p>
                <p className="text-2xl font-bold">${calculateTotalSavings().toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                Member discounts
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Verifications</p>
                <p className="text-2xl font-bold">{analytics?.pendingMembers || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                Awaiting approval
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Partners */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Performing Partners
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Total Savings</TableHead>
                <TableHead>Avg. Savings</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getTopPerformingPartners().map((partner, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{partner.name}</TableCell>
                  <TableCell>{partner.approvedMembers}</TableCell>
                  <TableCell>${(partner.totalDiscountApplied || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    ${partner.approvedMembers > 0 
                      ? ((partner.totalDiscountApplied || 0) / partner.approvedMembers).toFixed(2)
                      : '0.00'
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" className="bg-green-100 text-green-700">
                      Active
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {getTopPerformingPartners().length === 0 && (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-500">
                Corporate partnership data will appear here once members start joining.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Verification Queue */}
      {analytics?.pendingMembers > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Pending Verifications ({analytics.pendingMembers})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="font-medium text-yellow-800">Action Required</h4>
                  <p className="text-yellow-700 mt-1">
                    {analytics.pendingMembers} corporate member{analytics.pendingMembers !== 1 ? 's' : ''} 
                    {' '}waiting for employment verification. Review and approve to activate their discounts.
                  </p>
                  <Button variant="outline" size="sm" className="mt-3">
                    Review Pending Members
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Automated Reporting Summary */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Automated Reporting Status</h3>
        <AutomatedReportingSummary />
      </div>
    </div>
  );
};

export default CorporateAnalyticsDashboard;

