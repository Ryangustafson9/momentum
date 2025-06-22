
import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Calendar as CalendarIcon, User, MoreVertical, Edit, Trash2, CreditCard, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const MemberCard = ({ member, onEdit, onDelete, onViewProfile }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    transition={{ duration: 0.3 }}
    className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300"
  >
    <div className="p-6">
      <div className="flex justify-between items-start">
        <div onClick={() => onViewProfile(member)} className="cursor-pointer flex-grow">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{member.name}</h3>
            {member.role === 'staff' && (
                <Badge variant="outline" className="text-xs border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/30">
                    <Shield className="h-3 w-3 mr-1" /> Staff
                </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{member.systemMemberId || `ID: ${member.id}`}</p>
          <Badge 
            variant={member.status === 'Active' ? 'success' : 'destructive'} 
            className="mt-1"
          >
            {member.status}
          </Badge>
        </div>
        <DropdownMenu 
            onOpenChange={(e) => { if(e) e.stopPropagation();}} 
            onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewProfile(member); }}>
              <User className="mr-2 h-4 w-4" /> View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(member); }}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(member); }} className="text-red-600 hover:!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-500/10">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer" onClick={() => onViewProfile(member)}>
        <p className="flex items-center"><Mail className="h-4 w-4 mr-2 text-primary" /> {member.email}</p>
        <p className="flex items-center"><Phone className="h-4 w-4 mr-2 text-primary" /> {member.phone || 'N/A'}</p>
        <p className="flex items-center"><CalendarIcon className="h-4 w-4 mr-2 text-primary" /> Joined: {new Date(member.join_date || member.joinDate).toLocaleDateString()}</p>
        {member.membershipType && <p className="flex items-center"><User className="h-4 w-4 mr-2 text-primary" /> Plan: {member.membershipType}</p>}
        {member.accessCardNumber && <p className="flex items-center"><CreditCard className="h-4 w-4 mr-2 text-primary" /> Card: {member.accessCardNumber}</p>}
      </div>
    </div>
  </motion.div>
);

export default MemberCard;



