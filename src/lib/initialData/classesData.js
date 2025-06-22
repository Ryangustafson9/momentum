
import React from 'react';
import { generateUUID } from '@/lib/utils';

export const initialClassesData = [
  { id: generateUUID(), name: "Morning Yoga Flow", description: "Start your day with an energizing yoga session.", instructor_id: null, capacity: 20, duration_minutes: 60, difficulty: "Beginner", type: "Yoga", equipment_needed: "Yoga Mat", start_time: "2025-05-20T08:00:00", end_time: "2025-05-20T09:00:00", days_of_week: ["Tuesday", "Thursday"], room_id: null, color: "#8B5CF6" },
  { id: generateUUID(), name: "HIIT Blast", description: "High-intensity interval training to burn calories and build strength.", instructor_id: null, capacity: 15, duration_minutes: 45, difficulty: "Intermediate", type: "Cardio", equipment_needed: "None", start_time: "2025-05-20T18:00:00", end_time: "2025-05-20T18:45:00", days_of_week: ["Monday", "Wednesday", "Friday"], room_id: null, color: "#EF4444" },
  { id: generateUUID(), name: "Strength Training 101", description: "Learn the fundamentals of strength training.", instructor_id: null, capacity: 10, duration_minutes: 75, difficulty: "Beginner", type: "Strength", equipment_needed: "Weights", start_time: "2025-05-21T17:00:00", end_time: "2025-05-21T18:15:00", days_of_week: ["Tuesday", "Thursday"], room_id: null, color: "#F97316" },
];



