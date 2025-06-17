import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthQuery as useAuth } from '@/hooks/useAuthQuery';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Crown, 
  Shield, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  LogOut, 
  Settings,
  CreditCard,
  UserCircle
} from 'lucide-react';

const AccountIndicator = ({ className = "" }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!user) return null;

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4" />;
      case 'staff': return <Shield className="w-4 h-4" />;
      case 'member': return <Users className="w-4 h-4" />;
      case 'nonmember': return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'staff': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'member': return 'bg-green-100 text-green-800 border-green-200';
      case 'nonmember': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'staff': return 'Staff Member';
      case 'member': return 'Member';
      case 'nonmember': return 'Guest';
      default: return 'User';
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getQuickActions = () => {
    const actions = [
      {
        label: 'My Profile',
        icon: <UserCircle className="w-4 h-4" />,
        onClick: () => navigate('/profile'),
        show: true
      },
      {
        label: 'Settings',
        icon: <Settings className="w-4 h-4" />,
        onClick: () => navigate('/settings'),
        show: ['admin', 'staff'].includes(user.role)
      },
      {
        label: 'Billing',
        icon: <CreditCard className="w-4 h-4" />,
        onClick: () => navigate('/member/billing'),
        show: user.role === 'member'
      },
      {
        label: 'Join Membership',
        icon: <CreditCard className="w-4 h-4" />,
        onClick: () => navigate('/join-online'),
        show: user.role === 'nonmember'
      }
    ];

    return actions.filter(action => action.show);
  };

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="shadow-lg border-2 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-3">
            {/* Collapsed View */}
            <div 
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {/* Avatar */}
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {(user.first_name || user.name || user.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>

              {/* User Info */}
              <div className="flex-grow min-w-0">
                <p className="font-medium text-sm truncate">
                  {user.first_name && user.last_name 
                    ? `${user.first_name} ${user.last_name}`
                    : user.name || user.email?.split('@')[0] || 'User'
                  }
                </p>
                <div className="flex items-center space-x-2">
                  <Badge className={`text-xs ${getRoleBadgeColor(user.role)}`}>
                    {getRoleIcon(user.role)}
                    <span className="ml-1">{getRoleDisplayName(user.role)}</span>
                  </Badge>
                </div>
              </div>

              {/* Expand/Collapse Icon */}
              <div className="text-gray-400">
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </div>

            {/* Expanded View */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <Separator className="my-3" />
                  
                  {/* User Details */}
                  <div className="space-y-2 mb-3">
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Email:</span> {user.email}
                    </div>
                    {user.phone && (
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Phone:</span> {user.phone}
                      </div>
                    )}
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Member Since:</span>{' '}
                      {new Date(user.created_at || Date.now()).toLocaleDateString()}
                    </div>
                  </div>

                  <Separator className="my-3" />

                  {/* Quick Actions */}
                  <div className="space-y-2">
                    {getQuickActions().map((action, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs h-8"
                        onClick={() => {
                          action.onClick();
                          setIsExpanded(false);
                        }}
                      >
                        {action.icon}
                        <span className="ml-2">{action.label}</span>
                      </Button>
                    ))}
                    
                    <Separator className="my-2" />
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        handleLogout();
                        setIsExpanded(false);
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="ml-2">Sign Out</span>
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AccountIndicator;
