// 🚀 TRAINER MANAGEMENT - Comprehensive trainer administration interface
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  User,
  Mail,
  Phone,
  Award,
  DollarSign,
  Calendar,
  MoreVertical,
  Star,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  useTrainers, 
  useCreateTrainer, 
  useUpdateTrainer, 
  useDeleteTrainer 
} from '@/hooks/useScheduling';

const SPECIALTIES_OPTIONS = [
  'Yoga', 'Pilates', 'CrossFit', 'Strength Training', 'Cardio', 'Spin', 
  'Boxing', 'HIIT', 'Zumba', 'Aqua Fitness', 'Personal Training', 'Nutrition'
];

const CERTIFICATIONS_OPTIONS = [
  'ACE Certified', 'NASM Certified', 'ACSM Certified', 'RYT 200', 'RYT 500',
  'CrossFit Level 1', 'CrossFit Level 2', 'First Aid/CPR', 'Nutrition Specialist'
];

const TrainerDialog = ({ isOpen, onClose, trainer, organizationId }) => {
  const createMutation = useCreateTrainer();
  const updateMutation = useUpdateTrainer();
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    specialties: [],
    certifications: [],
    experience_years: 0,
    hourly_rate: 0,
    is_active: true,
    can_substitute: true,
    max_classes_per_day: 8
  });

  // Initialize form data
  React.useEffect(() => {
    if (trainer) {
      setFormData({
        first_name: trainer.first_name || '',
        last_name: trainer.last_name || '',
        email: trainer.email || '',
        phone: trainer.phone || '',
        bio: trainer.bio || '',
        specialties: trainer.specialties || [],
        certifications: trainer.certifications || [],
        experience_years: trainer.experience_years || 0,
        hourly_rate: trainer.hourly_rate || 0,
        is_active: trainer.is_active ?? true,
        can_substitute: trainer.can_substitute ?? true,
        max_classes_per_day: trainer.max_classes_per_day || 8
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        bio: '',
        specialties: [],
        certifications: [],
        experience_years: 0,
        hourly_rate: 0,
        is_active: true,
        can_substitute: true,
        max_classes_per_day: 8
      });
    }
  }, [trainer, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (trainer) {
        await updateMutation.mutateAsync({
          trainerId: trainer.id,
          updates: formData
        });
      } else {
        await createMutation.mutateAsync({
          organizationId,
          trainerData: formData
        });
      }
      onClose();
    } catch (error) {
      
    }
  };

  const handleSpecialtyToggle = (specialty) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const handleCertificationToggle = (certification) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.includes(certification)
        ? prev.certifications.filter(c => c !== certification)
        : [...prev.certifications, certification]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {trainer ? 'Edit Trainer' : 'Add New Trainer'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              rows={3}
              placeholder="Brief description of the trainer's background and expertise"
            />
          </div>

          {/* Professional Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="experience_years">Years of Experience</Label>
              <Input
                id="experience_years"
                type="number"
                min="0"
                value={formData.experience_years}
                onChange={(e) => setFormData(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
              <Input
                id="hourly_rate"
                type="number"
                step="0.01"
                min="0"
                value={formData.hourly_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          {/* Specialties */}
          <div>
            <Label>Specialties</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {SPECIALTIES_OPTIONS.map((specialty) => (
                <div key={specialty} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`specialty-${specialty}`}
                    checked={formData.specialties.includes(specialty)}
                    onChange={() => handleSpecialtyToggle(specialty)}
                    className="rounded"
                  />
                  <Label htmlFor={`specialty-${specialty}`} className="text-sm">
                    {specialty}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div>
            <Label>Certifications</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {CERTIFICATIONS_OPTIONS.map((certification) => (
                <div key={certification} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`cert-${certification}`}
                    checked={formData.certifications.includes(certification)}
                    onChange={() => handleCertificationToggle(certification)}
                    className="rounded"
                  />
                  <Label htmlFor={`cert-${certification}`} className="text-sm">
                    {certification}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Active Trainer</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="can_substitute"
                checked={formData.can_substitute}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, can_substitute: checked }))}
              />
              <Label htmlFor="can_substitute">Available for Substitutions</Label>
            </div>

            <div>
              <Label htmlFor="max_classes_per_day">Max Classes per Day</Label>
              <Input
                id="max_classes_per_day"
                type="number"
                min="1"
                max="12"
                value={formData.max_classes_per_day}
                onChange={(e) => setFormData(prev => ({ ...prev, max_classes_per_day: parseInt(e.target.value) || 8 }))}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              {trainer ? 'Update' : 'Create'} Trainer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const TrainerCard = ({ trainer, onEdit, onDelete }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-medium text-gray-900">
                  {trainer.first_name} {trainer.last_name}
                </h3>
                {trainer.is_active ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="w-3 h-3 mr-1" />
                    Inactive
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>{trainer.email}</span>
                </div>
                
                {trainer.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{trainer.phone}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span>${trainer.hourly_rate}/hour</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-gray-500" />
                  <span>{trainer.experience_years} years experience</span>
                </div>
              </div>

              {trainer.specialties && trainer.specialties.length > 0 && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-1">
                    {trainer.specialties.slice(0, 3).map((specialty) => (
                      <Badge key={specialty} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                    {trainer.specialties.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{trainer.specialties.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(trainer)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(trainer.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Deactivate
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const TrainerManagement = ({ organizationId = 'default-org-id' }) => {
  const { data: trainers = [], isLoading, error } = useTrainers(organizationId);
  const deleteMutation = useDeleteTrainer();
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [filterActive, setFilterActive] = useState(true);

  const filteredTrainers = trainers.filter(trainer => 
    filterActive ? trainer.is_active : !trainer.is_active
  );

  const handleEdit = (trainer) => {
    setEditingTrainer(trainer);
    setShowDialog(true);
  };

  const handleDelete = async (trainerId) => {
    if (window.confirm('Are you sure you want to deactivate this trainer?')) {
      try {
        await deleteMutation.mutateAsync(trainerId);
      } catch (error) {
        
      }
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingTrainer(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading trainers...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Error loading trainers: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Trainer Management</h3>
          <p className="text-sm text-gray-600">
            Manage your fitness instructors and their specialties
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={filterActive ? 'active' : 'inactive'} onValueChange={(value) => setFilterActive(value === 'active')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Trainer
          </Button>
        </div>
      </div>

      {/* Trainers Grid */}
      {filteredTrainers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredTrainers.map((trainer) => (
              <TrainerCard
                key={trainer.id}
                trainer={trainer}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {filterActive ? 'Active' : 'Inactive'} Trainers
            </h3>
            <p className="text-gray-500 mb-4">
              {filterActive 
                ? "Add your first trainer to start scheduling classes"
                : "No inactive trainers found"
              }
            </p>
            {filterActive && (
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Trainer
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <TrainerDialog
        isOpen={showDialog}
        onClose={handleCloseDialog}
        trainer={editingTrainer}
        organizationId={organizationId}
      />
    </div>
  );
};

export default TrainerManagement;

