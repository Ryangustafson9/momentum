import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  CreditCard, 
  Calendar, 
  MessageSquare, 
  FileText, 
  DollarSign,
  Edit3,
  Save,
  X,
  Plus
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

// Enhanced Tab Configuration
const TAB_CONFIG = [
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    description: 'Personal information and contact details',
    color: 'blue'
  },
  {
    id: 'membership',
    label: 'Membership',
    icon: CreditCard,
    description: 'Membership plans and billing',
    color: 'green'
  },
  {
    id: 'registrations',
    label: 'Classes',
    icon: Calendar,
    description: 'Class registrations and bookings',
    color: 'purple'
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: MessageSquare,
    description: 'Email and SMS history',
    color: 'orange'
  },
  {
    id: 'notes',
    label: 'Notes & Documents',
    icon: FileText,
    description: 'Staff notes and documents',
    color: 'red'
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: DollarSign,
    description: 'Payment history and billing',
    color: 'indigo'
  }
];

const EnhancedMemberProfileTabs = ({ memberId, memberData, onMemberUpdate }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Initialize edit data when member data changes
  useEffect(() => {
    if (memberData) {
      setEditData({
        first_name: memberData.first_name || '',
        last_name: memberData.last_name || '',
        email: memberData.email || '',
        phone: memberData.phone || '',
        address: memberData.address || '',
        city: memberData.city || '',
        state: memberData.state || '',
        zip_code: memberData.zip_code || '',
        date_of_birth: memberData.date_of_birth || '',
        emergency_contact_name: memberData.emergency_contact_name || '',
        emergency_contact_phone: memberData.emergency_contact_phone || '',
        notes: memberData.notes || ''
      });
    }
  }, [memberData]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  // Save changes
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(editData)
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;

      onMemberUpdate?.(data);
      setHasChanges(false);
      setIsEditing(false);
      
      toast({
        title: "Success",
        description: "Member profile updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update profile: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditData({
      first_name: memberData.first_name || '',
      last_name: memberData.last_name || '',
      email: memberData.email || '',
      phone: memberData.phone || '',
      address: memberData.address || '',
      city: memberData.city || '',
      state: memberData.state || '',
      zip_code: memberData.zip_code || '',
      date_of_birth: memberData.date_of_birth || '',
      emergency_contact_name: memberData.emergency_contact_name || '',
      emergency_contact_phone: memberData.emergency_contact_phone || '',
      notes: memberData.notes || ''
    });
    setHasChanges(false);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-6">
            {TAB_CONFIG.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Global Edit Controls */}
          {activeTab === 'profile' && (
            <div className="flex items-center gap-2">
              {hasChanges && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isLoading}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </motion.div>
              )}
              
              {!isEditing && !hasChanges && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Edit Profile
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border shadow-sm">
          <TabsContent value="profile" className="p-6 space-y-6">
            <ProfileTabContent 
              memberData={memberData}
              editData={editData}
              isEditing={isEditing || hasChanges}
              onInputChange={handleInputChange}
            />
          </TabsContent>

          <TabsContent value="membership" className="p-6">
            <MembershipTabContent memberId={memberId} memberData={memberData} />
          </TabsContent>

          <TabsContent value="registrations" className="p-6">
            <RegistrationsTabContent memberId={memberId} />
          </TabsContent>

          <TabsContent value="communication" className="p-6">
            <CommunicationTabContent memberId={memberId} />
          </TabsContent>

          <TabsContent value="notes" className="p-6">
            <NotesTabContent memberId={memberId} />
          </TabsContent>

          <TabsContent value="billing" className="p-6">
            <BillingTabContent memberId={memberId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

// Profile Tab Content Component
const ProfileTabContent = ({ memberData, editData, isEditing, onInputChange }) => {
  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EditableField
            label="First Name"
            value={isEditing ? editData.first_name : memberData?.first_name}
            isEditing={isEditing}
            onChange={(value) => onInputChange('first_name', value)}
          />
          <EditableField
            label="Last Name"
            value={isEditing ? editData.last_name : memberData?.last_name}
            isEditing={isEditing}
            onChange={(value) => onInputChange('last_name', value)}
          />
          <EditableField
            label="Email"
            value={isEditing ? editData.email : memberData?.email}
            isEditing={isEditing}
            type="email"
            onChange={(value) => onInputChange('email', value)}
          />
          <EditableField
            label="Phone"
            value={isEditing ? editData.phone : memberData?.phone}
            isEditing={isEditing}
            type="tel"
            onChange={(value) => onInputChange('phone', value)}
          />
          <EditableField
            label="Date of Birth"
            value={isEditing ? editData.date_of_birth : memberData?.date_of_birth}
            isEditing={isEditing}
            type="date"
            onChange={(value) => onInputChange('date_of_birth', value)}
          />
          <div className="flex items-center gap-2">
            <Badge variant={memberData?.role === 'member' ? 'default' : 'secondary'}>
              {memberData?.role || 'Guest'}
            </Badge>
            {memberData?.created_at && (
              <span className="text-sm text-muted-foreground">
                Member since {new Date(memberData.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Address & Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <EditableField
              label="Address"
              value={isEditing ? editData.address : memberData?.address}
              isEditing={isEditing}
              onChange={(value) => onInputChange('address', value)}
            />
          </div>
          <EditableField
            label="City"
            value={isEditing ? editData.city : memberData?.city}
            isEditing={isEditing}
            onChange={(value) => onInputChange('city', value)}
          />
          <EditableField
            label="State"
            value={isEditing ? editData.state : memberData?.state}
            isEditing={isEditing}
            onChange={(value) => onInputChange('state', value)}
          />
          <EditableField
            label="ZIP Code"
            value={isEditing ? editData.zip_code : memberData?.zip_code}
            isEditing={isEditing}
            onChange={(value) => onInputChange('zip_code', value)}
          />
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EditableField
            label="Emergency Contact Name"
            value={isEditing ? editData.emergency_contact_name : memberData?.emergency_contact_name}
            isEditing={isEditing}
            onChange={(value) => onInputChange('emergency_contact_name', value)}
          />
          <EditableField
            label="Emergency Contact Phone"
            value={isEditing ? editData.emergency_contact_phone : memberData?.emergency_contact_phone}
            isEditing={isEditing}
            type="tel"
            onChange={(value) => onInputChange('emergency_contact_phone', value)}
          />
        </CardContent>
      </Card>
    </div>
  );
};

// Editable Field Component
const EditableField = ({ label, value, isEditing, type = 'text', onChange }) => {
  if (isEditing) {
    return (
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <p className="text-sm text-gray-900 py-2">
        {value || <span className="text-gray-400 italic">Not provided</span>}
      </p>
    </div>
  );
};

// Placeholder components for other tabs
const MembershipTabContent = ({ memberId, memberData }) => (
  <div className="text-center py-8">
    <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
    <p className="text-gray-500">Membership management coming soon</p>
  </div>
);

const RegistrationsTabContent = ({ memberId }) => (
  <div className="text-center py-8">
    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
    <p className="text-gray-500">Class registrations coming soon</p>
  </div>
);

const CommunicationTabContent = ({ memberId }) => (
  <div className="text-center py-8">
    <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
    <p className="text-gray-500">Communication history coming soon</p>
  </div>
);

const NotesTabContent = ({ memberId }) => (
  <div className="text-center py-8">
    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
    <p className="text-gray-500">Notes and documents coming soon</p>
  </div>
);

const BillingTabContent = ({ memberId }) => (
  <div className="text-center py-8">
    <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
    <p className="text-gray-500">Billing history coming soon</p>
  </div>
);

export default EnhancedMemberProfileTabs;
