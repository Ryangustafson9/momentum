
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MembersHeader = ({ onAddNewMember }) => {
  const navigate = useNavigate();

  const handleAddNewMember = () => {
    navigate('/staff-portal/register-member');
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center text-slate-800 dark:text-slate-100">
          <Users className="mr-3 h-8 w-8 text-primary" /> Manage Members
        </h1>
        <p className="text-muted-foreground mt-1">View, add, and manage all gym members.</p>
      </div>
      <Button 
        onClick={handleAddNewMember} 
        className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-shadow"
      >
        <PlusCircle className="mr-2 h-4 w-4" /> Add New Member
      </Button>
    </div>
  );
};

export default MembersHeader;


