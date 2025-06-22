import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Calendar, CreditCard, Activity, Edit, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import MemberEditModal from '@/components/member/MemberEditModal';
import AssignPlanDialog from '@/components/member/AssignPlanDialog';

// Member Profile Service Functions
const memberProfileService = {
  async getMemberProfile(userId) {
    try {      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          memberships(
            id,
            status,
            membership_types(name, category)
          )
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      
      throw error;
    }
  },

  async updateMemberProfile(userId, profileData) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      
      throw error;
    }
  },

  async getMembershipLog(userId) {
    try {
      const { data, error } = await supabase
        .from('membership_log')
        .select(`
          *,
          membership_types(name, category)
        `)
        .eq('member_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      
      return [];
    }
  },

  async getBookings(userId) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          classes(name, start_time, end_time)
        `)
        .eq('member_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      
      return [];
    }
  }
};

const MemberProfilePage = () => {
  const [memberData, setMemberData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [membershipLog, setMembershipLog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignPlanModalOpen, setIsAssignPlanModalOpen] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchProfileData = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const [profileData, bookingsData, logData] = await Promise.all([
        memberProfileService.getMemberProfile(user.id),
        memberProfileService.getBookings(user.id),
        memberProfileService.getMembershipLog(user.id)
      ]);

      if (profileData) {
        setMemberData(profileData);
        setBookings(bookingsData.filter(r => r.status === 'Booked' || r.status === 'Cancelled'));
        setMembershipLog(logData || []);
      } else {
        toast({ title: "Error", description: "Could not load member details.", variant: "destructive" });
        navigate('/');
      }
    } catch (error) {
      
      toast({ title: "Error", description: "Failed to load profile data.", variant: "destructive" });
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, navigate, toast]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleEditProfile = () => setIsEditModalOpen(true);
  const handleOpenAssignPlanModal = () => setIsAssignPlanModalOpen(true);

  const handleSaveProfile = async (updatedFormData) => {
    if (!memberData?.id) return;
    try {
      const updatedProfile = await memberProfileService.updateMemberProfile(memberData.id, updatedFormData);
      setMemberData(updatedProfile);
      toast({ title: "Success", description: "Profile updated successfully!" });
      setIsEditModalOpen(false);
    } catch (error) {
      
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    }
  };

  const handlePlanAssignSuccess = () => {
    fetchProfileData(); // Refresh to show new plan
    setIsAssignPlanModalOpen(false);
    toast({ title: "Success", description: "Membership plan assigned successfully!" });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!memberData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
        <p className="text-muted-foreground mb-4">We couldn't load your profile information.</p>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6 p-4 md:p-6 lg:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <User className="h-8 w-8 mr-3" />
            Member Profile
          </h1>
          <p className="text-muted-foreground">Manage your account and membership information</p>
        </div>
        <Button onClick={handleEditProfile}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p>{memberData.name || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p>{memberData.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <p>{memberData.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="capitalize">{memberData.status || 'Active'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Membership Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Membership
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
              <p>{memberData.memberships?.[0]?.membership_types?.name || 'No active membership'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Category</p>
              <p>{memberData.memberships?.[0]?.membership_types?.category || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Member Since</p>
              <p>{memberData.created_at ? new Date(memberData.created_at).toLocaleDateString() : 'N/A'}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleOpenAssignPlanModal}
              className="w-full mt-4"
            >
              Change Plan
            </Button>
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
              <p>{bookings.length}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Bookings</p>
              <p>{bookings.filter(b => b.status === 'Booked').length}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Membership Changes</p>
              <p>{membershipLog.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Recent Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No bookings found</p>
          ) : (
            <div className="space-y-2">
              {bookings.slice(0, 5).map((booking, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{booking.classes?.name || 'Unknown Class'}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.classes?.start_time} - {booking.classes?.end_time}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      booking.status === 'Booked' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {booking.status}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <MemberEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProfile}
        memberData={memberData}
      />

      <AssignPlanDialog
        isOpen={isAssignPlanModalOpen}
        onClose={() => setIsAssignPlanModalOpen(false)}
        onSuccess={handlePlanAssignSuccess}
        member={memberData}
      />
    </motion.div>
  );
};

export default MemberProfilePage;



