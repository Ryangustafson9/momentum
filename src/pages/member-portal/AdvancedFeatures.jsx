/**
 * 🚀 ADVANCED MEMBER FEATURES PAGE
 * Comprehensive member portal with all advanced features
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Camera, 
  Dumbbell, 
  Users, 
  Gift, 
  Star, 
  MessageSquare,
  Calendar,
  Trophy,
  Target,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import PhotoUpload from '@/components/member/PhotoUpload';
import WorkoutTracker from '@/components/member/WorkoutTracker';
import PersonalTrainingBooking from '@/components/member/PersonalTrainingBooking';
import ReferralSystem from '@/components/member/ReferralSystem';
import LoyaltyProgram from '@/components/member/LoyaltyProgram';
import CommunicationCenter from '@/components/member/CommunicationCenter';
import { cn } from '@/lib/utils';

const AdvancedFeatures = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-600">Please log in to access member features.</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      id: 'photo',
      name: 'Profile Photo',
      description: 'Upload and manage your profile photo',
      icon: Camera,
      color: 'from-blue-500 to-blue-600',
      component: PhotoUpload
    },
    {
      id: 'workouts',
      name: 'Workout Tracking',
      description: 'Track your workouts and progress',
      icon: Dumbbell,
      color: 'from-green-500 to-green-600',
      component: WorkoutTracker
    },
    {
      id: 'training',
      name: 'Personal Training',
      description: 'Book sessions with personal trainers',
      icon: Target,
      color: 'from-purple-500 to-purple-600',
      component: PersonalTrainingBooking
    },
    {
      id: 'referrals',
      name: 'Referral Program',
      description: 'Refer friends and earn rewards',
      icon: Users,
      color: 'from-orange-500 to-orange-600',
      component: ReferralSystem
    },
    {
      id: 'loyalty',
      name: 'Loyalty Points',
      description: 'Earn and redeem loyalty points',
      icon: Star,
      color: 'from-yellow-500 to-yellow-600',
      component: LoyaltyProgram
    },
    {
      id: 'communication',
      name: 'Communication',
      description: 'Messages and support center',
      icon: MessageSquare,
      color: 'from-indigo-500 to-indigo-600',
      component: CommunicationCenter
    }
  ];

  const handlePhotoUpdate = (photoUrl) => {
    // Handle photo update
    
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚀 Advanced Member Features
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlock the full potential of your Momentum Gym membership with our advanced features
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 mb-8">
            <TabsTrigger value="overview" className="text-xs lg:text-sm">
              Overview
            </TabsTrigger>
            {features.map((feature) => (
              <TabsTrigger 
                key={feature.id} 
                value={feature.id}
                className="text-xs lg:text-sm"
              >
                <feature.icon className="h-4 w-4 mr-1 lg:mr-2" />
                <span className="hidden lg:inline">{feature.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className="cursor-pointer hover:border-primary transition-all duration-200 h-full"
                      onClick={() => setActiveTab(feature.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className={cn(
                            'p-3 rounded-lg bg-gradient-to-r text-white',
                            feature.color
                          )}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{feature.name}</h3>
                            <Badge variant="outline" className="mt-1">
                              Premium Feature
                            </Badge>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {feature.description}
                        </p>
                        <div className="mt-4 flex items-center text-primary text-sm font-medium">
                          <span>Explore Feature</span>
                          <Zap className="h-4 w-4 ml-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Feature Highlights */}
            <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div>
                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-80" />
                    <h3 className="text-xl font-bold mb-2">Premium Experience</h3>
                    <p className="opacity-90">
                      Access exclusive features designed to enhance your fitness journey
                    </p>
                  </div>
                  <div>
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-80" />
                    <h3 className="text-xl font-bold mb-2">Goal Achievement</h3>
                    <p className="opacity-90">
                      Track progress and achieve your fitness goals with advanced tools
                    </p>
                  </div>
                  <div>
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-80" />
                    <h3 className="text-xl font-bold mb-2">Community Rewards</h3>
                    <p className="opacity-90">
                      Earn points, refer friends, and unlock exclusive rewards
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feature Tabs */}
          {features.map((feature) => {
            const FeatureComponent = feature.component;
            return (
              <TabsContent key={feature.id} value={feature.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className={cn(
                          'p-2 rounded-lg bg-gradient-to-r text-white',
                          feature.color
                        )}>
                          <feature.icon className="h-5 w-5" />
                        </div>
                        {feature.name}
                        <Badge variant="secondary">Premium</Badge>
                      </CardTitle>
                    </CardHeader>
                  </Card>

                  <FeatureComponent
                    memberId={user.id}
                    memberName={user.full_name || user.email}
                    onPhotoUpdate={feature.id === 'photo' ? handlePhotoUpdate : undefined}
                  />
                </motion.div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
};

export default AdvancedFeatures;

