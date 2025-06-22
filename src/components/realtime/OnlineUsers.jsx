/**
 * 👥 ONLINE USERS COMPONENT
 * Display currently online users with presence information
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const OnlineUsers = ({ 
  users = [], 
  title = "Online Now",
  maxDisplay = 5,
  showCount = true,
  showStatus = true,
  className = ''
}) => {
  const displayUsers = users.slice(0, maxDisplay);
  const remainingCount = Math.max(0, users.length - maxDisplay);

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
  };

  const formatLastSeen = (lastActivity) => {
    if (!lastActivity) return 'Just now';
    
    const now = new Date();
    const activity = new Date(lastActivity);
    const diffMs = now - activity;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4" />
          {title}
          {showCount && (
            <Badge variant="secondary" className="ml-auto">
              {users.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        {users.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No one online</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {displayUsers.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Avatar with status indicator */}
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    {showStatus && (
                      <div className={cn(
                        'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background',
                        getStatusColor(user.status)
                      )} />
                    )}
                  </div>

                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {user.name}
                      </p>
                      
                      {user.role && (
                        <Badge 
                          variant="outline" 
                          className="text-xs px-1.5 py-0.5"
                        >
                          {user.role}
                        </Badge>
                      )}
                    </div>
                    
                    {user.lastActivity && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatLastSeen(user.lastActivity)}
                      </div>
                    )}
                  </div>

                  {/* Status badge */}
                  {showStatus && user.status && (
                    <Badge 
                      variant="outline" 
                      className={cn(
                        'text-xs capitalize',
                        user.status === 'online' && 'border-green-200 text-green-700',
                        user.status === 'away' && 'border-yellow-200 text-yellow-700',
                        user.status === 'busy' && 'border-red-200 text-red-700'
                      )}
                    >
                      {user.status}
                    </Badge>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Show remaining count */}
            {remainingCount > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-2"
              >
                <Badge variant="secondary" className="text-xs">
                  +{remainingCount} more
                </Badge>
              </motion.div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OnlineUsers;

