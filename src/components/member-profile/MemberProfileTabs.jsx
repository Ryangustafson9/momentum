/**
 * Member Profile Tabs
 * Tab navigation and content for member profile sections
 * Extracted from the massive MemberProfile component
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Briefcase,
  Calendar, 
  MessageSquare, 
  FolderOpen,
  History
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMemberProfile } from './MemberProfileContext';
import ProfileTab from './tabs/ProfileTab';
import MembershipTab from './tabs/MembershipTab';
import RegistrationsTab from './tabs/RegistrationsTab';
import CommunicationTab from './tabs/CommunicationTab';
import NotesTab from './tabs/NotesTab';
import BillingTab from './tabs/BillingTab';

// ==================== TAB CONFIGURATION ====================

const TAB_CONFIG = [
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    description: 'Personal information and contact details',
    component: ProfileTab
  },
  {
    id: 'membership',
    label: 'Membership',
    icon: Briefcase,
    description: 'Membership plans and status',
    component: MembershipTab
  },
  {
    id: 'registrations',
    label: 'Registrations',
    icon: Calendar,
    description: 'Class registrations and bookings',
    component: RegistrationsTab
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: MessageSquare,
    description: 'Email and SMS communication log',
    component: CommunicationTab
  },
  {
    id: 'notes',
    label: 'Notes & Documents',
    icon: FolderOpen,
    description: 'Staff notes and member documents',
    component: NotesTab
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: History,
    description: 'Payment history and billing information',
    component: BillingTab
  }
];

// ==================== TAB TRIGGER COMPONENT ===================

const TabTriggerWithIcon = ({ tab, isActive }) => {
  const Icon = tab.icon;
  
  return (
    <TabsTrigger 
      value={tab.id}
      className={`
        relative flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium
        transition-all duration-200 rounded-md border border-transparent
        ${isActive 
          ? 'bg-white text-primary shadow-sm' 
          : 'text-gray-500 hover:bg-white/60 hover:text-primary'
        }
      `}
    >
      <Icon className="h-5 w-5" />
      <span>{tab.label}</span>
    </TabsTrigger>
  );
};

// ==================== MAIN COMPONENT ====================

const MemberProfileTabs = () => {
  const { memberData, isLoading } = useMemberProfile();
  const [activeTab, setActiveTab] = useState('profile');

  if (isLoading || !memberData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="flex space-x-4 mb-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded w-24"></div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="bg-gray-100 p-1 rounded-lg grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1">
        {TAB_CONFIG.map(tab => (
          <TabTriggerWithIcon 
            key={tab.id} 
            tab={tab} 
            isActive={activeTab === tab.id}
          />
        ))}
      </TabsList>
      
      <div className="mt-4">
        <AnimatePresence mode="wait">
          {TAB_CONFIG.map(tab => (
            activeTab === tab.id && (
              <TabsContent key={tab.id} value={tab.id} className="m-0">
                <motion.div
                  key={activeTab}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <tab.component />
                </motion.div>
              </TabsContent>
            )
          ))}
        </AnimatePresence>
      </div>
    </Tabs>
  );
};

export default MemberProfileTabs;
