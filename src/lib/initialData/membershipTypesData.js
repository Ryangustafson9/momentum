
import React from 'react';
import { generateUUID } from '@/lib/utils';
import { initialStaffRolesData } from './staffRolesData';

export const initialMembershipTypesData = [
  {
    id: 'default-non-member',
    name: 'Non-Member Access',
    price: 0,
    billing_type: 'N/A', 
    duration_months: null,
    features: ['Access to specific events or day passes if configured'],
    available_for_sale: false,
    category: 'Non-Member', 
    color: '#64748B', 
    role_id: null, 
  },
  {
    id: generateUUID(),
    name: 'Individual Standard',
    price: 45,
    billing_type: 'Recurring',
    duration_months: null, 
    features: ['Full gym access', 'Basic classes included'],
    available_for_sale: true,
    category: 'Member',
    color: '#3B82F6', 
    role_id: null,
  },
  {
    id: generateUUID(),
    name: 'Administrator',
    price: 0,
    billing_type: 'N/A',
    duration_months: null,
    features: ['Full system access', 'Administrative privileges'],
    available_for_sale: false,
    category: 'Staff',
    color: '#EF4444', 
    role_id: initialStaffRolesData.find(r => r.name === 'Administrator')?.id || null,
  },
  {
    id: generateUUID(),
    name: 'Instructor',
    price: 0,
    billing_type: 'N/A',
    duration_months: null,
    features: ['Class management', 'Attendance tracking'],
    available_for_sale: false,
    category: 'Staff',
    color: '#F97316', 
    role_id: initialStaffRolesData.find(r => r.name === 'Instructor')?.id || null,
  },
  {
    id: generateUUID(),
    name: 'Individual + Dependents',
    price: 70,
    billing_type: 'Recurring',
    duration_months: null,
    features: ['Full gym access for primary member', 'Access for up to 2 dependents', 'All classes included'],
    available_for_sale: true,
    category: 'Member',
    color: '#10B981', 
    role_id: null,
  }
];



