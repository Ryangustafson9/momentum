
import React from 'react';
import { generateUUID } from '@/lib/utils';
import { initialMembershipTypesData } from './membershipTypesData';

export const initialMembersData = [
  { id: generateUUID(), name: "Alice Wonderland", email: "alice@example.com", phone: "555-1234", role: 'member', membership_type_id: initialMembershipTypesData.find(mt => mt.name === 'Individual Standard')?.id || null, join_date: "2024-01-15", status: "active", date_of_birth: "1990-05-10", address: "123 Rabbit Hole Lane", emergency_contact_name: "Mad Hatter", emergency_contact_phone: "555-4321", profile_picture_url: `https://ui-avatars.com/api/?name=Alice+Wonderland&background=random&size=128` },
  { id: generateUUID(), name: "Bob The Builder", email: "bob@example.com", phone: "555-5678", role: 'member', membership_type_id: initialMembershipTypesData.find(mt => mt.name === 'Individual + Dependents')?.id || null, join_date: "2024-02-20", status: "active", date_of_birth: "1985-11-25", address: "456 Fixit Ave", profile_picture_url: `https://ui-avatars.com/api/?name=Bob+The+Builder&background=random&size=128` },
  { id: generateUUID(), name: "Charlie Brown", email: "charlie@example.com", phone: "555-8765", role: 'member', membership_type_id: initialMembershipTypesData.find(mt => mt.name === 'Individual Standard')?.id || null, join_date: "2024-03-10", status: "inactive", date_of_birth: "2000-08-01", profile_picture_url: `https://ui-avatars.com/api/?name=Charlie+Brown&background=random&size=128` },
];



