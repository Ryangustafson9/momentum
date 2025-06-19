import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, MapPin, MoreHorizontal, Edit, Trash2, PlusCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import ClassFormDialog from '@/components/admin/classes/ClassFormDialog';
import DeleteClassDialog from '@/components/admin/classes/DeleteClassDialog';

// Classes Service Functions
const classService = {
  async getClasses() {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          rooms(name),
          profiles!classes_instructor_id_fkey(name)
        `)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching classes:', error);
      throw error;
    }
  },

  async addClass(classData) {
    try {
      const { data, error } = await supabase
        .from('classes')
        .insert([{
          ...classData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding class:', error);
      throw error;
    }
  },

  async updateClass(id, classData) {
    try {
      const { data, error } = await supabase
        .from('classes')
        .update({
          ...classData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating class:', error);
      throw error;
    }
  },

  async deleteClass(id) {
    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting class:', error);
      throw error;
    }
  }
};

const ClassCard = ({ cls, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'full': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <h3 className="font-medium">{cls.name}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(cls)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(cls)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="text-sm text-muted-foreground mt-1 space-y-1">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            {cls.start_time} - {cls.end_time}
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            {cls.day_of_week || 'Not scheduled'}
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            {cls.rooms?.name || 'No room assigned'}
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            {cls.current_capacity || 0}/{cls.max_capacity || 0} participants
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <Badge className={getStatusColor(cls.status)}>
            {cls.status || 'Unknown'}
          </Badge>
          <p className="text-sm text-muted-foreground">
            Instructor: {cls.profiles?.name || 'TBD'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const ClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);

  const { toast } = useToast();

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await classService.getClasses();
      setClasses(data);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({ 
        title: 'Error', 
        description: `Failed to fetch classes: ${error.message}`, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const filteredClasses = classes.filter(cls => {
    const searchLower = searchTerm.toLowerCase();
    return !searchTerm || 
      cls.name?.toLowerCase().includes(searchLower) ||
      cls.description?.toLowerCase().includes(searchLower) ||
      cls.instructor_name?.toLowerCase().includes(searchLower);
  });

  const handleAddClass = () => {
    setSelectedClass(null);
    setIsFormOpen(true);
  };

  const handleEditClass = (cls) => {
    setSelectedClass(cls);
    setIsFormOpen(true);
  };

  const handleDeleteClass = (cls) => {
    setClassToDelete(cls);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteClass = async () => {
    if (!classToDelete) return;
    try {
      await classService.deleteClass(classToDelete.id);
      toast({ title: "Class Deleted", description: `${classToDelete.name} has been deleted.` });
      fetchClasses();
    } catch (error) {
      console.error("Failed to delete class:", error);
      toast({ title: "Error", description: `Could not delete ${classToDelete.name}. ${error.message}`, variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setClassToDelete(null);
    }
  };

  const handleSaveClass = async (classData) => {
    try {
      if (classData.id) {
        await classService.updateClass(classData.id, classData);
        toast({ title: "Class Updated", description: `${classData.name} has been updated.` });
      } else {
        await classService.addClass(classData);
        toast({ title: "Class Created", description: `${classData.name} has been created.` });
      }
      fetchClasses();
      setIsFormOpen(false);
    } catch (error) {
      console.error("Failed to save class:", error);
      toast({ title: "Error", description: `Could not save class. ${error.message}`, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6 p-4 md:p-6 lg:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Classes</h1>
          <p className="text-muted-foreground">Manage your class schedule and instructors</p>
        </div>
        <Button onClick={handleAddClass}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Class
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          type="text"
          placeholder="Search classes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No classes found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first class.'}
          </p>
          <Button onClick={handleAddClass}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add First Class
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => (
            <ClassCard
              key={cls.id}
              cls={cls}
              onEdit={handleEditClass}
              onDelete={handleDeleteClass}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <ClassFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveClass}
        classData={selectedClass}
      />

      <DeleteClassDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDeleteClass}
        className={classToDelete?.name}
      />
    </motion.div>
  );
};

export default ClassesPage;


