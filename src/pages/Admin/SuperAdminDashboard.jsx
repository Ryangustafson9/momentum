// 🚀 SUPER ADMIN DASHBOARD - Advanced billing configuration and analytics
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  BarChart3, 
  Users,
  CreditCard,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Database,
  Shield,
  Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthQuery as useAuth } from '@/hooks/useAuthQuery';
import BillingConfigurationPanel from '@/components/admin/BillingConfigurationPanel.jsx';
import BillingAnalyticsDashboard from '@/components/admin/BillingAnalyticsDashboard.jsx';

// Mock data for super admin overview
const mockSuperAdminData = {
  systemHealth: {
    billingJobsRunning: 2,
    failedJobs: 0,
    systemUptime: 99.9,
    lastBillingRun: '2024-01-15T06:00:00Z'
  },
  organizations: [
    {
      id: 'org-1',
      name: 'Momentum Fitness Center',
      members: 156,
      monthlyRevenue: 45750,
      billingType: 'unified',
      status: 'active'
    },
    {
      id: 'org-2', 
      name: 'Elite Gym Downtown',
      members: 89,
      monthlyRevenue: 28900,
      billingType: 'anniversary',
      status: 'active'
    }
  ],
  recentActivity: [
    {
      id: 1,
      type: 'billing_cycle',
      organization: 'Momentum Fitness Center',
      description: 'Monthly billing cycle completed',
      timestamp: '2024-01-15T06:00:00Z',
      status: 'success'
    },
    {
      id: 2,
      type: 'config_change',
      organization: 'Elite Gym Downtown',
      description: 'Billing configuration updated',
      timestamp: '2024-01-14T14:30:00Z',
      status: 'info'
    },
    {
      id: 3,
      type: 'payment_failure',
      organization: 'Momentum Fitness Center',
      description: '3 payment failures detected',
      timestamp: '2024-01-14T09:15:00Z',
      status: 'warning'
    }
  ]
};

const SystemHealthCard = ({ title, value, status, icon: Icon }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-xl font-semibold text-gray-900">{value}</p>
          </div>
          <div className={`p-2 rounded-full ${getStatusColor(status)}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const OrganizationCard = ({ org, onSelect }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="cursor-pointer"
      onClick={() => onSelect(org)}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-medium text-gray-900">{org.name}</h3>
              <p className="text-sm text-gray-600">{org.members} members</p>
            </div>
            <Badge className={org.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
              {org.status}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Monthly Revenue</span>
              <span className="font-medium">${org.monthlyRevenue.toLocaleString()}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Billing Type</span>
              <Badge variant="outline">
                {org.billingType === 'unified' ? 'Unified' : 'Anniversary'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ActivityFeed = ({ activities }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'billing_cycle': return <Calendar className="w-4 h-4" />;
      case 'config_change': return <Settings className="w-4 h-4" />;
      case 'payment_failure': return <AlertTriangle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getActivityColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
          <div className={`p-1 rounded-full ${getActivityColor(activity.status)}`}>
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{activity.description}</p>
            <p className="text-xs text-gray-600">{activity.organization}</p>
            <p className="text-xs text-gray-500">{formatTime(activity.timestamp)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Check if user has super admin access
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access the Super Admin Dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
              <p className="text-gray-600">Multi-tenant billing configuration and analytics</p>
            </div>
            <Badge className="bg-purple-100 text-purple-800">
              Super Admin
            </Badge>
          </div>
        </div>

        {/* System Health Alert */}
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            All billing systems are operational. Last billing cycle completed successfully at{' '}
            {new Date(mockSuperAdminData.systemHealth.lastBillingRun).toLocaleString()}.
          </AlertDescription>
        </Alert>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">System Overview</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="billing-config">Billing Configuration</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* System Overview Tab */}
          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* System Health */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Database className="w-5 h-5 mr-2" />
                      System Health
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <SystemHealthCard
                        title="Billing Jobs Running"
                        value={mockSuperAdminData.systemHealth.billingJobsRunning}
                        status="healthy"
                        icon={Calendar}
                      />
                      <SystemHealthCard
                        title="Failed Jobs"
                        value={mockSuperAdminData.systemHealth.failedJobs}
                        status="healthy"
                        icon={AlertTriangle}
                      />
                      <SystemHealthCard
                        title="System Uptime"
                        value={`${mockSuperAdminData.systemHealth.systemUptime}%`}
                        status="healthy"
                        icon={TrendingUp}
                      />
                      <SystemHealthCard
                        title="Organizations"
                        value={mockSuperAdminData.organizations.length}
                        status="healthy"
                        icon={Users}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Organizations Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Organizations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {mockSuperAdminData.organizations.map((org) => (
                        <OrganizationCard
                          key={org.id}
                          org={org}
                          onSelect={setSelectedOrganization}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Activity Feed */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Bell className="w-5 h-5 mr-2" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ActivityFeed activities={mockSuperAdminData.recentActivity} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Organizations Tab */}
          <TabsContent value="organizations">
            <Card>
              <CardHeader>
                <CardTitle>Organization Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Organization Management</h3>
                  <p className="text-gray-500 mb-4">
                    Manage multiple gym organizations, their settings, and billing configurations
                  </p>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Configuration Tab */}
          <TabsContent value="billing-config">
            <BillingConfigurationPanel organizationId={selectedOrganization?.id || 'default-org-id'} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <BillingAnalyticsDashboard organizationId={selectedOrganization?.id || 'default-org-id'} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
