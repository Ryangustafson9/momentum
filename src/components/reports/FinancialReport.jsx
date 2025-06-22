import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Download, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast.js';
import { supabase } from '@/lib/supabaseClient';
import { LoadingSpinner } from '@/shared/components/LoadingStates';

const StatCard = ({ title, value, change, changeType, icon, color }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {change && (
            <div className={`flex items-center gap-1 mt-1 ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
              {changeType === 'positive' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span className="text-xs">{change}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

const FinancialReport = () => {
  const [financialData, setFinancialData] = useState({
    revenue: [],
    membershipTypes: [],
    summary: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const { toast } = useToast();

  const fetchFinancialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      // Fetch membership revenue data
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('memberships')
        .select(`
          *,
          membership_types(id, name, price, billing_type, category)
        `)
        .gte('join_date', startDate.toISOString().split('T')[0])
        .lte('join_date', endDate.toISOString().split('T')[0])
        .eq('status', 'active');

      if (membershipsError) {
        throw new Error(`Failed to fetch financial data: ${membershipsError.message}`);
      }

      // Calculate revenue by membership type
      const revenueByType = {};
      let totalRevenue = 0;

      (membershipsData || []).forEach(membership => {
        const typeName = membership.membership_types.name;
        const price = membership.membership_types.price || 0;
        
        if (!revenueByType[typeName]) {
          revenueByType[typeName] = {
            name: typeName,
            category: membership.membership_types.category,
            revenue: 0,
            count: 0,
            price: price
          };
        }
        
        revenueByType[typeName].revenue += price;
        revenueByType[typeName].count += 1;
        totalRevenue += price;
      });

      const revenueArray = Object.values(revenueByType);

      setFinancialData({
        revenue: revenueArray,
        membershipTypes: revenueArray,
        summary: {
          totalRevenue,
          totalMembers: membershipsData?.length || 0,
          averageRevenue: totalRevenue / (membershipsData?.length || 1)
        }
      });

    } catch (error) {
      
      toast({
        title: 'Error',
        description: `Failed to fetch financial data: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, toast]);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading financial data..." />;
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
            <DollarSign className="h-6 w-6 text-primary" />
            Financial Report
          </h2>
          <p className="text-muted-foreground">
            Revenue analysis and membership financial performance
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(financialData.summary.totalRevenue)}
          icon={<DollarSign className="h-5 w-5 text-white" />}
          color="bg-green-500"
        />
        <StatCard
          title="Active Members"
          value={financialData.summary.totalMembers}
          icon={<CreditCard className="h-5 w-5 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Average Revenue per Member"
          value={formatCurrency(financialData.summary.averageRevenue)}
          icon={<TrendingUp className="h-5 w-5 text-white" />}
          color="bg-purple-500"
        />
      </div>

      {/* Revenue by Membership Type */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Membership Type</CardTitle>
        </CardHeader>
        <CardContent>
          {financialData.revenue.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No revenue data</h3>
              <p className="text-muted-foreground">
                No financial data available for the selected time period.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membership Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Members</TableHead>
                    <TableHead className="text-right">Price per Member</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialData.revenue
                    .sort((a, b) => b.revenue - a.revenue)
                    .map((item, index) => {
                      const percentage = ((item.revenue / financialData.summary.totalRevenue) * 100).toFixed(1);
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell className="text-right">{item.count}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.revenue)}</TableCell>
                          <TableCell className="text-right">{percentage}%</TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue Breakdown by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['Member Plans', 'Staff Plans', 'Add-ons', 'Guest Plans'].map(category => {
              const categoryRevenue = financialData.revenue
                .filter(item => item.category === category)
                .reduce((sum, item) => sum + item.revenue, 0);
              
              const categoryCount = financialData.revenue
                .filter(item => item.category === category)
                .reduce((sum, item) => sum + item.count, 0);

              return (
                <Card key={category} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-2">{category}</h4>
                    <p className="text-2xl font-bold">{formatCurrency(categoryRevenue)}</p>
                    <p className="text-sm text-muted-foreground">{categoryCount} members</p>
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

export default FinancialReport;

