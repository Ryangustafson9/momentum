
import {
  Home, Users, Calendar, BarChart2, UserCheck, Zap, UserCog, Briefcase,
  Mail, CreditCard, Wrench
} from 'lucide-react';

export const navLinks = [
  { to: "/dashboard", label: "Homepage", icon: Home },
  { to: "/checkin", label: "Check-in", icon: UserCheck },
  { to: "/members", label: "Members", icon: Users },
  { to: "/memberships", label: "Plan Management", icon: Briefcase },
  { to: "/classes", label: "Classes", icon: Calendar },
  { to: "/schedule", label: "Schedule", icon: Zap },
  { to: "/communications", label: "Communications", icon: Mail },
  { to: "/billing", label: "Billing", icon: CreditCard },
  { to: "/equipment", label: "Equipment", icon: Wrench },
  { to: "/reports", label: "Reports", icon: BarChart2 },
  { to: "/trainers", label: "Trainers", icon: UserCog },
];


