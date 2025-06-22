import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  X,
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Settings,
  ChevronDown,
  Download,
  PlusCircle
} from 'lucide-react';
import { MemberProfileService } from '@/services/memberProfileService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient';

const AdvancedMemberSearchModal = ({ 
  isOpen, 
  onClose, 
  onSelectMember,
  navigate 
}) => {  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [membershipFilter, setMembershipFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [joinDateFilter, setJoinDateFilter] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  // Fetch membership types for filter options
  useEffect(() => {
    const fetchMembershipTypes = async () => {
      try {
        const { data } = await supabase
          .from('membership_types')
          .select('id, name, category')
          .order('name');
        setMembershipTypes(data || []);
      } catch (error) {
        
      }
    };

    if (isOpen) {
      fetchMembershipTypes();
    }
  }, [isOpen]);
  // Perform advanced search
  const performAdvancedSearch = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          memberships(
            id,
            status,
            start_date,
            end_date,
            membership_types(id, name, category)
          )
        `, { count: 'exact' })
        .order('first_name', { ascending: true });

      // Apply text search
      if (searchTerm.trim()) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,system_member_id.ilike.%${searchTerm}%`);
      }

      // Apply role filter
      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      // Apply join date filter
      if (joinDateFilter !== 'all') {
        const now = new Date();
        let dateThreshold;
        
        switch (joinDateFilter) {
          case 'week':
            dateThreshold = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            dateThreshold = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case 'quarter':
            dateThreshold = new Date(now.setMonth(now.getMonth() - 3));
            break;
          case 'year':
            dateThreshold = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        }
        
        if (dateThreshold) {
          query = query.gte('created_at', dateThreshold.toISOString());
        }
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setTotalCount(count || 0);

      // Process and filter results
      let processedResults = (data || []).map(profile => ({
        ...profile,
        name: profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
        current_membership: profile.memberships?.[0] || null,
      }));

      // Apply membership filter
      if (membershipFilter !== 'all') {
        if (membershipFilter === 'none') {
          processedResults = processedResults.filter(member => !member.current_membership);
        } else {
          processedResults = processedResults.filter(member => 
            member.current_membership?.membership_types?.id === membershipFilter
          );
        }
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        processedResults = processedResults.filter(member => {
          const memberStatus = member.current_membership?.status || 'inactive';
          return memberStatus === statusFilter;
        });
      }

      setResults(processedResults);
    } catch (error) {
      
      setResults([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };
  // Auto-search when filters change
  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => {
        performAdvancedSearch();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, statusFilter, membershipFilter, roleFilter, joinDateFilter, isOpen]);  // Reset filters when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setStatusFilter('all');
      setMembershipFilter('all');
      setRoleFilter('all');
      setJoinDateFilter('all');
      setResults([]);
      setTotalCount(0);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleSelectMember = (member) => {
    onSelectMember?.(member);
    if (navigate) {
      navigate(`/staff-portal/member/${member.id}`);
    }
    onClose();
  };

  const handleCreateNewMember = async () => {
    if (isCreatingProfile) return; // Prevent double-clicks

    setIsCreatingProfile(true);

    try {
      // Create temporary profile from search query
      const { data: newProfile, error } = await MemberProfileService.createFromSearchQuery(searchTerm);

      if (error) {
        throw error;
      }

      if (!newProfile) {
        throw new Error('Failed to create profile');
      }

      toast({
        title: "Profile Created",
        description: `Created draft profile for ${newProfile.first_name} ${newProfile.last_name}`,
      });

      // Navigate to the new profile page
      if (navigate) {
        navigate(`/staff-portal/member/${newProfile.system_member_id}`);
      }
      onClose();

    } catch (error) {
      
      toast({
        title: "Error",
        description: `Failed to create profile: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsCreatingProfile(false);
    }
  };
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'staff': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'member': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleExportResults = () => {
    if (results.length === 0) return;

    // Prepare CSV data
    const csvHeaders = ['Name', 'Email', 'Phone', 'Role', 'Membership Plan', 'Status', 'Join Date'];
    const csvData = results.map(member => [
      member.name || '',
      member.email || '',
      member.phone || '',
      member.role || 'member',
      member.current_membership?.membership_types?.name || 'No membership',
      member.current_membership?.status || 'inactive',
      member.created_at ? new Date(member.created_at).toLocaleDateString() : ''
    ]);

    // Create CSV content
    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `member-search-results-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Member Search
          </DialogTitle>
          <DialogDescription>
            Search and filter members with advanced criteria
          </DialogDescription>
        </DialogHeader>        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Search Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Search Text
              </label>
              <Input
                placeholder="Name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Role
              </label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Membership Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Membership Plan
              </label>
              <Select value={membershipFilter} onValueChange={setMembershipFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Plans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="none">No Membership</SelectItem>
                  {membershipTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Joined
              </label>
              <Select value={joinDateFilter} onValueChange={setJoinDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Any time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any time</SelectItem>
                  <SelectItem value="week">Last week</SelectItem>
                  <SelectItem value="month">Last month</SelectItem>
                  <SelectItem value="quarter">Last 3 months</SelectItem>
                  <SelectItem value="year">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">
                Search Results ({results.length}{totalCount !== results.length ? ` of ${totalCount}` : ''})
              </h3>
              <div className="flex items-center gap-2">
                {loading && (
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Searching...
                  </div>
                )}                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setMembershipFilter('all');
                    setRoleFilter('all');
                    setJoinDateFilter('all');
                  }}
                  className="text-xs"
                >
                  Clear Filters
                </Button>
                {results.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportResults}
                    className="text-xs"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export CSV
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {results.map(member => (
                <Card 
                  key={member.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSelectMember(member)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-gray-900 truncate">
                            {member.name}
                          </h4>
                          <Badge className={getRoleColor(member.role)}>
                            {member.role || 'member'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          {member.email && (
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {member.email}
                            </div>
                          )}
                          {member.phone && (
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {member.phone}
                            </div>
                          )}
                          {member.current_membership ? (
                            <div className="flex items-center">
                              <CreditCard className="h-3 w-3 mr-1" />
                              {member.current_membership.membership_types?.name}
                            </div>
                          ) : (
                            <div className="flex items-center text-gray-400">
                              <CreditCard className="h-3 w-3 mr-1" />
                              No membership
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Always show Create New Member option when there's a search term and results exist */}
              {!loading && results.length > 0 && searchTerm.trim().length >= 2 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={isCreatingProfile ? undefined : handleCreateNewMember}
                    disabled={isCreatingProfile}
                    className="w-full text-primary hover:text-primary/80 border-primary hover:border-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingProfile ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    ) : (
                      <PlusCircle className="mr-2 h-4 w-4" />
                    )}
                    {isCreatingProfile ? 'Creating Profile...' : (
                      <>
                        Create New Member: {(() => {
                          const nameParts = searchTerm.trim().split(/\s+/);
                          const firstName = nameParts[0] || '';
                          const lastName = nameParts.slice(1).join(' ') || '';
                          return (
                            <span className="font-semibold">
                              {firstName} {lastName}
                            </span>
                          );
                        })()}
                      </>
                    )}
                  </Button>
                </div>
              )}

              {!loading && results.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No members found matching your criteria</p>
                  <p className="text-sm mb-4">Try adjusting your search filters</p>

                  {/* Show Create New Member option if there's a search term */}
                  {searchTerm.trim().length >= 2 && (
                    <Button
                      variant="outline"
                      onClick={isCreatingProfile ? undefined : handleCreateNewMember}
                      disabled={isCreatingProfile}
                      className="mt-2 text-primary hover:text-primary/80 border-primary hover:border-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingProfile ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                      ) : (
                        <PlusCircle className="mr-2 h-4 w-4" />
                      )}
                      {isCreatingProfile ? 'Creating Profile...' : (
                        <>
                          Create New Member: {(() => {
                            const nameParts = searchTerm.trim().split(/\s+/);
                            const firstName = nameParts[0] || '';
                            const lastName = nameParts.slice(1).join(' ') || '';
                            return (
                              <span className="font-semibold">
                                {firstName} {lastName}
                              </span>
                            );
                          })()}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdvancedMemberSearchModal;

