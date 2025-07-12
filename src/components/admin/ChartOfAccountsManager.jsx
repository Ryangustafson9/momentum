import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Lock,
  Shield,
  MoreHorizontal,
  Copy,
  Archive,
  RefreshCw,
  Settings,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  Save,
  X,
  GripVertical
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

const ChartOfAccountsManager = ({ accountingSettings }) => {
  // Core state
  const [accounts, setAccounts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('account_number');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('hierarchical'); // 'hierarchical' or 'flat'


  // Selection and bulk operations
  const [selectedAccounts, setSelectedAccounts] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');

  // Inline editing
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  // Dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);

  const { toast } = useToast();

  // Enhanced filtering and grouping for all account types
  const filteredAndGroupedAccounts = useMemo(() => {
    let filtered = accounts.filter(account => {
      const matchesSearch = !searchTerm ||
        account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_number.includes(searchTerm) ||
        account.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_category?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === 'all' || account.account_type === filterType;
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'active' && account.is_active) ||
        (filterStatus === 'inactive' && !account.is_active);

      return matchesSearch && matchesType && matchesStatus;
    });

    // Sort accounts
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'account_number') {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Group by account type for hierarchical view
    if (viewMode === 'hierarchical') {
      const grouped = {};
      filtered.forEach(account => {
        const type = account.account_type;
        if (!grouped[type]) {
          grouped[type] = [];
        }
        grouped[type].push(account);
      });
      return grouped;
    }

    return filtered;
  }, [accounts, searchTerm, filterType, filterStatus, sortBy, sortOrder, viewMode]);

  const [accountForm, setAccountForm] = useState({
    account_number: '',
    account_name: '',
    account_type: '',
    account_category: '',
    description: '',
    normal_balance: 'debit',
    is_active: true,
    visible_to_all_branches: true,
    revenue_branch: '',
    for_bad_check_charges: false,
    display_on: [],
    is_protected: false
  });

  // Revenue account categories specific to gym operations
  const revenueCategories = [
    { value: 'membership', label: 'Membership Revenue' },
    { value: 'programs', label: 'Program Revenue' },
    { value: 'personal_training', label: 'Personal Training' },
    { value: 'group_classes', label: 'Group Classes' },
    { value: 'childcare', label: 'Child Care' },
    { value: 'events', label: 'Events & Workshops' },
    { value: 'retail', label: 'Retail Sales' },
    { value: 'food_beverage', label: 'Food & Beverage' },
    { value: 'guest_fees', label: 'Guest Fees' },
    { value: 'late_fees', label: 'Late Fees' },
    { value: 'bad_check_charges', label: 'Bad Check Charges' },
    { value: 'other', label: 'Other Revenue' }
  ];

  // Display options based on Daxko standards
  const displayOptions = [
    { value: 'membership', label: 'Membership', description: 'Available for membership types and discount groups' },
    { value: 'programs', label: 'Programs', description: 'Available for programs, child care, reservations, and events' },
    { value: 'fundraising', label: 'Fundraising', description: 'Available for fundraising activities' },
    { value: 'fee_setup', label: 'Fee Setup', description: 'Available for add-ons, one-time fees, and adjustments' }
  ];

  const accountTypes = [
    { value: 'Asset', label: 'Asset', color: 'blue' },
    { value: 'Liability', label: 'Liability', color: 'red' },
    { value: 'Equity', label: 'Equity', color: 'purple' },
    { value: 'Revenue', label: 'Revenue', color: 'green' },
    { value: 'Expense', label: 'Expense', color: 'orange' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadAccounts(),
        loadTemplates()
      ]);
    } catch (error) {
      console.error('Error loading chart of accounts data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('accounting_accounts')
        .select('*, is_protected')
        .order('account_number');

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('accounting_account_templates')
        .select('*')
        .eq('industry', 'fitness')
        .order('sort_order');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  // Enhanced functionality methods
  const handleSelectAccount = (accountId) => {
    const newSelected = new Set(selectedAccounts);
    if (newSelected.has(accountId)) {
      newSelected.delete(accountId);
    } else {
      newSelected.add(accountId);
    }
    setSelectedAccounts(newSelected);
  };

  const handleSelectAll = () => {
    if (viewMode === 'hierarchical') {
      const allAccountIds = Object.values(filteredAndGroupedAccounts)
        .flat()
        .map(account => account.id);
      setSelectedAccounts(new Set(allAccountIds));
    } else {
      const allAccountIds = filteredAndGroupedAccounts.map(account => account.id);
      setSelectedAccounts(new Set(allAccountIds));
    }
  };

  const handleDeselectAll = () => {
    setSelectedAccounts(new Set());
  };

  const startInlineEdit = (accountId, field, currentValue) => {
    setEditingAccountId(accountId);
    setEditingField(field);
    setEditingValue(currentValue);
  };

  const saveInlineEdit = async () => {
    try {
      const { error } = await supabase
        .from('accounting_accounts')
        .update({ [editingField]: editingValue })
        .eq('id', editingAccountId);

      if (error) throw error;

      // Update local state
      setAccounts(prev => prev.map(account =>
        account.id === editingAccountId
          ? { ...account, [editingField]: editingValue }
          : account
      ));

      toast({
        title: "Account Updated",
        description: "Account has been updated successfully.",
      });

      cancelInlineEdit();
    } catch (error) {
      console.error('Error updating account:', error);
      toast({
        title: "Error",
        description: "Failed to update account.",
        variant: "destructive"
      });
    }
  };

  const cancelInlineEdit = () => {
    setEditingAccountId(null);
    setEditingField(null);
    setEditingValue('');
  };

  const handleCreateAccount = () => {
    setEditingAccount(null);
    setAccountForm({
      account_number: '',
      account_name: '',
      account_type: '',
      account_category: '',
      account_subcategory: '',
      description: '',
      normal_balance: 'debit',
      is_active: true,
      allow_manual_entries: true,
      requires_department: false,
      requires_location: false,
      is_protected: false
    });
    setIsCreateDialogOpen(true);
  };

  const handleEditAccount = (account) => {
    setEditingAccount(account);
    setAccountForm({
      account_number: account.account_number,
      account_name: account.account_name,
      account_type: account.account_type,
      account_category: account.account_category || '',
      account_subcategory: account.account_subcategory || '',
      description: account.description || '',
      normal_balance: account.normal_balance,
      is_active: account.is_active,
      allow_manual_entries: account.allow_manual_entries,
      requires_department: account.requires_department,
      requires_location: account.requires_location,
      is_protected: account.is_protected || false
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveAccount = async () => {
    if (!accountForm.account_number || !accountForm.account_name || !accountForm.account_type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      const accountData = {
        ...accountForm,
        created_by: user?.id
      };

      if (editingAccount) {
        const { error } = await supabase
          .from('accounting_accounts')
          .update(accountData)
          .eq('id', editingAccount.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('accounting_accounts')
          .insert(accountData);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Account ${editingAccount ? 'updated' : 'created'} successfully.`,
        duration: 3000,
      });

      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
      loadAccounts();
      onStatsUpdate?.();
    } catch (error) {
      console.error('Error saving account:', error);
      toast({
        title: "Error",
        description: error.message.includes('unique') 
          ? "Account number or name already exists."
          : "Failed to save account.",
        variant: "destructive"
      });
    }
  };

  const handleToggleAccountStatus = async (account) => {
    // Prevent deactivating protected accounts
    if (account.is_protected && account.is_active) {
      toast({
        title: "Cannot Deactivate",
        description: "This account is required by the system and cannot be deactivated.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('accounting_accounts')
        .update({ is_active: !account.is_active })
        .eq('id', account.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Account ${!account.is_active ? 'activated' : 'deactivated'} successfully.`,
        duration: 3000,
      });

      loadAccounts();
      onStatsUpdate?.();
    } catch (error) {
      console.error('Error toggling account status:', error);
      toast({
        title: "Error",
        description: "Failed to update account status.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAccount = async (account) => {
    // Check if account is protected
    if (account.is_protected) {
      toast({
        title: "Cannot Delete",
        description: "This account is required by the system and cannot be deleted.",
        variant: "destructive"
      });

      // Log the deletion attempt for audit purposes
      try {
        await supabase.rpc('log_protected_account_operation', {
          p_account_id: account.id,
          p_action: 'DELETE_ATTEMPTED',
          p_details: {
            account_number: account.account_number,
            account_name: account.account_name
          }
        });
      } catch (logError) {
        console.error('Error logging deletion attempt:', logError);
      }

      return;
    }

    // TODO: Implement actual deletion logic for non-protected accounts
    // This would include confirmation dialog and actual deletion
    toast({
      title: "Delete Account",
      description: "Account deletion functionality will be implemented here.",
      duration: 3000,
    });
  };

  const handleImportFromTemplate = async () => {
    try {
      const templatesToImport = templates.filter(template =>
        !accounts.some(account => account.account_number === template.account_number)
      );

      if (templatesToImport.length === 0) {
        toast({
          title: "Info",
          description: "All template accounts are already imported.",
          duration: 3000,
        });
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      const accountsToInsert = templatesToImport.map(template => ({
        account_number: template.account_number,
        account_name: template.account_name,
        account_type: template.account_type,
        account_category: template.account_category,
        account_subcategory: template.account_subcategory,
        normal_balance: template.normal_balance,
        is_active: true,
        is_system_account: template.is_required,
        allow_manual_entries: true,
        created_by: user?.id
      }));

      const { error } = await supabase
        .from('accounting_accounts')
        .insert(accountsToInsert);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Imported ${templatesToImport.length} accounts from template.`,
        duration: 3000,
      });

      setIsTemplateDialogOpen(false);
      loadAccounts();
      onStatsUpdate?.();
    } catch (error) {
      console.error('Error importing from template:', error);
      toast({
        title: "Error",
        description: "Failed to import accounts from template.",
        variant: "destructive"
      });
    }
  };

  const getAccountTypeColor = (type) => {
    const typeConfig = accountTypes.find(t => t.value === type);
    return typeConfig?.color || 'gray';
  };

  const getBalanceTypeIcon = (normalBalance) => {
    return normalBalance === 'debit' ? '+' : '-';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 animate-pulse" />
          <span>Loading chart of accounts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Stats and Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Chart of Accounts</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Manage your complete chart of accounts including Assets, Liabilities, Equity, Revenue, and Expenses
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Total Accounts:</span>
                <span className="font-medium">{accounts.length}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Active:</span>
                <span className="font-medium">{accounts.filter(a => a.is_active).length}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span className="text-gray-600">Protected:</span>
                <span className="font-medium">{accounts.filter(a => a.is_protected).length}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-gray-600">Account Types:</span>
                <span className="font-medium">{new Set(accounts.map(a => a.account_type).filter(Boolean)).size}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'hierarchical' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('hierarchical')}
                className="text-xs"
              >
                Hierarchical
              </Button>
              <Button
                variant={viewMode === 'flat' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('flat')}
                className="text-xs"
              >
                Flat View
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsTemplateDialogOpen(true)}
                variant="outline"
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Template
              </Button>
              <Button onClick={handleCreateAccount} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters and Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search and Filters */}
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by account number, name, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-40 h-10">
                <SelectValue placeholder="Account Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {accountTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-${type.color}-500`}></div>
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-32 h-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions and Sort */}
          <div className="flex items-center gap-3">
            {selectedAccounts.size > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-medium text-blue-700">
                  {selectedAccounts.size} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsBulkDialogOpen(true)}
                  className="text-blue-700 hover:text-blue-800 h-6 px-2"
                >
                  Actions
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectAll}
                  className="text-blue-700 hover:text-blue-800 h-6 px-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}>
              <SelectTrigger className="w-40 h-10">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="account_number-asc">Number ↑</SelectItem>
                <SelectItem value="account_number-desc">Number ↓</SelectItem>
                <SelectItem value="account_name-asc">Name ↑</SelectItem>
                <SelectItem value="account_name-desc">Name ↓</SelectItem>
                <SelectItem value="account_type-asc">Type ↑</SelectItem>
                <SelectItem value="account_type-desc">Type ↓</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Modern Accounts Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedAccounts.size > 0}
                onCheckedChange={(checked) => {
                  if (checked) {
                    handleSelectAll();
                  } else {
                    handleDeselectAll();
                  }
                }}
              />
              <span className="text-sm font-medium text-gray-700">
                {viewMode === 'hierarchical' ? 'Account Groups' : 'All Accounts'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <RefreshCw
                className="h-4 w-4 cursor-pointer hover:text-gray-700"
                onClick={loadData}
              />
              <Download className="h-4 w-4 cursor-pointer hover:text-gray-700" />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <span>Account</span>
                  </div>
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Category
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance Type
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
              <tbody>
              {viewMode === 'hierarchical' ? (
                // Hierarchical View
                Object.entries(filteredAndGroupedAccounts).map(([groupName, groupAccounts]) => (
                  <React.Fragment key={groupName}>
                    {/* Group Header */}
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full bg-${getAccountTypeColor(groupName)}-500`}></div>
                              <span className="font-semibold text-gray-900">{groupName}</span>
                              <Badge variant="outline" className="ml-2">
                                {groupAccounts.length} accounts
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              {groupAccounts.filter(a => a.is_active).length} active
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Group Accounts - Always Visible */}
                    {groupAccounts.map((account, index) => (
                      <tr
                        key={account.id}
                        className={`border-b border-gray-100 hover:bg-blue-50/50 transition-colors ${
                          selectedAccounts.has(account.id) ? 'bg-blue-50' :
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedAccounts.has(account.id)}
                              onCheckedChange={() => handleSelectAccount(account.id)}
                            />
                            <div className="flex items-center gap-3">
                              <div className="w-1 h-8 bg-gray-200 rounded-full"></div>
                              <div>
                                {editingAccountId === account.id && editingField === 'account_number' ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      value={editingValue}
                                      onChange={(e) => setEditingValue(e.target.value)}
                                      className="w-24 h-7 text-sm font-mono"
                                      autoFocus
                                    />
                                    <Button size="sm" variant="ghost" onClick={saveInlineEdit}>
                                      <Save className="h-3 w-3" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={cancelInlineEdit}>
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <span
                                    className="font-mono text-sm font-medium text-blue-600 cursor-pointer hover:underline"
                                    onClick={() => startInlineEdit(account.id, 'account_number', account.account_number)}
                                  >
                                    {account.account_number}
                                  </span>
                                )}
                                <div className="mt-1">
                                  {editingAccountId === account.id && editingField === 'account_name' ? (
                                    <div className="flex items-center gap-2">
                                      <Input
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        className="w-48 h-7 text-sm"
                                        autoFocus
                                      />
                                      <Button size="sm" variant="ghost" onClick={saveInlineEdit}>
                                        <Save className="h-3 w-3" />
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={cancelInlineEdit}>
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <span
                                      className="font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                                      onClick={() => startInlineEdit(account.id, 'account_name', account.account_name)}
                                    >
                                      {account.account_name}
                                    </span>
                                  )}
                                  {account.description && (
                                    <p className="text-xs text-gray-500 mt-1">{account.description}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <Badge
                              variant="outline"
                              className={`bg-${getAccountTypeColor(account.account_type)}-50 text-${getAccountTypeColor(account.account_type)}-700 border-${getAccountTypeColor(account.account_type)}-200`}
                            >
                              {account.account_type}
                            </Badge>
                            {account.account_category && (
                              <p className="text-xs text-gray-500">{account.account_category}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {account.normal_balance === 'debit' ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                            <span className={`text-sm font-medium ${
                              account.normal_balance === 'debit' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {account.normal_balance}
                            </span>
                          </div>
                        </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={account.is_active ? 'default' : 'secondary'}
                        className={account.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                      >
                        {account.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {account.is_protected && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Shield className="h-4 w-4 text-amber-600" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Protected revenue account</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditAccount(account)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Account
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {}}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleAccountStatus(account)}
                            disabled={account.is_protected}
                          >
                            {account.is_active ? (
                              <>
                                <Archive className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          {!account.is_protected && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteAccount(account)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))
        ) : (
          // Flat View
          filteredAndGroupedAccounts.map((account, index) => (
            <tr
              key={account.id}
              className={`border-b border-gray-100 hover:bg-blue-50/50 transition-colors ${
                selectedAccounts.has(account.id) ? 'bg-blue-50' :
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
              }`}
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedAccounts.has(account.id)}
                    onCheckedChange={() => handleSelectAccount(account.id)}
                  />
                  <div>
                    <span className="font-mono text-sm font-medium text-blue-600">
                      {account.account_number}
                    </span>
                    <div className="mt-1">
                      <span className="font-medium text-gray-900">{account.account_name}</span>
                      {account.description && (
                        <p className="text-xs text-gray-500 mt-1">{account.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="space-y-1">
                  <Badge
                    variant="outline"
                    className={`bg-${getAccountTypeColor(account.account_type)}-50 text-${getAccountTypeColor(account.account_type)}-700 border-${getAccountTypeColor(account.account_type)}-200`}
                  >
                    {account.account_type}
                  </Badge>
                  {account.account_category && (
                    <p className="text-xs text-gray-500">{account.account_category}</p>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  {account.normal_balance === 'debit' ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    account.normal_balance === 'debit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {account.normal_balance}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={account.is_active ? 'default' : 'secondary'}
                    className={account.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                  >
                    {account.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {account.is_protected && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Shield className="h-4 w-4 text-amber-600" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Protected account</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditAccount(account)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Account
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {}}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleToggleAccountStatus(account)}
                        disabled={account.is_protected}
                      >
                        {account.is_active ? (
                          <>
                            <Archive className="h-4 w-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      {!account.is_protected && (
                        <DropdownMenuItem
                          onClick={() => handleDeleteAccount(account)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
          </table>
        </div>

        {/* Empty State */}
        {(viewMode === 'hierarchical' ?
          Object.keys(filteredAndGroupedAccounts).length === 0 :
          filteredAndGroupedAccounts.length === 0
        ) && (
          <div className="text-center py-16 px-6">
            <div className="max-w-sm mx-auto">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                  ? "No accounts match your current filters. Try adjusting your search criteria."
                  : "Get started by creating your first account or importing from a template."
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={handleCreateAccount} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Account
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsTemplateDialogOpen(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Template
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Account Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(false);
        setIsEditDialogOpen(false);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? 'Edit GL Account' : 'Add New GL Account'}
            </DialogTitle>
            <p className="text-sm text-gray-600">
              {editingAccount
                ? 'Modify the GL account settings. Note: Account Number and Type cannot be changed after creation.'
                : 'Create a new General Ledger revenue account for tracking income and financial categorization.'
              }
            </p>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Account Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="account_number">Account Number *</Label>
                <Input
                  id="account_number"
                  value={accountForm.account_number}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, account_number: e.target.value }))}
                  placeholder="e.g., 4100"
                  disabled={editingAccount} // Cannot edit after creation per Daxko standards
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editingAccount ? "Account number cannot be changed after creation" : "GL account number for transaction categorization"}
                </p>
              </div>
              <div>
                <Label htmlFor="account_type">Account Type *</Label>
                <Select
                  value={accountForm.account_type}
                  onValueChange={(value) => setAccountForm(prev => ({ ...prev, account_type: value }))}
                  disabled={editingAccount} // Cannot edit after creation per Daxko standards
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {editingAccount ? "Account type cannot be changed after creation" : "Revenue accounts track money coming into the organization"}
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="account_name">Account Name *</Label>
              <Input
                id="account_name"
                value={accountForm.account_name}
                onChange={(e) => setAccountForm(prev => ({ ...prev, account_name: e.target.value }))}
                placeholder="e.g., Membership Revenue - Monthly"
              />
              <p className="text-xs text-gray-500 mt-1">
                Descriptive name to help identify what this GL account is used for
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="account_category">Revenue Category *</Label>
                <Select
                  value={accountForm.account_category}
                  onValueChange={(value) => setAccountForm(prev => ({ ...prev, account_category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {revenueCategories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="revenue_branch">Revenue Branch</Label>
                <Input
                  id="revenue_branch"
                  value={accountForm.revenue_branch}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, revenue_branch: e.target.value }))}
                  placeholder="e.g., Main Branch"
                  disabled={accountForm.visible_to_all_branches}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {accountForm.visible_to_all_branches ? "Available to all branches" : "Specific branch for this GL account"}
                </p>
              </div>
            </div>

            {/* Display Options */}
            <div>
              <Label>Display On *</Label>
              <p className="text-xs text-gray-500 mb-3">
                Select where this GL account will be available for use within the system
              </p>
              <div className="grid grid-cols-2 gap-3">
                {displayOptions.map(option => (
                  <div key={option.value} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={`display_${option.value}`}
                      checked={accountForm.display_on.includes(option.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setAccountForm(prev => ({
                            ...prev,
                            display_on: [...prev.display_on, option.value]
                          }));
                        } else {
                          setAccountForm(prev => ({
                            ...prev,
                            display_on: prev.display_on.filter(item => item !== option.value)
                          }));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`display_${option.value}`} className="font-medium">
                        {option.label}
                      </Label>
                      <p className="text-xs text-gray-500">{option.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Options */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="visible_to_all_branches">Visible to all Branches</Label>
                  <p className="text-xs text-gray-500">Make this GL account available at all branch locations</p>
                </div>
                <Switch
                  id="visible_to_all_branches"
                  checked={accountForm.visible_to_all_branches}
                  onCheckedChange={(checked) => setAccountForm(prev => ({ ...prev, visible_to_all_branches: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="for_bad_check_charges">For Bad Check Charges</Label>
                  <p className="text-xs text-gray-500">Use this account to charge members fees for returned payments</p>
                </div>
                <Switch
                  id="for_bad_check_charges"
                  checked={accountForm.for_bad_check_charges}
                  onCheckedChange={(checked) => setAccountForm(prev => ({ ...prev, for_bad_check_charges: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_active">Active Account</Label>
                  <p className="text-xs text-gray-500">Account is available for use in transactions</p>
                </div>
                <Switch
                  id="is_active"
                  checked={accountForm.is_active}
                  onCheckedChange={(checked) => setAccountForm(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
            </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_protected">Protected Account</Label>
                  <p className="text-xs text-gray-600 mt-1">
                    Protected accounts cannot be deleted and are required by the system
                  </p>
                </div>
                <Switch
                  id="is_protected"
                  checked={accountForm.is_protected}
                  onCheckedChange={(checked) => setAccountForm(prev => ({ ...prev, is_protected: checked }))}
                  disabled={editingAccount?.is_system_account} // Prevent changing system accounts
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setIsEditDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveAccount}>
                {editingAccount ? 'Update Account' : 'Create Account'}
              </Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* Template Import Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Import Chart of Accounts Template</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will import the standard gym industry chart of accounts. 
                Existing accounts will not be duplicated.
              </AlertDescription>
            </Alert>

            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b sticky top-0">
                  <tr>
                    <th className="text-left p-3">Account #</th>
                    <th className="text-left p-3">Account Name</th>
                    <th className="text-left p-3">Type</th>
                    <th className="text-left p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template, index) => {
                    const exists = accounts.some(account => account.account_number === template.account_number);
                    return (
                      <tr key={template.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="p-3 font-mono">{template.account_number}</td>
                        <td className="p-3">{template.account_name}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-xs">
                            {template.account_type}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {exists ? (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Exists
                            </Badge>
                          ) : (
                            <Badge variant="default" className="text-xs">
                              Will Import
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleImportFromTemplate}>
                Import Template Accounts
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChartOfAccountsManager;
