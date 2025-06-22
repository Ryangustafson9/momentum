
import React from 'react';
import { generateUUID } from '@/lib/utils';

export const initialStaffRolesData = [
  { id: generateUUID(), name: 'Administrator', permissions: ['all'], description: 'Full access to all system features and settings.', is_default: true },
  { id: generateUUID(), name: 'Instructor', permissions: ['manage_classes', 'view_members', 'manage_schedule', 'track_attendance'], description: 'Can manage classes, view member profiles, manage schedules, and track attendance.', is_default: false },
  { id: generateUUID(), name: 'Front Desk', permissions: ['manage_members', 'manage_check_in', 'view_schedule'], description: 'Can manage member profiles, handle check-ins, and view class schedules.', is_default: false },
];



