import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Filter, Download, Eye, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast.js';
import { supabase } from '@/lib/supabaseClient';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import { useDebounce } from '@/hooks/useDebounce.js';

const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'expired': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <Badge className={`${getStatusColor(status)} border-0`}>
      {status || 'Unknown'}
    </Badge>
  );
};

const MemberSubscriptionsReport = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { toast } = useToast();

  const fetchSubscriptions = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch memberships with profile and membership type data
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('memberships')
        .select(`
          *,
          profiles(id, email, first_name, last_name),
          membership_types(id, name, category, price, billing_type)
        `)
        .order('join_date', { ascending: false });

      if (membershipsError) {
        throw new Error(`Failed to fetch memberships: ${membershipsError.message}`);
      }

      // Fetch membership types for filters
      const { data: typesData, error: typesError } = await supabase
        .from('membership_types')
        .select('id, name, category')
        .order('category', { ascending: true });

      if (typesError) {
        throw new Error(`Failed to fetch membership types: ${typesError.message}`);
      }

      setSubscriptions(membershipsData || []);
      setMembershipTypes(typesData || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch member subscriptions: ${error.message}`,
        variant: 'destructive'
      });
      setSubscriptions([]);
      setMembershipTypes([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const filteredSubscriptions = useMemo(() => {
    let filtered = [...subscriptions];

    // Search filter
    if (debouncedSearchTerm) {
      filtered = filtered.filter(sub => {
        const email = sub.profiles?.email || '';
        const firstName = sub.profiles?.first_name || '';
        const lastName = sub.profiles?.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const membershipType = sub.membership_types?.name || '';

        return email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
               firstName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
               lastName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
               fullName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
               membershipType.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(sub => sub.current_membership_type_id === typeFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      const { key, direction } = sortConfig;
      let aValue = a[key];
      let bValue = b[key];

      // Handle nested properties
      if (key === 'member_name') {
        const aFirstName = a.profiles?.first_name || '';
        const aLastName = a.profiles?.last_name || '';
        aValue = `${aFirstName} ${aLastName}`.trim() || a.profiles?.email || '';

        const bFirstName = b.profiles?.first_name || '';
        const bLastName = b.profiles?.last_name || '';
        bValue = `${bFirstName} ${bLastName}`.trim() || b.profiles?.email || '';
      } else if (key === 'membership_type') {
        aValue = a.membership_types?.name || '';
        bValue = b.membership_types?.name || '';
      }

      // Handle dates
      if (key.includes('date') || key.includes('_at')) {
        aValue = aValue ? new Date(aValue) : new Date(0);
        bValue = bValue ? new Date(bValue) : new Date(0);
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [subscriptions, debouncedSearchTerm, statusFilter, typeFilter, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getUniqueStatuses = () => {
    const statuses = new Set(subscriptions.map(sub => sub.status).filter(Boolean));
    return ['all', ...Array.from(statuses)];
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading member subscriptions..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Member Subscriptions
          </h2>
          <p className="text-muted-foreground">
            View and manage all member subscription details and status
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">
                  {subscriptions.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold">
                  {subscriptions.filter(s => s.status === 'expired').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {subscriptions.filter(s => s.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{subscriptions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by member name, email, or membership type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {getUniqueStatuses().map(status => (
                  <SelectItem key={status} value={status}>
                    {status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {membershipTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Subscription Details ({filteredSubscriptions.length} results)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSubscriptions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No subscriptions found</h3>
              <p className="text-muted-foreground">
                {debouncedSearchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No member subscriptions are available yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('member_name')}
                    >
                      Member Name
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('membership_type')}
                    >
                      Membership Type
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('status')}
                    >
                      Status
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('join_date')}
                    >
                      Join Date
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('next_payment_date')}
                    >
                      Next Payment
                    </TableHead>
                    <TableHead>Monthly Fee</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>
                            {subscription.profiles?.first_name && subscription.profiles?.last_name
                              ? `${subscription.profiles.first_name} ${subscription.profiles.last_name}`
                              : subscription.profiles?.email || 'N/A'
                            }
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {subscription.profiles?.email || `Member ID: ${subscription.user_id?.slice(-8)}`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{subscription.membership_types?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {subscription.membership_types?.category}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={subscription.status} />
                      </TableCell>
                      <TableCell>{formatDate(subscription.join_date)}</TableCell>
                      <TableCell>{formatDate(subscription.next_payment_date)}</TableCell>
                      <TableCell>
                        {formatCurrency(subscription.membership_types?.price)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MemberSubscriptionsReport;
