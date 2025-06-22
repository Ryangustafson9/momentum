/**
 * 🏆 LOYALTY POINTS PROGRAM
 * Earn and redeem points for gym activities
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  Gift, 
  Zap, 
  Calendar, 
  Target, 
  Award,
  ShoppingBag,
  Coffee,
  Dumbbell,
  Users,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';

const LoyaltyProgram = ({ memberId, className = '' }) => {
  const { toast } = useToast();
  const [points, setPoints] = useState(0);
  const [tier, setTier] = useState('Bronze');
  const [pointsHistory, setPointsHistory] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  // Loyalty tiers
  const loyaltyTiers = [
    { name: 'Bronze', minPoints: 0, multiplier: 1, color: 'from-amber-600 to-amber-700', perks: ['Basic rewards'] },
    { name: 'Silver', minPoints: 500, multiplier: 1.2, color: 'from-gray-400 to-gray-500', perks: ['20% bonus points', 'Priority booking'] },
    { name: 'Gold', minPoints: 1500, multiplier: 1.5, color: 'from-yellow-400 to-yellow-500', perks: ['50% bonus points', 'Free guest passes'] },
    { name: 'Platinum', minPoints: 3000, multiplier: 2, color: 'from-purple-400 to-purple-500', perks: ['Double points', 'VIP events', 'Personal trainer discount'] },
    { name: 'Diamond', minPoints: 5000, multiplier: 2.5, color: 'from-blue-400 to-blue-500', perks: ['2.5x points', 'Exclusive rewards', 'Free merchandise'] }
  ];

  // Point earning activities
  const pointActivities = [
    { activity: 'Class Attendance', points: 10, icon: Calendar },
    { activity: 'Workout Check-in', points: 5, icon: Dumbbell },
    { activity: 'Referral Success', points: 100, icon: Users },
    { activity: 'Monthly Goal', points: 50, icon: Target },
    { activity: 'Social Share', points: 5, icon: Star },
    { activity: 'Review/Feedback', points: 25, icon: Star }
  ];

  // Available rewards
  const availableRewards = [
    { id: 1, name: 'Free Protein Shake', points: 50, category: 'Food & Drink', icon: Coffee, available: true },
    { id: 2, name: 'Guest Pass', points: 100, category: 'Access', icon: Users, available: true },
    { id: 3, name: 'Personal Training Session', points: 300, category: 'Training', icon: Dumbbell, available: true },
    { id: 4, name: 'Gym T-Shirt', points: 200, category: 'Merchandise', icon: ShoppingBag, available: true },
    { id: 5, name: 'Massage Session', points: 400, category: 'Wellness', icon: Star, available: true },
    { id: 6, name: 'Monthly Membership Credit', points: 500, category: 'Billing', icon: Gift, available: true }
  ];

  // Weekly challenges
  const weeklyChallenge = [
    { id: 1, name: 'Workout Warrior', description: 'Complete 5 workouts this week', progress: 3, target: 5, points: 75, icon: Dumbbell },
    { id: 2, name: 'Class Champion', description: 'Attend 3 different classes', progress: 1, target: 3, points: 50, icon: Calendar },
    { id: 3, name: 'Early Bird', description: 'Check in before 8 AM, 3 times', progress: 0, target: 3, points: 40, icon: Clock }
  ];

  useEffect(() => {
    loadLoyaltyData();
  }, [memberId]);

  const loadLoyaltyData = async () => {
    try {
      // Load current points
      const { data: pointsData, error: pointsError } = await supabase
        .from('member_loyalty_points')
        .select('total_points, current_tier')
        .eq('member_id', memberId)
        .single();

      if (pointsError && pointsError.code !== 'PGRST116') throw pointsError;

      // Load points history
      const { data: historyData, error: historyError } = await supabase
        .from('loyalty_points_history')
        .select('*')
        .eq('member_id', memberId)
        .order('earned_at', { ascending: false })
        .limit(20);

      if (historyError) throw historyError;

      // Load redeemed rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('loyalty_rewards_redeemed')
        .select('*')
        .eq('member_id', memberId)
        .order('redeemed_at', { ascending: false });

      if (rewardsError) throw rewardsError;

      setPoints(pointsData?.total_points || 0);
      setTier(pointsData?.current_tier || 'Bronze');
      setPointsHistory(historyData || []);
      setRewards(rewardsData || []);
      setChallenges(weeklyChallenge);

    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTier = (currentPoints) => {
    return loyaltyTiers
      .slice()
      .reverse()
      .find(tier => currentPoints >= tier.minPoints) || loyaltyTiers[0];
  };

  const getNextTier = (currentPoints) => {
    return loyaltyTiers.find(tier => currentPoints < tier.minPoints);
  };

  const redeemReward = async (reward) => {
    if (points < reward.points) {
      toast({
        title: 'Insufficient points',
        description: `You need ${reward.points - points} more points to redeem this reward.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      // Deduct points
      const newPoints = points - reward.points;
      
      const { error: updateError } = await supabase
        .from('member_loyalty_points')
        .update({ total_points: newPoints })
        .eq('member_id', memberId);

      if (updateError) throw updateError;

      // Record redemption
      const { error: redeemError } = await supabase
        .from('loyalty_rewards_redeemed')
        .insert([{
          member_id: memberId,
          reward_name: reward.name,
          points_cost: reward.points,
          category: reward.category,
          redeemed_at: new Date().toISOString()
        }]);

      if (redeemError) throw redeemError;

      setPoints(newPoints);
      setRewards(prev => [...prev, {
        reward_name: reward.name,
        points_cost: reward.points,
        category: reward.category,
        redeemed_at: new Date().toISOString()
      }]);

      toast({
        title: 'Reward redeemed!',
        description: `You've successfully redeemed ${reward.name} for ${reward.points} points.`,
      });

    } catch (error) {
      
      toast({
        title: 'Redemption failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const currentTierData = getCurrentTier(points);
  const nextTierData = getNextTier(points);
  const progressToNext = nextTierData ? 
    ((points - currentTierData.minPoints) / (nextTierData.minPoints - currentTierData.minPoints)) * 100 : 100;

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Points Overview */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Loyalty Points</h2>
              <div className="text-4xl font-bold mb-2">{points.toLocaleString()}</div>
              <Badge className={cn('bg-gradient-to-r text-white', currentTierData.color)}>
                {currentTierData.name} Member
              </Badge>
            </div>
            <div className="text-right">
              <Star className="h-16 w-16 opacity-20" />
            </div>
          </div>
          
          {nextTierData && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress to {nextTierData.name}</span>
                <span>{nextTierData.minPoints - points} points needed</span>
              </div>
              <Progress value={progressToNext} className="bg-white/20" />
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="earn" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="earn">Earn Points</TabsTrigger>
          <TabsTrigger value="redeem">Redeem</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Earn Points Tab */}
        <TabsContent value="earn" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ways to Earn Points</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pointActivities.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Icon className="h-8 w-8 text-primary" />
                      <div className="flex-1">
                        <h4 className="font-medium">{activity.activity}</h4>
                        <p className="text-sm text-gray-600">+{activity.points} points</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Tier Benefits */}
          <Card>
            <CardHeader>
              <CardTitle>Tier Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {loyaltyTiers.map((tierData, index) => (
                  <div
                    key={tierData.name}
                    className={cn(
                      'p-4 rounded-lg text-center',
                      tierData.name === currentTierData.name
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-gray-50'
                    )}
                  >
                    <h4 className="font-bold mb-2">{tierData.name}</h4>
                    <p className="text-sm mb-2">{tierData.minPoints}+ points</p>
                    <p className="text-xs">{tierData.multiplier}x multiplier</p>
                    <div className="mt-2 space-y-1">
                      {tierData.perks.map((perk, i) => (
                        <p key={i} className="text-xs opacity-80">{perk}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Redeem Points Tab */}
        <TabsContent value="redeem" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableRewards.map((reward) => {
              const Icon = reward.icon;
              const canAfford = points >= reward.points;
              
              return (
                <motion.div
                  key={reward.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className={cn(
                    'cursor-pointer transition-colors',
                    canAfford ? 'hover:border-primary' : 'opacity-60'
                  )}>
                    <CardContent className="p-4 text-center">
                      <Icon className="h-12 w-12 mx-auto mb-3 text-primary" />
                      <h3 className="font-semibold mb-2">{reward.name}</h3>
                      <Badge variant="outline" className="mb-3">
                        {reward.category}
                      </Badge>
                      <div className="text-lg font-bold text-primary mb-3">
                        {reward.points} points
                      </div>
                      <Button
                        onClick={() => redeemReward(reward)}
                        disabled={!canAfford}
                        className="w-full"
                        size="sm"
                      >
                        {canAfford ? 'Redeem' : 'Not enough points'}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Challenges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {challenges.map((challenge) => {
                  const Icon = challenge.icon;
                  const progress = (challenge.progress / challenge.target) * 100;
                  const isCompleted = challenge.progress >= challenge.target;
                  
                  return (
                    <div key={challenge.id} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <Icon className="h-6 w-6 text-primary" />
                        <div className="flex-1">
                          <h4 className="font-medium">{challenge.name}</h4>
                          <p className="text-sm text-gray-600">{challenge.description}</p>
                        </div>
                        <Badge variant={isCompleted ? 'default' : 'outline'}>
                          +{challenge.points} pts
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress: {challenge.progress}/{challenge.target}</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} />
                      </div>
                      
                      {isCompleted && (
                        <Badge className="mt-2 bg-green-100 text-green-800">
                          Completed! Points awarded
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Points Earned */}
            <Card>
              <CardHeader>
                <CardTitle>Points Earned</CardTitle>
              </CardHeader>
              <CardContent>
                {pointsHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No points earned yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pointsHistory.slice(0, 10).map((entry, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border-b">
                        <div>
                          <div className="font-medium">{entry.activity}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(entry.earned_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-green-600 font-bold">
                          +{entry.points}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rewards Redeemed */}
            <Card>
              <CardHeader>
                <CardTitle>Rewards Redeemed</CardTitle>
              </CardHeader>
              <CardContent>
                {rewards.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No rewards redeemed yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rewards.slice(0, 10).map((reward, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border-b">
                        <div>
                          <div className="font-medium">{reward.reward_name}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(reward.redeemed_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-red-600 font-bold">
                          -{reward.points_cost}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LoyaltyProgram;

