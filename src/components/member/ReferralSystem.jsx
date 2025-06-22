/**
 * 🤝 MEMBER REFERRAL SYSTEM
 * Refer friends and earn rewards
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Gift, 
  Share2, 
  Copy, 
  Mail, 
  MessageSquare,
  Facebook,
  Twitter,
  Check,
  DollarSign,
  Trophy,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
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

const ReferralSystem = ({ memberId, memberName, className = '' }) => {
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    successfulReferrals: 0,
    totalEarned: 0,
    currentTier: 'Bronze'
  });
  const [loading, setLoading] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  // Referral tiers and rewards
  const referralTiers = [
    { name: 'Bronze', minReferrals: 0, bonus: 0, color: 'from-amber-600 to-amber-700' },
    { name: 'Silver', minReferrals: 5, bonus: 50, color: 'from-gray-400 to-gray-500' },
    { name: 'Gold', minReferrals: 10, bonus: 100, color: 'from-yellow-400 to-yellow-500' },
    { name: 'Platinum', minReferrals: 20, bonus: 200, color: 'from-purple-400 to-purple-500' },
    { name: 'Diamond', minReferrals: 50, bonus: 500, color: 'from-blue-400 to-blue-500' }
  ];

  useEffect(() => {
    loadReferralData();
  }, [memberId]);

  const loadReferralData = async () => {
    try {
      // Generate or load referral code
      const code = await generateReferralCode();
      setReferralCode(code);

      // Load referrals
      const { data: referralsData, error: referralsError } = await supabase
        .from('member_referrals')
        .select('*')
        .eq('referrer_id', memberId)
        .order('created_at', { ascending: false });

      if (referralsError) throw referralsError;

      // Load rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('referral_rewards')
        .select('*')
        .eq('member_id', memberId)
        .order('earned_at', { ascending: false });

      if (rewardsError) throw rewardsError;

      setReferrals(referralsData || []);
      setRewards(rewardsData || []);

      // Calculate stats
      const successful = referralsData?.filter(r => r.status === 'completed') || [];
      const totalEarned = rewardsData?.reduce((sum, r) => sum + r.amount, 0) || 0;
      const currentTier = getCurrentTier(successful.length);

      setStats({
        totalReferrals: referralsData?.length || 0,
        successfulReferrals: successful.length,
        totalEarned,
        currentTier: currentTier.name
      });

    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = async () => {
    // Check if user already has a code
    const { data: existing } = await supabase
      .from('member_referral_codes')
      .select('code')
      .eq('member_id', memberId)
      .single();

    if (existing) return existing.code;

    // Generate new code
    const code = `${memberName.replace(/\s+/g, '').toUpperCase().slice(0, 4)}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    // Save to database
    await supabase
      .from('member_referral_codes')
      .insert([{ member_id: memberId, code }]);

    return code;
  };

  const getCurrentTier = (referralCount) => {
    return referralTiers
      .slice()
      .reverse()
      .find(tier => referralCount >= tier.minReferrals) || referralTiers[0];
  };

  const getNextTier = (referralCount) => {
    return referralTiers.find(tier => referralCount < tier.minReferrals);
  };

  const copyReferralLink = async () => {
    const referralLink = `${window.location.origin}/join-online?ref=${referralCode}`;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: 'Link copied!',
        description: 'Referral link copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Please copy the link manually',
        variant: 'destructive',
      });
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Join Momentum Gym with my referral!');
    const body = encodeURIComponent(
      `Hi! I've been loving my experience at Momentum Gym and thought you might be interested too. ` +
      `Use my referral code ${referralCode} when you sign up and we'll both get rewards! ` +
      `${window.location.origin}/join-online?ref=${referralCode}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaSMS = () => {
    const message = encodeURIComponent(
      `Check out Momentum Gym! Use my referral code ${referralCode} when you join: ${window.location.origin}/join-online?ref=${referralCode}`
    );
    window.open(`sms:?body=${message}`);
  };

  const shareViaFacebook = () => {
    const url = encodeURIComponent(`${window.location.origin}/join-online?ref=${referralCode}`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(`Join me at Momentum Gym! Use code ${referralCode} for rewards`);
    const url = encodeURIComponent(`${window.location.origin}/join-online?ref=${referralCode}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`);
  };

  const currentTier = getCurrentTier(stats.successfulReferrals);
  const nextTier = getNextTier(stats.successfulReferrals);
  const progressToNext = nextTier ? 
    ((stats.successfulReferrals - currentTier.minReferrals) / (nextTier.minReferrals - currentTier.minReferrals)) * 100 : 100;

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
      {/* Referral Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
            <div className="text-sm text-gray-600">Total Referrals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Check className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{stats.successfulReferrals}</div>
            <div className="text-sm text-gray-600">Successful</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">${stats.totalEarned}</div>
            <div className="text-sm text-gray-600">Total Earned</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
            <div className="text-2xl font-bold">{stats.currentTier}</div>
            <div className="text-sm text-gray-600">Current Tier</div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Referral Tier Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge className={cn('bg-gradient-to-r text-white', currentTier.color)}>
                {currentTier.name}
              </Badge>
              {nextTier && (
                <span className="text-sm text-gray-600">
                  {nextTier.minReferrals - stats.successfulReferrals} more for {nextTier.name}
                </span>
              )}
            </div>
            
            {nextTier && (
              <div>
                <Progress value={progressToNext} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{currentTier.minReferrals} referrals</span>
                  <span>{nextTier.minReferrals} referrals</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {referralTiers.map((tier, index) => (
                <div
                  key={tier.name}
                  className={cn(
                    'p-2 rounded text-center text-xs',
                    stats.successfulReferrals >= tier.minReferrals
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  <div className="font-medium">{tier.name}</div>
                  <div>{tier.minReferrals}+ refs</div>
                  {tier.bonus > 0 && <div>${tier.bonus} bonus</div>}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Code & Sharing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Your Referral Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={referralCode}
                readOnly
                className="font-mono text-lg text-center"
              />
              <Button
                onClick={copyReferralLink}
                variant="outline"
                className={cn(copied && 'bg-green-100 border-green-300')}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="text-sm text-gray-600 text-center">
              Share your code and earn $25 for each successful referral!
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button onClick={shareViaEmail} variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button onClick={shareViaSMS} variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                SMS
              </Button>
              <Button onClick={shareViaFacebook} variant="outline" size="sm">
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </Button>
              <Button onClick={shareViaTwitter} variant="outline" size="sm">
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Referrals */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No referrals yet</p>
              <p className="text-sm">Start sharing your code to earn rewards!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.slice(0, 5).map((referral, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      {referral.referred_name || 'New Member'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        referral.status === 'completed' ? 'default' :
                        referral.status === 'pending' ? 'secondary' : 'outline'
                      }
                    >
                      {referral.status}
                    </Badge>
                    {referral.status === 'completed' && (
                      <span className="text-sm text-green-600 font-medium">
                        +$25
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rewards History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Rewards History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rewards.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No rewards earned yet</p>
              <p className="text-sm">Complete referrals to start earning!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rewards.slice(0, 5).map((reward, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{reward.description}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(reward.earned_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    +${reward.amount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralSystem;

