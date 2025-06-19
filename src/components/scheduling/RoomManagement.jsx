// 🚀 ROOM MANAGEMENT - Comprehensive facility space administration
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  MapPin,
  Users,
  Square,
  Settings,
  DollarSign,
  Calendar,
  MoreVertical,
  CheckCircle,
  XCircle,
  Wrench
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  useRooms, 
  useCreateRoom, 
  useUpdateRoom 
} from '@/hooks/useScheduling';

const ROOM_TYPES = [
  { value: 'studio', label: 'Studio' },
  { value: 'gym_floor', label: 'Gym Floor' },
  { value: 'cardio', label: 'Cardio Room' },
  { value: 'strength', label: 'Strength Training' },
  { value: 'specialty', label: 'Specialty Room' },
  { value: 'pool', label: 'Pool Area' },
  { value: 'court', label: 'Court' },
  { value: 'outdoor', label: 'Outdoor Space' }
];

const FEATURES_OPTIONS = [
  'Mirrors', 'Sound System', 'Air Conditioning', 'Ventilation', 'Natural Light',
  'Hardwood Floor', 'Rubber Flooring', 'Carpet', 'Projector', 'TV Screen',
  'Storage', 'Water Fountain', 'Towel Service', 'Lockers'
];

const EQUIPMENT_OPTIONS = [
  'Free Weights', 'Dumbbells', 'Barbells', 'Kettlebells', 'Resistance Bands',
  'Yoga Mats', 'Stability Balls', 'Foam Rollers', 'TRX Suspension',
  'Cardio Machines', 'Strength Machines', 'Functional Training Equipment',
  'Boxing Equipment', 'Spin Bikes', 'Rowing Machines'
];

