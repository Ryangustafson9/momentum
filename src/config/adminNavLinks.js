
import {
  Home, Users, Calendar, BarChart2, UserCheck, Zap, UserCog, Briefcase,
  Mail, CreditCard, Wrench, ShoppingCart
} from 'lucide-react';

export const navLinks = [
  { to: "/staff-portal/dashboard", label: "Homepage", icon: Home },
  { to: "/staff-portal/checkin", label: "Check-in", icon: UserCheck },
  { to: "/staff-portal/members", label: "Members", icon: Users },
  { to: "/staff-portal/memberships", label: "Plan Management", icon: Briefcase },
  { to: "/staff-portal/classes", label: "Classes", icon: Calendar },
  { to: "/staff-portal/schedule", label: "Schedule", icon: Zap },
  { to: "/staff-portal/communications", label: "Communications", icon: Mail },
  { to: "/staff-portal/billing", label: "Billing", icon: CreditCard },
  { to: "/staff-portal/pos", label: "Point of Sale", icon: ShoppingCart },
  { to: "/staff-portal/equipment", label: "Equipment", icon: Wrench },
  { to: "/staff-portal/reports", label: "Reports", icon: BarChart2 },
  { to: "/staff-portal/trainers", label: "Trainers", icon: UserCog },
];


