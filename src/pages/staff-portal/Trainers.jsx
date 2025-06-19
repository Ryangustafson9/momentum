
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCog, Mail, Phone, Award, PlusCircle, Search, Edit, Trash2, MoreVertical, CalendarDays, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Removed CardDescription
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.jsx';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.jsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog.jsx';
import { Textarea } from '@/components/ui/textarea.jsx'; 


const initialTrainers = [
  { id: 1, name: 'Alice Wonderland', email: 'alice.trainer@example.com', phone: '555-0201', specialization: 'Yoga, Pilates', experience: '5 years', bio: 'Certified Yoga and Pilates instructor with a passion for holistic wellness.' },
  { id: 2, name: 'Bob The Builder', email: 'bob.trainer@example.com', phone: '555-0202', specialization: 'HIIT, Strength Training', experience: '3 years', bio: 'Expert in high-intensity interval training and strength conditioning.'  },
  { id: 3, name: 'Carol White', email: 'carol.trainer@example.com', phone: '555-0203', specialization: 'CrossFit, Olympic Lifting', experience: '7 years', bio: 'Level 2 CrossFit coach, focused on functional fitness and performance.' },
];

const TrainerCard = ({ trainer, onEdit, onDelete }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 flex flex-col"
    >
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-pink-500 flex items-center justify-center">
                    <UserCog className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-gray-800">{trainer.name}</h3>
                    <p className="text-sm text-primary font-medium">{trainer.specialization}</p>
                </div>
            </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(trainer)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem> {/* Placeholder for future functionality */}
                <CalendarDays className="mr-2 h-4 w-4" /> View Schedule
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(trainer)} className="text-red-600 hover:!text-red-600 hover:!bg-red-50">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Trainer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <p className="flex items-center"><Mail className="h-4 w-4 mr-2 text-gray-400" /> {trainer.email}</p>
          <p className="flex items-center"><Phone className="h-4 w-4 mr-2 text-gray-400" /> {trainer.phone}</p>
          <p className="flex items-center"><Award className="h-4 w-4 mr-2 text-gray-400" /> Experience: {trainer.experience}</p>
          {trainer.bio && <p className="text-xs italic text-gray-500 pt-2 border-t border-gray-100 mt-2">{trainer.bio}</p>}
        </div>
      </div>
      <div className="bg-gray-50 p-4 text-right">
          <Button variant="link" size="sm">View Full Profile</Button> {/* Placeholder */}
      </div>
    </motion.div>
  );

const TrainerList = ({ trainers, onEdit, onDelete }) => {
    if (trainers.length === 0) {
        return (
            <div className="text-center py-12">
                <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No trainers found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or add a new trainer.</p>
            </div>
        );
    }
    return (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainers.map((trainer) => (
                <TrainerCard key={trainer.id} trainer={trainer} onEdit={onEdit} onDelete={onDelete} />
            ))}
        </motion.div>
    );
};

