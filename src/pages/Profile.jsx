import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthQuery as useAuth } from '@/hooks/useAuthQuery';
import { useToast } from '@/hooks/use-toast.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit3, 
  Save, 
  X, 
  ArrowLeft,
  Shield,
  CreditCard
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          toast({
            title: "Error",
            description: "Failed to load profile data.",
            variant: "destructive",
          });
          return;
        }

        setProfileData(profile);
        setFormData(profile);
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, toast]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          name: `${formData.first_name} ${formData.last_name}`.trim(),
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: "Failed to update profile.",
          variant: "destructive",
        });
        return;
      }

      setProfileData(formData);
      setEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setFormData(profileData);
    setEditing(false);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'staff': return 'bg-blue-100 text-blue-800';
      case 'member': return 'bg-green-100 text-green-800';
      case 'nonmember': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
            <p className="text-gray-600 mb-6">Please sign in to view your profile.</p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 pt-8"
        >
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="absolute top-4 left-4 bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <h1 className="text-4xl font-bold text-white mb-4">
            My Profile
          </h1>
          <p className="text-xl text-white/90">
            Manage your personal information and account settings
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Profile Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="h-fit">
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">
                    {(profileData?.first_name || profileData?.name || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <CardTitle className="text-xl">
                  {profileData?.name || `${profileData?.first_name || ''} ${profileData?.last_name || ''}`.trim() || 'User'}
                </CardTitle>
                <Badge className={`${getRoleBadgeColor(profileData?.role)} capitalize`}>
                  <Shield className="w-3 h-3 mr-1" />
                  {profileData?.role || 'Member'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{profileData?.email}</span>
                </div>
                {profileData?.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{profileData.phone}</span>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    Joined {new Date(profileData?.created_at).toLocaleDateString()}
                  </span>
                </div>

                {profileData?.role === 'nonmember' && (
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      onClick={() => navigate('/join-online')}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Upgrade to Member
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Profile Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:col-span-2"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Personal Information
                  </CardTitle>
                </div>
                <div className="flex space-x-2">
                  {editing ? (
                    <>
                      <Button onClick={handleSave} size="sm" className="bg-green-600 hover:bg-green-700">
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button onClick={handleCancel} variant="outline" size="sm">
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setEditing(true)} variant="outline" size="sm">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="font-semibold mb-4">Basic Information</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name</Label>
                      {editing ? (
                        <Input
                          id="first_name"
                          value={formData.first_name || ''}
                          onChange={(e) => handleInputChange('first_name', e.target.value)}
                          placeholder="First Name"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-700">{profileData?.first_name || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name</Label>
                      {editing ? (
                        <Input
                          id="last_name"
                          value={formData.last_name || ''}
                          onChange={(e) => handleInputChange('last_name', e.target.value)}
                          placeholder="Last Name"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-700">{profileData?.last_name || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <p className="mt-1 text-sm text-gray-700">{profileData?.email}</p>
                      <p className="text-xs text-gray-500">Email cannot be changed</p>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      {editing ? (
                        <Input
                          id="phone"
                          value={formData.phone || ''}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="(555) 123-4567"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-700">{profileData?.phone || 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Address Information */}
                <div>
                  <h4 className="font-semibold mb-4 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Address Information
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Street Address</Label>
                      {editing ? (
                        <Input
                          id="address"
                          value={formData.address || ''}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="123 Main Street"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-700">{profileData?.address || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      {editing ? (
                        <Input
                          id="city"
                          value={formData.city || ''}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="City"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-700">{profileData?.city || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      {editing ? (
                        <Input
                          id="state"
                          value={formData.state || ''}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          placeholder="State"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-700">{profileData?.state || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="zip_code">ZIP Code</Label>
                      {editing ? (
                        <Input
                          id="zip_code"
                          value={formData.zip_code || ''}
                          onChange={(e) => handleInputChange('zip_code', e.target.value)}
                          placeholder="12345"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-700">{profileData?.zip_code || 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
