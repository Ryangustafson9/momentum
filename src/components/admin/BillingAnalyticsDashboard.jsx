// 🚀 BILLING ANALYTICS DASHBOARD - Advanced billing insights and reporting
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Download,
  Filter,
  RefreshCw,
  Calculator
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

// Mock data for analytics - in production this would come from React Query hooks
const mockAnalytics = {
  overview: {
    totalRevenue: 45750.00,
    membershipRevenue: 38200.00,
    houseChargesRevenue: 7550.00,
    revenueGrowth: 12.5,
    activeMembers: 156,
    memberGrowth: 8.2,
    averageRevenuePerMember: 293.27,
    churnRate: 2.1
  },
  billing: {
    successfulBillings: 148,
    failedBillings: 8,
    retrySuccessRate: 75.0,
    overdueInvoices: 12,
    totalInvoices: 156,
    averageInvoiceAmount: 293.27
  },
  proration: {
    proratedMembers: 23,
    totalProrationAmount: 1250.75,
    averageProrationAmount: 54.38,
    prorationImpact: 2.7
  },
  trends: {
    monthlyRevenue: [
      { month: 'Jan', membership: 35000, houseCharges: 6500, total: 41500 },
      { month: 'Feb', membership: 36200, houseCharges: 6800, total: 43000 },
      { month: 'Mar', membership: 37500, houseCharges: 7200, total: 44700 },
      { month: 'Apr', membership: 38200, houseCharges: 7550, total: 45750 }
    ]
  }
};

const MetricCard = ({ title, value, change, icon: Icon, color = "blue", format = "currency" }) => {
  const formatValue = (val) => {
    if (format === "currency") return `$${val.toLocaleString()}`;
    if (format === "percentage") return `${val}%`;
    if (format === "number") return val.toLocaleString();
    return val;
  };

  const isPositive = change > 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
            {change !== undefined && (
              <div className={`flex items-center mt-1 text-sm ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                {Math.abs(change)}% vs last month
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full bg-${color}-100`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const RevenueChart = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.total));

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={item.month} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{item.month}</span>
            <span className="text-gray-600">${item.total.toLocaleString()}</span>
          </div>
          <div className="relative">
            <div className="flex h-6 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 transition-all duration-500"
                style={{ width: `${(item.membership / maxValue) * 100}%` }}
              />
              <div 
                className="bg-green-500 transition-all duration-500"
                style={{ width: `${(item.houseCharges / maxValue) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-center space-x-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2" />
          Membership Revenue
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
          House Charges
        </div>
      </div>
    </div>
  );
};

const BillingStatusChart = ({ successful, failed, total }) => {
  const successRate = (successful / total) * 100;
  const failureRate = (failed / total) * 100;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-600">Successful Billings</span>
          <span className="font-medium">{successful}</span>
        </div>
        <Progress value={successRate} className="h-2" />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-red-600">Failed Billings</span>
          <span className="font-medium">{failed}</span>
        </div>
        <Progress value={failureRate} className="h-2 bg-red-100" />
      </div>
      
      <div className="pt-2 border-t">
        <div className="flex items-center justify-between text-sm font-medium">
          <span>Success Rate</span>
          <span className="text-green-600">{successRate.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

const BillingAnalyticsDashboard = ({ organizationId = 'default-org-id' }) => {
  const [timeRange, setTimeRange] = useState('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleExport = () => {
    // In production, this would generate and download a report
    console.log('Exporting billing analytics...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Billing Analytics</h2>
          <p className="text-gray-600">Comprehensive billing insights and revenue tracking</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={mockAnalytics.overview.totalRevenue}
          change={mockAnalytics.overview.revenueGrowth}
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="Active Members"
          value={mockAnalytics.overview.activeMembers}
          change={mockAnalytics.overview.memberGrowth}
          icon={Users}
          color="blue"
          format="number"
        />
        <MetricCard
          title="Avg Revenue/Member"
          value={mockAnalytics.overview.averageRevenuePerMember}
          change={5.2}
          icon={TrendingUp}
          color="purple"
        />
        <MetricCard
          title="Churn Rate"
          value={mockAnalytics.overview.churnRate}
          change={-0.5}
          icon={AlertTriangle}
          color="red"
          format="percentage"
        />
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="billing">Billing Performance</TabsTrigger>
          <TabsTrigger value="proration">Proration Impact</TabsTrigger>
          <TabsTrigger value="forecasting">Revenue Forecasting</TabsTrigger>
        </TabsList>

        {/* Revenue Analysis Tab */}
        <TabsContent value="revenue">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Monthly Revenue Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueChart data={mockAnalytics.trends.monthlyRevenue} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Revenue Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3" />
                      <span className="text-sm font-medium">Membership Revenue</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        ${mockAnalytics.overview.membershipRevenue.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {((mockAnalytics.overview.membershipRevenue / mockAnalytics.overview.totalRevenue) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3" />
                      <span className="text-sm font-medium">House Charges</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        ${mockAnalytics.overview.houseChargesRevenue.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {((mockAnalytics.overview.houseChargesRevenue / mockAnalytics.overview.totalRevenue) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      ${mockAnalytics.overview.totalRevenue.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Monthly Revenue</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Billing Performance Tab */}
        <TabsContent value="billing">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Billing Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BillingStatusChart
                  successful={mockAnalytics.billing.successfulBillings}
                  failed={mockAnalytics.billing.failedBillings}
                  total={mockAnalytics.billing.totalInvoices}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Payment Recovery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Failed Payments</span>
                    <Badge variant="outline" className="text-red-600">
                      {mockAnalytics.billing.failedBillings}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Retry Success Rate</span>
                    <Badge variant="outline" className="text-green-600">
                      {mockAnalytics.billing.retrySuccessRate}%
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Overdue Invoices</span>
                    <Badge variant="outline" className="text-amber-600">
                      {mockAnalytics.billing.overdueInvoices}
                    </Badge>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      ${mockAnalytics.billing.averageInvoiceAmount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Average Invoice Amount</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Proration Impact Tab */}
        <TabsContent value="proration">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="w-5 h-5 mr-2" />
                  Proration Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {mockAnalytics.proration.proratedMembers}
                    </div>
                    <div className="text-sm text-blue-800">Prorated Members</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ${mockAnalytics.proration.totalProrationAmount.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-800">Total Proration</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Average Proration Amount</span>
                    <span className="font-medium">
                      ${mockAnalytics.proration.averageProrationAmount}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Revenue Impact</span>
                    <span className="font-medium text-amber-600">
                      -{mockAnalytics.proration.prorationImpact}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Proration Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-800">Unified Billing Impact</div>
                  <div className="text-xs text-blue-600 mt-1">
                    Switching to unified billing could reduce proration complexity by 65%
                  </div>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm font-medium text-green-800">Revenue Optimization</div>
                  <div className="text-xs text-green-600 mt-1">
                    Consider mid-month billing cycles to maximize revenue capture
                  </div>
                </div>
                
                <div className="p-3 bg-amber-50 rounded-lg">
                  <div className="text-sm font-medium text-amber-800">Member Experience</div>
                  <div className="text-xs text-amber-600 mt-1">
                    Clear proration communication reduces billing inquiries by 40%
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Forecasting Tab */}
        <TabsContent value="forecasting">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Revenue Forecasting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Revenue Forecasting</h3>
                <p className="text-gray-500 mb-4">
                  Advanced forecasting models based on billing patterns, member growth, and seasonal trends
                </p>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BillingAnalyticsDashboard;
