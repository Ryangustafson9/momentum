
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, ChevronsLeft, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const UserActions = ({ onLogout, userName, userEmail, closeMobileMenu, onImpersonateMemberRole }) => {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2 p-1 rounded-full" aria-label="User menu">
          <Avatar className="h-8 w-8">
            <AvatarImage src={`https://avatar.vercel.sh/${userEmail}.png?s=32`} alt={userName} />
            <AvatarFallback>{userName ? userName.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
          </Avatar>
          <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-gray-300">{userName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => { navigate('/settings'); closeMobileMenu(); }}>
          <UserCircle className="mr-2 h-4 w-4" /> Profile / Settings
        </DropdownMenuItem>
        {onImpersonateMemberRole && (
          <DropdownMenuItem onClick={() => { onImpersonateMemberRole(); closeMobileMenu(); }}>
            <Eye className="mr-2 h-4 w-4" /> Impersonate Member Role
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => { onLogout(); closeMobileMenu(); }}>
          <ChevronsLeft className="mr-2 h-4 w-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserActions;



