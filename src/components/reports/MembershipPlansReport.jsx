import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Award, Users, DollarSign, Eye, Download, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast.js';
import { supabase } from '@/lib/supabaseClient';
import * as membershipService from '@/lib/services/membershipTypeService';
import { LoadingSpinner } from '@/shared/components/LoadingStates';

const CategoryBadge = ({ category }) => {
  const getCategoryColor = (category) => {
    switch (category) {
      case 'Membership': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Staff': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'Add-On': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Guest': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <Badge className={`${getCategoryColor(category)} border-0`}>
      {category}
    </Badge>
  );
};

const AvailabilityBadge = ({ available, type }) => {
  const color = available 
    ? (type === 'sale' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800')
    : 'bg-gray-100 text-gray-800';
  
  return (
    <Badge className={`${color} border-0 text-xs`}>
      {available ? '✓' : '✗'}
    </Badge>
  );
};

const StatCard = ({ title, value, subtitle, icon, color }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

const MembershipPlansReport = () => {
  const [plansData, setPlansData] = useState({
    plans: [],
    usage: [],
    summary: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPlansData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all membership types
      const membershipTypes = await membershipService.getMembershipTypes(
        supabase,
        () => false,
        () => {},
        () => null
      );

      // Fetch usage data (how many members have each plan)
      const { data: usageData, error: usageError } = await supabase
        .from('memberships')
        .select(`
          current_membership_type_id,
          status,
          membership_types!inner(id, name, category)
        `);

      if (usageError) {
        
      }

      // Process usage statistics
      const usageStats = {};
      (usageData || []).forEach(membership => {
        const typeId = membership.current_membership_type_id;
        if (!usageStats[typeId]) {
          usageStats[typeId] = {
            total: 0,
            active: 0,
            inactive: 0
          };
        }
        usageStats[typeId].total += 1;
        if (membership.status === 'active') {
          usageStats[typeId].active += 1;
        } else {
          usageStats[typeId].inactive += 1;
        }
      });

      // Combine plans with usage data
      const plansWithUsage = (membershipTypes || []).map(plan => ({
        ...plan,
        usage: usageStats[plan.id] || { total: 0, active: 0, inactive: 0 }
      }));

      // Calculate summary statistics
      const totalPlans = plansWithUsage.length;
      const availableForSale = plansWithUsage.filter(p => p.available_for_sale !== false).length;
      const availableOnline = plansWithUsage.filter(p => p.available_online === true).length;
      const totalActiveMembers = Object.values(usageStats).reduce((sum, stat) => sum + stat.active, 0);

      setPlansData({
        plans: plansWithUsage,
        usage: Object.values(usageStats),
        summary: {
          totalPlans,
          availableForSale,
          availableOnline,
          totalActiveMembers
        }
      });

    } catch (error) {
      
      toast({
        title: 'Error',
        description: `Failed to fetch membership plans data: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPlansData();
  }, [fetchPlansData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading membership plans data..." />;
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
            <Award className="h-6 w-6 text-primary" />
            Membership Plans Overview
          </h2>
          <p className="text-muted-foreground">
            Comprehensive overview of all membership plans and their usage
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Plans"
          value={plansData.summary.totalPlans}
          subtitle="All membership types"
          icon={<Package className="h-5 w-5 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Available for Sale"
          value={plansData.summary.availableForSale}
          subtitle="Staff can sell these"
          icon={<DollarSign className="h-5 w-5 text-white" />}
          color="bg-green-500"
        />
        <StatCard
          title="Available Online"
          value={plansData.summary.availableOnline}
          subtitle="Members can purchase online"
          icon={<Eye className="h-5 w-5 text-white" />}
          color="bg-purple-500"
        />
        <StatCard
          title="Active Members"
          value={plansData.summary.totalActiveMembers}
          subtitle="Currently subscribed"
          icon={<Users className="h-5 w-5 text-white" />}
          color="bg-orange-500"
        />
      </div>

      {/* Plans Overview Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Membership Plans</CardTitle>
        </CardHeader>
        <CardContent>
          {plansData.plans.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No membership plans</h3>
              <p className="text-muted-foreground">
                No membership plans have been created yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>Billing Type</TableHead>
                    <TableHead className="text-center">For Sale</TableHead>
                    <TableHead className="text-center">Online</TableHead>
                    <TableHead className="text-right">Active Members</TableHead>
                    <TableHead className="text-right">Total Members</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plansData.plans
                    .sort((a, b) => b.usage.total - a.usage.total)
                    .map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{plan.name}</div>
                            {plan.features && plan.features.length > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {Array.isArray(plan.features) 
                                  ? plan.features.slice(0, 2).join(', ')
                                  : plan.features.split(',').slice(0, 2).join(', ')
                                }
                                {(Array.isArray(plan.features) ? plan.features.length : plan.features.split(',').length) > 2 && '...'}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <CategoryBadge category={plan.category} />
                        </TableCell>
                        <TableCell className="text-right">
                          {plan.billing_type === 'N/A' ? 'N/A' : formatCurrency(plan.price)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {plan.billing_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <AvailabilityBadge available={plan.available_for_sale !== false} type="sale" />
                        </TableCell>
                        <TableCell className="text-center">
                          <AvailabilityBadge available={plan.available_online === true} type="online" />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {plan.usage.active}
                        </TableCell>
                        <TableCell className="text-right">
                          {plan.usage.total}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(plan.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Plans by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['Membership', 'Staff', 'Add-On', 'Guest'].map(category => {
              const categoryPlans = plansData.plans.filter(plan => plan.category === category);
              const totalMembers = categoryPlans.reduce((sum, plan) => sum + plan.usage.total, 0);
              const activeMembers = categoryPlans.reduce((sum, plan) => sum + plan.usage.active, 0);
              
              return (
                <Card key={category} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-2">{category}</h4>
                    <p className="text-2xl font-bold">{categoryPlans.length}</p>
                    <p className="text-sm text-muted-foreground">
                      {activeMembers} active / {totalMembers} total members
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MembershipPlansReport;

