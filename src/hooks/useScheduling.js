// 🚀 SCHEDULING HOOKS - React Query integration for enhanced scheduling system
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import { schedulingService } from '@/services/schedulingService';
import { useToast } from '@/hooks/use-toast';

// For demo purposes, we'll use a default organization ID
const DEFAULT_ORG_ID = 'default-org-id';

// ===== TRAINER HOOKS =====

// Get all trainers
export const useTrainers = (organizationId = DEFAULT_ORG_ID, filters = {}) => {
  return useQuery({
    queryKey: [...queryKeys.trainers, organizationId, filters],
    queryFn: () => schedulingService.getTrainers(organizationId, filters),
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes cache
  });
};

// Get single trainer
export const useTrainer = (trainerId) => {
  return useQuery({
    queryKey: queryKeys.trainer(trainerId),
    queryFn: () => schedulingService.getTrainer(trainerId),
    enabled: !!trainerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get trainer availability
export const useTrainerAvailability = (trainerId, startDate, endDate) => {
  return useQuery({
    queryKey: [...queryKeys.trainerAvailability(trainerId), startDate, endDate],
    queryFn: () => schedulingService.getTrainerAvailability(trainerId, startDate, endDate),
    enabled: !!(trainerId && startDate && endDate),
    staleTime: 1 * 60 * 1000, // 1 minute for availability
  });
};

// ===== ROOM HOOKS =====

// Get all rooms
export const useRooms = (organizationId = DEFAULT_ORG_ID, filters = {}) => {
  return useQuery({
    queryKey: [...queryKeys.rooms, organizationId, filters],
    queryFn: () => schedulingService.getRooms(organizationId, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes cache (formerly cacheTime)
  });
};

// Get single room
export const useRoom = (roomId) => {
  return useQuery({
    queryKey: queryKeys.room(roomId),
    queryFn: () => schedulingService.getRoom(roomId),
    enabled: !!roomId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ===== EQUIPMENT HOOKS =====

// Get all equipment
export const useEquipment = (organizationId = DEFAULT_ORG_ID, filters = {}) => {
  return useQuery({
    queryKey: [...queryKeys.equipment, organizationId, filters],
    queryFn: () => schedulingService.getEquipment(organizationId, filters),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache (formerly cacheTime)
  });
};

// ===== SCHEDULE HOOKS =====

// Get class schedule with resources
export const useClassSchedule = (organizationId = DEFAULT_ORG_ID, filters = {}) => {
  return useQuery({
    queryKey: [...queryKeys.classSchedule, organizationId, filters],
    queryFn: () => schedulingService.getClassSchedule(organizationId, filters),
    staleTime: 30 * 1000, // 30 seconds for live schedule
    gcTime: 2 * 60 * 1000, // 2 minutes cache (formerly cacheTime)
  });
};

// Get schedule conflicts
export const useScheduleConflicts = (organizationId = DEFAULT_ORG_ID, dateRange = {}) => {
  return useQuery({
    queryKey: [...queryKeys.scheduleConflicts, organizationId, dateRange],
    queryFn: () => schedulingService.detectScheduleConflicts(organizationId, dateRange),
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
  });
};

// Get pending substitutions
export const usePendingSubstitutions = (organizationId = DEFAULT_ORG_ID) => {
  return useQuery({
    queryKey: [...queryKeys.substitutions, organizationId, 'pending'],
    queryFn: () => schedulingService.getPendingSubstitutions(organizationId),
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 2 * 60 * 1000, // 2 minutes cache
  });
};

// ===== MUTATION HOOKS =====

// Create trainer
export const useCreateTrainer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ organizationId, trainerData }) => 
      schedulingService.createTrainer(organizationId, trainerData),
    onSuccess: (data, { organizationId }) => {
      // Invalidate trainers queries
      queryClient.invalidateQueries({ queryKey: [...queryKeys.trainers, organizationId] });
      
      toast({
        title: "Trainer Created",
        description: `${data.first_name} ${data.last_name} has been added to the team`,
      });
    },
    onError: (error) => {
      
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create trainer",
        variant: "destructive",
      });
    },
  });
};

// Update trainer
export const useUpdateTrainer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ trainerId, updates }) => 
      schedulingService.updateTrainer(trainerId, updates),
    onSuccess: (data, { trainerId }) => {
      // Update specific trainer in cache
      queryClient.setQueryData(queryKeys.trainer(trainerId), data);
      
      // Invalidate trainers lists
      queryClient.invalidateQueries({ queryKey: queryKeys.trainers });
      
      toast({
        title: "Trainer Updated",
        description: `${data.first_name} ${data.last_name} has been updated`,
      });
    },
    onError: (error) => {
      
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update trainer",
        variant: "destructive",
      });
    },
  });
};

