// 🚀 CLASS MANAGEMENT HOOKS - React Query integration for class booking system
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, cacheUtils } from '@/lib/queryClient';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

// Class service functions
const classService = {
  // Get all classes with optional date filtering
  async getClasses(filters = {}) {
    console.log('🔍 ClassService: Fetching classes with filters:', filters);
    
    let query = supabase
      .from('classes')
      .select(`
        *,
        instructor:profiles!instructor_id(first_name, last_name, email),
        bookings:class_bookings(
          id,
          member:profiles!member_id(first_name, last_name),
          status,
          booked_at
        )
      `)
      .order('start_time', { ascending: true });

    // Apply date filter
    if (filters.date) {
      const startOfDay = `${filters.date}T00:00:00`;
      const endOfDay = `${filters.date}T23:59:59`;
      query = query.gte('start_time', startOfDay).lte('start_time', endOfDay);
    }

    // Apply status filter
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ ClassService: Error fetching classes:', error);
      throw new Error(`Failed to fetch classes: ${error.message}`);
    }

    // Process classes to add enrollment counts
    const processedClasses = (data || []).map(classItem => {
      const activeBookings = classItem.bookings?.filter(b => b.status === 'confirmed') || [];
      const waitlistBookings = classItem.bookings?.filter(b => b.status === 'waitlisted') || [];
      
      return {
        ...classItem,
        enrolled: activeBookings.length,
        waitlist: waitlistBookings.length,
        bookings: classItem.bookings || []
      };
    });

    console.log('✅ ClassService: Fetched', processedClasses.length, 'classes');
    return processedClasses;
  },

  // Get single class details
  async getClass(classId) {
    console.log('🔍 ClassService: Fetching class:', classId);
    
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        instructor:profiles!instructor_id(first_name, last_name, email, avatar_url),
        bookings:class_bookings(
          id,
          member:profiles!member_id(first_name, last_name, email),
          status,
          booked_at
        )
      `)
      .eq('id', classId)
      .single();

    if (error) {
      console.error('❌ ClassService: Error fetching class:', error);
      throw new Error(`Failed to fetch class: ${error.message}`);
    }

    // Process enrollment data
    const activeBookings = data.bookings?.filter(b => b.status === 'confirmed') || [];
    const waitlistBookings = data.bookings?.filter(b => b.status === 'waitlisted') || [];

    const processedClass = {
      ...data,
      enrolled: activeBookings.length,
      waitlist: waitlistBookings.length
    };

    console.log('✅ ClassService: Fetched class:', data.name);
    return processedClass;
  },

  // Create new class
  async createClass(classData) {
    console.log('🔄 ClassService: Creating class:', classData.name);
    
    const { data, error } = await supabase
      .from('classes')
      .insert({
        name: classData.name,
        description: classData.description,
        instructor_id: classData.instructorId,
        start_time: classData.startTime,
        end_time: classData.endTime,
        capacity: classData.capacity,
        location: classData.location,
        difficulty: classData.difficulty,
        category: classData.category,
        price: classData.price,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ ClassService: Error creating class:', error);
      throw new Error(`Failed to create class: ${error.message}`);
    }

    console.log('✅ ClassService: Created class:', data.name);
    return data;
  },

  // Update class
  async updateClass(classId, updates) {
    console.log('🔄 ClassService: Updating class:', classId);
    
    const { data, error } = await supabase
      .from('classes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', classId)
      .select()
      .single();

    if (error) {
      console.error('❌ ClassService: Error updating class:', error);
      throw new Error(`Failed to update class: ${error.message}`);
    }

    console.log('✅ ClassService: Updated class:', data.name);
    return data;
  },

  // Delete class
  async deleteClass(classId) {
    console.log('🔄 ClassService: Deleting class:', classId);
    
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', classId);

    if (error) {
      console.error('❌ ClassService: Error deleting class:', error);
      throw new Error(`Failed to delete class: ${error.message}`);
    }

    console.log('✅ ClassService: Deleted class');
    return true;
  },

  // Book a class
  async bookClass(classId, memberId) {
    console.log('🔄 ClassService: Booking class:', classId, 'for member:', memberId);
    
    // First check if class has capacity
    const classData = await this.getClass(classId);
    
    let status = 'confirmed';
    if (classData.enrolled >= classData.capacity) {
      status = 'waitlisted';
    }

    const { data, error } = await supabase
      .from('class_bookings')
      .insert({
        class_id: classId,
        member_id: memberId,
        status: status,
        booked_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ ClassService: Error booking class:', error);
      throw new Error(`Failed to book class: ${error.message}`);
    }

    console.log('✅ ClassService: Booked class with status:', status);
    return { ...data, status };
  },

  // Cancel booking
  async cancelBooking(bookingId) {
    console.log('🔄 ClassService: Cancelling booking:', bookingId);
    
    const { error } = await supabase
      .from('class_bookings')
      .delete()
      .eq('id', bookingId);

    if (error) {
      console.error('❌ ClassService: Error cancelling booking:', error);
      throw new Error(`Failed to cancel booking: ${error.message}`);
    }

    console.log('✅ ClassService: Cancelled booking');
    return true;
  },

  // Get member's bookings
  async getMemberBookings(memberId) {
    console.log('🔍 ClassService: Fetching bookings for member:', memberId);
    
    const { data, error } = await supabase
      .from('class_bookings')
      .select(`
        *,
        class:classes(
          name,
          start_time,
          end_time,
          location,
          instructor:profiles!instructor_id(first_name, last_name)
        )
      `)
      .eq('member_id', memberId)
      .order('booked_at', { ascending: false });

    if (error) {
      console.error('❌ ClassService: Error fetching member bookings:', error);
      throw new Error(`Failed to fetch member bookings: ${error.message}`);
    }

    console.log('✅ ClassService: Fetched', data?.length || 0, 'bookings');
    return data || [];
  }
};

// React Query Hooks

// Get classes with optional filtering
export const useClasses = (filters = {}) => {
  return useQuery({
    queryKey: [...queryKeys.classes, filters],
    queryFn: () => classService.getClasses(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes cache (formerly cacheTime)
  });
};

// Get single class
export const useClass = (classId) => {
  return useQuery({
    queryKey: queryKeys.class(classId),
    queryFn: () => classService.getClass(classId),
    enabled: !!classId,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

// Get member's bookings
export const useMemberBookings = (memberId) => {
  return useQuery({
    queryKey: queryKeys.memberClasses(memberId),
    queryFn: () => classService.getMemberBookings(memberId),
    enabled: !!memberId,
    staleTime: 1 * 60 * 1000, // 1 minute for bookings
  });
};

// Mutation hooks

// Create class
export const useCreateClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: classService.createClass,
    onSuccess: (data) => {
      // Invalidate classes queries
      queryClient.invalidateQueries({ queryKey: queryKeys.classes });
      
      toast({
        title: "Class Created",
        description: `${data.name} has been successfully created`,
      });
    },
    onError: (error) => {
      console.error('Create class error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create class",
        variant: "destructive",
      });
    },
  });
};

// Update class
export const useUpdateClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ classId, updates }) => classService.updateClass(classId, updates),
    onSuccess: (data, { classId }) => {
      // Update specific class in cache
      queryClient.setQueryData(queryKeys.class(classId), data);
      
      // Invalidate classes lists
      queryClient.invalidateQueries({ queryKey: queryKeys.classes });
      
      toast({
        title: "Class Updated",
        description: `${data.name} has been successfully updated`,
      });
    },
    onError: (error) => {
      console.error('Update class error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update class",
        variant: "destructive",
      });
    },
  });
};

// Delete class
export const useDeleteClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: classService.deleteClass,
    onSuccess: (_, classId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.class(classId) });
      
      // Invalidate classes lists
      queryClient.invalidateQueries({ queryKey: queryKeys.classes });
      
      toast({
        title: "Class Deleted",
        description: "Class has been successfully deleted",
      });
    },
    onError: (error) => {
      console.error('Delete class error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete class",
        variant: "destructive",
      });
    },
  });
};

// Book class
export const useBookClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ classId, memberId }) => classService.bookClass(classId, memberId),
    onSuccess: (data, { classId, memberId }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.class(classId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.classes });
      queryClient.invalidateQueries({ queryKey: queryKeys.memberClasses(memberId) });
      
      const message = data.status === 'waitlisted' 
        ? "You've been added to the waitlist!"
        : "Class booked successfully!";
      
      toast({
        title: data.status === 'waitlisted' ? "Added to Waitlist" : "Class Booked",
        description: message,
      });
    },
    onError: (error) => {
      console.error('Book class error:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book class",
        variant: "destructive",
      });
    },
  });
};

// Cancel booking
export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: classService.cancelBooking,
    onSuccess: () => {
      // Invalidate all class-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.classes });
      
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been successfully cancelled",
      });
    },
    onError: (error) => {
      console.error('Cancel booking error:', error);
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel booking",
        variant: "destructive",
      });
    },
  });
};

export default {
  useClasses,
  useClass,
  useMemberBookings,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
  useBookClass,
  useCancelBooking,
};
