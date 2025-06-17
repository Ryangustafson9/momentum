// 📧 MEMBER COMMUNICATIONS - Industry-standard member communication system
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  MessageSquare, 
  Send, 
  Users, 
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

const CommunicationsPage = () => {
  const { toast } = useToast();
  
  // State management
  const [activeTab, setActiveTab] = useState('compose');
  const [messages, setMessages] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Compose message state
  const [composeData, setComposeData] = useState({
    subject: '',
    message: '',
    recipients: 'all',
    customRecipients: [],
    scheduleDate: '',
    template: '',
    priority: 'normal'
  });

  // Mock data for demonstration
  const mockMessages = [
    {
      id: 1,
      subject: 'Welcome to Our Gym!',
      recipients: 'New Members',
      sentDate: '2024-01-15',
      status: 'sent',
      openRate: '85%',
      clickRate: '12%'
    },
    {
      id: 2,
      subject: 'Class Schedule Update',
      recipients: 'All Active Members',
      sentDate: '2024-01-14',
      status: 'sent',
      openRate: '72%',
      clickRate: '8%'
    },
    {
      id: 3,
      subject: 'Membership Renewal Reminder',
      recipients: 'Expiring Soon',
      sentDate: '2024-01-13',
      status: 'scheduled',
      openRate: '-',
      clickRate: '-'
    }
  ];

  const mockTemplates = [
    {
      id: 1,
      name: 'Welcome Email',
      category: 'onboarding',
      subject: 'Welcome to {{gym_name}}!',
      content: 'Dear {{member_name}}, welcome to our fitness family...',
      lastUsed: '2024-01-10'
    },
    {
      id: 2,
      name: 'Class Reminder',
      category: 'classes',
      subject: 'Your class {{class_name}} starts in 2 hours',
      content: 'Hi {{member_name}}, just a friendly reminder...',
      lastUsed: '2024-01-12'
    },
    {
      id: 3,
      name: 'Payment Reminder',
      category: 'billing',
      subject: 'Payment Due - {{gym_name}}',
      content: 'Dear {{member_name}}, your payment is due...',
      lastUsed: '2024-01-08'
    }
  ];

  const recipientOptions = [
    { value: 'all', label: 'All Active Members', count: 245 },
    { value: 'new', label: 'New Members (Last 30 days)', count: 18 },
    { value: 'expiring', label: 'Memberships Expiring Soon', count: 12 },
    { value: 'inactive', label: 'Inactive Members', count: 34 },
    { value: 'premium', label: 'Premium Members', count: 89 },
    { value: 'custom', label: 'Custom Selection', count: 0 }
  ];

  useEffect(() => {
    setMessages(mockMessages);
    setTemplates(mockTemplates);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!composeData.subject || !composeData.message) {
      toast({
        title: "Validation Error",
        description: "Please fill in subject and message fields.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newMessage = {
        id: Date.now(),
        subject: composeData.subject,
        recipients: recipientOptions.find(opt => opt.value === composeData.recipients)?.label || 'Custom',
        sentDate: new Date().toISOString().split('T')[0],
        status: composeData.scheduleDate ? 'scheduled' : 'sent',
        openRate: '-',
        clickRate: '-'
      };

      setMessages(prev => [newMessage, ...prev]);
      setComposeData({
        subject: '',
        message: '',
        recipients: 'all',
        customRecipients: [],
        scheduleDate: '',
        template: '',
        priority: 'normal'
      });

      toast({
        title: "Success",
        description: composeData.scheduleDate ? "Message scheduled successfully!" : "Message sent successfully!",
      });

      setActiveTab('history');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [composeData, toast]);

  const handleUseTemplate = useCallback((template) => {
    setComposeData(prev => ({
      ...prev,
      subject: template.subject,
      message: template.content,
      template: template.id
    }));
    setActiveTab('compose');
  }, []);

  const ComposeTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Compose Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recipients */}
          <div>
            <label className="text-sm font-medium mb-2 block">Recipients</label>
            <Select value={composeData.recipients} onValueChange={(value) => 
              setComposeData(prev => ({ ...prev, recipients: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Select recipients" />
              </SelectTrigger>
              <SelectContent>
                {recipientOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label} ({option.count} members)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div>
            <label className="text-sm font-medium mb-2 block">Subject</label>
            <Input
              value={composeData.subject}
              onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Enter email subject"
            />
          </div>

          {/* Message */}
          <div>
            <label className="text-sm font-medium mb-2 block">Message</label>
            <Textarea
              value={composeData.message}
              onChange={(e) => setComposeData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Enter your message here..."
              rows={8}
            />
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select value={composeData.priority} onValueChange={(value) => 
                setComposeData(prev => ({ ...prev, priority: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="normal">Normal Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Schedule (Optional)</label>
              <Input
                type="datetime-local"
                value={composeData.scheduleDate}
                onChange={(e) => setComposeData(prev => ({ ...prev, scheduleDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setActiveTab('templates')}>
              <Eye className="w-4 h-4 mr-2" />
              Use Template
            </Button>
            
            <div className="space-x-2">
              <Button variant="outline">
                Save Draft
              </Button>
              <Button onClick={handleSendMessage} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    {composeData.scheduleDate ? 'Scheduling...' : 'Sending...'}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {composeData.scheduleDate ? 'Schedule' : 'Send Now'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const HistoryTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Message History</h3>
        <div className="flex space-x-2">
          <Input placeholder="Search messages..." className="w-64" />
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {messages.map(message => (
          <Card key={message.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium">{message.subject}</h4>
                    <Badge variant={message.status === 'sent' ? 'default' : 'secondary'}>
                      {message.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">To: {message.recipients}</p>
                  <p className="text-sm text-gray-500">Sent: {message.sentDate}</p>
                </div>
                
                <div className="text-right space-y-1">
                  <div className="text-sm">
                    <span className="text-gray-500">Open Rate: </span>
                    <span className="font-medium">{message.openRate}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Click Rate: </span>
                    <span className="font-medium">{message.clickRate}</span>
                  </div>
                  <div className="flex space-x-1 mt-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="w-3 h-3" />
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

  const TemplatesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Email Templates</h3>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map(template => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">{template.name}</h4>
                  <Badge variant="outline">{template.category}</Badge>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2">{template.subject}</p>
                <p className="text-xs text-gray-500">Last used: {template.lastUsed}</p>
                
                <div className="flex justify-between">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleUseTemplate(template)}
                  >
                    Use Template
                  </Button>
                  <div className="space-x-1">
                    <Button size="sm" variant="ghost">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Trash2 className="w-3 h-3" />
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
          <h1 className="text-3xl font-bold text-gray-900">Member Communications</h1>
          <p className="text-gray-600 mt-1">
            Send emails, notifications, and manage communication templates
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Email Service Active
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Messages Sent</p>
                <p className="text-2xl font-bold">1,247</p>
              </div>
              <Mail className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Open Rate</p>
                <p className="text-2xl font-bold">78.5%</p>
              </div>
              <Eye className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Click Rate</p>
                <p className="text-2xl font-bold">12.3%</p>
              </div>
              <MessageSquare className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Templates</p>
                <p className="text-2xl font-bold">{templates.length}</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="compose" className="mt-6">
          <ComposeTab />
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <HistoryTab />
        </TabsContent>
        
        <TabsContent value="templates" className="mt-6">
          <TemplatesTab />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default CommunicationsPage;
