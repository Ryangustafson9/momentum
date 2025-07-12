import React from 'react';
import { TrendingUp, BarChart3, PieChart, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ServiceAnalytics = ({ services, categories }) => {
  const getServicesByCategory = () => {
    const categoryStats = {};
    
    categories.forEach(category => {
      categoryStats[category.name] = {
        count: services.filter(service => service.category_id === category.id).length,
        color: category.color || '#3B82F6'
      };
    });

    // Add uncategorized
    const uncategorized = services.filter(service => !service.category_id).length;
    if (uncategorized > 0) {
      categoryStats['Uncategorized'] = {
        count: uncategorized,
        color: '#6B7280'
      };
    }

    return categoryStats;
  };

  const getServiceTypeStats = () => {
    const typeStats = {};
    
    services.forEach(service => {
      const type = service.service_type || 'unknown';
      typeStats[type] = (typeStats[type] || 0) + 1;
    });

    return typeStats;
  };

  const getPriceRangeStats = () => {
    const ranges = {
      'Under $50': 0,
      '$50 - $100': 0,
      '$100 - $200': 0,
      'Over $200': 0
    };

    services.forEach(service => {
      const price = parseFloat(service.price) || 0;
      if (price < 50) ranges['Under $50']++;
      else if (price < 100) ranges['$50 - $100']++;
      else if (price < 200) ranges['$100 - $200']++;
      else ranges['Over $200']++;
    });

    return ranges;
  };

  const categoryStats = getServicesByCategory();
  const typeStats = getServiceTypeStats();
  const priceRangeStats = getPriceRangeStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Service Analytics
        </h2>
        <p className="text-gray-600 mt-1">
          Insights and statistics about your services
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Services</p>
                <p className="text-2xl font-bold text-gray-900">{services.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Services</p>
                <p className="text-2xl font-bold text-green-600">
                  {services.filter(service => service.is_active).length}
                </p>
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
              <PieChart className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Price</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${services.length > 0 ? 
                    (services.reduce((sum, service) => sum + (parseFloat(service.price) || 0), 0) / services.length).toFixed(0) : 
                    '0'
                  }
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Services by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(categoryStats).map(([category, stats]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: stats.color }}
                    />
                    <span className="text-sm font-medium">{category}</span>
                  </div>
                  <span className="text-sm text-gray-600">{stats.count} services</span>
                </div>
              ))}
              {Object.keys(categoryStats).length === 0 && (
                <p className="text-gray-500 text-center py-4">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Service Types */}
        <Card>
          <CardHeader>
            <CardTitle>Service Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(typeStats).map(([type, count]) => {
                const typeLabel = type === 'single_session' ? 'Single Session' :
                                type === 'single_service' ? 'Single Service' :
                                type === 'time_based' ? 'Time-based' :
                                type === 'unlimited' ? 'Unlimited Access' :
                                type.replace('_', ' ');
                return (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {typeLabel}
                    </span>
                    <span className="text-sm text-gray-600">{count} services</span>
                  </div>
                );
              })}
              {Object.keys(typeStats).length === 0 && (
                <p className="text-gray-500 text-center py-4">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Price Ranges */}
        <Card>
          <CardHeader>
            <CardTitle>Price Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(priceRangeStats).map(([range, count]) => (
                <div key={range} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{range}</span>
                  <span className="text-sm text-gray-600">{count} services</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Service Status */}
        <Card>
          <CardHeader>
            <CardTitle>Service Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active</span>
                <span className="text-sm text-green-600">
                  {services.filter(service => service.is_active).length} services
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Inactive</span>
                <span className="text-sm text-gray-600">
                  {services.filter(service => !service.is_active).length} services
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Featured</span>
                <span className="text-sm text-blue-600">
                  {services.filter(service => service.is_featured).length} services
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Requires Membership</span>
                <span className="text-sm text-purple-600">
                  {services.filter(service => service.requires_membership).length} services
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon */}
      <Card className="border-dashed border-2 border-gray-300">
        <CardContent className="py-12">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Analytics Coming Soon</h3>
            <p className="text-gray-600">
              Revenue tracking, sales performance, and member service usage analytics will be available once the sales integration is complete.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceAnalytics;
