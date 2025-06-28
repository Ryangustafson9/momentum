import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Calendar,
  CreditCard,
  Users,
  Settings,
  CheckCircle,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Notifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      membershipReminders: true,
      paymentReminders: true,
      classReminders: true,
      promotionalOffers: false,
      eventAnnouncements: true,
      maintenanceAlerts: true,
      newsletterUpdates: false
    },
    sms: {
      paymentDue: true,
      classReminders: false,
      emergencyAlerts: true,
      promotionalOffers: false
    },
    push: {
      classReminders: true,
      paymentReminders: true,
      socialUpdates: false,
      promotionalOffers: false
    }
  });

  const handleSettingChange = (category, setting) => {
    setNotificationSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting]
      }
    }));

    toast({
      title: "Settings Updated",
      description: "Your notification preferences have been saved.",
      variant: "default"
    });
  };

  const notificationCategories = [
    {
      id: 'email',
      name: 'Email Notifications',
      icon: <Mail className="h-5 w-5" />,
      description: 'Receive updates via email',
      settings: [
        { key: 'membershipReminders', label: 'Membership Reminders', description: 'Renewal and expiration notices' },
        { key: 'paymentReminders', label: 'Payment Reminders', description: 'Billing and payment due dates' },
        { key: 'classReminders', label: 'Class Reminders', description: 'Upcoming class and reservation notifications' },
        { key: 'promotionalOffers', label: 'Promotional Offers', description: 'Special deals and discounts' },
        { key: 'eventAnnouncements', label: 'Event Announcements', description: 'Club events and activities' },
        { key: 'maintenanceAlerts', label: 'Maintenance Alerts', description: 'Facility closures and updates' },
        { key: 'newsletterUpdates', label: 'Newsletter Updates', description: 'Monthly club newsletter' }
      ]
    },
    {
      id: 'sms',
      name: 'SMS Notifications',
      icon: <MessageSquare className="h-5 w-5" />,
      description: 'Receive text messages on your phone',
      settings: [
        { key: 'paymentDue', label: 'Payment Due', description: 'Urgent payment reminders' },
        { key: 'classReminders', label: 'Class Reminders', description: '1 hour before class starts' },
        { key: 'emergencyAlerts', label: 'Emergency Alerts', description: 'Important safety notifications' },
        { key: 'promotionalOffers', label: 'Promotional Offers', description: 'Limited-time deals via SMS' }
      ]
    },
    {
      id: 'push',
      name: 'Push Notifications',
      icon: <Bell className="h-5 w-5" />,
      description: 'Receive notifications in the app',
      settings: [
        { key: 'classReminders', label: 'Class Reminders', description: 'Push notifications for upcoming classes' },
        { key: 'paymentReminders', label: 'Payment Reminders', description: 'In-app payment notifications' },
        { key: 'socialUpdates', label: 'Social Updates', description: 'Community and social features' },
        { key: 'promotionalOffers', label: 'Promotional Offers', description: 'Special offers and deals' }
      ]
    }
  ];

  const recentNotifications = [
    {
      id: 1,
      type: 'payment',
      title: 'Payment Confirmation',
      message: 'Your monthly membership payment of $59.99 has been processed successfully.',
      timestamp: new Date(),
      read: true
    },
    {
      id: 2,
      type: 'class',
      title: 'Class Reminder',
      message: 'Your Yoga Flow class starts in 1 hour. Studio A.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false
    },
    {
      id: 3,
      type: 'announcement',
      title: 'New Equipment Available',
      message: 'Check out our new cardio machines on the second floor!',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: true
    },
    {
      id: 4,
      type: 'maintenance',
      title: 'Pool Maintenance',
      message: 'The pool will be closed for maintenance on Sunday, 6 AM - 12 PM.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      read: true
    }
  ];

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'payment': return <CreditCard className="h-4 w-4 text-green-600" />;
      case 'class': return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'announcement': return <Bell className="h-4 w-4 text-purple-600" />;
      case 'maintenance': return <Settings className="h-4 w-4 text-orange-600" />;
      default: return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
        <p className="text-muted-foreground">Manage how you receive club communications and updates</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button variant="outline" className="h-16 flex flex-col gap-2">
          <Volume2 className="h-5 w-5" />
          Enable All
        </Button>
        <Button variant="outline" className="h-16 flex flex-col gap-2">
          <VolumeX className="h-5 w-5" />
          Disable All
        </Button>
        <Button variant="outline" className="h-16 flex flex-col gap-2">
          <Settings className="h-5 w-5" />
          Reset to Default
        </Button>
      </div>

      {/* Notification Categories */}
      {notificationCategories.map((category) => (
        <Card key={category.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {category.icon}
              {category.name}
            </CardTitle>
            <p className="text-sm text-gray-600">{category.description}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {category.settings.map((setting) => (
                <div key={setting.key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{setting.label}</p>
                    <p className="text-sm text-gray-600">{setting.description}</p>
                  </div>
                  <Switch
                    checked={notificationSettings[category.id][setting.key]}
                    onCheckedChange={() => handleSettingChange(category.id, setting.key)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentNotifications.map((notification) => (
              <div key={notification.id} className={`flex items-start gap-4 p-4 border rounded-lg ${!notification.read ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}>
                <div className="p-2 bg-gray-100 rounded-lg">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{notification.title}</p>
                    {!notification.read && (
                      <Badge variant="default" className="bg-blue-100 text-blue-800 text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                  <p className="text-xs text-gray-500">
                    {notification.timestamp.toLocaleDateString()} at {notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {notification.read && (
                  <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Email Address</span>
              </div>
              <p className="text-sm text-gray-600">{user?.email}</p>
              <Button variant="outline" size="sm" className="mt-2">
                Update Email
              </Button>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Phone Number</span>
              </div>
              <p className="text-sm text-gray-600">{user?.phone || 'Not provided'}</p>
              <Button variant="outline" size="sm" className="mt-2">
                {user?.phone ? 'Update Phone' : 'Add Phone'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
