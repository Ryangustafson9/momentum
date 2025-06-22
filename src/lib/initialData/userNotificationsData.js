
import React from 'react';
import { generateUUID } from '@/lib/utils';
import { initialStaffMembersData } from './staffMembersData';

export const initialUserNotificationsData = [
  { 
    id: generateUUID(), 
    user_id: initialStaffMembersData[0].id, 
    title: 'Welcome to GymPro!', 
    message: 'Your admin account is set up. Explore the dashboard to get started.', 
    type: 'system', 
    read: false, 
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() 
  },
  { 
    id: generateUUID(), 
    user_id: initialStaffMembersData[0].id, 
    title: 'New Feature: Advanced Reporting', 
    message: 'Check out the new advanced reporting tools available in the reports section.', 
    type: 'announcement', 
    read: true, 
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() 
  },
];



