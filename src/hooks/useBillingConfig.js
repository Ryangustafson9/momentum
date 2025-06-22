// 🚀 BILLING CONFIGURATION HOOKS - React Query integration for billing settings
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import { billingConfigService } from '@/services/billingConfigService';
import { useToast } from '@/hooks/use-toast';

// For demo purposes, we'll use a default organization ID
// In production, this would come from the authenticated user's context
const DEFAULT_ORG_ID = 'default-org-id';

// Get billing configuration
export const useBillingConfig = (organizationId = DEFAULT_ORG_ID) => {
  return useQuery({
    queryKey: [...queryKeys.billing, 'config', organizationId],
    queryFn: () => billingConfigService.getBillingConfig(organizationId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache (formerly cacheTime)
  });
};

// Get house charges
export const useHouseCharges = (organizationId = DEFAULT_ORG_ID) => {
  return useQuery({
    queryKey: [...queryKeys.billing, 'houseCharges', organizationId],
    queryFn: () => billingConfigService.getHouseCharges(organizationId),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache (formerly cacheTime)
  });
};

// Get member house charges
export const useMemberHouseCharges = (memberId) => {
  return useQuery({
    queryKey: [...queryKeys.billing, 'memberHouseCharges', memberId],
    queryFn: () => billingConfigService.getMemberHouseCharges(memberId),
    enabled: !!memberId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get billing schedules
export const useBillingSchedules = (organizationId = DEFAULT_ORG_ID, filters = {}) => {
  return useQuery({
    queryKey: [...queryKeys.billing, 'schedules', organizationId, filters],
    queryFn: () => billingConfigService.getBillingSchedules(organizationId, filters),
    staleTime: 1 * 60 * 1000, // 1 minute for schedules
    gcTime: 5 * 60 * 1000, // 5 minutes cache (formerly cacheTime)
  });
};

// Mutation hooks

// Update billing configuration
export const useUpdateBillingConfig = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ organizationId, configData }) => 
      billingConfigService.updateBillingConfig(organizationId, configData),
    onMutate: async ({ organizationId, configData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: [...queryKeys.billing, 'config', organizationId] 
      });

      // Snapshot previous value
      const previousConfig = queryClient.getQueryData([...queryKeys.billing, 'config', organizationId]);

      // Optimistically update
      queryClient.setQueryData([...queryKeys.billing, 'config', organizationId], (old) => ({
        ...old,
        ...configData
      }));

      return { previousConfig };
    },
    onError: (error, { organizationId }, context) => {
      // Rollback on error
      if (context?.previousConfig) {
        queryClient.setQueryData([...queryKeys.billing, 'config', organizationId], context.previousConfig);
      }
      
      toast({
        title: "Configuration Update Failed",
        description: error.message || "Failed to update billing configuration",
        variant: "destructive",
      });
    },
    onSuccess: (data, { organizationId }) => {
      toast({
        title: "Configuration Updated",
        description: "Billing configuration has been successfully updated",
      });
    },
    onSettled: (data, error, { organizationId }) => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.billing, 'config', organizationId] 
      });
    },
  });
};

// Create house charge
export const useCreateHouseCharge = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ organizationId, chargeData }) => 
      billingConfigService.createHouseCharge(organizationId, chargeData),
    onSuccess: (data, { organizationId }) => {
      // Invalidate house charges queries
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.billing, 'houseCharges', organizationId] 
      });
      
      toast({
        title: "House Charge Created",
        description: `${data.name} has been successfully created`,
      });
    },
    onError: (error) => {
      
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create house charge",
        variant: "destructive",
      });
    },
  });
};

// Update house charge
export const useUpdateHouseCharge = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ chargeId, updates }) => 
      billingConfigService.updateHouseCharge(chargeId, updates),
    onSuccess: (data) => {
      // Invalidate house charges queries
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.billing, 'houseCharges'] 
      });
      
      toast({
        title: "House Charge Updated",
        description: `${data.name} has been successfully updated`,
      });
    },
    onError: (error) => {
      
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update house charge",
        variant: "destructive",
      });
    },
  });
};

// Delete house charge
export const useDeleteHouseCharge = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (chargeId) => billingConfigService.deleteHouseCharge(chargeId),
    onSuccess: () => {
      // Invalidate house charges queries
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.billing, 'houseCharges'] 
      });
      
      toast({
        title: "House Charge Deleted",
        description: "House charge has been successfully deleted",
      });
    },
    onError: (error) => {
      
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete house charge",
        variant: "destructive",
      });
    },
  });
};

// Assign house charge to member
export const useAssignHouseCharge = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ memberId, houseChargeId, organizationId, options }) => 
      billingConfigService.assignHouseChargeToMember(memberId, houseChargeId, organizationId, options),
    onSuccess: (data, { memberId }) => {
      // Invalidate member house charges
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.billing, 'memberHouseCharges', memberId] 
      });
      
      // Invalidate billing schedules
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.billing, 'schedules'] 
      });
      
      toast({
        title: "House Charge Assigned",
        description: "House charge has been successfully assigned to member",
      });
    },
    onError: (error) => {
      
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign house charge",
        variant: "destructive",
      });
    },
  });
};

// Remove house charge from member
export const useRemoveHouseCharge = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (memberHouseChargeId) => 
      billingConfigService.removeHouseChargeFromMember(memberHouseChargeId),
    onSuccess: () => {
      // Invalidate member house charges
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.billing, 'memberHouseCharges'] 
      });
      
      // Invalidate billing schedules
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.billing, 'schedules'] 
      });
      
      toast({
        title: "House Charge Removed",
        description: "House charge has been successfully removed from member",
      });
    },
    onError: (error) => {
      
      toast({
        title: "Removal Failed",
        description: error.message || "Failed to remove house charge",
        variant: "destructive",
      });
    },
  });
};

// Utility hooks for calculations
export const useProrationCalculation = () => {
  return {
    calculateProration: billingConfigService.calculateProration,
    getNextBillingDate: billingConfigService.getNextBillingDate,
    validateBillingConfig: billingConfigService.validateBillingConfig
  };
};

export default {
  useBillingConfig,
  useHouseCharges,
  useMemberHouseCharges,
  useBillingSchedules,
  useUpdateBillingConfig,
  useCreateHouseCharge,
  useUpdateHouseCharge,
  useDeleteHouseCharge,
  useAssignHouseCharge,
  useRemoveHouseCharge,
  useProrationCalculation,
};

