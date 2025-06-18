
import React from 'react';
import { 
  Home, Users, Calendar, BarChart2, Settings, UserCheck, Zap, UserCog, Briefcase
} from 'lucide-react';

export const navLinks = [
  { to: "/staff/staffdashboard", label: "Homepage", icon: Home },
  { to: "/staff/checkin", label: "Check-in", icon: UserCheck },
  { to: "/staff/members", label: "Members", icon: Users },
  { to: "/staff/memberships", label: "Plan Management", icon: Briefcase },
  { to: "/staff/classes", label: "Classes", icon: Calendar },
  { to: "/staff/schedule", label: "Schedule", icon: Zap },
  { to: "/staff/reports", label: "Reports", icon: BarChart2 },
  { to: "/staff/trainers", label: "Trainers", icon: UserCog },
];


