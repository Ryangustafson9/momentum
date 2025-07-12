import React from 'react';
import { 
  Edit, 
  Trash2, 
  Eye, 
  MoreHorizontal, 
  Clock, 
  Users, 
  MapPin,
  DollarSign,
  Calendar,
  Package
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

const ServicesList = ({ services, categories, viewMode, onEditService, onRefresh }) => {
  const { toast } = useToast();

  const handleDeleteService = async (serviceId) => {
    if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      toast({
        title: "Service Deleted",
        description: "Service has been deleted successfully.",
        duration: 3000,
      });

      onRefresh();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Error",
        description: "Failed to delete service.",
        variant: "destructive"
      });
    }
  };

  const toggleServiceStatus = async (serviceId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !currentStatus })
        .eq('id', serviceId);

      if (error) throw error;

      toast({
        title: "Service Updated",
        description: `Service has been ${!currentStatus ? 'activated' : 'deactivated'}.`,
        duration: 3000,
      });

      onRefresh();
    } catch (error) {
      console.error('Error updating service status:', error);
      toast({
        title: "Error",
        description: "Failed to update service status.",
        variant: "destructive"
      });
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getServiceTypeLabel = (type) => {
    switch (type) {
      case 'single_session': return 'Single Session';
      case 'single_service': return 'Single Service';
      case 'time_based': return 'Time-based';
      case 'unlimited': return 'Unlimited Access';
      default: return type?.replace('_', ' ') || 'Unknown';
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Uncategorized';
  };

  const getCategoryColor = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || 'gray';
  };

  if (services.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Services</h3>
            <p className="text-gray-600 mb-4">
              Get started by creating your first service.
            </p>
            <Button onClick={() => onEditService(null)}>
              Create Service
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Both grid and list view now use the same table format
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Service Name
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Type & Duration
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Price
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {services.map((service, index) => (
                <tr
                  key={service.id}
                  className={`
                    transition-all duration-200 ease-in-out
                    hover:bg-blue-50 hover:shadow-sm
                    border-b border-gray-100
                    ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}
                  `}
                >
                  <td className="px-6 py-5 border-r border-gray-100">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-gray-900 leading-tight">
                        {service.name}
                      </div>
                      {service.short_description && (
                        <div
                          className="text-xs text-gray-600 leading-relaxed max-w-xs"
                          title={service.short_description}
                        >
                          {service.short_description.length > 80
                            ? `${service.short_description.substring(0, 80)}...`
                            : service.short_description
                          }
                        </div>
                      )}
                      {service.expiration_days && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          Expires in {service.expiration_days} days
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-5 border-r border-gray-100">
                    <Badge
                      variant="secondary"
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: `${getCategoryColor(service.category_id)}15`,
                        color: getCategoryColor(service.category_id),
                        border: `1px solid ${getCategoryColor(service.category_id)}30`
                      }}
                    >
                      {getCategoryName(service.category_id)}
                    </Badge>
                  </td>

                  <td className="px-6 py-5 border-r border-gray-100">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-900">
                        {getServiceTypeLabel(service.service_type)}
                      </div>
                      {service.duration_minutes && (
                        <div className="flex items-center gap-1 text-sm text-blue-600 font-medium">
                          <Clock className="h-4 w-4" />
                          {service.duration_minutes} min
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-5 border-r border-gray-100">
                    <div className="space-y-1">
                      <div className="text-lg font-bold text-green-600">
                        {formatPrice(service.price)}
                      </div>
                      {service.compare_at_price && service.compare_at_price > service.price && (
                        <div className="text-xs text-gray-500 line-through">
                          {formatPrice(service.compare_at_price)}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-5 text-center border-r border-gray-100">
                    <div className="flex flex-col items-center gap-2">
                      <Badge
                        variant={service.is_active ? "default" : "secondary"}
                        className={`
                          font-medium px-3 py-1 rounded-full text-xs
                          ${service.is_active
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }
                        `}
                      >
                        {service.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {service.is_featured && (
                          <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 text-xs px-2 py-0.5">
                            Featured
                          </Badge>
                        )}
                        {service.requires_membership && (
                          <Badge className="bg-purple-100 text-purple-800 border border-purple-200 text-xs px-2 py-0.5">
                            Members Only
                          </Badge>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-9 w-9 p-0 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="text-xs font-semibold text-gray-700">
                          Service Actions
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => onEditService(service)}
                          className="text-sm hover:bg-blue-50"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Service
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleServiceStatus(service.id, service.is_active)}
                          className="text-sm hover:bg-blue-50"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          {service.is_active ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteService(service.id)}
                          className="text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Service
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing {services.length} service{services.length !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                <span className="text-xs">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
                <span className="text-xs">Inactive</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
                <span className="text-xs">Featured</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div>
                <span className="text-xs">Members Only</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );


};

export default ServicesList;
