import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, Plus, Play, Save, Download, Upload, Settings, 
  Mail, MessageSquare, Clock, GitBranch, CheckSquare,
  UserPlus, Calendar, CreditCard, CheckCircle, Search,
  Edit, DollarSign, Users, Bell, FileText, MoreVertical,
  Eye, Copy, Trash2, PlayCircle, PauseCircle, BookOpen,
  X, Move, Link, Unlink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Workflow node types configuration
const nodeTypes = {
  triggers: [
    { id: 'member-joins', label: 'Member Joins', icon: UserPlus, color: 'bg-green-500', description: 'When a new member signs up' },
    { id: 'membership-expires', label: 'Membership Expires', icon: Calendar, color: 'bg-red-500', description: 'When membership is about to expire' },
    { id: 'payment-due', label: 'Payment Due', icon: CreditCard, color: 'bg-yellow-500', description: 'When payment is due' },
    { id: 'class-booked', label: 'Class Booked', icon: Calendar, color: 'bg-blue-500', description: 'When member books a class' },
    { id: 'check-in', label: 'Member Check-in', icon: CheckCircle, color: 'bg-purple-500', description: 'When member checks into gym' }
  ],
  conditions: [
    { id: 'if-then', label: 'If/Then', icon: GitBranch, color: 'bg-orange-500', description: 'Conditional logic' },
    { id: 'wait', label: 'Wait', icon: Clock, color: 'bg-gray-500', description: 'Wait for specified time' },
    { id: 'check-field', label: 'Check Field', icon: Search, color: 'bg-indigo-500', description: 'Check field value' }
  ],
  actions: [
    { id: 'send-email', label: 'Send Email', icon: Mail, color: 'bg-blue-600', description: 'Send automated email' },
    { id: 'send-sms', label: 'Send SMS', icon: MessageSquare, color: 'bg-green-600', description: 'Send text message' },
    { id: 'update-field', label: 'Update Field', icon: Edit, color: 'bg-purple-600', description: 'Update member field' },
    { id: 'create-task', label: 'Create Task', icon: CheckSquare, color: 'bg-red-600', description: 'Create staff task' },
    { id: 'charge-payment', label: 'Charge Payment', icon: DollarSign, color: 'bg-yellow-600', description: 'Process payment' }
  ]
};

// Workflow templates
const workflowTemplates = [
  {
    id: 'welcome-series',
    name: 'New Member Welcome Series',
    description: 'Automatically welcome new members with helpful information',
    category: 'Member Onboarding',
    status: 'template',
    steps: 5,
    icon: UserPlus
  },
  {
    id: 'payment-reminder',
    name: 'Payment Reminder Sequence',
    description: 'Send reminders when payments are due',
    category: 'Billing',
    status: 'template',
    steps: 3,
    icon: CreditCard
  },
  {
    id: 'class-reminder',
    name: 'Class Reminder System',
    description: 'Remind members about upcoming classes',
    category: 'Classes',
    status: 'template',
    steps: 2,
    icon: Calendar
  },
  {
    id: 'retention-campaign',
    name: 'Member Retention Campaign',
    description: 'Re-engage inactive members',
    category: 'Retention',
    status: 'template',
    steps: 4,
    icon: Users
  }
];

// Sample workflows for demonstration
const sampleWorkflows = [
  {
    id: '1',
    name: 'Welcome New Members',
    description: 'Send welcome email series to new members',
    status: 'active',
    lastRun: '2 hours ago',
    totalRuns: 45,
    category: 'Member Onboarding'
  },
  {
    id: '2',
    name: 'Payment Reminders',
    description: 'Remind members about upcoming payments',
    status: 'active',
    lastRun: '1 day ago',
    totalRuns: 12,
    category: 'Billing'
  },
  {
    id: '3',
    name: 'Class Cancellation Alerts',
    description: 'Notify members when classes are cancelled',
    status: 'paused',
    lastRun: '3 days ago',
    totalRuns: 8,
    category: 'Classes'
  }
];

