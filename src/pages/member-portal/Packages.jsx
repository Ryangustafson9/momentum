import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  Dumbbell, 
  Users, 
  Calendar,
  Clock,
  Star,
  CheckCircle,
  Gift
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';

const Packages = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Mock package data
  const myPackages = [
    {
      id: 'pt-package-1',
      name: 'Personal Training Package',
      type: 'Personal Training',
      totalSessions: 10,
      usedSessions: 6,
      remainingSessions: 4,
      purchaseDate: new Date('2024-01-15'),
      expiryDate: addDays(new Date(), 45),
      price: 750,
      status: 'active'
    },
    {
      id: 'massage-package-1',
      name: 'Massage Therapy Package',
      type: 'Wellness',
      totalSessions: 5,
      usedSessions: 2,
      remainingSessions: 3,
      purchaseDate: new Date('2024-02-01'),
      expiryDate: addDays(new Date(), 60),
      price: 400,
      status: 'active'
    },
    {
      id: 'guest-passes',
      name: 'Guest Pass Bundle',
      type: 'Guest Passes',
      totalSessions: 20,
      usedSessions: 20,
      remainingSessions: 0,
      purchaseDate: new Date('2023-12-01'),
      expiryDate: new Date('2024-01-31'),
      price: 200,
      status: 'expired'
    }
  ];

  const availablePackages = [
    {
      id: 'pt-10-sessions',
      name: '10 Personal Training Sessions',
      description: 'One-on-one training with certified personal trainers',
      sessions: 10,
      price: 750,
      savings: 100,
      validFor: '90 days',
      type: 'Personal Training',
      popular: true
    },
    {
      id: 'pt-5-sessions',
      name: '5 Personal Training Sessions',
      description: 'Perfect starter package for personal training',
      sessions: 5,
      price: 400,
      savings: 25,
      validFor: '60 days',
      type: 'Personal Training',
      popular: false
    },
    {
      id: 'massage-5-sessions',
      name: '5 Massage Therapy Sessions',
      description: 'Relaxing therapeutic massage sessions',
      sessions: 5,
      price: 400,
      savings: 50,
      validFor: '120 days',
      type: 'Wellness',
      popular: false
    },
    {
      id: 'guest-passes-10',
      name: '10 Guest Passes',
      description: 'Bring friends and family to experience our facilities',
      sessions: 10,
      price: 120,
      savings: 30,
      validFor: '180 days',
      type: 'Guest Passes',
      popular: false
    },
    {
      id: 'nutrition-package',
      name: 'Nutrition Consultation Package',
      description: '3 sessions with our registered dietitian',
      sessions: 3,
      price: 225,
      savings: 45,
      validFor: '90 days',
      type: 'Nutrition',
      popular: false
    }
  ];

  const handlePurchasePackage = (packageItem) => {
    toast({
      title: "Package Purchase",
      description: `Redirecting to purchase ${packageItem.name}...`,
      variant: "default"
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'expiring': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Personal Training': return <Dumbbell className="h-5 w-5" />;
      case 'Wellness': return <Star className="h-5 w-5" />;
      case 'Guest Passes': return <Users className="h-5 w-5" />;
      case 'Nutrition': return <Gift className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Packages</h1>
        <p className="text-muted-foreground">View your package usage and purchase new packages</p>
      </div>

      {/* My Active Packages */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Active Packages</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myPackages.filter(pkg => pkg.status === 'active').map((packageItem) => (
            <Card key={packageItem.id} className="border-2 border-blue-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(packageItem.type)}
                    <CardTitle className="text-lg">{packageItem.name}</CardTitle>
                  </div>
                  <Badge className={getStatusColor(packageItem.status)}>
                    {packageItem.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Sessions Used</span>
                    <span>{packageItem.usedSessions}/{packageItem.totalSessions}</span>
                  </div>
                  <Progress 
                    value={(packageItem.usedSessions / packageItem.totalSessions) * 100} 
                    className="h-2"
                  />
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remaining:</span>
                    <span className="font-semibold text-blue-600">
                      {packageItem.remainingSessions} sessions
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expires:</span>
                    <span className="font-medium">
                      {format(packageItem.expiryDate, 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Package Value:</span>
                    <span className="font-medium">${packageItem.price}</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  Book Session
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Package History */}
      {myPackages.filter(pkg => pkg.status !== 'active').length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Package History</h2>
          <Card>
            <CardContent className="p-0">
              <div className="space-y-0">
                {myPackages.filter(pkg => pkg.status !== 'active').map((packageItem) => (
                  <div key={packageItem.id} className="flex items-center justify-between p-4 border-b last:border-b-0">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getTypeIcon(packageItem.type)}
                      </div>
                      <div>
                        <p className="font-medium">{packageItem.name}</p>
                        <p className="text-sm text-gray-600">
                          {packageItem.usedSessions}/{packageItem.totalSessions} sessions used
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(packageItem.status)}>
                        {packageItem.status}
                      </Badge>
                      <p className="text-sm text-gray-500 mt-1">
                        Expired: {format(packageItem.expiryDate, 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Available Packages */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Packages</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availablePackages.map((packageItem) => (
            <Card key={packageItem.id} className={packageItem.popular ? 'border-2 border-blue-500 relative' : ''}>
              {packageItem.popular && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-2">
                  {getTypeIcon(packageItem.type)}
                  <CardTitle className="text-lg">{packageItem.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm">{packageItem.description}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sessions:</span>
                    <span className="font-medium">{packageItem.sessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valid for:</span>
                    <span className="font-medium">{packageItem.validFor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">You save:</span>
                    <span className="font-medium text-green-600">${packageItem.savings}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-bold">${packageItem.price}</span>
                    <Badge variant="outline">{packageItem.type}</Badge>
                  </div>
                  
                  <Button 
                    className="w-full"
                    onClick={() => handlePurchasePackage(packageItem)}
                  >
                    Purchase Package
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Packages;
