import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Calendar, 
  DollarSign,
  CreditCard,
  Receipt,
  TrendingUp,
  Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const Statement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [statementData, setStatementData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock statement data
  useEffect(() => {
    const mockData = {
      accountSummary: {
        currentBalance: 0,
        lastPayment: 59.99,
        lastPaymentDate: subMonths(new Date(), 1),
        nextDueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        nextDueAmount: 59.99
      },
      transactions: [
        {
          id: 'txn-001',
          date: new Date(),
          description: 'Monthly Membership Fee - Premium',
          type: 'charge',
          amount: 59.99,
          status: 'paid'
        },
        {
          id: 'txn-002',
          date: subMonths(new Date(), 1),
          description: 'Payment Received - Thank You',
          type: 'payment',
          amount: -59.99,
          status: 'completed'
        },
        {
          id: 'txn-003',
          date: subMonths(new Date(), 1),
          description: 'Monthly Membership Fee - Premium',
          type: 'charge',
          amount: 59.99,
          status: 'paid'
        },
        {
          id: 'txn-004',
          date: subMonths(new Date(), 1),
          description: 'Personal Training Session',
          type: 'charge',
          amount: 75.00,
          status: 'paid'
        },
        {
          id: 'txn-005',
          date: subMonths(new Date(), 2),
          description: 'Payment Received - Thank You',
          type: 'payment',
          amount: -134.99,
          status: 'completed'
        },
        {
          id: 'txn-006',
          date: subMonths(new Date(), 2),
          description: 'Monthly Membership Fee - Premium',
          type: 'charge',
          amount: 59.99,
          status: 'paid'
        },
        {
          id: 'txn-007',
          date: subMonths(new Date(), 2),
          description: 'Swim Lessons Registration',
          type: 'charge',
          amount: 120.00,
          status: 'paid'
        }
      ]
    };

    setStatementData(mockData);
    setLoading(false);
  }, []);

  const handleDownloadStatement = () => {
    toast({
      title: "Statement Downloaded",
      description: "Your statement has been downloaded successfully.",
      variant: "default"
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'payment':
        return <CreditCard className="h-4 w-4 text-green-600" />;
      case 'charge':
        return <Receipt className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'payment':
        return 'text-green-600';
      case 'charge':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Statement</h1>
          <p className="text-muted-foreground">Review your charges, payments, and account activity</p>
        </div>
        <Button onClick={handleDownloadStatement} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download Statement
        </Button>
      </div>

      {/* Account Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Balance</p>
                <p className="text-2xl font-bold text-green-600">
                  ${statementData.accountSummary.currentBalance.toFixed(2)}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Payment</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${statementData.accountSummary.lastPayment.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  {format(statementData.accountSummary.lastPaymentDate, 'MMM d, yyyy')}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Next Due</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${statementData.accountSummary.nextDueAmount.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  {format(statementData.accountSummary.nextDueDate, 'MMM d, yyyy')}
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Account Status</p>
                <p className="text-lg font-bold text-green-600">Active</p>
                <p className="text-xs text-gray-500">In Good Standing</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Transaction History
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="current">Current Month</option>
                <option value="last3">Last 3 Months</option>
                <option value="last6">Last 6 Months</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statementData.transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-gray-500">
                      {format(transaction.date, 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                      {transaction.type === 'payment' ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">{transaction.type}</p>
                  </div>
                  {getStatusBadge(transaction.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-16 flex flex-col gap-2">
              <Download className="h-5 w-5" />
              Download PDF
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-2">
              <CreditCard className="h-5 w-5" />
              Make Payment
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-2">
              <FileText className="h-5 w-5" />
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Statement;