const TrainerFormDialog = ({ isOpen, onOpenChange, editingTrainer, onSubmit }) => {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', specialization: '', experience: '', bio: '' });

    useEffect(() => {
        if (editingTrainer) {
            setFormData({ ...editingTrainer });
        } else {
            setFormData({ name: '', email: '', phone: '', specialization: '', experience: '', bio: '' });
        }
    }, [editingTrainer, isOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmitForm = (e) => {
        e.preventDefault();
        onSubmit(formData, editingTrainer);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>{editingTrainer ? 'Edit Trainer Profile' : 'Add New Trainer'}</DialogTitle>
                <DialogDescription>
                {editingTrainer ? 'Update the details for this trainer.' : 'Enter the details for the new trainer.'}
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitForm} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                <Label htmlFor="name-dialog-trainer">Full Name</Label>
                <Input id="name-dialog-trainer" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div>
                <Label htmlFor="email-dialog-trainer">Email Address</Label>
                <Input id="email-dialog-trainer" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                </div>
                <div>
                <Label htmlFor="phone-dialog-trainer">Phone Number</Label>
                <Input id="phone-dialog-trainer" name="phone" value={formData.phone} onChange={handleInputChange} />
                </div>
                <div>
                <Label htmlFor="specialization-dialog-trainer">Specialization (e.g., Yoga, HIIT)</Label>
                <Input id="specialization-dialog-trainer" name="specialization" value={formData.specialization} onChange={handleInputChange} required />
                </div>
                <div>
                <Label htmlFor="experience-dialog-trainer">Years of Experience</Label>
                <Input id="experience-dialog-trainer" name="experience" value={formData.experience} onChange={handleInputChange} />
                </div>
                <div>
                <Label htmlFor="bio-dialog-trainer">Short Bio</Label>
                <Textarea id="bio-dialog-trainer" name="bio" value={formData.bio} onChange={handleInputChange} placeholder="Briefly describe the trainer's expertise and passion." rows={3}/>
                </div>
                <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">{editingTrainer ? 'Save Changes' : 'Add Trainer'}</Button>
                </DialogFooter>
            </form>
            </DialogContent>
        </Dialog>
    );
};


const Trainers = () => {
  const [trainers, setTrainers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [trainerToDelete, setTrainerToDelete] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedTrainers = JSON.parse(localStorage.getItem('trainers'));
    if (storedTrainers) {
      setTrainers(storedTrainers);
    } else {
      setTrainers(initialTrainers);
      localStorage.setItem('trainers', JSON.stringify(initialTrainers));
    }
  }, []);

  const handleFormSubmit = (formData, currentEditingTrainer) => {
    const newTrainerData = {
      id: currentEditingTrainer ? currentEditingTrainer.id : Date.now(),
      ...formData,
    };

    let updatedTrainers;
    if (currentEditingTrainer) {
      updatedTrainers = trainers.map((t) => (t.id === currentEditingTrainer.id ? newTrainerData : t));
      toast({ title: 'Trainer Updated', description: `${newTrainerData.name} has been updated successfully.` });
    } else {
      updatedTrainers = [...trainers, newTrainerData];
      toast({ title: 'Trainer Added', description: `${newTrainerData.name} has been added successfully.` });
    }
    setTrainers(updatedTrainers);
    localStorage.setItem('trainers', JSON.stringify(updatedTrainers));
    setIsFormOpen(false);
    setEditingTrainer(null);
  };

  const handleEdit = (trainer) => {
    setEditingTrainer(trainer);
    setIsFormOpen(true);
  };

  const handleDeletePrompt = (trainer) => {
    setTrainerToDelete(trainer);
  };

  const confirmDelete = () => {
    if (!trainerToDelete) return;
    const updatedTrainers = trainers.filter((t) => t.id !== trainerToDelete.id);
    setTrainers(updatedTrainers);
    localStorage.setItem('trainers', JSON.stringify(updatedTrainers));
    toast({ title: 'Trainer Deleted', description: `${trainerToDelete.name} has been deleted.`, variant: 'destructive' });
    setTrainerToDelete(null);
  };

  const filteredTrainers = trainers.filter(
    (trainer) =>
      trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Trainers</h1>
            <p className="text-muted-foreground">Oversee trainer profiles and specializations.</p>
        </div>
        <Button onClick={() => { setEditingTrainer(null); setIsFormOpen(true); }} className="bg-primary hover:bg-primary/90">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Trainer
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search trainers by name or specialization..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full md:w-1/2 lg:w-1/3"
        />
      </div>

      <TrainerList trainers={filteredTrainers} onEdit={handleEdit} onDelete={handleDeletePrompt} />
      
      {filteredTrainers.length === 0 && searchTerm && (
         <p className="text-center text-muted-foreground">No trainers match your search "{searchTerm}".</p>
      )}
       {trainers.length > 0 && filteredTrainers.length === 0 && !searchTerm && (
         <p className="text-center text-muted-foreground">No trainers available. Add one to get started!</p>
      )}

      <TrainerFormDialog 
        isOpen={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        editingTrainer={editingTrainer} 
        onSubmit={handleFormSubmit}
      />
      
       <AlertDialog open={!!trainerToDelete} onOpenChange={() => setTrainerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this trainer?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete <span className="font-semibold">{trainerToDelete?.name}</span> and all their associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete Trainer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Trainers;


