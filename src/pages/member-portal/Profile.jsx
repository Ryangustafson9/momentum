import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Edit,
  CheckCircle,
  Clock,
  MapPin,
  Camera,
  Save,
  X,
  TrendingUp,
  Activity,
  Target,
  Award,
  Settings,
  Shield,
  Users
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { format, differenceInDays, startOfMonth, endOfMonth } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/utils/logger';

const MemberProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: ''
  });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        // Fetch complete profile with membership and check-in data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            *,
            memberships:memberships!user_id(
              id,
              status,
              start_date,
              expiration_date,
              next_payment_date,
              membership_type:membership_types!membership_type_id(
                id,
                name,
                category,
                price,
                description
              )
            )
          `)
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // Fetch recent check-ins
        const { data: recentCheckIns, error: checkInError } = await supabase
          .from('checkin_history')
          .select('id, check_in_time, status, notes')
          .eq('profile_id', user.id)
          .order('check_in_time', { ascending: false })
          .limit(10);

        if (checkInError) {
          logger.error('Check-in error:', checkInError);
        }

        // Calculate comprehensive statistics
        const { data: allCheckIns, error: totalError } = await supabase
          .from('checkin_history')
          .select('id, check_in_time')
          .eq('profile_id', user.id);

        if (totalError) {
          logger.error('Total check-ins error:', totalError);
        }

        // Calculate monthly stats
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        const monthlyCheckIns = allCheckIns?.filter(checkIn => {
          const checkInDate = new Date(checkIn.check_in_time);
          return checkInDate >= monthStart && checkInDate <= monthEnd;
        }) || [];

        // Calculate streak
        const calculateStreak = (checkIns) => {
          if (!checkIns || checkIns.length === 0) return 0;

          const sortedCheckIns = checkIns
            .map(c => new Date(c.check_in_time))
            .sort((a, b) => b - a);

          let streak = 0;
          let currentDate = new Date();
          currentDate.setHours(0, 0, 0, 0);

          for (const checkInDate of sortedCheckIns) {
            checkInDate.setHours(0, 0, 0, 0);
            const daysDiff = differenceInDays(currentDate, checkInDate);

            if (daysDiff === streak) {
              streak++;
              currentDate.setDate(currentDate.getDate() - 1);
            } else if (daysDiff > streak) {
              break;
            }
          }

          return streak;
        };

        const workoutStreak = calculateStreak(allCheckIns);

        // Calculate membership duration
        const memberSince = new Date(profile.created_at);
        const membershipDays = differenceInDays(now, memberSince);

        setProfileData({
          ...profile,
          recentCheckIns: recentCheckIns || [],
          totalCheckIns: allCheckIns?.length || 0,
          monthlyCheckIns: monthlyCheckIns.length,
          workoutStreak,
          membershipDays,
          memberSince
        });

        // Initialize edit form
        setEditForm({
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          bio: profile.bio || '',
          emergency_contact_name: profile.emergency_contact_name || '',
          emergency_contact_phone: profile.emergency_contact_phone || '',
          emergency_contact_relationship: profile.emergency_contact_relationship || ''
        });

      } catch (error) {
        logger.error('Error fetching profile data:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchProfileData();
    }
  }, [user?.id, toast]);

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!profileData?.id) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editForm.first_name.trim(),
          last_name: editForm.last_name.trim(),
          phone: editForm.phone.trim(),
          bio: editForm.bio.trim(),
          emergency_contact_name: editForm.emergency_contact_name.trim(),
          emergency_contact_phone: editForm.emergency_contact_phone.trim(),
          emergency_contact_relationship: editForm.emergency_contact_relationship.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', profileData.id);

      if (error) throw error;

      // Update local state
      setProfileData(prev => ({
        ...prev,
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        phone: editForm.phone.trim(),
        bio: editForm.bio.trim(),
        emergency_contact_name: editForm.emergency_contact_name.trim(),
        emergency_contact_phone: editForm.emergency_contact_phone.trim(),
        emergency_contact_relationship: editForm.emergency_contact_relationship.trim()
      }));

      setIsEditDialogOpen(false);
      toast({
        title: "Profile Updated Successfully! ✅",
        description: "Your profile information has been saved.",
        variant: "default"
      });

    } catch (error) {
      logger.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "Unable to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Unable to load profile data</p>
      </div>
    );
  }

  const activeMembership = profileData.memberships?.find(m => m.status === 'active');
  const getInitials = () => {
    if (profileData.first_name && profileData.last_name) {
      return `${profileData.first_name[0]}${profileData.last_name[0]}`.toUpperCase();
    }
    return profileData.email?.[0]?.toUpperCase() || 'M';
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Profile Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="pt-8 pb-6">
          <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-4 lg:space-y-0 lg:space-x-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                <AvatarImage src={profileData.profile_picture_url} />
                <AvatarFallback className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-white border-2 border-gray-200 text-gray-600 hover:text-gray-800"
                variant="outline"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {profileData.first_name} {profileData.last_name}
              </h1>
              <p className="text-gray-600 mb-3">{profileData.email}</p>

              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-2 mb-4">
                <Badge variant={activeMembership ? "default" : "secondary"} className="px-3 py-1">
                  {activeMembership ? activeMembership.membership_type.name : 'No Active Membership'}
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  Member since {format(new Date(profileData.created_at), 'MMM yyyy')}
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {profileData.membershipDays} days
                </Badge>
              </div>

              {profileData.bio && (
                <p className="text-gray-600 text-sm max-w-md">{profileData.bio}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          value={editForm.first_name}
                          onChange={(e) => handleInputChange('first_name', e.target.value)}
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          value={editForm.last_name}
                          onChange={(e) => handleInputChange('last_name', e.target.value)}
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={editForm.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Phone number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={editForm.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        placeholder="Tell us about yourself..."
                        rows={3}
                      />
                    </div>

                    {/* Emergency Contact Section */}
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-orange-600" />
                        Emergency Contact
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                          <Input
                            id="emergency_contact_name"
                            value={editForm.emergency_contact_name}
                            onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                            placeholder="Emergency contact name"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                            <Input
                              id="emergency_contact_phone"
                              value={editForm.emergency_contact_phone}
                              onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                              placeholder="Emergency contact phone"
                              type="tel"
                            />
                          </div>
                          <div>
                            <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                            <Input
                              id="emergency_contact_relationship"
                              value={editForm.emergency_contact_relationship}
                              onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
                              placeholder="e.g., Spouse, Parent, Friend"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditDialogOpen(false)}
                        disabled={isUpdating}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpdateProfile}
                        disabled={isUpdating}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        {isUpdating ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Saving...
                          </div>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="membership" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Membership
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Achievements
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">Total Check-ins</p>
                        <p className="text-2xl font-bold text-blue-600">{profileData.totalCheckIns}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-900">Current Streak</p>
                        <p className="text-2xl font-bold text-green-600">{profileData.workoutStreak} days</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Calendar className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-purple-900">This Month</p>
                        <p className="text-2xl font-bold text-purple-600">{profileData.monthlyCheckIns}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{profileData.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{profileData.phone || 'Not provided'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Member Since</p>
                        <p className="font-medium">{format(new Date(profileData.created_at), 'MMMM d, yyyy')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Shield className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Account Status</p>
                        <p className="font-medium text-green-600">Active</p>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="pt-4 border-t border-border/50">
                    <h5 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Shield className="h-3 w-3 text-orange-600" />
                      Emergency Contact
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                        <User className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="text-sm text-orange-700">Contact Name</p>
                          <p className="font-medium text-orange-900">
                            {profileData.emergency_contact_name || 'Not provided'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                        <Phone className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="text-sm text-orange-700">Contact Phone</p>
                          <p className="font-medium text-orange-900">
                            {profileData.emergency_contact_phone || 'Not provided'}
                          </p>
                        </div>
                      </div>

                      {profileData.emergency_contact_relationship && (
                        <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                          <Users className="h-5 w-5 text-orange-500" />
                          <div>
                            <p className="text-sm text-orange-700">Relationship</p>
                            <p className="font-medium text-orange-900">
                              {profileData.emergency_contact_relationship}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Overview */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Activity Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{profileData.totalCheckIns}</div>
                  <p className="text-sm text-gray-600">Total Visits</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="font-semibold">{profileData.monthlyCheckIns}</span>
                  </div>
                  <Progress value={(profileData.monthlyCheckIns / 20) * 100} className="h-2" />
                  <p className="text-xs text-gray-500">Goal: 20 visits/month</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Streak</span>
                    <span className="font-semibold">{profileData.workoutStreak} days</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(7)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 w-full rounded ${
                          i < profileData.workoutStreak ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Weekly streak progress</p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Check-ins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {profileData.recentCheckIns.length > 0 ? (
                    profileData.recentCheckIns.map((checkIn) => (
                      <div key={checkIn.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <MapPin className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">Gym Check-in</p>
                            {checkIn.notes && (
                              <p className="text-sm text-gray-600">{checkIn.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {format(new Date(checkIn.check_in_time), 'MMM d')}
                          </p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(checkIn.check_in_time), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No check-ins yet</p>
                      <p className="text-sm text-gray-400">Start your fitness journey today!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Membership Tab */}
        <TabsContent value="membership" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Membership Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeMembership ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{activeMembership.membership_type.name}</h3>
                      <p className="text-gray-600">{activeMembership.membership_type.description || 'Premium gym membership'}</p>
                      <Badge variant="default" className="mt-2">Active</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-600">${activeMembership.membership_type.price}</p>
                      <p className="text-sm text-gray-500">per month</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Start Date</p>
                      <p className="font-semibold">{format(new Date(activeMembership.start_date), 'MMM d, yyyy')}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Next Payment</p>
                      <p className="font-semibold">
                        {activeMembership.next_payment_date
                          ? format(new Date(activeMembership.next_payment_date), 'MMM d, yyyy')
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Membership Type</p>
                      <p className="font-semibold">{activeMembership.membership_type.category}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => navigate('/member-portal/billing')}>
                      View Billing
                    </Button>
                    <Button variant="outline">
                      Upgrade Plan
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Membership</h3>
                  <p className="text-gray-500 mb-4">Join our gym to start your fitness journey</p>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Browse Plans
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Achievement Cards */}
            <Card className="border-2 border-yellow-200 bg-yellow-50">
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-yellow-100 rounded-full w-fit mx-auto mb-4">
                  <Award className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="font-bold text-yellow-900 mb-2">First Check-in</h3>
                <p className="text-sm text-yellow-700">Completed your first gym visit</p>
                <Badge variant="secondary" className="mt-2 bg-yellow-100 text-yellow-800">
                  Earned
                </Badge>
              </CardContent>
            </Card>

            <Card className={`border-2 ${profileData.workoutStreak >= 7 ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
              <CardContent className="p-6 text-center">
                <div className={`p-3 rounded-full w-fit mx-auto mb-4 ${profileData.workoutStreak >= 7 ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <TrendingUp className={`h-8 w-8 ${profileData.workoutStreak >= 7 ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <h3 className={`font-bold mb-2 ${profileData.workoutStreak >= 7 ? 'text-green-900' : 'text-gray-500'}`}>
                  Week Warrior
                </h3>
                <p className={`text-sm ${profileData.workoutStreak >= 7 ? 'text-green-700' : 'text-gray-500'}`}>
                  7-day workout streak
                </p>
                <Badge variant="secondary" className={`mt-2 ${profileData.workoutStreak >= 7 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {profileData.workoutStreak >= 7 ? 'Earned' : 'Locked'}
                </Badge>
              </CardContent>
            </Card>

            <Card className={`border-2 ${profileData.totalCheckIns >= 50 ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-gray-50'}`}>
              <CardContent className="p-6 text-center">
                <div className={`p-3 rounded-full w-fit mx-auto mb-4 ${profileData.totalCheckIns >= 50 ? 'bg-purple-100' : 'bg-gray-100'}`}>
                  <Target className={`h-8 w-8 ${profileData.totalCheckIns >= 50 ? 'text-purple-600' : 'text-gray-400'}`} />
                </div>
                <h3 className={`font-bold mb-2 ${profileData.totalCheckIns >= 50 ? 'text-purple-900' : 'text-gray-500'}`}>
                  Gym Regular
                </h3>
                <p className={`text-sm ${profileData.totalCheckIns >= 50 ? 'text-purple-700' : 'text-gray-500'}`}>
                  50 total check-ins
                </p>
                <Badge variant="secondary" className={`mt-2 ${profileData.totalCheckIns >= 50 ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>
                  {profileData.totalCheckIns >= 50 ? 'Earned' : `${profileData.totalCheckIns}/50`}
                </Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MemberProfile;