// Main Process Automation Component
const ProcessAutomation = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);

  const handleImportWorkflow = () => {
    alert('Import functionality will allow you to upload workflow files from your computer.');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto space-y-6"
      >        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Zap className="h-8 w-8 text-blue-600" />
              Process Automation
            </h1>
            <p className="text-gray-600 mt-2">
              Automate your gym operations with visual workflows
            </p>
          </div>
          <div className="flex gap-3">            <Button 
              variant="outline" 
              className="flex items-center gap-2 whitespace-nowrap"
              onClick={handleImportWorkflow}
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button 
              onClick={() => setShowBuilder(true)}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Create Workflow
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workflows">My Workflows</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <OverviewSection />
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows" className="space-y-6">
            <WorkflowsList workflows={sampleWorkflows} />
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <TemplatesSection templates={workflowTemplates} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsSection />
          </TabsContent>
        </Tabs>        {/* Workflow Builder Modal */}
        {showBuilder && (
          <WorkflowBuilder 
            isOpen={showBuilder}
            onClose={() => setShowBuilder(false)}
          />
        )}
      </motion.div>
    </div>
  );
};

// Overview Section Component
const OverviewSection = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
          <PlayCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">8</div>
          <p className="text-xs text-muted-foreground">+2 from last month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Automations</CardTitle>
          <Zap className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1,247</div>
          <p className="text-xs text-muted-foreground">This month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
          <Clock className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">42h</div>
          <p className="text-xs text-muted-foreground">This week</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">98.5%</div>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </CardContent>
      </Card>

      {/* Quick Start Guide */}
      <Card className="md:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Quick Start
          </CardTitle>
          <CardDescription>
            Get started with process automation in 3 easy steps
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
            <span>Choose a template or create from scratch</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
            <span>Drag and drop workflow elements</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
            <span>Test and activate your workflow</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="md:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Welcome email sent to 3 new members</span>
            <span className="text-gray-400 ml-auto">2m ago</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Payment reminder workflow triggered</span>
            <span className="text-gray-400 ml-auto">1h ago</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-600">Class reminder sent to 24 members</span>
            <span className="text-gray-400 ml-auto">3h ago</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Workflows List Component
