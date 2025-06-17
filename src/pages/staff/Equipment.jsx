// 🏋️ EQUIPMENT MANAGEMENT - Comprehensive equipment tracking and maintenance
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  Settings,
  TrendingDown,
  Activity,
  Eye,
  Edit,
  Trash2,
  Download
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const EquipmentPage = () => {
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [equipment, setEquipment] = useState([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  // Mock equipment data
  const equipmentStats = {
    totalEquipment: 156,
    operational: 142,
    maintenance: 8,
    outOfOrder: 6,
    utilizationRate: 78.5,
    maintenanceCost: 2450,
    upcomingMaintenance: 12
  };

  const mockEquipment = [
    {
      id: 'EQ-001',
      name: 'Treadmill Pro X1',
      category: 'Cardio',
      location: 'Main Floor',
      status: 'operational',
      lastMaintenance: '2024-01-10',
      nextMaintenance: '2024-02-10',
      purchaseDate: '2023-06-15',
      warranty: 'Active',
      utilizationHours: 245,
      condition: 'excellent'
    },
    {
      id: 'EQ-002',
      name: 'Bench Press Station',
      category: 'Strength',
      location: 'Weight Room',
      status: 'maintenance',
      lastMaintenance: '2024-01-05',
      nextMaintenance: '2024-01-20',
      purchaseDate: '2023-03-20',
      warranty: 'Active',
      utilizationHours: 180,
      condition: 'good'
    },
    {
      id: 'EQ-003',
      name: 'Elliptical Elite',
      category: 'Cardio',
      location: 'Main Floor',
      status: 'out-of-order',
      lastMaintenance: '2024-01-08',
      nextMaintenance: '2024-01-25',
      purchaseDate: '2023-08-10',
      warranty: 'Expired',
      utilizationHours: 320,
      condition: 'poor'
    },
    {
      id: 'EQ-004',
      name: 'Cable Machine Deluxe',
      category: 'Strength',
      location: 'Weight Room',
      status: 'operational',
      lastMaintenance: '2024-01-12',
      nextMaintenance: '2024-02-12',
      purchaseDate: '2023-05-05',
      warranty: 'Active',
      utilizationHours: 195,
      condition: 'excellent'
    }
  ];

  const mockMaintenanceRecords = [
    {
      id: 'MR-001',
      equipmentId: 'EQ-001',
      equipmentName: 'Treadmill Pro X1',
      type: 'Preventive',
      description: 'Belt lubrication and calibration',
      technician: 'Mike Johnson',
      date: '2024-01-10',
      cost: 125.00,
      status: 'completed',
      nextDue: '2024-02-10'
    },
    {
      id: 'MR-002',
      equipmentId: 'EQ-002',
      equipmentName: 'Bench Press Station',
      type: 'Repair',
      description: 'Replace worn safety pins',
      technician: 'Sarah Wilson',
      date: '2024-01-15',
      cost: 85.00,
      status: 'in-progress',
      nextDue: '2024-01-20'
    },
    {
      id: 'MR-003',
      equipmentId: 'EQ-003',
      equipmentName: 'Elliptical Elite',
      type: 'Emergency',
      description: 'Motor replacement required',
      technician: 'External Service',
      date: '2024-01-16',
      cost: 450.00,
      status: 'scheduled',
      nextDue: '2024-01-25'
    }
  ];

  useEffect(() => {
    setEquipment(mockEquipment);
    setMaintenanceRecords(mockMaintenanceRecords);
  }, []);

  const getStatusBadge = (status) => {
    const colors = {
      operational: 'bg-green-100 text-green-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      'out-of-order': 'bg-red-100 text-red-800'
    };

    const icons = {
      operational: CheckCircle,
      maintenance: Clock,
      'out-of-order': AlertTriangle
    };

    const Icon = icons[status];

    return (
      <Badge className={colors[status]}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const getConditionBadge = (condition) => {
    const colors = {
      excellent: 'bg-green-100 text-green-800',
      good: 'bg-blue-100 text-blue-800',
      fair: 'bg-yellow-100 text-yellow-800',
      poor: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[condition]}>
        {condition.charAt(0).toUpperCase() + condition.slice(1)}
      </Badge>
    );
  };

  const handleScheduleMaintenance = useCallback(async (equipmentId) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Maintenance Scheduled",
        description: "Maintenance has been scheduled for this equipment.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule maintenance. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Equipment Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Equipment</p>
                <p className="text-2xl font-bold text-gray-900">{equipmentStats.totalEquipment}</p>
                <p className="text-sm text-green-600">{equipmentStats.operational} operational</p>
              </div>
              <Settings className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Utilization Rate</p>
                <p className="text-2xl font-bold text-gray-900">{equipmentStats.utilizationRate}%</p>
                <p className="text-sm text-gray-500">Average daily usage</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Maintenance Cost</p>
                <p className="text-2xl font-bold text-gray-900">${equipmentStats.maintenanceCost}</p>
                <p className="text-sm text-gray-500">This month</p>
              </div>
              <Wrench className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Needs Attention</p>
                <p className="text-2xl font-bold text-gray-900">{equipmentStats.maintenance + equipmentStats.outOfOrder}</p>
                <p className="text-sm text-red-600">Requires action</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Status Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Equipment by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Operational</span>
                </div>
                <span className="font-medium">{equipmentStats.operational}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  <span>Under Maintenance</span>
                </div>
                <span className="font-medium">{equipmentStats.maintenance}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>Out of Order</span>
                </div>
                <span className="font-medium">{equipmentStats.outOfOrder}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {maintenanceRecords.filter(record => record.status === 'scheduled').map(record => (
                <div key={record.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{record.equipmentName}</p>
                    <p className="text-sm text-gray-600">{record.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{record.nextDue}</p>
                    <Badge variant="outline">{record.type}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const EquipmentTab = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Equipment Inventory</h3>
        <div className="flex space-x-2">
          <Input 
            placeholder="Search equipment..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64" 
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="operational">Operational</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="out-of-order">Out of Order</SelectItem>
            </SelectContent>
          </Select>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="Main Floor">Main Floor</SelectItem>
              <SelectItem value="Weight Room">Weight Room</SelectItem>
              <SelectItem value="Studio">Studio</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Equipment
          </Button>
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {equipment.map(item => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-600">{item.category}</p>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Location:</span>
                    <span>{item.location}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Condition:</span>
                    {getConditionBadge(item.condition)}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Usage Hours:</span>
                    <span>{item.utilizationHours}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Next Maintenance:</span>
                    <span>{item.nextMaintenance}</span>
                  </div>
                </div>
                
                <div className="flex justify-between pt-2">
                  <div className="space-x-1">
                    <Button size="sm" variant="outline">
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => handleScheduleMaintenance(item.id)}
                    disabled={isLoading}
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    Schedule
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const MaintenanceTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Maintenance Records</h3>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Records
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Maintenance
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {maintenanceRecords.map(record => (
          <Card key={record.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium">{record.equipmentName}</h4>
                    <Badge variant={record.status === 'completed' ? 'default' : 'secondary'}>
                      {record.status}
                    </Badge>
                    <Badge variant="outline">{record.type}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{record.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Technician: </span>
                      <span>{record.technician}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Date: </span>
                      <span>{record.date}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Cost: </span>
                      <span>${record.cost}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Next Due: </span>
                      <span>{record.nextDue}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto py-8 px-4 md:px-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Equipment Management</h1>
          <p className="text-gray-600 mt-1">
            Track equipment status, schedule maintenance, and manage inventory
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge className="bg-blue-100 text-blue-800">
            <Activity className="w-4 h-4 mr-1" />
            {equipmentStats.operational} Active
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <OverviewTab />
        </TabsContent>
        
        <TabsContent value="equipment" className="mt-6">
          <EquipmentTab />
        </TabsContent>
        
        <TabsContent value="maintenance" className="mt-6">
          <MaintenanceTab />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default EquipmentPage;
