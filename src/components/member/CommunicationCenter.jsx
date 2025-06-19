/**
 * 💬 MEMBER COMMUNICATION CENTER
 * Messages, announcements, and support chat
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  Bell, 
  User, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Info,
  Star,
  Phone,
  Mail,
  Search,
  Filter,
  Paperclip
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';

const CommunicationCenter = ({ memberId, memberName, className = '' }) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  // Mock data for demonstration
  const mockAnnouncements = [
    {
      id: 1,
      title: 'New Class Schedule Released',
      content: 'Check out our updated class schedule with new HIIT and Yoga sessions!',
      type: 'info',
      priority: 'normal',
      created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      read: false
    },
    {
      id: 2,
      title: 'Gym Maintenance Notice',
      content: 'The gym will be closed for maintenance on Sunday, March 15th from 6 AM to 12 PM.',
      type: 'warning',
      priority: 'high',
      created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      read: true
    },
    {
      id: 3,
      title: 'Member Appreciation Event',
      content: 'Join us for our annual member appreciation BBQ on Saturday, March 20th!',
      type: 'success',
      priority: 'normal',
      created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      read: true
    }
  ];

  const mockMessages = [
    {
      id: 1,
      sender_id: 'staff_1',
      sender_name: 'Sarah (Staff)',
      content: 'Hi! Welcome to Momentum Gym. How can I help you today?',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: true,
      type: 'received'
    },
    {
      id: 2,
      sender_id: memberId,
      sender_name: memberName,
      content: 'Hi Sarah! I have a question about the personal training packages.',
      timestamp: new Date(Date.now() - 3000000).toISOString(),
      read: true,
      type: 'sent'
    },
    {
      id: 3,
      sender_id: 'staff_1',
      sender_name: 'Sarah (Staff)',
      content: 'I\'d be happy to help! We have several personal training options available. Would you like to schedule a consultation?',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      read: false,
      type: 'received'
    }
  ];

  useEffect(() => {
    loadCommunicationData();
    scrollToBottom();
  }, [memberId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadCommunicationData = async () => {
    try {
      // In real app, load from database
      setAnnouncements(mockAnnouncements);
      setMessages(mockMessages);
      
      // Calculate unread count
      const unread = mockAnnouncements.filter(a => !a.read).length + 
                    mockMessages.filter(m => !m.read && m.type === 'received').length;
      setUnreadCount(unread);

      // Load support tickets
      const { data: ticketsData, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSupportTickets(ticketsData || []);

    } catch (error) {
      console.error('Error loading communication data:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      sender_id: memberId,
      sender_name: memberName,
      content: newMessage,
      timestamp: new Date().toISOString(),
      read: true,
      type: 'sent'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // In real app, send to database and notify staff
    try {
      const { error } = await supabase
        .from('member_messages')
        .insert([{
          member_id: memberId,
          sender_name: memberName,
          content: newMessage,
          timestamp: new Date().toISOString()
        }]);

      if (error) throw error;

      toast({
        title: 'Message sent',
        description: 'Your message has been sent to our staff.',
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Failed to send message',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const markAnnouncementAsRead = (announcementId) => {
    setAnnouncements(prev => 
      prev.map(a => a.id === announcementId ? { ...a, read: true } : a)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const createSupportTicket = async (subject, description, priority = 'normal') => {
    try {
      const ticketData = {
        member_id: memberId,
        member_name: memberName,
        subject,
        description,
        priority,
        status: 'open',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('support_tickets')
        .insert([ticketData]);

      if (error) throw error;

      setSupportTickets(prev => [ticketData, ...prev]);

      toast({
        title: 'Support ticket created',
        description: 'We\'ll get back to you within 24 hours.',
      });

    } catch (error) {
      console.error('Error creating support ticket:', error);
      toast({
        title: 'Failed to create ticket',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getAnnouncementIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Communication Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{messages.length}</div>
            <div className="text-sm text-gray-600">Messages</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Bell className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
            <div className="text-2xl font-bold">{announcements.length}</div>
            <div className="text-sm text-gray-600">Announcements</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{supportTickets.length}</div>
            <div className="text-sm text-gray-600">Support Tickets</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="messages" className="relative">
            Messages
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 min-w-5 text-xs p-0 flex items-center justify-center">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat with Staff
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Messages List */}
              <div className="h-96 overflow-y-auto border rounded-lg p-4 mb-4 bg-gray-50">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex',
                        message.type === 'sent' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
                          message.type === 'sent'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-white border'
                        )}
                      >
                        <div className="text-sm font-medium mb-1">
                          {message.sender_name}
                        </div>
                        <div className="text-sm">{message.content}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="space-y-4">
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => markAnnouncementAsRead(announcement.id)}
              >
                <Card className={cn(
                  'cursor-pointer transition-colors',
                  !announcement.read && 'border-primary bg-primary/5'
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {getAnnouncementIcon(announcement.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{announcement.title}</h3>
                          {!announcement.read && (
                            <Badge variant="secondary" className="text-xs">
                              New
                            </Badge>
                          )}
                          <Badge 
                            variant={announcement.priority === 'high' ? 'destructive' : 'outline'}
                            className="text-xs"
                          >
                            {announcement.priority}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-2">{announcement.content}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {formatTime(announcement.created_at)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Support Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <SupportTicketForm onSubmit={createSupportTicket} />
            </CardContent>
          </Card>

          {/* Support Tickets List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Support Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              {supportTickets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No support tickets</p>
                  <p className="text-sm">Create a ticket above if you need help!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {supportTickets.map((ticket, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{ticket.subject}</h4>
                        <Badge 
                          variant={
                            ticket.status === 'open' ? 'destructive' :
                            ticket.status === 'in_progress' ? 'secondary' : 'default'
                          }
                        >
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                      <div className="text-xs text-gray-500">
                        Created {formatTime(ticket.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Other Ways to Reach Us</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Phone</div>
                    <div className="text-sm text-gray-600">(555) 123-4567</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Email</div>
                    <div className="text-sm text-gray-600">support@momentum.com</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Support Ticket Form Component
const SupportTicketForm = ({ onSubmit }) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    
    onSubmit(subject, description, priority);
    setSubject('');
    setDescription('');
    setPriority('normal');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief description of your issue"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="priority">Priority</Label>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Please provide detailed information about your issue..."
          rows={4}
          required
        />
      </div>
      
      <Button type="submit" disabled={!subject.trim() || !description.trim()}>
        Create Ticket
      </Button>
    </form>
  );
};

export default CommunicationCenter;
