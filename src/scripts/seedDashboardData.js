// 🚀 SPRINT 1: SEED SAMPLE DATA FOR MEMBER DASHBOARD
// This script populates the existing database with sample data for testing

import { supabase } from '../lib/supabaseClient.js';

// Sample data that works with existing schema
const sampleClasses = [
  {
    name: 'Morning Yoga Flow',
    description: 'Start your day with gentle yoga movements and breathing exercises',
    start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    end_time: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // +1 hour
    max_capacity: 15,
    location: 'Studio A',
    difficulty: 'Beginner'
  },
  {
    name: 'HIIT Training',
    description: 'High-intensity interval training to boost your metabolism',
    start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
    end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(), // +45 min
    max_capacity: 12,
    location: 'Main Gym',
    difficulty: 'Intermediate'
  },
  {
    name: 'Strength & Conditioning',
    description: 'Build muscle and improve overall strength',
    start_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // +1 hour
    max_capacity: 10,
    location: 'Weight Room',
    difficulty: 'Intermediate'
  }
];

// Function to seed classes
export const seedClasses = async () => {
  try {
    
    
    // Check if classes already exist
    const { data: existingClasses } = await supabase
      .from('classes')
      .select('id')
      .limit(1);
    
    if (existingClasses && existingClasses.length > 0) {
      
      return;
    }
    
    const { data, error } = await supabase
      .from('classes')
      .insert(sampleClasses)
      .select();
    
    if (error) {
      
      return;
    }
    
    
    return data;
  } catch (error) {
    
  }
};

// Function to create sample membership for a user
export const createSampleMembership = async (userId) => {
  try {
    
    
    // Check if membership already exists
    const { data: existingMembership } = await supabase
      .from('memberships')
      .select('id')
      .eq('auth_user_id', userId)
      .single();
    
    if (existingMembership) {
      
      return existingMembership;
    }
    
    const membershipData = {
      auth_user_id: userId,
      membership_type: 'Basic',
      status: 'Active',
      start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      monthly_fee: 49.99,
      billing_cycle: 'Monthly'
    };
    
    const { data, error } = await supabase
      .from('memberships')
      .insert([membershipData])
      .select()
      .single();
    
    if (error) {
      
      return null;
    }
    
    
    return data;
  } catch (error) {
    
    return null;
  }
};

// Function to create sample attendance records
export const createSampleAttendance = async (userId) => {
  try {
    
    
    // Check if attendance records already exist
    const { data: existingAttendance } = await supabase
      .from('checkin_history')
      .select('id')
      .eq('member_id', userId)
      .limit(1);
    
    if (existingAttendance && existingAttendance.length > 0) {
      
      return;
    }
    
    // Create 10 sample attendance records (8 present, 2 absent for good stats)
    const attendanceRecords = [];
    for (let i = 0; i < 10; i++) {
      const daysAgo = i + 1;
      const checkInTime = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      attendanceRecords.push({
        member_id: userId,
        member_name: 'Sample Member', // This field exists in the schema
        class_name: `Sample Class ${i + 1}`, // This field exists in the schema
        status: i < 8 ? 'Present' : 'Absent', // 80% attendance rate
        check_in_time: checkInTime.toISOString(),
        notes: i < 8 ? 'Great session!' : 'Missed class'
      });
    }
    
    const { data, error } = await supabase
      .from('checkin_history')
      .insert(attendanceRecords)
      .select();
    
    if (error) {
      
      return;
    }
    
    
    return data;
  } catch (error) {
    
  }
};

// Function to ensure user has a profile
export const ensureUserProfile = async (user) => {
  try {
    
    
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (existingProfile) {
      
      return existingProfile;
    }
    
    // Create profile if it doesn't exist
    const profileData = {
      id: user.id,
      email: user.email,
      first_name: user.user_metadata?.first_name || user.email.split('@')[0],
      last_name: user.user_metadata?.last_name || '',
      role: user.user_metadata?.role || 'member'
    };
    
    const { data, error } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single();
    
    if (error) {
      
      return null;
    }
    
    
    return data;
  } catch (error) {
    
    return null;
  }
};

// Main function to set up all sample data for a user
export const setupSampleDataForUser = async (user) => {
  try {
    
    
    // 1. Ensure user has a profile
    await ensureUserProfile(user);
    
    // 2. Seed classes (if not already done)
    await seedClasses();
    
    // 3. Create membership for user
    await createSampleMembership(user.id);
    
    // 4. Create attendance records for user
    await createSampleAttendance(user.id);
    
    
    return true;
  } catch (error) {
    
    return false;
  }
};

// Export individual functions for flexibility
export default {
  seedClasses,
  createSampleMembership,
  createSampleAttendance,
  ensureUserProfile,
  setupSampleDataForUser
};