const WorkflowsList = ({ workflows }) => {
  const handleViewWorkflow = (workflow) => {
    console.log('View workflow:', workflow.name);
    // TODO: Open workflow in view mode
  };

  const handleEditWorkflow = (workflow) => {
    console.log('Edit workflow:', workflow.name);
    // TODO: Open workflow in edit mode
  };

  const handleCopyWorkflow = (workflow) => {
    console.log('Copy workflow:', workflow.name);
    // TODO: Create a copy of the workflow
  };

  const handleToggleWorkflow = (workflow) => {
    console.log('Toggle workflow:', workflow.name);
    // TODO: Toggle workflow active/paused status
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">My Workflows</h2>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{workflow.name}</h3>
                    <p className="text-gray-600">{workflow.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                        {workflow.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Last run: {workflow.lastRun}
                      </span>
                      <span className="text-sm text-gray-500">
                        {workflow.totalRuns} executions
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleViewWorkflow(workflow)}
                    title="View workflow"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditWorkflow(workflow)}
                    title="Edit workflow"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleCopyWorkflow(workflow)}
                    title="Copy workflow"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleToggleWorkflow(workflow)}
                    title={workflow.status === 'active' ? 'Pause workflow' : 'Activate workflow'}
                  >
                    {workflow.status === 'active' ? (
                      <PauseCircle className="h-4 w-4 text-orange-600" />
                    ) : (
                      <PlayCircle className="h-4 w-4 text-green-600" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" title="More options">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Templates Section Component
const TemplatesSection = ({ templates }) => {
  const handleUseTemplate = (template) => {
    console.log('Using template:', template.name);
    // TODO: Create a new workflow from template
    alert(`Creating workflow from template: ${template.name}\nThis will open the workflow builder with pre-configured steps.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Workflow Templates</h2>
        <Select defaultValue="all">
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="onboarding">Member Onboarding</SelectItem>
            <SelectItem value="billing">Billing</SelectItem>
            <SelectItem value="classes">Classes</SelectItem>
            <SelectItem value="retention">Retention</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <template.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge variant="outline" className="mt-1">
                    {template.category}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{template.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {template.steps} steps
                </span>
                <Button 
                  size="sm"
                  onClick={() => handleUseTemplate(template)}
                  className="whitespace-nowrap"
                >
                  Use Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Analytics Section Component
const AnalyticsSection = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Analytics & Performance</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Workflow Performance</CardTitle>
            <CardDescription>Success rates by workflow type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Email Workflows</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '98%' }}></div>
                  </div>
                  <span className="text-sm">98%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>SMS Workflows</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                  <span className="text-sm">95%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Payment Workflows</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                  <span className="text-sm">92%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Workflows</CardTitle>
            <CardDescription>By execution count this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Welcome Email Series</div>
                  <div className="text-sm text-gray-500">Member Onboarding</div>
                </div>
                <Badge>245 runs</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Payment Reminders</div>
                  <div className="text-sm text-gray-500">Billing</div>
                </div>
                <Badge>189 runs</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Class Reminders</div>
                  <div className="text-sm text-gray-500">Classes</div>
                </div>
                <Badge>156 runs</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Workflow Builder Component
const WorkflowBuilder = ({ isOpen, onClose }) => {
  const [draggedNode, setDraggedNode] = useState(null);
  const [canvasNodes, setCanvasNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectionMode, setConnectionMode] = useState(false);
  const [sourceNodeId, setSourceNodeId] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tempConnection, setTempConnection] = useState(null);

  const handleSaveWorkflow = () => {
    alert('Workflow saved as draft! You can continue editing or test it later.');
  };

  const handleTestWorkflow = () => {
    if (canvasNodes.length === 0) {
      alert('Please add some workflow steps before testing.');
      return;
    }
    alert(`Testing workflow with ${canvasNodes.length} steps and ${connections.length} connections.`);
  };

  const createDemoWorkflow = () => {
    const demoNodes = [
      {
        id: 'demo-1',
        type: 'member-joins',
        label: 'Member Joins',
        icon: UserPlus,
        color: 'bg-green-500',
        x: 100,
        y: 100,
        data: {}
      },
      {
        id: 'demo-2',
        type: 'wait',
        label: 'Wait',
        icon: Clock,
        color: 'bg-gray-500',
        x: 100,
        y: 200,
        data: { duration: '1 day' }
      },
      {
        id: 'demo-3',
        type: 'send-email',
        label: 'Send Email',
        icon: Mail,
        color: 'bg-blue-600',
        x: 100,
        y: 300,
        data: { recipient: 'member', template: 'welcome' }
      },
      {
        id: 'demo-4',
        type: 'if-then',
        label: 'If/Then',
        icon: GitBranch,
        color: 'bg-orange-500',
        x: 400,
        y: 200,
        data: { condition: 'member type = premium' }
      },
      {
        id: 'demo-5',
        type: 'send-sms',
        label: 'Send SMS',
        icon: MessageSquare,
        color: 'bg-green-600',
        x: 400,
        y: 350,
        data: { recipient: 'member' }
      }
    ];

    const demoConnections = [
      { id: 'demo-1-demo-2', from: 'demo-1', to: 'demo-2' },
      { id: 'demo-2-demo-3', from: 'demo-2', to: 'demo-3' },
      { id: 'demo-2-demo-4', from: 'demo-2', to: 'demo-4' },
      { id: 'demo-4-demo-5', from: 'demo-4', to: 'demo-5' }
    ];

    setCanvasNodes(demoNodes);
    setConnections(demoConnections);
  };

  const clearCanvas = () => {
    setCanvasNodes([]);
    setConnections([]);
    setSelectedNode(null);
    setConnectionMode(false);
    setSourceNodeId(null);
    setTempConnection(null);
  };

  const handleDragStart = (nodeType) => {
    setDraggedNode(nodeType);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (draggedNode && !isDraggingNode) {
      const rect = e.currentTarget.getBoundingClientRect();
      const newNode = {
        id: Date.now().toString(),
        type: draggedNode.id,
        label: draggedNode.label,
        icon: draggedNode.icon,
        color: draggedNode.color,
        x: e.clientX - rect.left - 100, // Center the node on cursor
        y: e.clientY - rect.top - 30,
        data: {}
      };
      setCanvasNodes([...canvasNodes, newNode]);
      setDraggedNode(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    if (connectionMode) return; // Don't drag in connection mode
    
    const node = canvasNodes.find(n => n.id === nodeId);
    if (node) {
      setIsDraggingNode(true);
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setSelectedNode(node);
    }
  };

  const handleMouseMove = (e) => {
    if (isDraggingNode && selectedNode) {
      const rect = e.currentTarget.getBoundingClientRect();
      const newX = e.clientX - rect.left - dragOffset.x;
      const newY = e.clientY - rect.top - dragOffset.y;
      
      setCanvasNodes(nodes => 
        nodes.map(node => 
          node.id === selectedNode.id 
            ? { ...node, x: Math.max(0, newX), y: Math.max(0, newY) }
            : node
        )
      );
    }
    
    // Handle temporary connection line for visual feedback
    if (connectionMode && sourceNodeId) {
      const rect = e.currentTarget.getBoundingClientRect();
      const sourceNode = canvasNodes.find(n => n.id === sourceNodeId);
      if (sourceNode) {
        setTempConnection({
          from: { x: sourceNode.x + 100, y: sourceNode.y + 40 },
          to: { x: e.clientX - rect.left, y: e.clientY - rect.top }
        });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDraggingNode(false);
  };

  const createConnection = (fromNodeId, toNodeId) => {
    // Prevent duplicate connections
    if (connections.find(c => c.from === fromNodeId && c.to === toNodeId)) {
      return;
    }
    
    const newConnection = {
      id: `${fromNodeId}-${toNodeId}`,
      from: fromNodeId,
      to: toNodeId
    };
    setConnections([...connections, newConnection]);
  };

  const handleConnectionStart = (nodeId) => {
    if (!connectionMode) {
      // Start connection mode
      setConnectionMode(true);
      setSourceNodeId(nodeId);
      setSelectedNode(canvasNodes.find(n => n.id === nodeId));
    } else if (sourceNodeId && sourceNodeId !== nodeId) {
      // Complete connection
      createConnection(sourceNodeId, nodeId);
      setConnectionMode(false);
      setSourceNodeId(null);
      setTempConnection(null);
    }
  };

  const handleConnectionCancel = () => {
    setConnectionMode(false);
    setSourceNodeId(null);
    setTempConnection(null);
  };

  const deleteConnection = (connectionId) => {
    setConnections(connections => connections.filter(conn => conn.id !== connectionId));
  };

  const deleteNode = (nodeId) => {
    setCanvasNodes(nodes => nodes.filter(node => node.id !== nodeId));
    setConnections(connections => connections.filter(conn => conn.from !== nodeId && conn.to !== nodeId));
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(null);
    }
    // Cancel connection mode if deleting source node
    if (sourceNodeId === nodeId) {
      handleConnectionCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full h-full max-w-7xl max-h-[90vh] flex flex-col">        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Workflow Builder</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Connection Mode Indicator */}
            {connectionMode && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg border border-blue-200">
                <Link className="h-4 w-4" />
                <span className="text-sm font-medium">Connection Mode</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleConnectionCancel}
                  className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-200"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}            <Button variant="outline" size="sm" className="whitespace-nowrap" onClick={handleSaveWorkflow}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button variant="outline" size="sm" onClick={createDemoWorkflow} className="whitespace-nowrap">
              <PlayCircle className="h-4 w-4 mr-1" />
              Demo
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearCanvas}
              disabled={canvasNodes.length === 0}
              className="whitespace-nowrap"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>            <Button size="sm" className="whitespace-nowrap" onClick={handleTestWorkflow}>
              <Play className="h-4 w-4 mr-1" />
              Test
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="whitespace-nowrap">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Node Palette */}
          <div className="w-80 border-r bg-gray-50 p-4 overflow-y-auto">
            <NodePalette onDragStart={handleDragStart} />
          </div>          {/* Canvas */}
          <div className="flex-1 relative">
            <WorkflowCanvas
              nodes={canvasNodes}
              connections={connections}
              tempConnection={tempConnection}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onNodeSelect={setSelectedNode}
              onNodeMouseDown={handleNodeMouseDown}
              onNodeMouseEnter={setHoveredNode}
              onNodeMouseLeave={() => setHoveredNode(null)}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onConnectionStart={handleConnectionStart}
              onDeleteNode={deleteNode}
              onDeleteConnection={deleteConnection}
              selectedNode={selectedNode}
              hoveredNode={hoveredNode}
              isDraggingNode={isDraggingNode}
              connectionMode={connectionMode}
              sourceNodeId={sourceNodeId}
            />
          </div>

          {/* Properties Panel */}
          {selectedNode && (
            <div className="w-80 border-l bg-gray-50 p-4 overflow-y-auto">
              <NodePropertiesPanel node={selectedNode} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Node Palette Component
const NodePalette = ({ onDragStart }) => {
  const [draggedItem, setDraggedItem] = useState(null);

  const handleDragStart = (node) => {
    setDraggedItem(node.id);
    onDragStart(node);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  return (
    <div className="space-y-6">
      <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm font-medium text-blue-700 mb-1">Drag & Drop</div>
        <div className="text-xs text-blue-600">Drag elements to the canvas to build your workflow</div>
      </div>

      <div>
        <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          TRIGGERS
        </h3>
        <div className="space-y-2">
          {nodeTypes.triggers.map((node) => (
            <div
              key={node.id}
              draggable
              onDragStart={() => handleDragStart(node)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-3 bg-white border rounded-lg cursor-move hover:shadow-md transition-all transform ${
                draggedItem === node.id ? 'scale-95 opacity-50' : 'hover:scale-102'
              }`}
            >
              <div className={`p-2 rounded ${node.color} text-white`}>
                <node.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="font-medium text-sm">{node.label}</div>
                <div className="text-xs text-gray-500">{node.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          CONDITIONS
        </h3>
        <div className="space-y-2">
          {nodeTypes.conditions.map((node) => (
            <div
              key={node.id}
              draggable
              onDragStart={() => handleDragStart(node)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-3 bg-white border rounded-lg cursor-move hover:shadow-md transition-all transform ${
                draggedItem === node.id ? 'scale-95 opacity-50' : 'hover:scale-102'
              }`}
            >
              <div className={`p-2 rounded ${node.color} text-white`}>
                <node.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="font-medium text-sm">{node.label}</div>
                <div className="text-xs text-gray-500">{node.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          ACTIONS
        </h3>
        <div className="space-y-2">
          {nodeTypes.actions.map((node) => (
            <div
              key={node.id}
              draggable
              onDragStart={() => handleDragStart(node)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-3 bg-white border rounded-lg cursor-move hover:shadow-md transition-all transform ${
                draggedItem === node.id ? 'scale-95 opacity-50' : 'hover:scale-102'
              }`}
            >
              <div className={`p-2 rounded ${node.color} text-white`}>
                <node.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="font-medium text-sm">{node.label}</div>
                <div className="text-xs text-gray-500">{node.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Workflow Canvas Component
const WorkflowCanvas = ({ 
  nodes, 
  connections, 
  tempConnection,
  onDrop, 
  onDragOver, 
  onNodeSelect, 
  onNodeMouseDown, 
  onNodeMouseEnter,
  onNodeMouseLeave,
  onMouseMove, 
  onMouseUp, 
  onConnectionStart, 
  onDeleteNode,
  onDeleteConnection,
  selectedNode,
  hoveredNode,
  isDraggingNode,
  connectionMode,
  sourceNodeId
}) => {
  // Calculate connection path between two nodes
  const getConnectionPath = (fromNode, toNode) => {
    const fromX = fromNode.x + 100; // Center of node (assuming 200px width)
    const fromY = fromNode.y + 40; // Bottom of node
    const toX = toNode.x + 100; // Center of target node
    const toY = toNode.y; // Top of target node

    // Create a curved path
    const midY = fromY + (toY - fromY) / 2;
    return `M ${fromX} ${fromY} C ${fromX} ${midY} ${toX} ${midY} ${toX} ${toY}`;
  };

  // Calculate path for temporary connection (from node to mouse)
  const getTempConnectionPath = (from, to) => {
    const midY = from.y + (to.y - from.y) / 2;
    return `M ${from.x} ${from.y} C ${from.x} ${midY} ${to.x} ${midY} ${to.x} ${to.y}`;
  };

  return (
    <div
      className={`w-full h-full bg-gray-100 relative overflow-auto ${
        connectionMode ? 'cursor-crosshair' : 'cursor-default'
      }`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      style={{
        backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}
    >
      {/* SVG for connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        {/* Regular connections */}
        {connections.map(connection => {
          const fromNode = nodes.find(n => n.id === connection.from);
          const toNode = nodes.find(n => n.id === connection.to);
          if (!fromNode || !toNode) return null;

          return (
            <g key={connection.id}>
              <path
                d={getConnectionPath(fromNode, toNode)}
                stroke="#3b82f6"
                strokeWidth="2"
                fill="none"
                markerEnd="url(#arrowhead)"
                className="hover:stroke-blue-700 transition-colors"
              />
              {/* Connection delete button */}
              <circle
                cx={fromNode.x + 100 + (toNode.x + 100 - fromNode.x - 100) / 2}
                cy={fromNode.y + 40 + (toNode.y - fromNode.y - 40) / 2}
                r="8"
                fill="white"
                stroke="#ef4444"
                strokeWidth="1"
                className="cursor-pointer"
                style={{ pointerEvents: 'all' }}
                onClick={() => onDeleteConnection(connection.id)}
              />
              <X
                x={fromNode.x + 100 + (toNode.x + 100 - fromNode.x - 100) / 2 - 4}
                y={fromNode.y + 40 + (toNode.y - fromNode.y - 40) / 2 - 4}
                width="8"
                height="8"
                className="text-red-500 cursor-pointer"
                style={{ pointerEvents: 'all' }}
                onClick={() => onDeleteConnection(connection.id)}
              />
            </g>
          );
        })}

        {/* Temporary connection while in connection mode */}
        {tempConnection && (
          <path
            d={getTempConnectionPath(tempConnection.from, tempConnection.to)}
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="5,5"
            fill="none"
            markerEnd="url(#tempArrowhead)"
          />
        )}
        
        {/* Arrow marker definitions */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#3b82f6"
            />
          </marker>
          <marker
            id="tempArrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#10b981"
            />
          </marker>
        </defs>
      </svg>      {/* Empty state */}
      {nodes.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 2 }}>
          <div className="text-center text-gray-500">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Start building your workflow</p>
            <p className="text-sm">Drag elements from the palette to get started</p>
          </div>
        </div>
      ) : (
        /* Workflow nodes */
        nodes.map((node) => (
          <WorkflowNode
            key={node.id}
            node={node}
            isSelected={selectedNode?.id === node.id}
            isHovered={hoveredNode?.id === node.id}
            isSourceNode={sourceNodeId === node.id}
            connectionMode={connectionMode}
            onSelect={() => onNodeSelect(node)}
            onMouseDown={(e) => onNodeMouseDown(e, node.id)}
            onMouseEnter={() => onNodeMouseEnter(node)}
            onMouseLeave={onNodeMouseLeave}
            onConnectionStart={() => onConnectionStart(node.id)}
            onDelete={() => onDeleteNode(node.id)}
          />
        ))
      )}

      {/* Connection instructions */}
      {connectionMode && (
        <div className="absolute top-4 left-4 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700" style={{ zIndex: 3 }}>
          <div className="font-medium mb-1">🔗 Connection Mode</div>
          <div>Click on a target node to create connection</div>
        </div>
      )}

      {/* General help */}
      {nodes.length > 0 && !connectionMode && (
        <div className="absolute top-4 left-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700" style={{ zIndex: 3 }}>
          <div className="font-medium mb-1">💡 Pro Tips:</div>
          <div>• Click the link icon to connect nodes</div>
          <div>• Drag nodes to reposition them</div>
          <div>• Click X on connections to remove them</div>
        </div>
      )}
    </div>
  );
};

// Individual Workflow Node Component
const WorkflowNode = ({ 
  node, 
  isSelected, 
  isHovered,
  isSourceNode,
  connectionMode,
  onSelect, 
  onMouseDown, 
  onMouseEnter,
  onMouseLeave,
  onConnectionStart, 
  onDelete 
}) => {
  const [showMenu, setShowMenu] = useState(false);

  // Dynamic styles based on state
  const getNodeStyles = () => {
    let borderClass = 'border-gray-300';
    let shadowClass = 'hover:shadow-lg';
    
    if (isSelected) {
      borderClass = 'border-blue-500';
      shadowClass = 'shadow-lg';
    } else if (isSourceNode) {
      borderClass = 'border-green-500';
      shadowClass = 'shadow-green-200 shadow-lg';
    } else if (connectionMode) {
      borderClass = 'border-purple-300';
      shadowClass = 'hover:border-purple-500 hover:shadow-purple-200 hover:shadow-lg';
    }
    
    return `${borderClass} ${shadowClass}`;
  };

  return (
    <div
      className={`absolute bg-white border-2 rounded-lg p-4 cursor-move transition-all select-none ${getNodeStyles()}`}
      style={{ 
        left: node.x, 
        top: node.y, 
        width: '200px',
        zIndex: isSelected ? 10 : (isSourceNode ? 9 : 5),
        transform: isHovered ? 'scale(1.02)' : 'scale(1)'
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (connectionMode) {
          onConnectionStart();
        } else {
          onSelect();
        }
      }}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onContextMenu={(e) => {
        e.preventDefault();
        setShowMenu(!showMenu);
      }}
    >
      {/* Connection mode indicator */}
      {isSourceNode && (
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-white" />
      )}

      {/* Node header */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-2 rounded ${node.color} text-white flex-shrink-0`}>
          <node.icon className="h-4 w-4" />
        </div>
        <span className="font-medium text-sm truncate">{node.label}</span>
        
        {/* Node actions */}
        <div className="ml-auto flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onConnectionStart();
            }}
            className={`p-1 hover:bg-gray-100 rounded transition-colors ${
              connectionMode ? 'text-green-600 bg-green-50' : 'text-blue-600'
            }`}
            title={connectionMode ? "Click to connect" : "Start connection"}
          >
            {connectionMode ? <Link className="h-3 w-3" /> : <GitBranch className="h-3 w-3" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-gray-100 rounded text-red-600 transition-colors"
            title="Delete node"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Node content */}
      <div className="text-xs text-gray-600">
        {node.type === 'send-email' && (
          <div>Send email to: {node.data.recipient || 'Not configured'}</div>
        )}
        {node.type === 'wait' && (
          <div>Wait: {node.data.duration || 'Not configured'}</div>
        )}
        {node.type === 'if-then' && (
          <div>Condition: {node.data.condition || 'Not configured'}</div>
        )}
        {!['send-email', 'wait', 'if-then'].includes(node.type) && (
          <div className="text-gray-400">Click to configure</div>
        )}
      </div>

      {/* Connection points */}
      <div 
        className={`absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full transition-opacity ${
          isHovered || connectionMode ? 'opacity-100' : 'opacity-0'
        }`}
        title="Input connection point" 
      />
      <div 
        className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full transition-opacity ${
          isHovered || connectionMode ? 'opacity-100' : 'opacity-0'
        }`}
        title="Output connection point" 
      />

      {/* Visual feedback for connection mode */}
      {connectionMode && !isSourceNode && (
        <div className="absolute inset-0 border-2 border-dashed border-purple-400 rounded-lg pointer-events-none animate-pulse" />
      )}
    </div>
  );
};

// Node Properties Panel Component
const NodePropertiesPanel = ({ node }) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg mb-2">Node Properties</h3>
        <div className="flex items-center gap-2 mb-4">
          <div className={`p-2 rounded ${node.color} text-white`}>
            <node.icon className="h-4 w-4" />
          </div>
          <span className="font-medium">{node.label}</span>
        </div>
      </div>

      {node.type === 'send-email' && (
        <EmailNodeProperties />
      )}

      {node.type === 'wait' && (
        <WaitNodeProperties />
      )}

      {node.type === 'if-then' && (
        <ConditionNodeProperties />
      )}

      {/* Default properties for other nodes */}
      {!['send-email', 'wait', 'if-then'].includes(node.type) && (
        <div className="space-y-3">
          <div>
            <Label>Node Name</Label>
            <Input placeholder="Enter node name" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea placeholder="Describe what this node does" />
          </div>
        </div>
      )}
    </div>
  );
};

// Email Node Properties Component
const EmailNodeProperties = () => {
  return (
    <div className="space-y-4">
      <div>
        <Label>Send To</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select recipient" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="emergency-contact">Emergency Contact</SelectItem>
            <SelectItem value="staff">Staff Member</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Email Template</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="welcome">Welcome Email</SelectItem>
            <SelectItem value="payment-reminder">Payment Reminder</SelectItem>
            <SelectItem value="class-reminder">Class Reminder</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Custom Subject</Label>
        <Input placeholder="Optional custom subject line" />
      </div>

      <div>
        <Label>Additional Message</Label>
        <Textarea placeholder="Add custom message to template" />
      </div>
    </div>
  );
};

// Wait Node Properties Component
const WaitNodeProperties = () => {
  return (
    <div className="space-y-4">
      <div>
        <Label>Wait Duration</Label>
        <div className="flex gap-2">
          <Input type="number" placeholder="0" className="flex-1" />
          <Select>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minutes">Minutes</SelectItem>
              <SelectItem value="hours">Hours</SelectItem>
              <SelectItem value="days">Days</SelectItem>
              <SelectItem value="weeks">Weeks</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Wait Type</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose wait type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="delay">Simple Delay</SelectItem>
            <SelectItem value="until-date">Wait Until Date</SelectItem>
            <SelectItem value="until-condition">Wait Until Condition</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

// Condition Node Properties Component
const ConditionNodeProperties = () => {
  return (
    <div className="space-y-4">
      <div>
        <Label>Field to Check</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select field" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="membership-status">Membership Status</SelectItem>
            <SelectItem value="payment-status">Payment Status</SelectItem>
            <SelectItem value="last-checkin">Last Check-in Date</SelectItem>
            <SelectItem value="member-type">Member Type</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Condition</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equals">Equals</SelectItem>
            <SelectItem value="not-equals">Not Equals</SelectItem>
            <SelectItem value="greater-than">Greater Than</SelectItem>
            <SelectItem value="less-than">Less Than</SelectItem>
            <SelectItem value="contains">Contains</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Value</Label>
        <Input placeholder="Enter comparison value" />
      </div>
    </div>
  );
};

export default ProcessAutomation;
