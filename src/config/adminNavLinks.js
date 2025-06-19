
import {
  Home, Users, Calendar, BarChart2, UserCheck, Zap, UserCog, Briefcase,
  Mail, CreditCard, Wrench
} from 'lucide-react';

export const navLinks = [
  { to: "/staff/dashboard", label: "Homepage", icon: Home },
  { to: "/staff/checkin", label: "Check-in", icon: UserCheck },
  { to: "/staff/members", label: "Members", icon: Users },
  { to: "/staff/memberships", label: "Plan Management", icon: Briefcase },
  { to: "/staff/classes", label: "Classes", icon: Calendar },
  { to: "/staff/schedule", label: "Schedule", icon: Zap },
  { to: "/staff/communications", label: "Communications", icon: Mail },
  { to: "/staff/billing", label: "Billing", icon: CreditCard },
  { to: "/staff/equipment", label: "Equipment", icon: Wrench },
  { to: "/staff/reports", label: "Reports", icon: BarChart2 },
  { to: "/staff/trainers", label: "Trainers", icon: UserCog },
];