// Delete trainer
export const useDeleteTrainer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (trainerId) => schedulingService.deleteTrainer(trainerId),
    onSuccess: (data, trainerId) => {
      // Update trainer in cache to show as inactive
      queryClient.setQueryData(queryKeys.trainer(trainerId), data);
      
      // Invalidate trainers lists
      queryClient.invalidateQueries({ queryKey: queryKeys.trainers });
      
      toast({
        title: "Trainer Deactivated",
        description: `${data.first_name} ${data.last_name} has been deactivated`,
      });
    },
    onError: (error) => {
      
      toast({
        title: "Deactivation Failed",
        description: error.message || "Failed to deactivate trainer",
        variant: "destructive",
      });
    },
  });
};

// Create room
export const useCreateRoom = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ organizationId, roomData }) => 
      schedulingService.createRoom(organizationId, roomData),
    onSuccess: (data, { organizationId }) => {
      // Invalidate rooms queries
      queryClient.invalidateQueries({ queryKey: [...queryKeys.rooms, organizationId] });
      
      toast({
        title: "Room Created",
        description: `${data.name} has been added to the facility`,
      });
    },
    onError: (error) => {
      
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create room",
        variant: "destructive",
      });
    },
  });
};

// Update room
export const useUpdateRoom = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ roomId, updates }) => 
      schedulingService.updateRoom(roomId, updates),
    onSuccess: (data, { roomId }) => {
      // Update specific room in cache
      queryClient.setQueryData(queryKeys.room(roomId), data);
      
      // Invalidate rooms lists
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
      
      toast({
        title: "Room Updated",
        description: `${data.name} has been updated`,
      });
    },
    onError: (error) => {
      
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update room",
        variant: "destructive",
      });
    },
  });
};

// Create class with resources
export const useCreateClassWithResources = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ organizationId, classData }) => 
      schedulingService.createClassWithResources(organizationId, classData),
    onSuccess: (data, { organizationId }) => {
      // Invalidate multiple related queries
      queryClient.invalidateQueries({ queryKey: [...queryKeys.classSchedule, organizationId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.classes });
      queryClient.invalidateQueries({ queryKey: queryKeys.roomBookings });
      
      toast({
        title: "Class Created",
        description: `${data.name} has been scheduled successfully`,
      });
    },
    onError: (error) => {
      
      toast({
        title: "Scheduling Failed",
        description: error.message || "Failed to create class",
        variant: "destructive",
      });
    },
  });
};

// Check availability
export const useCheckAvailability = () => {
  return useMutation({
    mutationFn: ({ type, resourceId, startTime, endTime, excludeId }) => {
      if (type === 'trainer') {
        return schedulingService.checkTrainerAvailability(resourceId, startTime, endTime, excludeId);
      } else if (type === 'room') {
        return schedulingService.checkRoomAvailability(resourceId, startTime, endTime, excludeId);
      }
      throw new Error('Invalid availability check type');
    },
  });
};

// Set trainer availability
export const useSetTrainerAvailability = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ trainerId, availabilityData }) => 
      schedulingService.setTrainerAvailability(trainerId, availabilityData),
    onSuccess: (data, { trainerId }) => {
      // Invalidate trainer availability
      queryClient.invalidateQueries({ queryKey: queryKeys.trainerAvailability(trainerId) });
      
      toast({
        title: "Availability Updated",
        description: "Trainer availability has been updated",
      });
    },
    onError: (error) => {
      
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update availability",
        variant: "destructive",
      });
    },
  });
};

// Create substitution
export const useCreateSubstitution = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (substitutionData) => schedulingService.createSubstitution(substitutionData),
    onSuccess: () => {
      // Invalidate substitutions queries
      queryClient.invalidateQueries({ queryKey: queryKeys.substitutions });
      
      toast({
        title: "Substitution Requested",
        description: "Substitution request has been submitted for approval",
      });
    },
    onError: (error) => {
      
      toast({
        title: "Request Failed",
        description: error.message || "Failed to create substitution request",
        variant: "destructive",
      });
    },
  });
};

// Promote from waitlist
export const usePromoteFromWaitlist = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (classId) => schedulingService.promoteFromWaitlist(classId),
    onSuccess: (data, classId) => {
      // Invalidate class and booking related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.class(classId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.classSchedule });
      queryClient.invalidateQueries({ queryKey: queryKeys.classBookings });
      
      toast({
        title: "Waitlist Processed",
        description: "Members have been promoted from the waitlist",
      });
    },
    onError: (error) => {
      
      toast({
        title: "Promotion Failed",
        description: error.message || "Failed to promote from waitlist",
        variant: "destructive",
      });
    },
  });
};

export default {
  // Query hooks
  useTrainers,
  useTrainer,
  useTrainerAvailability,
  useRooms,
  useRoom,
  useEquipment,
  useClassSchedule,
  useScheduleConflicts,
  usePendingSubstitutions,
  
  // Mutation hooks
  useCreateTrainer,
  useUpdateTrainer,
  useDeleteTrainer,
  useCreateRoom,
  useUpdateRoom,
  useCreateClassWithResources,
  useCheckAvailability,
  useSetTrainerAvailability,
  useCreateSubstitution,
  usePromoteFromWaitlist,
};

