import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  CreditCard, 
  User, 
  Activity, 
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

const MemberDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    upcomingClasses: [],
    membershipInfo: null,
    recentActivity: [],
    billingInfo: null
  });

  // Fetch member dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
          // Fetch member profile and membership info
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            *,
            memberships(
              id,
              status,
              membership_types(name, category, price)
            )
          `)
          .eq('id', user.id)
          .single();

        if (profileError) {
          
          // Continue without membership info if profile fetch fails
        }

        // Fetch upcoming classes (mock data for now)
        const upcomingClasses = [
          { id: 1, name: 'Morning Yoga', time: '8:00 AM', date: 'Today' },
          { id: 2, name: 'HIIT Training', time: '6:00 PM', date: 'Tomorrow' }
        ];

        // Fetch recent activity (mock data for now)
        const recentActivity = [
          { id: 1, activity: 'Gym Check-in', time: '2 hours ago' },
          { id: 2, activity: 'Yoga Class Completed', time: 'Yesterday' },
          { id: 3, activity: 'Personal Training Session', time: '3 days ago' }
        ];

        setDashboardData({
          upcomingClasses,
          membershipInfo: profile,
          recentActivity,
          billingInfo: {
            nextPayment: 'Jan 15, 2025',
            amount: '$49.99',
            status: 'Active'
          }
        });

      } catch (error) {
        
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.first_name || 'Member'}!
        </h1>
        <p className="text-blue-100">
          Ready to continue your fitness journey today?
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membership Status</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>            <p className="text-xs text-muted-foreground">
              {dashboardData.membershipInfo?.memberships?.[0]?.membership_types?.name || 'Basic Plan'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes This Month</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +3 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Payment</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.billingInfo?.amount}</div>
            <p className="text-xs text-muted-foreground">
              Due {dashboardData.billingInfo?.nextPayment}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workout Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7 days</div>
            <p className="text-xs text-muted-foreground">
              Keep it up! 🔥
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.upcomingClasses.map((classItem) => (
                <div key={classItem.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <h4 className="font-medium">{classItem.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {classItem.date} at {classItem.time}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              ))}
              {dashboardData.upcomingClasses.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No upcoming classes scheduled
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="font-medium">{activity.activity}</p>
                    <p className="text-sm text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
              {dashboardData.recentActivity.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No recent activity
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-20 flex flex-col gap-2">
              <Calendar className="h-6 w-6" />
              Book a Class
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <User className="h-6 w-6" />
              Update Profile
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <CreditCard className="h-6 w-6" />
              View Billing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MemberDashboard;

