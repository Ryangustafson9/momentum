import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Download,
  Mail,
  Plus,
  Edit3,
  MoreVertical
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAllMembersBilling, useRetryFailedPayment } from '@/hooks/useBilling';
import { useToast } from '@/hooks/use-toast';

const BillingManagement = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // React Query hooks for billing data
  const { data: members = [], isLoading: loading, error } = useAllMembersBilling();
  const retryPaymentMutation = useRetryFailedPayment();

  // Calculate billing stats from members data
  const billingStats = useMemo(() => {
    let totalRevenue = 0;
    let pendingPayments = 0;
    let overduePayments = 0;
    let successfulPayments = 0;

    members.forEach(member => {
      if (member.status === 'Active') {
        totalRevenue += member.totalMonthlyCost || 0;

        if (member.paymentStatus === 'overdue') {
          overduePayments++;
        } else if (member.paymentStatus === 'pending') {
          pendingPayments++;
        } else {
          successfulPayments++;
        }
      }
    });

    return {
      totalRevenue,
      pendingPayments,
      overduePayments,
      successfulPayments
    };
  }, [members]);



  // Filter members based on search and status
  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'overdue' && member.paymentStatus === 'overdue') ||
      (statusFilter === 'pending' && member.paymentStatus === 'pending') ||
      (statusFilter === 'current' && member.paymentStatus === 'current');

    return matchesSearch && matchesStatus;
  });

  const handleSendInvoice = async (memberName) => {
    try {
      // In a real implementation, this would trigger email sending
      toast({
        title: "Invoice Sent",
        description: `Invoice sent to ${memberName}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invoice",
        variant: "destructive",
      });
    }
  };

  const handleRetryPayment = async (memberId, memberName) => {
    try {
      retryPaymentMutation.mutate(memberId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to retry payment",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'current':
        return <Badge className="bg-green-100 text-green-800">Current</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Due Soon</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading billing data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Error loading billing data: {error.message}</p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="mt-2"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Billing Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-green-600">${billingStats.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-yellow-600">{billingStats.pendingPayments}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{billingStats.overduePayments}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current</p>
                <p className="text-2xl font-bold text-green-600">{billingStats.successfulPayments}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billing Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Billing Management
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Manual Payment
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="current">Current</SelectItem>
                <SelectItem value="pending">Due Soon</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Members Billing List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {filteredMembers.map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {member.first_name?.charAt(0)}{member.last_name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.first_name} {member.last_name}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>${member.totalMonthlyCost.toFixed(2)}/month</span>
                        <span>Next: {member.nextPaymentDate.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {getStatusBadge(member.paymentStatus)}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleSendInvoice(member.id, `${member.first_name} ${member.last_name}`)}>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRetryPayment(member.id, `${member.first_name} ${member.last_name}`)}>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Retry Payment
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit Billing
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredMembers.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No billing records found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingManagement;
