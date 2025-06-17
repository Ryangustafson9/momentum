// 🚀 SCHEDULING SERVICE - Enhanced scheduling with resource management
import { supabase } from '@/lib/supabaseClient';

export const schedulingService = {
  // ===== TRAINER MANAGEMENT =====
  
  // Get all trainers
  async getTrainers(organizationId, filters = {}) {
    console.log('🔍 SchedulingService: Fetching trainers for org:', organizationId);
    
    let query = supabase
      .from('trainers')
      .select('*')
      .eq('organization_id', organizationId)
      .order('first_name');

    if (filters.active !== undefined) {
      query = query.eq('is_active', filters.active);
    }

    if (filters.specialty) {
      query = query.contains('specialties', [filters.specialty]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ SchedulingService: Error fetching trainers:', error);
      throw new Error(`Failed to fetch trainers: ${error.message}`);
    }

    console.log('✅ SchedulingService: Fetched', data?.length || 0, 'trainers');
    return data || [];
  },

  // Create trainer
  async createTrainer(organizationId, trainerData) {
    console.log('🔄 SchedulingService: Creating trainer:', trainerData.email);
    
    const { data, error } = await supabase
      .from('trainers')
      .insert({
        organization_id: organizationId,
        ...trainerData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ SchedulingService: Error creating trainer:', error);
      throw new Error(`Failed to create trainer: ${error.message}`);
    }

    console.log('✅ SchedulingService: Created trainer:', data.email);
    return data;
  },

  // Update trainer
  async updateTrainer(trainerId, updates) {
    console.log('🔄 SchedulingService: Updating trainer:', trainerId);

    const { data, error } = await supabase
      .from('trainers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', trainerId)
      .select()
      .single();

    if (error) {
      console.error('❌ SchedulingService: Error updating trainer:', error);
      throw new Error(`Failed to update trainer: ${error.message}`);
    }

    console.log('✅ SchedulingService: Updated trainer');
    return data;
  },

  // Delete trainer (soft delete)
  async deleteTrainer(trainerId) {
    console.log('🔄 SchedulingService: Deleting trainer:', trainerId);

    const { data, error } = await supabase
      .from('trainers')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', trainerId)
      .select()
      .single();

    if (error) {
      console.error('❌ SchedulingService: Error deleting trainer:', error);
      throw new Error(`Failed to delete trainer: ${error.message}`);
    }

    console.log('✅ SchedulingService: Deleted trainer');
    return data;
  },

  // Get trainer by ID
  async getTrainer(trainerId) {
    console.log('🔍 SchedulingService: Fetching trainer:', trainerId);

    const { data, error } = await supabase
      .from('trainers')
      .select(`
        *,
        classes:classes!trainer_id(
          id,
          name,
          start_time,
          end_time,
          status
        )
      `)
      .eq('id', trainerId)
      .single();

    if (error) {
      console.error('❌ SchedulingService: Error fetching trainer:', error);
      throw new Error(`Failed to fetch trainer: ${error.message}`);
    }

    console.log('✅ SchedulingService: Fetched trainer:', data.first_name, data.last_name);
    return data;
  },

  // ===== ROOM MANAGEMENT =====
  
  // Get all rooms
  async getRooms(organizationId, filters = {}) {
    console.log('🔍 SchedulingService: Fetching rooms for org:', organizationId);
    
    let query = supabase
      .from('rooms')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');

    if (filters.bookable !== undefined) {
      query = query.eq('is_bookable', filters.bookable);
    }

    if (filters.roomType) {
      query = query.eq('room_type', filters.roomType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ SchedulingService: Error fetching rooms:', error);
      throw new Error(`Failed to fetch rooms: ${error.message}`);
    }

    console.log('✅ SchedulingService: Fetched', data?.length || 0, 'rooms');
    return data || [];
  },

  // Create room
  async createRoom(organizationId, roomData) {
    console.log('🔄 SchedulingService: Creating room:', roomData.name);

    const { data, error } = await supabase
      .from('rooms')
      .insert({
        organization_id: organizationId,
        ...roomData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ SchedulingService: Error creating room:', error);
      throw new Error(`Failed to create room: ${error.message}`);
    }

    console.log('✅ SchedulingService: Created room:', data.name);
    return data;
  },

  // Update room
  async updateRoom(roomId, updates) {
    console.log('🔄 SchedulingService: Updating room:', roomId);

    const { data, error } = await supabase
      .from('rooms')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId)
      .select()
      .single();

    if (error) {
      console.error('❌ SchedulingService: Error updating room:', error);
      throw new Error(`Failed to update room: ${error.message}`);
    }

    console.log('✅ SchedulingService: Updated room');
    return data;
  },

  // Delete room (soft delete)
  async deleteRoom(roomId) {
    console.log('🔄 SchedulingService: Deleting room:', roomId);

    const { data, error } = await supabase
      .from('rooms')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId)
      .select()
      .single();

    if (error) {
      console.error('❌ SchedulingService: Error deleting room:', error);
      throw new Error(`Failed to delete room: ${error.message}`);
    }

    console.log('✅ SchedulingService: Deleted room');
    return data;
  },

  // Get room by ID
  async getRoom(roomId) {
    console.log('🔍 SchedulingService: Fetching room:', roomId);

    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
        equipment:equipment!room_id(*),
        bookings:room_bookings!room_id(
          id,
          start_time,
          end_time,
          status,
          purpose
        )
      `)
      .eq('id', roomId)
      .single();

    if (error) {
      console.error('❌ SchedulingService: Error fetching room:', error);
      throw new Error(`Failed to fetch room: ${error.message}`);
    }

    console.log('✅ SchedulingService: Fetched room:', data.name);
    return data;
  },

  // ===== EQUIPMENT MANAGEMENT =====
  
  // Get all equipment
  async getEquipment(organizationId, filters = {}) {
    console.log('🔍 SchedulingService: Fetching equipment for org:', organizationId);
    
    let query = supabase
      .from('equipment')
      .select(`
        *,
        room:rooms(name)
      `)
      .eq('organization_id', organizationId)
      .order('name');

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.equipmentType) {
      query = query.eq('equipment_type', filters.equipmentType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ SchedulingService: Error fetching equipment:', error);
      throw new Error(`Failed to fetch equipment: ${error.message}`);
    }

    console.log('✅ SchedulingService: Fetched', data?.length || 0, 'equipment items');
    return data || [];
  },

  // ===== AVAILABILITY MANAGEMENT =====
  
  // Check trainer availability
  async checkTrainerAvailability(trainerId, startTime, endTime, excludeClassId = null) {
    console.log('🔍 SchedulingService: Checking trainer availability:', trainerId);
    
    const { data, error } = await supabase
      .rpc('check_trainer_availability', {
        trainer_id: trainerId,
        start_time: startTime,
        end_time: endTime,
        exclude_class_id: excludeClassId
      });

    if (error) {
      console.error('❌ SchedulingService: Error checking trainer availability:', error);
      throw new Error(`Failed to check trainer availability: ${error.message}`);
    }

    return data;
  },

  // Check room availability
  async checkRoomAvailability(roomId, startTime, endTime, excludeBookingId = null) {
    console.log('🔍 SchedulingService: Checking room availability:', roomId);
    
    const { data, error } = await supabase
      .rpc('check_room_availability', {
        room_id: roomId,
        start_time: startTime,
        end_time: endTime,
        exclude_booking_id: excludeBookingId
      });

    if (error) {
      console.error('❌ SchedulingService: Error checking room availability:', error);
      throw new Error(`Failed to check room availability: ${error.message}`);
    }

    return data;
  },

  // Get trainer availability for a date range
  async getTrainerAvailability(trainerId, startDate, endDate) {
    console.log('🔍 SchedulingService: Fetching trainer availability:', trainerId);
    
    const { data, error } = await supabase
      .from('trainer_availability')
      .select('*')
      .eq('trainer_id', trainerId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('❌ SchedulingService: Error fetching trainer availability:', error);
      throw new Error(`Failed to fetch trainer availability: ${error.message}`);
    }

    return data || [];
  },

  // Set trainer availability
  async setTrainerAvailability(trainerId, availabilityData) {
    console.log('🔄 SchedulingService: Setting trainer availability:', trainerId);
    
    const { data, error } = await supabase
      .from('trainer_availability')
      .upsert({
        trainer_id: trainerId,
        ...availabilityData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ SchedulingService: Error setting trainer availability:', error);
      throw new Error(`Failed to set trainer availability: ${error.message}`);
    }

    return data;
  },

  // ===== CLASS SCHEDULING =====
  
  // Get enhanced class schedule
  async getClassSchedule(organizationId, filters = {}) {
    console.log('🔍 SchedulingService: Fetching class schedule for org:', organizationId);
    
    let query = supabase
      .from('classes')
      .select(`
        *,
        trainer:trainers(first_name, last_name, email, specialties),
        room:rooms(name, capacity, room_type),
        bookings:class_bookings(
          id,
          member:profiles!member_id(first_name, last_name),
          status,
          booked_at
        ),
        waitlist:class_waitlist(
          id,
          member:profiles!member_id(first_name, last_name),
          position,
          status
        )
      `)
      .order('start_time', { ascending: true });

    // Apply filters
    if (filters.date) {
      const startOfDay = `${filters.date}T00:00:00`;
      const endOfDay = `${filters.date}T23:59:59`;
      query = query.gte('start_time', startOfDay).lte('start_time', endOfDay);
    }

    if (filters.trainerId) {
      query = query.eq('trainer_id', filters.trainerId);
    }

    if (filters.roomId) {
      query = query.eq('room_id', filters.roomId);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ SchedulingService: Error fetching class schedule:', error);
      throw new Error(`Failed to fetch class schedule: ${error.message}`);
    }

    // Process classes to add enrollment and conflict information
    const processedClasses = (data || []).map(classItem => {
      const activeBookings = classItem.bookings?.filter(b => b.status === 'confirmed') || [];
      const waitlistMembers = classItem.waitlist?.filter(w => w.status === 'waiting') || [];
      
      return {
        ...classItem,
        enrolled: activeBookings.length,
        waitlistCount: waitlistMembers.length,
        hasConflicts: false, // Will be populated by conflict detection
        bookings: activeBookings,
        waitlist: waitlistMembers
      };
    });

    console.log('✅ SchedulingService: Fetched', processedClasses.length, 'classes');
    return processedClasses;
  },

  // Create class with resource validation
  async createClassWithResources(organizationId, classData) {
    console.log('🔄 SchedulingService: Creating class with resources:', classData.name);
    
    // Validate trainer availability
    if (classData.trainerId) {
      const trainerAvailable = await this.checkTrainerAvailability(
        classData.trainerId,
        classData.startTime,
        classData.endTime
      );
      
      if (!trainerAvailable) {
        throw new Error('Trainer is not available at the selected time');
      }
    }

    // Validate room availability
    if (classData.roomId) {
      const roomAvailable = await this.checkRoomAvailability(
        classData.roomId,
        classData.startTime,
        classData.endTime
      );
      
      if (!roomAvailable) {
        throw new Error('Room is not available at the selected time');
      }
    }

    // Create the class
    const { data: newClass, error: classError } = await supabase
      .from('classes')
      .insert({
        name: classData.name,
        description: classData.description,
        trainer_id: classData.trainerId,
        room_id: classData.roomId,
        start_time: classData.startTime,
        end_time: classData.endTime,
        capacity: classData.capacity,
        price: classData.price,
        difficulty: classData.difficulty,
        category: classData.category,
        required_equipment: classData.requiredEquipment || [],
        room_setup_time: classData.setupTime || 15,
        room_cleanup_time: classData.cleanupTime || 15,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (classError) {
      console.error('❌ SchedulingService: Error creating class:', classError);
      throw new Error(`Failed to create class: ${classError.message}`);
    }

    // Create room booking if room is specified
    if (classData.roomId) {
      await this.createRoomBooking({
        roomId: classData.roomId,
        organizationId,
        bookedBy: classData.createdBy,
        bookingType: 'class',
        startTime: classData.startTime,
        endTime: classData.endTime,
        setupTime: classData.setupTime || 15,
        cleanupTime: classData.cleanupTime || 15,
        classId: newClass.id,
        purpose: `Class: ${classData.name}`
      });
    }

    console.log('✅ SchedulingService: Created class with resources:', newClass.name);
    return newClass;
  },

  // ===== ROOM BOOKING =====
  
  // Create room booking
  async createRoomBooking(bookingData) {
    console.log('🔄 SchedulingService: Creating room booking');
    
    const { data, error } = await supabase
      .from('room_bookings')
      .insert({
        ...bookingData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ SchedulingService: Error creating room booking:', error);
      throw new Error(`Failed to create room booking: ${error.message}`);
    }

    return data;
  },

  // ===== SUBSTITUTIONS =====
  
  // Create substitution request
  async createSubstitution(substitutionData) {
    console.log('🔄 SchedulingService: Creating substitution request');
    
    const { data, error } = await supabase
      .from('class_substitutions')
      .insert({
        ...substitutionData,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ SchedulingService: Error creating substitution:', error);
      throw new Error(`Failed to create substitution: ${error.message}`);
    }

    return data;
  },

  // Get pending substitutions
  async getPendingSubstitutions(organizationId) {
    console.log('🔍 SchedulingService: Fetching pending substitutions');
    
    const { data, error } = await supabase
      .from('class_substitutions')
      .select(`
        *,
        class:classes(name, start_time, end_time),
        original_trainer:trainers!original_trainer_id(first_name, last_name),
        substitute_trainer:trainers!substitute_trainer_id(first_name, last_name),
        requested_by_user:profiles!requested_by(first_name, last_name)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ SchedulingService: Error fetching substitutions:', error);
      throw new Error(`Failed to fetch substitutions: ${error.message}`);
    }

    return data || [];
  },

  // ===== CONFLICT DETECTION =====
  
  // Detect schedule conflicts
  async detectScheduleConflicts(organizationId, dateRange = {}) {
    console.log('🔍 SchedulingService: Detecting schedule conflicts');
    
    const startDate = dateRange.startDate || new Date().toISOString().split('T')[0];
    const endDate = dateRange.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get all classes in the date range
    const classes = await this.getClassSchedule(organizationId, {
      startDate,
      endDate
    });

    const conflicts = [];

    // Check for trainer conflicts
    const trainerSchedule = {};
    classes.forEach(classItem => {
      if (!classItem.trainer_id) return;
      
      if (!trainerSchedule[classItem.trainer_id]) {
        trainerSchedule[classItem.trainer_id] = [];
      }
      trainerSchedule[classItem.trainer_id].push(classItem);
    });

    // Detect trainer double-booking
    Object.entries(trainerSchedule).forEach(([trainerId, trainerClasses]) => {
      for (let i = 0; i < trainerClasses.length; i++) {
        for (let j = i + 1; j < trainerClasses.length; j++) {
          const class1 = trainerClasses[i];
          const class2 = trainerClasses[j];
          
          if (this.timesOverlap(class1.start_time, class1.end_time, class2.start_time, class2.end_time)) {
            conflicts.push({
              type: 'trainer_double_booked',
              severity: 'high',
              trainerId,
              classIds: [class1.id, class2.id],
              conflictStart: class1.start_time,
              conflictEnd: class1.end_time,
              description: `Trainer double-booked: ${class1.name} and ${class2.name}`
            });
          }
        }
      }
    });

    // Check for room conflicts (similar logic)
    const roomSchedule = {};
    classes.forEach(classItem => {
      if (!classItem.room_id) return;
      
      if (!roomSchedule[classItem.room_id]) {
        roomSchedule[classItem.room_id] = [];
      }
      roomSchedule[classItem.room_id].push(classItem);
    });

    // Detect room double-booking
    Object.entries(roomSchedule).forEach(([roomId, roomClasses]) => {
      for (let i = 0; i < roomClasses.length; i++) {
        for (let j = i + 1; j < roomClasses.length; j++) {
          const class1 = roomClasses[i];
          const class2 = roomClasses[j];
          
          if (this.timesOverlap(class1.start_time, class1.end_time, class2.start_time, class2.end_time)) {
            conflicts.push({
              type: 'room_double_booked',
              severity: 'high',
              roomId,
              classIds: [class1.id, class2.id],
              conflictStart: class1.start_time,
              conflictEnd: class1.end_time,
              description: `Room double-booked: ${class1.name} and ${class2.name}`
            });
          }
        }
      }
    });

    console.log('✅ SchedulingService: Detected', conflicts.length, 'conflicts');
    return conflicts;
  },

  // Helper function to check time overlap
  timesOverlap(start1, end1, start2, end2) {
    const s1 = new Date(start1);
    const e1 = new Date(end1);
    const s2 = new Date(start2);
    const e2 = new Date(end2);
    
    return s1 < e2 && s2 < e1;
  },

  // ===== WAITLIST MANAGEMENT =====
  
  // Promote from waitlist
  async promoteFromWaitlist(classId) {
    console.log('🔄 SchedulingService: Promoting from waitlist for class:', classId);
    
    const { error } = await supabase
      .rpc('promote_from_waitlist', {
        class_id: classId
      });

    if (error) {
      console.error('❌ SchedulingService: Error promoting from waitlist:', error);
      throw new Error(`Failed to promote from waitlist: ${error.message}`);
    }

    console.log('✅ SchedulingService: Promoted members from waitlist');
    return true;
  }
};

export default schedulingService;