const RoomDialog = ({ isOpen, onClose, room, organizationId }) => {
  const createMutation = useCreateRoom();
  const updateMutation = useUpdateRoom();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    room_type: 'studio',
    capacity: 20,
    area_sqft: '',
    features: [],
    equipment_included: [],
    is_bookable: true,
    requires_approval: false,
    advance_booking_days: 30,
    min_booking_duration: 60,
    max_booking_duration: 180,
    hourly_rate: 0,
    is_active: true
  });

  React.useEffect(() => {
    if (room) {
      setFormData({
        name: room.name || '',
        description: room.description || '',
        room_type: room.room_type || 'studio',
        capacity: room.capacity || 20,
        area_sqft: room.area_sqft || '',
        features: room.features || [],
        equipment_included: room.equipment_included || [],
        is_bookable: room.is_bookable ?? true,
        requires_approval: room.requires_approval ?? false,
        advance_booking_days: room.advance_booking_days || 30,
        min_booking_duration: room.min_booking_duration || 60,
        max_booking_duration: room.max_booking_duration || 180,
        hourly_rate: room.hourly_rate || 0,
        is_active: room.is_active ?? true
      });
    } else {
      setFormData({
        name: '',
        description: '',
        room_type: 'studio',
        capacity: 20,
        area_sqft: '',
        features: [],
        equipment_included: [],
        is_bookable: true,
        requires_approval: false,
        advance_booking_days: 30,
        min_booking_duration: 60,
        max_booking_duration: 180,
        hourly_rate: 0,
        is_active: true
      });
    }
  }, [room, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (room) {
        await updateMutation.mutateAsync({
          roomId: room.id,
          updates: formData
        });
      } else {
        await createMutation.mutateAsync({
          organizationId,
          roomData: formData
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving room:', error);
    }
  };

  const handleFeatureToggle = (feature) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleEquipmentToggle = (equipment) => {
    setFormData(prev => ({
      ...prev,
      equipment_included: prev.equipment_included.includes(equipment)
        ? prev.equipment_included.filter(e => e !== equipment)
        : [...prev.equipment_included, equipment]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {room ? 'Edit Room' : 'Add New Room'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Room Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Studio A"
                required
              />
            </div>
            <div>
              <Label htmlFor="room_type">Room Type</Label>
              <Select value={formData.room_type} onValueChange={(value) => setFormData(prev => ({ ...prev, room_type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              placeholder="Brief description of the room and its purpose"
            />
          </div>

          {/* Capacity & Size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="capacity">Capacity (people) *</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 20 }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="area_sqft">Area (sq ft)</Label>
              <Input
                id="area_sqft"
                type="number"
                min="0"
                value={formData.area_sqft}
                onChange={(e) => setFormData(prev => ({ ...prev, area_sqft: parseInt(e.target.value) || '' }))}
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Features */}
          <div>
            <Label>Room Features</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {FEATURES_OPTIONS.map((feature) => (
                <div key={feature} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`feature-${feature}`}
                    checked={formData.features.includes(feature)}
                    onChange={() => handleFeatureToggle(feature)}
                    className="rounded"
                  />
                  <Label htmlFor={`feature-${feature}`} className="text-sm">
                    {feature}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <Label>Included Equipment</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {EQUIPMENT_OPTIONS.map((equipment) => (
                <div key={equipment} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`equipment-${equipment}`}
                    checked={formData.equipment_included.includes(equipment)}
                    onChange={() => handleEquipmentToggle(equipment)}
                    className="rounded"
                  />
                  <Label htmlFor={`equipment-${equipment}`} className="text-sm">
                    {equipment}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Booking Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Booking Settings</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_bookable"
                  checked={formData.is_bookable}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_bookable: checked }))}
                />
                <Label htmlFor="is_bookable">Bookable</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="requires_approval"
                  checked={formData.requires_approval}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_approval: checked }))}
                />
                <Label htmlFor="requires_approval">Requires Approval</Label>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="advance_booking_days">Advance Booking (days)</Label>
                <Input
                  id="advance_booking_days"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.advance_booking_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, advance_booking_days: parseInt(e.target.value) || 30 }))}
                />
              </div>
              <div>
                <Label htmlFor="min_booking_duration">Min Duration (min)</Label>
                <Input
                  id="min_booking_duration"
                  type="number"
                  min="15"
                  step="15"
                  value={formData.min_booking_duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_booking_duration: parseInt(e.target.value) || 60 }))}
                />
              </div>
              <div>
                <Label htmlFor="max_booking_duration">Max Duration (min)</Label>
                <Input
                  id="max_booking_duration"
                  type="number"
                  min="30"
                  step="15"
                  value={formData.max_booking_duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_booking_duration: parseInt(e.target.value) || 180 }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active Room</Label>
              </div>
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
              {room ? 'Update' : 'Create'} Room
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const RoomCard = ({ room, onEdit }) => {
  const getRoomTypeColor = (type) => {
    const colors = {
      studio: 'bg-blue-100 text-blue-800',
      gym_floor: 'bg-green-100 text-green-800',
      cardio: 'bg-red-100 text-red-800',
      strength: 'bg-purple-100 text-purple-800',
      specialty: 'bg-yellow-100 text-yellow-800',
      pool: 'bg-cyan-100 text-cyan-800',
      court: 'bg-orange-100 text-orange-800',
      outdoor: 'bg-emerald-100 text-emerald-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

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
                <h3 className="font-medium text-gray-900">{room.name}</h3>
                <Badge className={getRoomTypeColor(room.room_type)}>
                  {ROOM_TYPES.find(t => t.value === room.room_type)?.label || room.room_type}
                </Badge>
                {room.is_active ? (
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
              
              {room.description && (
                <p className="text-sm text-gray-600 mb-3">{room.description}</p>
              )}
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span>Capacity: {room.capacity} people</span>
                </div>
                
                {room.area_sqft && (
                  <div className="flex items-center space-x-2">
                    <Square className="w-4 h-4 text-gray-500" />
                    <span>{room.area_sqft} sq ft</span>
                  </div>
                )}
                
                {room.hourly_rate > 0 && (
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span>${room.hourly_rate}/hour</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>
                    {room.is_bookable ? 'Bookable' : 'Not bookable'}
                    {room.requires_approval && ' (requires approval)'}
                  </span>
                </div>
              </div>

              {room.features && room.features.length > 0 && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-1">
                    {room.features.slice(0, 3).map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {room.features.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{room.features.length - 3} more
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
                <DropdownMenuItem onClick={() => onEdit(room)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Calendar className="w-4 h-4 mr-2" />
                  View Schedule
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Wrench className="w-4 h-4 mr-2" />
                  Maintenance
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const RoomManagement = ({ organizationId = 'default-org-id' }) => {
  const { data: rooms = [], isLoading, error } = useRooms(organizationId);
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [filterType, setFilterType] = useState('all');

  const filteredRooms = rooms.filter(room => 
    filterType === 'all' || room.room_type === filterType
  );

  const handleEdit = (room) => {
    setEditingRoom(room);
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingRoom(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading rooms...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Error loading rooms: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Room Management</h3>
          <p className="text-sm text-gray-600">
            Manage your facility spaces and booking settings
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              {ROOM_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Room
          </Button>
        </div>
      </div>

      {/* Rooms Grid */}
      {filteredRooms.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onEdit={handleEdit}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {filterType === 'all' ? '' : ROOM_TYPES.find(t => t.value === filterType)?.label} Rooms
            </h3>
            <p className="text-gray-500 mb-4">
              Add your first room to start managing facility spaces
            </p>
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Room
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <RoomDialog
        isOpen={showDialog}
        onClose={handleCloseDialog}
        room={editingRoom}
        organizationId={organizationId}
      />
    </div>
  );
};

export default RoomManagement;
