import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List,
  Package,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

// Import components we'll create
import ServicesList from '@/components/services/ServicesList';
import ServiceCategoriesManager from '@/components/services/ServiceCategoriesManager';
import ServiceFormDialog from '@/components/services/ServiceFormDialog';
import ServiceAnalytics from '@/components/services/ServiceAnalytics';

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // Always use list/table view
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [stats, setStats] = useState({
    totalServices: 0,
    activeServices: 0,
    totalRevenue: 0,
    popularService: null
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadServices(),
        loadCategories(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading services data:', error);
      toast({
        title: "Error",
        description: "Failed to load services data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          category:service_categories(id, name, color),
          service_locations(location:locations(name)),
          service_staff(staff:profiles(first_name, last_name))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
      // If table doesn't exist, create it
      if (error.code === '42P01') {
        await createServicesTables();
        setServices([]);
      }
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };

  const loadStats = async () => {
    try {
      // Get service counts
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('id, is_active');

      if (serviceError) throw serviceError;

      const totalServices = serviceData?.length || 0;
      const activeServices = serviceData?.filter(s => s.is_active).length || 0;

      // Get revenue data (placeholder for now)
      const totalRevenue = 0; // Will implement with actual sales data

      setStats({
        totalServices,
        activeServices,
        totalRevenue,
        popularService: null
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const createServicesTables = async () => {
    try {
      const { error } = await supabase.rpc('create_services_tables');
      if (error) throw error;
    } catch (error) {
      console.warn('Could not create services tables:', error);
    }
  };

  const handleCreateService = () => {
    setEditingService(null);
    setIsServiceDialogOpen(true);
  };

  const handleEditService = (serviceData) => {
    setEditingService(serviceData);
    setIsServiceDialogOpen(true);
  };

  const handleServiceSaved = () => {
    setIsServiceDialogOpen(false);
    setEditingService(null);
    loadData();
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = !searchTerm || 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      service.category_id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8 bg-background min-h-screen">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-8 w-8 animate-pulse" />
          <span className="text-xl">Loading services...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 bg-background min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
            Services
          </h1>
          <p className="text-gray-600 mt-1">
            Manage individual services, categories, and pricing
          </p>
        </div>
        
        <Button onClick={handleCreateService} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Service
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Services</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalServices}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Services</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeServices}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-purple-600">{categories.length}</p>
              </div>
              <Grid className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue (MTD)</p>
                <p className="text-2xl font-bold text-orange-600">${stats.totalRevenue}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Services
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Grid className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6 mt-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Services List */}
          <ServicesList
            services={filteredServices}
            categories={categories}
            viewMode={viewMode}
            onEditService={handleEditService}
            onRefresh={loadData}
          />
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6 mt-6">
          <ServiceCategoriesManager
            categories={categories}
            onCategoriesChange={loadCategories}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6 mt-6">
          <ServiceAnalytics
            services={services}
            categories={categories}
          />
        </TabsContent>
      </Tabs>

      {/* Service Form Dialog */}
      <ServiceFormDialog
        isOpen={isServiceDialogOpen}
        onClose={() => setIsServiceDialogOpen(false)}
        service={editingService}
        categories={categories}
        onSaved={handleServiceSaved}
      />
    </div>
  );
};

export default ServicesPage;
