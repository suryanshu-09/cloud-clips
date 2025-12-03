/**
 * Loyalty Program Screen
 * Displays loyalty account, points, tiers, rewards, and referral program
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeView } from '@/components/ui/SafeView';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import {
  useLoyaltyDashboard,
  useShareReferral,
  useTransactionsHistory,
  ILoyaltyReward,
  IUserReward,
  LoyaltyTier,
  RewardStatus,
} from '@/features/loyalty';

type TabType = 'overview' | 'rewards' | 'history' | 'referrals';

interface ITabButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

function TabButton({ label, isActive, onPress }: ITabButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`py-2 px-4 rounded-full ${isActive ? 'bg-amber-500' : 'bg-gray-100'}`}
    >
      <Text className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-600'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

// Tier badge component
function TierBadge({ tier }: { tier: LoyaltyTier }) {
  const tierColors = {
    [LoyaltyTier.BRONZE]: { bg: 'bg-amber-700', text: 'text-amber-50' },
    [LoyaltyTier.SILVER]: { bg: 'bg-gray-400', text: 'text-white' },
    [LoyaltyTier.GOLD]: { bg: 'bg-yellow-400', text: 'text-yellow-900' },
    [LoyaltyTier.PLATINUM]: { bg: 'bg-slate-800', text: 'text-slate-100' },
  };

  const colors = tierColors[tier] || tierColors[LoyaltyTier.BRONZE];

  return (
    <View className={`px-3 py-1 rounded-full ${colors.bg}`}>
      <Text className={`text-xs font-bold uppercase ${colors.text}`}>{tier}</Text>
    </View>
  );
}

// Progress bar for tier
function TierProgress({
  currentPoints,
  pointsToNext,
  currentTier,
  nextTier,
}: {
  currentPoints: number;
  pointsToNext: number;
  currentTier: LoyaltyTier;
  nextTier?: LoyaltyTier;
}) {
  const totalNeeded = currentPoints + pointsToNext;
  const progress = totalNeeded > 0 ? (currentPoints / totalNeeded) * 100 : 0;

  return (
    <View className="mt-4">
      <View className="flex-row justify-between mb-2">
        <Text className="text-xs text-gray-500">Progress to {nextTier || 'Max Tier'}</Text>
        <Text className="text-xs text-gray-600 font-medium">
          {pointsToNext > 0 ? `${pointsToNext} pts to go` : 'Max tier reached!'}
        </Text>
      </View>
      <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <View
          className="h-full bg-amber-500 rounded-full"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </View>
    </View>
  );
}

// Reward card component
function RewardCard({
  reward,
  currentPoints,
  onRedeem,
  isRedeeming,
}: {
  reward: ILoyaltyReward;
  currentPoints: number;
  onRedeem: (reward: ILoyaltyReward) => void;
  isRedeeming: boolean;
}) {
  const canAfford = currentPoints >= reward.pointsCost;

  return (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900">{reward.name}</Text>
          <Text className="text-sm text-gray-500 mt-1">{reward.description}</Text>
        </View>
        <View className="bg-amber-100 px-3 py-1 rounded-full ml-2">
          <Text className="text-amber-700 font-bold text-sm">{reward.pointsCost} pts</Text>
        </View>
      </View>

      <View className="flex-row items-center mt-3">
        <View className="flex-row items-center flex-1">
          {reward.isPercentage ? (
            <Text className="text-green-600 font-medium">{reward.value}% off</Text>
          ) : (
            <Text className="text-green-600 font-medium">${reward.value} value</Text>
          )}
          {reward.minTier !== LoyaltyTier.BRONZE && (
            <View className="ml-2">
              <TierBadge tier={reward.minTier} />
            </View>
          )}
        </View>
        <Button
          variant={canAfford ? 'primary' : 'secondary'}
          size="sm"
          onPress={() => onRedeem(reward)}
          disabled={!canAfford || isRedeeming}
          loading={isRedeeming}
        >
          {canAfford ? 'Redeem' : 'Not Enough Points'}
        </Button>
      </View>
    </View>
  );
}

// My reward card component
function MyRewardCard({
  userReward,
  onUse,
}: {
  userReward: IUserReward;
  onUse: (reward: IUserReward) => void;
}) {
  const isExpired = new Date(userReward.expiresAt) < new Date();
  const isUsed = userReward.status === RewardStatus.REDEEMED;

  return (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900">
            {userReward.reward?.name || 'Reward'}
          </Text>
          <Text className="text-xs text-gray-400 mt-1">Code: {userReward.code}</Text>
        </View>
        <View
          className={`px-2 py-1 rounded-full ${
            isUsed ? 'bg-gray-100' : isExpired ? 'bg-red-100' : 'bg-green-100'
          }`}
        >
          <Text
            className={`text-xs font-medium ${
              isUsed ? 'text-gray-500' : isExpired ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {isUsed ? 'Used' : isExpired ? 'Expired' : 'Available'}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between mt-2">
        <Text className="text-xs text-gray-500">
          Expires: {new Date(userReward.expiresAt).toLocaleDateString()}
        </Text>
        {!isUsed && !isExpired && (
          <Button variant="primary" size="sm" onPress={() => onUse(userReward)}>
            Use Now
          </Button>
        )}
      </View>
    </View>
  );
}

// Overview section
function OverviewSection({
  account,
  benefits,
  tierProgress,
  myRewards,
  isLoading,
}: {
  account: any;
  benefits: string[];
  tierProgress: any;
  myRewards: IUserReward[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <View className="px-4 py-6">
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  const availableRewards = myRewards.filter((r) => r.status === RewardStatus.AVAILABLE);

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {/* Points Card */}
      <View className="mx-4 mt-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 shadow-lg">
        <View className="flex-row justify-between items-start">
          <View>
            <Text className="text-amber-100 text-sm">Available Points</Text>
            <Text className="text-white text-4xl font-bold mt-1">
              {account?.currentPoints?.toLocaleString() || 0}
            </Text>
          </View>
          {account?.tier && <TierBadge tier={account.tier} />}
        </View>

        {tierProgress && (
          <TierProgress
            currentPoints={tierProgress.currentPoints}
            pointsToNext={tierProgress.pointsToNext}
            currentTier={tierProgress.currentTier}
            nextTier={tierProgress.nextTier}
          />
        )}

        <View className="flex-row justify-between mt-4 pt-4 border-t border-amber-400/30">
          <View>
            <Text className="text-amber-200 text-xs">Lifetime Points</Text>
            <Text className="text-white font-semibold">
              {account?.lifetimePoints?.toLocaleString() || 0}
            </Text>
          </View>
          <View>
            <Text className="text-amber-200 text-xs">Total Savings</Text>
            <Text className="text-white font-semibold">
              ${account?.totalSavings?.toFixed(2) || '0.00'}
            </Text>
          </View>
          <View>
            <Text className="text-amber-200 text-xs">Rewards Used</Text>
            <Text className="text-white font-semibold">{account?.totalRedemptions || 0}</Text>
          </View>
        </View>
      </View>

      {/* Available Rewards */}
      {availableRewards.length > 0 && (
        <View className="mx-4 mt-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">Your Rewards</Text>
          {availableRewards.slice(0, 2).map((reward) => (
            <View key={reward.id} className="bg-green-50 rounded-lg p-3 mb-2 flex-row items-center">
              <Text className="text-2xl mr-3">🎁</Text>
              <View className="flex-1">
                <Text className="text-green-800 font-medium">{reward.reward?.name}</Text>
                <Text className="text-green-600 text-xs">
                  Code: {reward.code} - Expires {new Date(reward.expiresAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Tier Benefits */}
      <View className="mx-4 mt-6 mb-8">
        <Text className="text-lg font-bold text-gray-900 mb-3">
          {account?.tier || 'Bronze'} Member Benefits
        </Text>
        <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          {benefits.map((benefit, index) => (
            <View key={index} className="flex-row items-center py-2">
              <Text className="text-green-500 mr-3">✓</Text>
              <Text className="text-gray-700">{benefit}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// Referrals section
function ReferralsSection() {
  const { referralCode, stats, config, isLoading, isSharing, shareReferral } = useShareReferral();

  if (isLoading) {
    return (
      <View className="px-4 py-6">
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
      {/* Share Card */}
      <View className="mt-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-lg">
        <Text className="text-white text-xl font-bold mb-2">Invite Friends & Earn</Text>
        <Text className="text-purple-100 mb-4">
          Give {config?.refereeRewardPoints || 100} points, get{' '}
          {config?.referrerRewardPoints || 200} points when they sign up!
        </Text>

        <View className="bg-white/20 rounded-lg p-4 mb-4">
          <Text className="text-purple-100 text-xs mb-1">Your Referral Code</Text>
          <Text className="text-white text-2xl font-bold tracking-wider">
            {referralCode || '---'}
          </Text>
        </View>

        <Button
          variant="secondary"
          onPress={shareReferral}
          loading={isSharing}
          className="bg-white"
        >
          Share Code
        </Button>
      </View>

      {/* Stats */}
      <View className="mt-6">
        <Text className="text-lg font-bold text-gray-900 mb-3">Your Referral Stats</Text>
        <View className="flex-row gap-3">
          <View className="flex-1 bg-white rounded-xl p-4 items-center shadow-sm border border-gray-100">
            <Text className="text-3xl font-bold text-gray-900">
              {stats?.completedReferrals || 0}
            </Text>
            <Text className="text-gray-500 text-sm mt-1">Successful</Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-4 items-center shadow-sm border border-gray-100">
            <Text className="text-3xl font-bold text-gray-900">{stats?.pendingReferrals || 0}</Text>
            <Text className="text-gray-500 text-sm mt-1">Pending</Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-4 items-center shadow-sm border border-gray-100">
            <Text className="text-3xl font-bold text-amber-500">
              {stats?.totalPointsEarned || 0}
            </Text>
            <Text className="text-gray-500 text-sm mt-1">Pts Earned</Text>
          </View>
        </View>
      </View>

      {/* How it works */}
      <View className="mt-6 mb-8">
        <Text className="text-lg font-bold text-gray-900 mb-3">How It Works</Text>
        <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <View className="flex-row items-start mb-3">
            <View className="w-6 h-6 rounded-full bg-purple-100 items-center justify-center mr-3">
              <Text className="text-purple-600 font-bold text-xs">1</Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-medium">Share your code</Text>
              <Text className="text-gray-500 text-sm">Send it to friends and family</Text>
            </View>
          </View>
          <View className="flex-row items-start mb-3">
            <View className="w-6 h-6 rounded-full bg-purple-100 items-center justify-center mr-3">
              <Text className="text-purple-600 font-bold text-xs">2</Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-medium">They sign up</Text>
              <Text className="text-gray-500 text-sm">They enter your code when registering</Text>
            </View>
          </View>
          <View className="flex-row items-start">
            <View className="w-6 h-6 rounded-full bg-purple-100 items-center justify-center mr-3">
              <Text className="text-purple-600 font-bold text-xs">3</Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-medium">Both get rewarded</Text>
              <Text className="text-gray-500 text-sm">Bonus points are automatically added</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

export default function LoyaltyScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const {
    account,
    benefits,
    tierConfig,
    tierProgress,
    rewards,
    affordableRewards,
    myRewards,
    isEnrolled,
    isLoadingAccount,
    enroll,
    isEnrolling,
    isLoadingRewards,
  } = useLoyaltyDashboard();

  const {
    transactions,
    isLoading: isLoadingTransactions,
    hasMore,
    loadMore,
    refresh,
  } = useTransactionsHistory();

  const [isRedeeming, setIsRedeeming] = useState(false);

  const handleRedeem = useCallback(
    async (reward: ILoyaltyReward) => {
      router.push({
        pathname: '/(client)/loyalty/redeem',
        params: { rewardId: reward.id },
      });
    },
    [router]
  );

  const handleUseReward = useCallback(
    (reward: IUserReward) => {
      // Navigate to booking or cart with reward applied
      router.push({
        pathname: '/search',
        params: { rewardCode: reward.code },
      });
    },
    [router]
  );

  // Not enrolled state
  if (!isEnrolled && !isLoadingAccount) {
    return (
      <SafeView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center px-8">
          <Text className="text-6xl mb-6">⭐</Text>
          <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
            Join Our Loyalty Program
          </Text>
          <Text className="text-gray-600 text-center mb-8">
            Earn points on every booking and purchase. Redeem for exclusive rewards and discounts!
          </Text>

          <View className="bg-amber-50 rounded-xl p-4 mb-6 w-full">
            <Text className="text-amber-800 font-medium text-center mb-2">
              Sign up bonus: 50 points
            </Text>
            <Text className="text-amber-600 text-sm text-center">
              Start earning immediately with your first booking
            </Text>
          </View>

          <Button
            variant="primary"
            size="lg"
            onPress={() => enroll()}
            loading={isEnrolling}
            className="w-full"
          >
            Join Now
          </Button>
        </View>
      </SafeView>
    );
  }

  return (
    <SafeView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 pt-4 pb-2 bg-white border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900 mb-1">Rewards</Text>
        <Text className="text-gray-600 text-sm">Earn points, unlock rewards</Text>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-white border-b border-gray-100"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
      >
        <TabButton
          label="Overview"
          isActive={activeTab === 'overview'}
          onPress={() => setActiveTab('overview')}
        />
        <TabButton
          label="Rewards"
          isActive={activeTab === 'rewards'}
          onPress={() => setActiveTab('rewards')}
        />
        <TabButton
          label="History"
          isActive={activeTab === 'history'}
          onPress={() => setActiveTab('history')}
        />
        <TabButton
          label="Refer Friends"
          isActive={activeTab === 'referrals'}
          onPress={() => setActiveTab('referrals')}
        />
      </ScrollView>

      {/* Content */}
      {activeTab === 'overview' && (
        <OverviewSection
          account={account}
          benefits={benefits}
          tierProgress={tierProgress}
          myRewards={myRewards}
          isLoading={isLoadingAccount}
        />
      )}

      {activeTab === 'rewards' && (
        <View className="flex-1">
          {isLoadingRewards ? (
            <View className="px-4 py-6">
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : rewards.length === 0 ? (
            <EmptyState
              icon="🎁"
              title="No Rewards Available"
              description="Check back later for new rewards"
            />
          ) : (
            <FlatList
              data={rewards}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View className="px-4">
                  <RewardCard
                    reward={item}
                    currentPoints={account?.currentPoints || 0}
                    onRedeem={handleRedeem}
                    isRedeeming={isRedeeming}
                  />
                </View>
              )}
              contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View className="px-4 mb-4">
                  <View className="bg-amber-50 rounded-lg p-3 flex-row items-center">
                    <Text className="text-2xl mr-3">💰</Text>
                    <View>
                      <Text className="text-amber-800 font-semibold">
                        {account?.currentPoints?.toLocaleString() || 0} points available
                      </Text>
                      <Text className="text-amber-600 text-sm">
                        {affordableRewards.length} rewards you can redeem now
                      </Text>
                    </View>
                  </View>
                </View>
              }
            />
          )}
        </View>
      )}

      {activeTab === 'history' && (
        <View className="flex-1">
          {isLoadingTransactions ? (
            <View className="px-4 py-6">
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : transactions.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No Transactions Yet"
              description="Start earning points with your first booking"
            />
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View className="px-4">
                  <View className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-100 flex-row items-center">
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                        item.points > 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      <Text className={item.points > 0 ? 'text-green-600' : 'text-red-600'}>
                        {item.points > 0 ? '+' : ''}
                        {item.points}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-medium">{item.description}</Text>
                      <Text className="text-gray-500 text-xs">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text className="text-gray-500 text-sm">{item.balanceAfter} pts</Text>
                  </View>
                </View>
              )}
              contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
              onEndReached={hasMore ? loadMore : undefined}
              onEndReachedThreshold={0.5}
              refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />}
            />
          )}
        </View>
      )}

      {activeTab === 'referrals' && <ReferralsSection />}
    </SafeView>
  );
}
