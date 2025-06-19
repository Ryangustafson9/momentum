import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Users, UserPlus, Settings } from 'lucide-react';
import { useProfileFetcher } from '@/hooks/useProfileFetcher';
import profileUtils from '@/utils/profileUtils';
import { useToast } from '@/hooks/use-toast';

/**
 * Example admin component demonstrating the new profile utilities
 * This shows how the extracted profile functionality can be reused
 * in admin tools and other parts of the application
 */
const AdminProfileManager = () => {
  const [profiles, setProfiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [stats, setStats] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  
  const { fetchUserProfile, loading } = useProfileFetcher();
  const { toast } = useToast();

  // Load profile statistics on component mount
  useEffect(() => {
    loadProfileStats();
  }, []);

  const loadProfileStats = async () => {
    try {
      const profileStats = await profileUtils.getProfileStats();
      setStats(profileStats);
    } catch (error) {
      console.error('Failed to load profile stats:', error);
      toast({
        title: "Error",
        description: "Failed to load profile statistics",
        variant: "destructive"
      });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() && !selectedRole) {
      setProfiles([]);
      return;
    }

    setIsSearching(true);
    try {
      const searchResults = await profileUtils.searchProfiles({
        query: searchQuery,
        role: selectedRole || null,
        limit: 20
      });
      setProfiles(searchResults);
      
      toast({
        title: "Search Complete",
        description: `Found ${searchResults.length} profiles`
      });
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: "Search Failed",
        description: "Failed to search profiles",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleBulkRoleUpdate = async (targetRole) => {
    if (profiles.length === 0) return;

    try {
      const updates = profiles.map(profile => ({
        id: profile.id,
        updates: { role: targetRole }
      }));

      const result = await profileUtils.bulkUpdateProfiles(updates);
      
      toast({
        title: "Bulk Update Complete",
        description: `Updated ${result.successful.length} profiles, ${result.failed.length} failed`
      });

      // Refresh the search results
      await handleSearch();
      await loadProfileStats();
    } catch (error) {
      console.error('Bulk update failed:', error);
      toast({
        title: "Bulk Update Failed",
        description: "Failed to update profiles",
        variant: "destructive"
      });
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      staff: 'bg-blue-100 text-blue-800',
      member: 'bg-green-100 text-green-800',
      nonmember: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || colors.nonmember;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center space-x-2">
        <Users className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Profile Management</h1>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Profiles</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.admin || 0}</div>
              <div className="text-sm text-gray-600">Admins</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.staff || 0}</div>
              <div className="text-sm text-gray-600">Staff</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.member || 0}</div>
              <div className="text-sm text-gray-600">Members</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-600">{stats.nonmember || 0}</div>
              <div className="text-sm text-gray-600">Non-members</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search Profiles</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Search Query</label>
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Role Filter</label>
              <select
                className="px-3 py-2 border rounded-md"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="member">Member</option>
                <option value="nonmember">Non-member</option>
              </select>
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isSearching}
              className="px-6"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {profiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Bulk Actions ({profiles.length} profiles)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => handleBulkRoleUpdate('member')}
                className="text-green-600 hover:bg-green-50"
              >
                Set as Members
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleBulkRoleUpdate('staff')}
                className="text-blue-600 hover:bg-blue-50"
              >
                Set as Staff
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleBulkRoleUpdate('nonmember')}
                className="text-gray-600 hover:bg-gray-50"
              >
                Set as Non-members
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Results */}
      {profiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profiles.map((profile) => (
                <div 
                  key={profile.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {profile.first_name} {profile.last_name} {!profile.first_name && !profile.last_name && 'Unnamed User'}
                    </div>
                    <div className="text-sm text-gray-600">{profile.email}</div>
                    <div className="text-xs text-gray-500">ID: {profile.id}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getRoleColor(profile.role)}>
                      {profile.role}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading profiles...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && profiles.length === 0 && (searchQuery || selectedRole) && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No profiles found matching your search criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminProfileManager;
