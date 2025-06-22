// 💳 BILLING MANAGEMENT - Comprehensive billing and payment system
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  TrendingUp,
  Download,
  Search,
  Filter,
  Plus,
  Eye,
  RefreshCw,
  Calendar,
  Users,
  Receipt
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const BillingPage = () => {
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [transactions, setTransactions] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock billing data
  const billingStats = {
    monthlyRevenue: 45750,
    pendingAmount: 3240,
    overdueAmount: 1580,
    successfulPayments: 234,
    failedPayments: 12,
    averagePayment: 195.50,
    revenueGrowth: 12.5,
    collectionRate: 94.2
  };

  const mockTransactions = [
    {
      id: 'TXN-001',
      memberName: 'John Smith',
      memberId: 'M-12345',
      amount: 89.99,
      type: 'Monthly Membership',
      status: 'completed',
      date: '2024-01-15',
      paymentMethod: 'Credit Card',
      lastFour: '4242'
    },
    {
      id: 'TXN-002',
      memberName: 'Sarah Johnson',
      memberId: 'M-12346',
      amount: 129.99,
      type: 'Premium Membership',
      status: 'completed',
      date: '2024-01-15',
      paymentMethod: 'Bank Transfer',
      lastFour: '8765'
    },
    {
      id: 'TXN-003',
      memberName: 'Mike Wilson',
      memberId: 'M-12347',
      amount: 59.99,
      type: 'Basic Membership',
      status: 'failed',
      date: '2024-01-14',
      paymentMethod: 'Credit Card',
      lastFour: '1234'
    },
    {
      id: 'TXN-004',
      memberName: 'Emily Davis',
      memberId: 'M-12348',
      amount: 199.99,
      type: 'Annual Membership',
      status: 'pending',
      date: '2024-01-14',
      paymentMethod: 'Credit Card',
      lastFour: '5678'
    }
  ];

  const mockPendingPayments = [
    {
      id: 'PP-001',
      memberName: 'Robert Brown',
      memberId: 'M-12349',
      amount: 89.99,
      dueDate: '2024-01-20',
      daysOverdue: 0,
      type: 'Monthly Membership',
      attempts: 1
    },
    {
      id: 'PP-002',
      memberName: 'Lisa Garcia',
      memberId: 'M-12350',
      amount: 129.99,
      dueDate: '2024-01-18',
      daysOverdue: 2,
      type: 'Premium Membership',
      attempts: 2
    }
  ];

  useEffect(() => {
    setTransactions(mockTransactions);
    setPendingPayments(mockPendingPayments);
  }, []);

  const handleRetryPayment = useCallback(async (paymentId) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Payment Retry Initiated",
        description: "Payment retry has been scheduled. Member will be notified.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to retry payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
      overdue: 'destructive'
    };
    
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      overdue: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Revenue Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${billingStats.monthlyRevenue.toLocaleString()}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+{billingStats.revenueGrowth}%</span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${billingStats.pendingAmount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">{pendingPayments.length} payments</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${billingStats.overdueAmount.toLocaleString()}
                </p>
                <p className="text-sm text-red-600">Requires attention</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {billingStats.collectionRate}%
                </p>
                <p className="text-sm text-green-600">Above target</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.slice(0, 5).map(transaction => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{transaction.memberName}</p>
                    <p className="text-sm text-gray-600">{transaction.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">${transaction.amount}</p>
                  {getStatusBadge(transaction.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const TransactionsTab = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">All Transactions</h3>
        <div className="flex space-x-2">
          <Input 
            placeholder="Search transactions..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64" 
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map(transaction => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{transaction.id}</p>
                        <p className="text-sm text-gray-500">{transaction.type}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{transaction.memberName}</p>
                        <p className="text-sm text-gray-500">{transaction.memberId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${transaction.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(transaction.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-3 h-3" />
                        </Button>
                        {transaction.status === 'failed' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleRetryPayment(transaction.id)}
                            disabled={isLoading}
                          >
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const PendingTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Pending & Overdue Payments</h3>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Manual Payment
        </Button>
      </div>

      <div className="space-y-4">
        {pendingPayments.map(payment => (
          <Card key={payment.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium">{payment.memberName}</h4>
                    {payment.daysOverdue > 0 && (
                      <Badge className="bg-red-100 text-red-800">
                        {payment.daysOverdue} days overdue
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Member ID: {payment.memberId}</p>
                  <p className="text-sm text-gray-600 mb-1">Type: {payment.type}</p>
                  <p className="text-sm text-gray-600">Due: {payment.dueDate}</p>
                </div>
                
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900 mb-2">${payment.amount}</p>
                  <p className="text-sm text-gray-500 mb-3">Attempts: {payment.attempts}</p>
                  <div className="space-x-2">
                    <Button size="sm" variant="outline">
                      <Users className="w-3 h-3 mr-1" />
                      Contact
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleRetryPayment(payment.id)}
                      disabled={isLoading}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto py-8 px-4 md:px-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing Management</h1>
          <p className="text-gray-600 mt-1">
            Manage payments, transactions, and billing operations
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Payment Gateway Active
          </Badge>
          <Button>
            <Receipt className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <OverviewTab />
        </TabsContent>
        
        <TabsContent value="transactions" className="mt-6">
          <TransactionsTab />
        </TabsContent>
        
        <TabsContent value="pending" className="mt-6">
          <PendingTab />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default BillingPage;

