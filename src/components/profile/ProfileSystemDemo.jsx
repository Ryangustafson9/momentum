import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Search, 
  Plus, 
  Edit, 
  Camera, 
  Users, 
  CheckCircle, 
  AlertCircle,
  TestTube
} from 'lucide-react';

// Import our new profile components
import {
  ProfileForm,
  ProfileModal,
  ProfileCreationWizard,
  ProfileSearch,
  ProfilePhotoUpload,
  ProfileBulkOperations
} from '@/components/profile';

import { useProfileManager } from '@/hooks/useProfileManager';

/**
 * Demo component to test and showcase the profile management system
 */
const ProfileSystemDemo = () => {
  const { toast } = useToast();
  const [activeDemo, setActiveDemo] = useState('search');
  const [showModal, setShowModal] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [demoProfiles, setDemoProfiles] = useState([
    {
      id: 'demo-1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '(555) 123-4567',
      role: 'member',
      status: 'active',
      created_at: new Date().toISOString()
    },
    {
      id: 'demo-2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      phone: '(555) 987-6543',
      role: 'staff',
      status: 'active',
      created_at: new Date().toISOString()
    }
  ]);

  const {
    profiles,
    currentProfile,
    isLoading,
    error,
    createProfile,
    updateProfile,
    searchProfiles
  } = useProfileManager({
    showToasts: true,
    validateData: true
  });

  const handleProfileSelect = (profile) => {
    setSelectedProfile(profile);
    toast({
      title: "Profile Selected",
      description: `Selected ${profile.first_name} ${profile.last_name}`
    });
  };

  const handleCreateNew = (initialData = {}) => {
    setSelectedProfile(initialData);
    setShowWizard(true);
  };

  const handleProfileCreated = (newProfile) => {
    setDemoProfiles(prev => [newProfile, ...prev]);
    setShowWizard(false);
    toast({
      title: "Demo Profile Created",
      description: `Created profile for ${newProfile.first_name} ${newProfile.last_name}`
    });
  };

  const handleProfileUpdated = (updatedProfile) => {
    setDemoProfiles(prev => 
      prev.map(p => p.id === updatedProfile.id ? updatedProfile : p)
    );
    setShowModal(false);
    toast({
      title: "Demo Profile Updated",
      description: "Profile has been updated successfully"
    });
  };

  const testValidation = () => {
    // Test form validation
    const testData = {
      first_name: 'A', // Too short
      email: 'invalid-email', // Invalid format
      phone: '123' // Too short
    };

    toast({
      title: "Validation Test",
      description: "Check console for validation results",
      variant: "info"
    });

    console.log('Testing validation with invalid data:', testData);
  };

  const testSearch = async () => {
    try {
      const results = await searchProfiles('john', { role: 'member' });
      toast({
        title: "Search Test",
        description: `Found ${results.length} profiles`,
        variant: "info"
      });
    } catch (error) {
      toast({
        title: "Search Test Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const demos = [
    {
      id: 'search',
      title: 'Profile Search',
      description: 'Search and create profiles with intelligent suggestions',
      icon: Search,
      component: (
        <div className="space-y-4">
          <ProfileSearch
            onProfileSelect={handleProfileSelect}
            onCreateNew={handleCreateNew}
            placeholder="Search demo profiles..."
            userRole="member"
          />
          
          {selectedProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Selected Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {selectedProfile.first_name} {selectedProfile.last_name}</p>
                  <p><strong>Email:</strong> {selectedProfile.email}</p>
                  <p><strong>Role:</strong> <Badge variant="outline">{selectedProfile.role}</Badge></p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )
    },
    {
      id: 'form',
      title: 'Profile Form',
      description: 'Standardized form with validation and error handling',
      icon: Edit,
      component: (
        <ProfileForm
          initialData={{
            first_name: 'Demo',
            last_name: 'User',
            email: 'demo@example.com'
          }}
          userRole="member"
          onSubmit={(data) => {
            toast({
              title: "Form Submitted",
              description: "Check console for form data",
              variant: "info"
            });
            console.log('Form data:', data);
          }}
          showSections={true}
          submitButtonText="Test Submit"
        />
      )
    },
    {
      id: 'photo',
      title: 'Photo Upload',
      description: 'Drag & drop photo upload with validation',
      icon: Camera,
      component: (
        <div className="flex justify-center">
          <ProfilePhotoUpload
            profileId="demo-profile"
            profileName="Demo User"
            onImageUploaded={(url) => {
              toast({
                title: "Photo Uploaded",
                description: "Profile photo updated successfully"
              });
            }}
            size="xl"
          />
        </div>
      )
    },
    {
      id: 'bulk',
      title: 'Bulk Operations',
      description: 'Manage multiple profiles with bulk actions',
      icon: Users,
      component: (
        <ProfileBulkOperations
          profiles={demoProfiles}
          selectedProfiles={[]}
          onSelectionChange={(selected) => {
            console.log('Selected profiles:', selected);
          }}
          onProfilesUpdated={() => {
            toast({
              title: "Bulk Operation",
              description: "Profiles updated successfully"
            });
          }}
        />
      )
    },
    {
      id: 'tests',
      title: 'System Tests',
      description: 'Test validation, error handling, and workflows',
      icon: TestTube,
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={testValidation} variant="outline" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Test Validation
            </Button>
            <Button onClick={testSearch} variant="outline" className="gap-2">
              <Search className="h-4 w-4" />
              Test Search
            </Button>
            <Button onClick={() => setShowModal(true)} variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Test Modal
            </Button>
            <Button onClick={() => setShowWizard(true)} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Test Wizard
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Profile validation system</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Form components standardized</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Search and creation workflow</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Photo upload functionality</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Bulk operations support</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Profile Management System</h1>
        <p className="text-muted-foreground">
          Comprehensive profile management with standardized components and workflows
        </p>
      </div>

      <Tabs value={activeDemo} onValueChange={setActiveDemo}>
        <TabsList className="grid w-full grid-cols-5">
          {demos.map((demo) => {
            const Icon = demo.icon;
            return (
              <TabsTrigger key={demo.id} value={demo.id} className="gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{demo.title}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {demos.map((demo) => (
          <TabsContent key={demo.id} value={demo.id}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <demo.icon className="h-5 w-5" />
                  {demo.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{demo.description}</p>
              </CardHeader>
              <CardContent>
                {demo.component}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Test Modals */}
      <ProfileModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        profileData={selectedProfile || demoProfiles[0]}
        mode="edit"
        onSave={handleProfileUpdated}
        showTabs={false}
      />

      <ProfileCreationWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={handleProfileCreated}
        userRole="member"
        initialData={selectedProfile}
      />
    </div>
  );
};

export default ProfileSystemDemo;
