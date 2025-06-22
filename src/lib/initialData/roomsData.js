
import React from 'react';
import { generateUUID } from '@/lib/utils';

export const initialRoomsData = [
  { id: generateUUID(), name: "Main Studio", capacity: 30, amenities: ["Mirrors", "Sound System"], location: "First Floor" },
  { id: generateUUID(), name: "Yoga Room", capacity: 15, amenities: ["Yoga Mats", "Blocks", "Peaceful Ambiance"], location: "Second Floor" },
  { id: generateUUID(), name: "Weight Room", capacity: 25, amenities: ["Free Weights", "Machines"], location: "First Floor, West Wing" },
];



