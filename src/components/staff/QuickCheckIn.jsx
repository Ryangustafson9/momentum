import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  UserCheck, 
  UserX, 
  Clock,
  CheckCircle,
  XCircle,
  User,
  Scan
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

const QuickCheckIn = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Fetch recent check-ins on component mount
  useEffect(() => {
    fetchRecentCheckIns();
  }, []);

  // Search members when query changes
  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchMembers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchRecentCheckIns = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          member:profiles!member_id(first_name, last_name, email)
        `)
        .gte('check_in_time', today)
        .order('check_in_time', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentCheckIns(data || []);
    } catch (error) {
      console.error('Error fetching recent check-ins:', error);
    }
  };

  const searchMembers = async () => {
    try {
      setSearchLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone')
        .eq('role', 'member')
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching members:', error);
      toast({
        title: "Error",
        description: "Failed to search members",
        variant: "destructive",
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCheckIn = async (member) => {
    try {
      setLoading(true);

      // Check if member is already checked in today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingCheckIn } = await supabase
        .from('attendance')
        .select('*')
        .eq('member_id', member.id)
        .gte('check_in_time', today)
        .lt('check_in_time', today + 'T23:59:59')
        .maybeSingle();

      if (existingCheckIn) {
        toast({
          title: "Already Checked In",
          description: `${member.first_name} ${member.last_name} is already checked in today`,
          variant: "destructive",
        });
        return;
      }

      // Create check-in record
      const { error } = await supabase
        .from('attendance')
        .insert({
          member_id: member.id,
          member_name: `${member.first_name} ${member.last_name}`,
          check_in_time: new Date().toISOString(),
          status: 'Present',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Check-in Successful",
        description: `${member.first_name} ${member.last_name} has been checked in`,
      });

      // Clear search and refresh recent check-ins
      setSearchQuery('');
      setSearchResults([]);
      fetchRecentCheckIns();

    } catch (error) {
      console.error('Error checking in member:', error);
      toast({
        title: "Error",
        description: "Failed to check in member",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (attendanceId, memberName) => {
    try {
      const { error } = await supabase
        .from('attendance')
        .update({
          check_out_time: new Date().toISOString(),
          status: 'Left'
        })
        .eq('id', attendanceId);

      if (error) throw error;

      toast({
        title: "Check-out Successful",
        description: `${memberName} has been checked out`,
      });

      fetchRecentCheckIns();
    } catch (error) {
      console.error('Error checking out member:', error);
      toast({
        title: "Error",
        description: "Failed to check out member",
        variant: "destructive",
      });
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Check-in Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="w-5 h-5 mr-2" />
            Quick Check-in
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search member by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                {searchResults.map((member) => (
                  <motion.div
                    key={member.id}
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCheckIn(member)}
                      disabled={loading}
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      Check In
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {searchLoading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Searching...</p>
            </div>
          )}

          {searchQuery.length >= 2 && searchResults.length === 0 && !searchLoading && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">No members found</p>
            </div>
          )}

          {/* Quick Access Buttons */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-gray-700 mb-2">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">
                <Scan className="w-4 h-4 mr-2" />
                Scan Card
              </Button>
              <Button variant="outline" size="sm">
                <User className="w-4 h-4 mr-2" />
                Guest Check-in
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Check-ins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Today's Check-ins
            </div>
            <Badge variant="outline">{recentCheckIns.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentCheckIns.length > 0 ? (
              recentCheckIns.map((checkIn) => (
                <motion.div
                  key={checkIn.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      checkIn.status === 'Present' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {checkIn.status === 'Present' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {checkIn.member?.first_name} {checkIn.member?.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        In: {formatTime(checkIn.check_in_time)}
                        {checkIn.check_out_time && ` • Out: ${formatTime(checkIn.check_out_time)}`}
                      </p>
                    </div>
                  </div>
                  
                  {checkIn.status === 'Present' && !checkIn.check_out_time && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCheckOut(checkIn.id, checkIn.member_name)}
                    >
                      <UserX className="w-4 h-4 mr-1" />
                      Check Out
                    </Button>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No check-ins today</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickCheckIn;
