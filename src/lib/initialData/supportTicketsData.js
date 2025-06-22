
import React from 'react';
import { generateUUID } from '@/lib/utils';
import { initialMembersData } from './membersData';
import { initialStaffMembersData } from './staffMembersData';

export const initialSupportTicketsData = [
  { 
    id: generateUUID(),
    user_id: initialMembersData[0].id, 
    subject: "Issue with treadmill #3",
    description: "Treadmill #3 in the main cardio area is making a loud squeaking noise. It seems like it needs maintenance.",
    category: "Equipment", 
    status: "Open", 
    priority: "Medium", 
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    assigned_to_staff_id: initialStaffMembersData[0].id,
  },
  { 
    id: generateUUID(),
    user_id: initialMembersData[1].id,
    subject: "Question about membership upgrade",
    description: "I'd like to know more about upgrading my 'Individual Standard' plan to 'Individual + Dependents'. Can someone explain the process and any pro-rated charges?",
    category: "Billing",
    status: "In Progress",
    priority: "Low",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    assigned_to_staff_id: null,
  }
];



