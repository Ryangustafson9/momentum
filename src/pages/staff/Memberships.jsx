import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, ListFilter, Search, Award, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast.js';
import { apiService, dataService } from '@/services/apiService';
import MembershipFormDialog from '@/components/admin/memberships/MembershipFormDialog';
import MembershipTable from '@/components/admin/memberships/MembershipTable';
import ColumnVisibilityDropdown from '@/components/admin/memberships/ColumnVisibilityDropdown';
import DeleteMembershipDialog from '@/components/admin/memberships/DeleteMembershipDialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { useDebounce } from '@/hooks/useDebounce.js'; 

const initialColumnVisibility = {
  name: true,
  price: true,
  billing_type: true,
  duration_months: true,
  features: false,
  category: true,
  color: false,
  available_for_sale: true,
  actions: true,
};

const DESIRED_TAB_ORDER = ['All Plans', 'Memberships', 'Staff'];

const MembershipsPageHeader = React.memo(({ onAddNewPlan }) => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 pb-4">
    <div>
      <h1 className="text-4xl font-bold tracking-tight flex items-center text-slate-900 dark:text-slate-50">
        <Award className="mr-3 h-9 w-9 text-primary" /> Membership Plans
      </h1>
      <p className="text-muted-foreground mt-1.5">
        Manage all available membership plans, their pricing, and features.
      </p>
    </div>
    <Button onClick={onAddNewPlan} variant="action" className="mt-4 md:mt-0">
      <PlusCircle className="mr-2 h-5 w-5" /> Add New Plan
    </Button>
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
  setActiveTabCategory
}) => (
  <div className="flex flex-col md:flex-row items-center gap-4 px-6 pt-4 pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
    <div className="flex-shrink-0 relative">
      <Input
        type="text"
        placeholder="Search plans..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10 w-full md:w-64 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:border-primary dark:focus:border-primary rounded-lg"
      />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
    </div>
    <div className="flex-shrink-0">
      <ColumnVisibilityDropdown
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        allColumns={allColumns}
        triggerButton={
          <Button variant="outline" size="icon" className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 h-10 w-10 rounded-lg">
            <SettingsIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            <span className="sr-only">View Options</span>
          </Button>
        }
      />
    </div>
    <div className="flex-grow overflow-x-auto md:overflow-visible">
      <Tabs defaultValue={activeTabCategory} onValueChange={setActiveTabCategory} className="w-full">
        <TabsList className="bg-transparent p-0 h-auto flex-nowrap whitespace-nowrap">
          {uniqueCategoriesForTabs.map(category => (
            <TabsTrigger 
              key={category.value} 
              value={category.value}
              className="
                px-4 py-2 mr-3 text-sm font-medium rounded-lg
                data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md 
                hover:bg-slate-100 dark:hover:bg-slate-800 
                text-slate-600 dark:text-slate-300
                data-[state=active]:text-white
                transition-colors duration-150 ease-in-out
              "
            >
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  </div>
));
MembershipsFilterControlsAndTabs.displayName = 'MembershipsFilterControlsAndTabs';

const getUniqueCategoriesForTabs = (types) => {
  const categories = new Set();
  types.forEach(type => {
    if (type.category && type.category.toLowerCase() !== 'member') { 
      categories.add(type.category);
    }
  });
  
  const tabItems = [{ value: 'All Plans', label: 'All Plans' }];
  
  const hasNonStaffPlans = types.some(type => type.category && type.category.toLowerCase() !== 'staff' && type.category.toLowerCase() !== 'member');
  if (hasNonStaffPlans) {
    tabItems.push({ value: 'Memberships', label: 'Memberships' });
  }

  if (categories.has('Staff')) {
    tabItems.push({ value: 'Staff', label: 'Staff' });
  }
  
  return tabItems.sort((a, b) => {
    const indexA = DESIRED_TAB_ORDER.indexOf(a.label);
    const indexB = DESIRED_TAB_ORDER.indexOf(b.label);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.label.localeCompare(b.label);
  });
};

const MembershipsPage = () => {
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [membershipToDelete, setMembershipToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTabCategory, setActiveTabCategory] = useState('All Plans');
  const [columnVisibility, setColumnVisibility] = useState(() => {
    const saved = localStorage.getItem('membershipTypesColumnVisibility');
    return saved ? JSON.parse(saved) : initialColumnVisibility;
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { toast } = useToast();

  const fetchMembershipTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await dataService.getMembershipTypes();
      setMembershipTypes(Array.isArray(data) ? data : []);
    } catch (error) {
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
  }, [columnVisibility]);

  const handleCreateNew = useCallback(() => {
    setSelectedMembership(null);
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

  const confirmDelete = useCallback(async () => {
    if (!membershipToDelete) return;
    try {
      await dataService.deleteMembershipType(membershipToDelete.id);
      toast({ title: 'Success', description: `Membership type "${membershipToDelete.name}" deleted successfully.` });
      fetchMembershipTypes(); // Refetch after delete
    } catch (error) {
      toast({ title: 'Error', description: `Failed to delete membership type: ${error.message}`, variant: 'destructive' });
    } finally {
      setIsDeleteDialogOpen(false);
      setMembershipToDelete(null);
    }
  }, [membershipToDelete, toast, fetchMembershipTypes]);

  const handleSaveMembershipType = useCallback(async (typeData) => {
    try {
      if (typeData.id) {
        // Update an existing membership type
        await dataService.updateMembershipType(typeData.id, typeData);
      } else {
        // Create a new membership type
        await dataService.addMembershipType(typeData);

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
      toast({
        title: "Error",
        description: `Failed to save membership type: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [toast, fetchMembershipTypes]);
  
  const uniqueCategoriesForTabs = useMemo(() => getUniqueCategoriesForTabs(membershipTypes), [membershipTypes]);

  const filteredMembershipTypes = useMemo(() => 
    membershipTypes.filter(type => {
      const nameMatch = type.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ?? false;
      const categorySearchMatch = type.category?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ?? false;
      const matchesSearch = nameMatch || categorySearchMatch;

      let matchesCategory;
      if (activeTabCategory === 'All Plans') {
        matchesCategory = true;
      } else if (activeTabCategory === 'Memberships') {
        matchesCategory = type.category?.toLowerCase() !== 'staff' && type.category?.toLowerCase() !== 'member';
      } else if (activeTabCategory === 'Staff') {
        matchesCategory = type.category === 'Staff';
      } else { 
        matchesCategory = type.category === activeTabCategory;
      }
      
      return matchesSearch && matchesCategory && type.category?.toLowerCase() !== 'member';
    }),
    [membershipTypes, debouncedSearchTerm, activeTabCategory]
  );

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
        <MembershipsPageHeader onAddNewPlan={handleCreateNew} />
        
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
          />
          
          {isLoading && membershipTypes.length > 0 && <div className="text-center py-4 text-muted-foreground">Refreshing plan list...</div>}
          
          {!isLoading && filteredMembershipTypes.length === 0 ? (
             <div className="px-6 pb-6">
               <EmptyState 
                icon={<ListFilter className="h-16 w-16 text-slate-400 dark:text-slate-500" />}
                title="No Membership Plans Found" 
                description={searchTerm || activeTabCategory !== 'All Plans' ? "No plans match your current search or filter. Try adjusting your criteria." : "There are no membership plans configured yet. Create one to get started!"}
                actionButton={
                  <Button onClick={handleCreateNew} variant="action">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create First Plan
                  </Button>
                }
              />
             </div>
          ) : (
            <MembershipTable
              types={filteredMembershipTypes}
              columnVisibility={columnVisibility}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
              searchTerm={debouncedSearchTerm}
            />
          )}
        </CardContent>
      </Card>

      <MembershipFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveMembershipType}
        membershipData={selectedMembership}
        existingCategories={uniqueCategoriesForTabs.filter(cat => cat.value !== 'All Plans').map(c => c.label)}
      />

      <DeleteMembershipDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        membershipToDelete={membershipToDelete}
      />
    </motion.div>
  );
};

export default MembershipsPage;


