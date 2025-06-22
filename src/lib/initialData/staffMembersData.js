
import React from 'react';
import { generateUUID } from '@/lib/utils';
import { initialStaffRolesData } from './staffRolesData';
import { initialMembershipTypesData } from './membershipTypesData';

export const initialStaffMembersData = [
  { id: 'staff-admin-001', name: 'Admin User', email: 'admin@example.com', phone: '555-0101', role: 'staff', staff_role_id: initialStaffRolesData.find(r => r.name === 'Administrator')?.id || null, membership_type_id: initialMembershipTypesData.find(mt => mt.name === 'Administrator')?.id || null, profile_picture_url: `https://ui-avatars.com/api/?name=Admin+User&background=random&size=128`, join_date: new Date().toISOString().split('T')[0], status: 'active' },
  { id: 'staff-instructor-001', name: 'Jane Instructor', email: 'jane.instructor@example.com', phone: '555-0102', role: 'staff', staff_role_id: initialStaffRolesData.find(r => r.name === 'Instructor')?.id || null, membership_type_id: initialMembershipTypesData.find(mt => mt.name === 'Instructor')?.id || null, profile_picture_url: `https://ui-avatars.com/api/?name=Jane+Instructor&background=random&size=128`, join_date: new Date().toISOString().split('T')[0], status: 'active' },
];



