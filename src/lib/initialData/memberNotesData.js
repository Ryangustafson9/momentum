
import React from 'react';
import { generateUUID } from '@/lib/utils';
import { initialMembersData } from './membersData';
import { initialStaffMembersData } from './staffMembersData';

export const initialMemberNotesData = [
    {
        id: generateUUID(),
        member_id: initialMembersData[0].id,
        staff_id: initialStaffMembersData[0].id,
        note_type: 'General', 
        content: 'Alice mentioned interest in personal training for marathon preparation.',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: generateUUID(),
        member_id: initialMembersData[1].id,
        staff_id: initialStaffMembersData[1].id,
        note_type: 'Goal',
        content: 'Bob aims to lose 10 lbs by end of next month. Recommended HIIT classes and a nutrition consultation.',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
];



