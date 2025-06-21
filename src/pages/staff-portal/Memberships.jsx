import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, ListFilter, Search, Award, Settings as SettingsIcon, Users, Shield, Package, Ticket, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast.js';
import { supabase } from '@/lib/supabaseClient';
import MembershipFormDialog from '@/components/admin/memberships/MembershipFormDialog';
import MembershipTable from '@/components/admin/memberships/MembershipTable';
import ColumnVisibilityDropdown from '@/components/admin/memberships/ColumnVisibilityDropdown';
import DeleteMembershipDialog from '@/components/admin/memberships/DeleteMembershipDialog';
import BillingScheduleDialog from '@/components/admin/memberships/BillingScheduleDialog';
import { useDebounce } from '@/hooks/useDebounce.js';

// Loading Spinner Component
const LoadingSpinner = ({ text = "Loading...", className = "" }) => (
  <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    {text && <p className="text-sm text-muted-foreground">{text}</p>}
  </div>
);

const initialColumnVisibility = {
  name: true,
  price: true,
  billing_type: true,
  duration_months: true,
  features: false,
  category: true,
  color: false,
  role_id: true,
  available_for_sale: true,
  available_online: true,
  actions: true,
};



// Membership Service Functions
const membershipService = {
  async getMembershipTypes() {
    try {
      // First get all membership types
      const { data: membershipTypes, error: membershipError } = await supabase
        .from('membership_types')
        .select('*')
        .order('created_at', { ascending: false });

      if (membershipError) throw membershipError;

      // Then get staff roles for those that have role_id
      const { data: staffRoles, error: rolesError } = await supabase
        .from('staff_roles')
        .select('id, name, description');

      if (rolesError) throw rolesError;

      // Map staff roles to membership types
      const mappedData = membershipTypes?.map(item => {
        const staffRole = staffRoles?.find(role => role.id === item.role_id);
        return {
          ...item,
          staff_role: staffRole || null
        };
      }) || [];

      return mappedData;
    } catch (error) {
      console.error('Error fetching membership types:', error);
      throw error;
    }
  },

  async addMembershipType(typeData) {
    try {
      const { data, error } = await supabase
        .from('membership_types')
        .insert([{
          ...typeData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding membership type:', error);
      throw error;
    }
  },

  async updateMembershipType(id, typeData) {
    try {
      const { data, error } = await supabase
        .from('membership_types')
        .update({
          ...typeData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating membership type:', error);
      throw error;
    }
  },

  async deleteMembershipType(id) {
    try {
      const { error } = await supabase
        .from('membership_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting membership type:', error);
      throw error;
    }
  }
};

const MembershipsPageHeader = React.memo(() => (
  <div className="p-6 pb-4">
    <div>
      <h1 className="text-4xl font-bold tracking-tight flex items-center text-slate-900 dark:text-slate-50">
        <Award className="mr-3 h-9 w-9 text-primary" /> Membership Plans
      </h1>
      <p className="text-muted-foreground mt-1.5">
        Manage Member Plans, Staff Plans, Add-ons, and Guest Plans. Configure pricing, features, and availability.
      </p>
    </div>
  </div>
));
MembershipsPageHeader.displayName = 'MembershipsPageHeader';

const MembershipsFilterControlsAndTabs = React.memo(({
  searchTerm,
  setSearchTerm,
  columnVisibility,
  setColumnVisibility,
  allColumns,
  uniqueCategoriesForTabs,
  activeTabCategory,
  setActiveTabCategory,
  onAddNewPlan
}) => {  const getAddButtonText = (category) => {
    if (category === 'All') return 'Add New Plan';
    return `Add ${category} Plan`;
  };
  const getAddButtonIcon = (category) => {
    switch (category) {
      case 'Membership': return <Users className="mr-2 h-4 w-4" />;
      case 'Staff': return <Shield className="mr-2 h-4 w-4" />;
      case 'Add-on': return <Package className="mr-2 h-4 w-4" />;
      case 'Guest': return <Ticket className="mr-2 h-4 w-4" />;
      default: return <PlusCircle className="mr-2 h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4 px-6 pt-4 pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
      {/* Search and Controls Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Search plans by name, category, or features..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:border-primary dark:focus:border-primary rounded-lg h-11"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
        </div>
        <div className="flex items-center gap-3">
          <ColumnVisibilityDropdown
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
            allColumns={allColumns}
            triggerButton={
              <Button variant="outline" className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 h-11 px-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                <SettingsIcon className="h-4 w-4 mr-2 text-slate-500 dark:text-slate-400" />
                <span className="hidden sm:inline">Columns</span>
                <span className="sr-only">View Options</span>
              </Button>
            }
          />
          <Button
            onClick={() => onAddNewPlan(activeTabCategory)}
            variant="default"
            className="h-11 px-4 rounded-lg bg-primary hover:bg-primary/90"
          >
            {getAddButtonIcon(activeTabCategory)}
            <span className="hidden sm:inline">{getAddButtonText(activeTabCategory)}</span>
            <span className="sm:hidden">Add Plan</span>
          </Button>
        </div>
      </div>

      {/* Category Tabs Row */}
      <div className="overflow-x-auto">
        <Tabs defaultValue={activeTabCategory} onValueChange={setActiveTabCategory} className="w-full">
          <TabsList className="bg-transparent p-0 h-auto flex-nowrap whitespace-nowrap min-w-max">
            {uniqueCategoriesForTabs.map(category => (
              <TabsTrigger
                key={category.value}
                value={category.value}
                className="
                  px-4 py-2.5 mr-3 text-sm font-medium rounded-lg min-w-max
                  data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md
                  hover:bg-slate-100 dark:hover:bg-slate-800
                  text-slate-600 dark:text-slate-300
                  data-[state=active]:text-white
                  transition-all duration-200 ease-in-out
                  border border-transparent data-[state=active]:border-primary/20
                "
              >
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
});
MembershipsFilterControlsAndTabs.displayName = 'MembershipsFilterControlsAndTabs';

const StatsCardSkeleton = () => (
  <Card className="p-6 animate-pulse">
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
      <div className="flex-1">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20 mb-2"></div>
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-12 mb-2"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
      </div>
    </div>
  </Card>
);

const MembershipStatsCards = React.memo(({ membershipTypes, isLoading }) => {
  const stats = React.useMemo(() => {
    const memberPlans = membershipTypes.filter(t => ['Membership', 'Member Plans'].includes(t.category));
    const staffPlans = membershipTypes.filter(t => ['Staff', 'Staff Plans'].includes(t.category));
    const addons = membershipTypes.filter(t => ['Add-On', 'Add-on', 'Add-ons'].includes(t.category));
    const guestPlans = membershipTypes.filter(t => ['Guest', 'Guest Plans'].includes(t.category));

    return {
      memberPlans: {
        count: memberPlans.length,
        available: memberPlans.filter(p => p.available_for_sale !== false).length,
        online: memberPlans.filter(p => p.available_online).length
      },
      staffPlans: {
        count: staffPlans.length,
        available: staffPlans.filter(p => p.available_for_sale !== false).length,
        online: staffPlans.filter(p => p.available_online).length
      },
      addons: {
        count: addons.length,
        available: addons.filter(p => p.available_for_sale !== false).length,
        online: addons.filter(p => p.available_online).length
      },
      guestPlans: {
        count: guestPlans.length,
        available: guestPlans.filter(p => p.available_for_sale !== false).length,
        online: guestPlans.filter(p => p.available_online).length
      }
    };
  }, [membershipTypes]);

  const StatCard = ({ icon, title, count, available, online, color }) => (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-transparent hover:border-l-primary">
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-xl ${color} shadow-sm`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">{count}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${available > 0 ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
              <p className="text-xs text-muted-foreground">
                {available} available for sale
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${online > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <p className="text-xs text-muted-foreground">
                {online} available online
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6 py-6">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6 py-6">
      <StatCard
        icon={<Users className="h-6 w-6 text-white" />}
        title="Membership"
        count={stats.memberPlans.count}
        available={stats.memberPlans.available}
        online={stats.memberPlans.online}
        color="bg-gradient-to-br from-blue-500 to-blue-600"
      />
      <StatCard
        icon={<Package className="h-6 w-6 text-white" />}
        title="Add-On"
        count={stats.addons.count}
        available={stats.addons.available}
        online={stats.addons.online}
        color="bg-gradient-to-br from-green-500 to-green-600"
      />
      <StatCard
        icon={<Ticket className="h-6 w-6 text-white" />}
        title="Guest"
        count={stats.guestPlans.count}
        available={stats.guestPlans.available}
        online={stats.guestPlans.online}
        color="bg-gradient-to-br from-orange-500 to-orange-600"
      />
      <StatCard
        icon={<Shield className="h-6 w-6 text-white" />}
        title="Staff"
        count={stats.staffPlans.count}
        available={stats.staffPlans.available}
        online={stats.staffPlans.online}
        color="bg-gradient-to-br from-purple-500 to-purple-600"
      />
    </div>
  );
});
MembershipStatsCards.displayName = 'MembershipStatsCards';

const getUniqueCategoriesForTabs = () => {
  // Always show only the standard tabs - no custom categories to avoid duplicates
  const tabItems = [
    { value: 'All', label: 'All' },
    { value: 'Membership', label: 'Membership' },
    { value: 'Add-on', label: 'Add-On' },
    { value: 'Guest', label: 'Guest' },
    { value: 'Staff', label: 'Staff' }
  ];

  return tabItems;
};

const MembershipsPage = () => {
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBillingDialogOpen, setIsBillingDialogOpen] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [membershipToDelete, setMembershipToDelete] = useState(null);
  const [membershipForBilling, setMembershipForBilling] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTabCategory, setActiveTabCategory] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'category', direction: 'asc' });
  const [columnVisibility, setColumnVisibility] = useState(() => {
    const saved = localStorage.getItem('membershipTypesColumnVisibility');
    return saved ? JSON.parse(saved) : initialColumnVisibility;
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { toast } = useToast();
  const fetchMembershipTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Fetching membership types from database...');
      const data = await membershipService.getMembershipTypes();
      console.log('✅ Membership types fetched:', data);
      console.log('✅ Number of membership types:', data?.length || 0);
      setMembershipTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Failed to fetch membership types:', error);
      toast({ title: 'Error', description: `Failed to fetch membership types: ${error.message}`, variant: 'destructive' });
      setMembershipTypes([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMembershipTypes();
  }, [fetchMembershipTypes]);

  useEffect(() => {
    localStorage.setItem('membershipTypesColumnVisibility', JSON.stringify(columnVisibility));
  }, [columnVisibility]);  const handleCreateNew = useCallback((category = null) => {
    // Map tab categories to database categories
    const categoryMap = {
      'Membership': 'Membership',
      'Add-on': 'Add-On',        // Use the actual database category
      'Guest': 'Guest',
      'Staff': 'Staff'
    };
    const defaultCategory = category && category !== 'All' ? (categoryMap[category] || category) : 'Membership';
    setSelectedMembership({ category: defaultCategory });
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((type) => {
    setSelectedMembership(type);
    setIsFormOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((type) => {
    setMembershipToDelete(type);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleViewBilling = useCallback((type) => {
    setMembershipForBilling(type);
    setIsBillingDialogOpen(true);
  }, []);

  const handleSort = useCallback((key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!membershipToDelete) return;
    try {
      console.log('🗑️ Deleting membership type:', membershipToDelete.id);
      await membershipService.deleteMembershipType(membershipToDelete.id);
      toast({ title: 'Success', description: `Membership type "${membershipToDelete.name}" deleted successfully.` });
      fetchMembershipTypes(); // Refetch after delete
    } catch (error) {
      console.error('❌ Failed to delete membership type:', error);
      toast({ title: 'Error', description: `Failed to delete membership type: ${error.message}`, variant: 'destructive' });
    } finally {
      setIsDeleteDialogOpen(false);
      setMembershipToDelete(null);
    }
  }, [membershipToDelete, toast, fetchMembershipTypes]);

  const handleSaveMembershipType = useCallback(async (typeData) => {
    try {
      console.log('💾 Saving membership type:', typeData);

      if (typeData.id) {
        // Update an existing membership type
        await membershipService.updateMembershipType(typeData.id, typeData);
      } else {
        // Create a new membership type
        await membershipService.addMembershipType(typeData);

        // If the membership type is being assigned to a user, update their role
        if (typeData.memberId) {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({ role: "member" })
            .eq("id", typeData.memberId);

          if (profileError) {
            console.error("Error updating user role:", profileError.message);
          } else {
            console.log("User role updated to member!");
          }
        }
      }

      toast({
        title: "Success",
        description: `Membership type ${typeData.id ? "updated" : "created"} successfully.`,
      });

      fetchMembershipTypes(); // Refetch after save
      setIsFormOpen(false);
    } catch (error) {
      console.error('❌ Failed to save membership type:', error);
      toast({
        title: "Error",
        description: `Failed to save membership type: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [toast, fetchMembershipTypes]);
  
  const uniqueCategoriesForTabs = useMemo(() => getUniqueCategoriesForTabs(), []);  const filteredMembershipTypes = useMemo(() => {
    // First filter the data
    const filtered = membershipTypes.filter(type => {
      const nameMatch = type.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ?? false;
      const categorySearchMatch = type.category?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ?? false;
      const featuresMatch = type.features?.some(feature =>
        feature.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      ) ?? false;
      const matchesSearch = nameMatch || categorySearchMatch || featuresMatch;

      let matchesCategory;
      if (activeTabCategory === 'All') {
        matchesCategory = true;
      } else {
        // Map the tab categories to database categories
        const categoryMap = {
          'Membership': ['Membership', 'Member Plans'],
          'Add-on': ['Add-On', 'Add-on', 'Add-ons'],  // Handle all variants
          'Guest': ['Guest', 'Guest Plans'],
          'Staff': ['Staff', 'Staff Plans']
        };

        const dbCategories = categoryMap[activeTabCategory];
        if (Array.isArray(dbCategories)) {
          matchesCategory = dbCategories.includes(type.category);
        } else {
          matchesCategory = type.category === activeTabCategory;
        }
      }      const result = matchesSearch && matchesCategory;
      return result;
    });

    // Then sort the filtered data
    return filtered.sort((a, b) => {
      const { key, direction } = sortConfig;
      let aValue = a[key];
      let bValue = b[key];

      // Handle different data types
      if (key === 'price') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      }

      if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [membershipTypes, debouncedSearchTerm, activeTabCategory, sortConfig]);

  if (isLoading && membershipTypes.length === 0) {
    return <LoadingSpinner text="Loading membership plans..." className="min-h-[calc(100vh-10rem)]"/>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-card dark:bg-slate-900/80 backdrop-blur-sm shadow-xl border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <MembershipsPageHeader />

        <MembershipStatsCards membershipTypes={membershipTypes} isLoading={isLoading} />

        <CardContent className="p-0">
          <MembershipsFilterControlsAndTabs
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
            allColumns={initialColumnVisibility}
            uniqueCategoriesForTabs={uniqueCategoriesForTabs}
            activeTabCategory={activeTabCategory}
            setActiveTabCategory={setActiveTabCategory}
            onAddNewPlan={handleCreateNew}
          />
          
          {isLoading && membershipTypes.length > 0 && <div className="text-center py-4 text-muted-foreground">Refreshing plan list...</div>}
          
          {!isLoading && filteredMembershipTypes.length === 0 ? (
             <div className="px-6 pb-8">
               <div className="text-center py-12">
                 <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                   <ListFilter className="h-12 w-12 text-slate-400 dark:text-slate-500" />
                 </div>                 <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                   {searchTerm || activeTabCategory !== 'All' ? 'No Plans Match Your Criteria' : 'No Membership Plans Found'}
                 </h3>
                 <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                   {searchTerm || activeTabCategory !== 'All'
                     ? "Try adjusting your search terms or filters to find the plans you're looking for."
                     : "Get started by creating your first membership plan. You can set up member plans, staff plans, add-ons, and guest options."
                   }
                 </p>
                 <div className="flex flex-col sm:flex-row gap-3 justify-center">
                   <Button onClick={() => handleCreateNew(activeTabCategory)} className="bg-primary hover:bg-primary/90">
                     <PlusCircle className="mr-2 h-4 w-4" />
                     {searchTerm || activeTabCategory !== 'All' ? 'Create New Plan' : 'Create First Plan'}
                   </Button>
                   {(searchTerm || activeTabCategory !== 'All') && (
                     <Button
                       variant="outline"
                       onClick={() => {
                         setSearchTerm('');
                         setActiveTabCategory('All');
                       }}
                     >
                       Clear Filters
                     </Button>
                   )}
                 </div>
               </div>
             </div>
          ) : (
            <MembershipTable
              types={filteredMembershipTypes}
              columnVisibility={columnVisibility}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
              onViewBilling={handleViewBilling}
              searchTerm={debouncedSearchTerm}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          )}
        </CardContent>
      </Card>

      <MembershipFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveMembershipType}
        membershipData={selectedMembership}
        existingCategories={uniqueCategoriesForTabs.filter(cat => cat.value !== 'All').map(c => c.label)}
      />

      <DeleteMembershipDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        membershipToDelete={membershipToDelete}
      />

      <BillingScheduleDialog
        isOpen={isBillingDialogOpen}
        onClose={() => setIsBillingDialogOpen(false)}
        membershipData={membershipForBilling}
      />
    </motion.div>
  );
};

export default MembershipsPage;


