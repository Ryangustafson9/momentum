import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Clock,
  Play,
  Pause,
  Settings,
  Calendar,
  Database,
  Mail,
  DollarSign,
  Users,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  FileText,
  Plus
} from 'lucide-react';

const ScriptsAndCronManager = () => {
  const [activeJobs, setActiveJobs] = useState([
    {
      id: 1,
      name: 'Daily Billing Process',
      description: 'Process recurring membership billing',
      schedule: '0 2 * * *', // Daily at 2 AM
      status: 'active',
      lastRun: '2025-06-30 02:00:00',
      nextRun: '2025-07-01 02:00:00',
      category: 'billing'
    },
    {
      id: 2,
      name: 'House Charge Processing',
      description: 'Process daily house charges (day passes, guest fees, etc.)',
      schedule: '0 18 * * *', // Daily at 6 PM
      status: 'active',
      lastRun: '2025-06-30 18:00:00',
      nextRun: '2025-06-30 18:00:00',
      category: 'billing'
    },
    {
      id: 3,
      name: 'Member Data Cleanup',
      description: 'Clean up expired sessions and temporary data',
      schedule: '0 1 * * 0', // Weekly on Sunday at 1 AM
      status: 'active',
      lastRun: '2025-06-29 01:00:00',
      nextRun: '2025-07-06 01:00:00',
      category: 'maintenance'
    },
    {
      id: 4,
      name: 'Payment Retry Process',
      description: 'Retry failed payment attempts',
      schedule: '0 */6 * * *', // Every 6 hours
      status: 'active',
      lastRun: '2025-06-30 12:00:00',
      nextRun: '2025-06-30 18:00:00',
      category: 'billing'
    },
    {
      id: 5,
      name: 'Membership Expiration Alerts',
      description: 'Send alerts for expiring memberships',
      schedule: '0 9 * * *', // Daily at 9 AM
      status: 'paused',
      lastRun: '2025-06-29 09:00:00',
      nextRun: 'Paused',
      category: 'notifications'
    },
    {
      id: 6,
      name: 'Database Backup',
      description: 'Create automated database backups',
      schedule: '0 3 * * *', // Daily at 3 AM
      status: 'active',
      lastRun: '2025-06-30 03:00:00',
      nextRun: '2025-07-01 03:00:00',
      category: 'maintenance'
    },
    {
      id: 7,
      name: 'Analytics Report Generation',
      description: 'Generate daily analytics and KPI reports',
      schedule: '0 7 * * *', // Daily at 7 AM
      status: 'active',
      lastRun: '2025-06-30 07:00:00',
      nextRun: '2025-07-01 07:00:00',
      category: 'analytics'
    },
    {
      id: 8,
      name: 'Member Check-in Data Sync',
      description: 'Sync check-in data and update member activity',
      schedule: '*/15 * * * *', // Every 15 minutes
      status: 'active',
      lastRun: '2025-06-30 14:45:00',
      nextRun: '2025-06-30 15:00:00',
      category: 'maintenance'
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'billing': return <DollarSign className="h-4 w-4" />;
      case 'maintenance': return <Database className="h-4 w-4" />;
      case 'notifications': return <Mail className="h-4 w-4" />;
      case 'analytics': return <BarChart3 className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const ScriptCard = ({ name, description, lastRun, status }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="h-4 w-4 text-blue-600" />
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <Badge className="bg-green-100 text-green-800">
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-700">Last Execution</p>
            <p className="text-gray-600">{lastRun}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Status</p>
            <p className="text-gray-600">Ready to execute</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-4">
          <Button size="sm" variant="outline">
            <Settings className="h-3 w-3 mr-1" />
            Configure
          </Button>
          <Button size="sm" variant="outline">
            <Play className="h-3 w-3 mr-1" />
            Run Now
          </Button>
          <Button size="sm" variant="outline">
            <Calendar className="h-3 w-3 mr-1" />
            View History
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const CronJobCard = ({ job }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getCategoryIcon(job.category)}
            <div>
              <CardTitle className="text-lg">{job.name}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{job.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(job.status)}
            <Badge className={getStatusColor(job.status)}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-700">Schedule</p>
            <p className="text-gray-600 font-mono">{job.schedule}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Last Run</p>
            <p className="text-gray-600">{job.lastRun}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Next Run</p>
            <p className="text-gray-600">{job.nextRun}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-4">
          <Button size="sm" variant="outline">
            <Settings className="h-3 w-3 mr-1" />
            Configure
          </Button>
          <Button size="sm" variant="outline">
            <Play className="h-3 w-3 mr-1" />
            Run Now
          </Button>
          <Button size="sm" variant="outline">
            <Calendar className="h-3 w-3 mr-1" />
            View Logs
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scripts & Cron Jobs</h2>
          <p className="text-gray-600 mt-1">
            Manage custom scripts and automated scheduled processes
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className="bg-blue-100 text-blue-800">
            <Settings className="w-4 h-4 mr-1" />
            3 Scripts
          </Badge>
          <Badge className="bg-green-100 text-green-800">
            <Clock className="w-4 h-4 mr-1" />
            {activeJobs.filter(job => job.status === 'active').length} Active Crons
          </Badge>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This is a placeholder interface for managing automated scripts and cron jobs. 
          Future implementation will include job creation, scheduling, monitoring, and log management.
        </AlertDescription>
      </Alert>

      {/* Main Tabs for Scripts vs Cron Jobs */}
      <Tabs defaultValue="scripts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scripts" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Scripts
          </TabsTrigger>
          <TabsTrigger value="cron" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Cron Jobs
          </TabsTrigger>
        </TabsList>

        {/* Scripts Tab Content */}
        <TabsContent value="scripts" className="mt-6">
          <div className="space-y-6">
            {/* Scripts Sub-Header */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Settings className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Custom Scripts</h3>
                  <p className="text-sm text-blue-700">One-time execution scripts and utilities</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-blue-100 text-blue-800">
                  3 Available Scripts
                </Badge>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-1" />
                  New Script
                </Button>
              </div>
            </div>

            {/* Scripts Content */}
            <Tabs defaultValue="available" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="available">Available Scripts</TabsTrigger>
                <TabsTrigger value="history">Execution History</TabsTrigger>
                <TabsTrigger value="templates">Script Templates</TabsTrigger>
              </TabsList>

              <TabsContent value="available" className="mt-4">
                <div className="grid gap-4">
                  <ScriptCard
                    name="Database Cleanup"
                    description="Remove old session data and temporary files"
                    lastRun="2025-06-29 02:00:00"
                    status="ready"
                  />
                  <ScriptCard
                    name="Member Data Export"
                    description="Export member data for reporting and analysis"
                    lastRun="2025-06-25 14:30:00"
                    status="ready"
                  />
                  <ScriptCard
                    name="Payment Reconciliation"
                    description="Reconcile payment records with external processors"
                    lastRun="Never"
                    status="ready"
                  />
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Script Execution History</h3>
                      <p className="text-gray-600">View logs and results from script executions</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="templates" className="mt-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Script Templates</h3>
                      <p className="text-gray-600">Pre-built script templates for common tasks</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

        {/* Cron Jobs Tab Content */}
        <TabsContent value="cron" className="mt-6">
          <div className="space-y-6">
            {/* Cron Jobs Sub-Header */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Scheduled Cron Jobs</h3>
                  <p className="text-sm text-green-700">Automated recurring tasks and processes</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800">
                  {activeJobs.filter(job => job.status === 'active').length} Active Jobs
                </Badge>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-1" />
                  New Cron Job
                </Button>
              </div>
            </div>

            {/* Cron Jobs Content */}
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="active">Active Jobs</TabsTrigger>
                <TabsTrigger value="scheduled">Schedule View</TabsTrigger>
                <TabsTrigger value="logs">Execution Logs</TabsTrigger>
                <TabsTrigger value="templates">Job Templates</TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="mt-4">
                <div className="space-y-4">
                  {activeJobs.map(job => (
                    <CronJobCard key={job.id} job={job} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="scheduled" className="mt-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Schedule Calendar</h3>
                      <p className="text-gray-600">View upcoming scheduled executions</p>
                      <Button className="mt-4" variant="outline">
                        View Calendar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="logs" className="mt-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Execution Logs</h3>
                      <p className="text-gray-600">Monitor cron job execution history and performance</p>
                      <Button className="mt-4" variant="outline">
                        View Detailed Logs
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="templates" className="mt-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Cron Job Templates</h3>
                      <p className="text-gray-600">Pre-configured templates for common scheduled tasks</p>
                      <Button className="mt-4" variant="outline">
                        Browse Templates
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScriptsAndCronManager;
