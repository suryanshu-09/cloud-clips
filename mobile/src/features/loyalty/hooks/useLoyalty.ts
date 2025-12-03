/**
 * useLoyalty hook
 * React Query hooks for loyalty program, rewards, and referrals
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { Share, Alert } from 'react-native';

import { loyaltyService } from '../services/loyaltyService';
import {
  IApplyReferralRequest,
  IGetMyRewardsRequest,
  IGetTransactionsRequest,
  ILoyaltyAccount,
  ILoyaltyReward,
  IUseRewardRequest,
  IUserReward,
  LoyaltyTier,
  LoyaltyTransactionType,
  RewardStatus,
} from '../types';

// Query keys
export const LOYALTY_QUERY_KEYS = {
  all: ['loyalty'] as const,
  account: () => [...LOYALTY_QUERY_KEYS.all, 'account'] as const,
  transactions: (page?: number, type?: LoyaltyTransactionType) =>
    [...LOYALTY_QUERY_KEYS.all, 'transactions', page, type] as const,
  rewards: () => [...LOYALTY_QUERY_KEYS.all, 'rewards'] as const,
  reward: (id: string) => [...LOYALTY_QUERY_KEYS.all, 'rewards', id] as const,
  myRewards: (status?: RewardStatus) => [...LOYALTY_QUERY_KEYS.all, 'my-rewards', status] as const,
  referralCode: () => [...LOYALTY_QUERY_KEYS.all, 'referral-code'] as const,
  referrals: () => [...LOYALTY_QUERY_KEYS.all, 'referrals'] as const,
};

/**
 * Hook to get user's loyalty account
 */
export function useLoyaltyAccount() {
  return useQuery({
    queryKey: LOYALTY_QUERY_KEYS.account(),
    queryFn: () => loyaltyService.getAccount(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to enroll in loyalty program
 */
export function useEnrollLoyalty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => loyaltyService.enroll(),
    onSuccess: (data) => {
      // Update account cache
      queryClient.setQueryData(LOYALTY_QUERY_KEYS.account(), {
        account: data.account,
        benefits: [],
        tierConfig: {
          thresholds: { bronze: 0, silver: 500, gold: 1500, platinum: 5000 },
          multiplier: 1.0,
          discount: 0,
        },
      });
      // Invalidate transactions
      queryClient.invalidateQueries({
        queryKey: LOYALTY_QUERY_KEYS.transactions(),
      });
    },
  });
}

/**
 * Hook to get loyalty transactions with pagination
 */
export function useLoyaltyTransactions(params?: IGetTransactionsRequest) {
  return useQuery({
    queryKey: LOYALTY_QUERY_KEYS.transactions(params?.page, params?.type),
    queryFn: () => loyaltyService.getTransactions(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to get available rewards
 */
export function useRewards() {
  return useQuery({
    queryKey: LOYALTY_QUERY_KEYS.rewards(),
    queryFn: () => loyaltyService.getRewards(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to get single reward details
 */
export function useReward(rewardId: string) {
  return useQuery({
    queryKey: LOYALTY_QUERY_KEYS.reward(rewardId),
    queryFn: () => loyaltyService.getReward(rewardId),
    enabled: !!rewardId,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Hook to redeem a reward
 */
export function useRedeemReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rewardId: string) => loyaltyService.redeemReward(rewardId),
    onSuccess: (data) => {
      // Update account points
      queryClient.setQueryData(
        LOYALTY_QUERY_KEYS.account(),
        (old: { account: ILoyaltyAccount } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            account: {
              ...old.account,
              currentPoints: data.currentPoints,
            },
          };
        }
      );
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: LOYALTY_QUERY_KEYS.myRewards() });
      queryClient.invalidateQueries({ queryKey: LOYALTY_QUERY_KEYS.transactions() });
      queryClient.invalidateQueries({ queryKey: LOYALTY_QUERY_KEYS.rewards() });
    },
  });
}

/**
 * Hook to get user's redeemed rewards
 */
export function useMyRewards(params?: IGetMyRewardsRequest) {
  return useQuery({
    queryKey: LOYALTY_QUERY_KEYS.myRewards(params?.status),
    queryFn: () => loyaltyService.getMyRewards(params),
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook to use a redeemed reward
 */
export function useUseReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userRewardId, data }: { userRewardId: string; data?: IUseRewardRequest }) =>
      loyaltyService.useReward(userRewardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOYALTY_QUERY_KEYS.myRewards() });
    },
  });
}

/**
 * Hook to get user's referral code
 */
export function useReferralCode() {
  return useQuery({
    queryKey: LOYALTY_QUERY_KEYS.referralCode(),
    queryFn: () => loyaltyService.getReferralCode(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Hook to share referral code
 */
export function useShareReferral() {
  const { data: referralData, isLoading } = useReferralCode();
  const [isSharing, setIsSharing] = useState(false);

  const shareReferral = useCallback(async () => {
    if (!referralData?.code) {
      Alert.alert('Error', 'Unable to get referral code');
      return;
    }

    setIsSharing(true);
    try {
      const message = `Join Cloud Clips and get ${referralData.config.refereeRewardPoints} bonus points! Use my referral code: ${referralData.code}\n\nDownload the app: https://cloudclips.app`;

      await Share.share({
        message,
        title: 'Join Cloud Clips',
      });
    } catch (error) {
      console.error('Error sharing referral:', error);
    } finally {
      setIsSharing(false);
    }
  }, [referralData]);

  return {
    referralCode: referralData?.code,
    stats: referralData?.stats,
    config: referralData?.config,
    isLoading,
    isSharing,
    shareReferral,
  };
}

/**
 * Hook to apply a referral code
 */
export function useApplyReferral() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: IApplyReferralRequest) => loyaltyService.applyReferralCode(data),
    onSuccess: () => {
      // Invalidate account to refresh points
      queryClient.invalidateQueries({ queryKey: LOYALTY_QUERY_KEYS.account() });
      queryClient.invalidateQueries({ queryKey: LOYALTY_QUERY_KEYS.transactions() });
    },
  });
}

/**
 * Hook to get user's referral history
 */
export function useReferrals() {
  return useQuery({
    queryKey: LOYALTY_QUERY_KEYS.referrals(),
    queryFn: () => loyaltyService.getReferrals(),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Combined hook for loyalty dashboard
 */
export function useLoyaltyDashboard() {
  const accountQuery = useLoyaltyAccount();
  const rewardsQuery = useRewards();
  const myRewardsQuery = useMyRewards({ status: RewardStatus.AVAILABLE });
  const enrollMutation = useEnrollLoyalty();

  const isEnrolled = !!accountQuery.data?.account;

  const tierProgress = accountQuery.data?.account
    ? {
        currentPoints: accountQuery.data.account.currentPoints,
        currentTier: accountQuery.data.account.tier,
        nextTier: accountQuery.data.account.nextTier,
        pointsToNext: accountQuery.data.account.pointsToNextTier,
        lifetimePoints: accountQuery.data.account.lifetimePoints,
      }
    : null;

  // Get rewards the user can afford
  const affordableRewards = rewardsQuery.data?.rewards.filter(
    (reward) => reward.pointsCost <= (accountQuery.data?.account?.currentPoints || 0)
  );

  return {
    // Account data
    account: accountQuery.data?.account,
    benefits: accountQuery.data?.benefits || [],
    tierConfig: accountQuery.data?.tierConfig,
    isLoadingAccount: accountQuery.isLoading,
    accountError: accountQuery.error,
    refetchAccount: accountQuery.refetch,

    // Enrollment
    isEnrolled,
    enroll: enrollMutation.mutateAsync,
    isEnrolling: enrollMutation.isPending,
    enrollError: enrollMutation.error,

    // Tier progress
    tierProgress,

    // Rewards
    rewards: rewardsQuery.data?.rewards || [],
    affordableRewards: affordableRewards || [],
    isLoadingRewards: rewardsQuery.isLoading,

    // My rewards
    myRewards: myRewardsQuery.data?.rewards || [],
    myRewardsCount: myRewardsQuery.data?.total || 0,
    isLoadingMyRewards: myRewardsQuery.isLoading,
  };
}

/**
 * Hook for rewards page functionality
 */
export function useRewardsPage() {
  const queryClient = useQueryClient();
  const accountQuery = useLoyaltyAccount();
  const rewardsQuery = useRewards();
  const redeemMutation = useRedeemReward();

  const [selectedReward, setSelectedReward] = useState<ILoyaltyReward | null>(null);

  const currentPoints = accountQuery.data?.account?.currentPoints || 0;
  const currentTier = accountQuery.data?.account?.tier || LoyaltyTier.BRONZE;

  const canAfford = (reward: ILoyaltyReward) => reward.pointsCost <= currentPoints;

  const handleRedeem = useCallback(
    async (reward: ILoyaltyReward) => {
      if (!canAfford(reward)) {
        Alert.alert(
          'Insufficient Points',
          `You need ${reward.pointsCost - currentPoints} more points to redeem this reward.`
        );
        return;
      }

      Alert.alert('Redeem Reward', `Redeem "${reward.name}" for ${reward.pointsCost} points?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            try {
              await redeemMutation.mutateAsync(reward.id);
              Alert.alert('Success', 'Reward redeemed successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to redeem reward. Please try again.');
            }
          },
        },
      ]);
    },
    [currentPoints, redeemMutation]
  );

  return {
    rewards: rewardsQuery.data?.rewards || [],
    isLoading: rewardsQuery.isLoading || accountQuery.isLoading,
    currentPoints,
    currentTier,
    selectedReward,
    setSelectedReward,
    canAfford,
    handleRedeem,
    isRedeeming: redeemMutation.isPending,
    redeemError: redeemMutation.error,
  };
}

/**
 * Hook for transactions history
 */
export function useTransactionsHistory() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<LoyaltyTransactionType | undefined>(undefined);

  const transactionsQuery = useLoyaltyTransactions({
    page,
    limit: 20,
    type: typeFilter,
  });

  const loadMore = useCallback(() => {
    if (transactionsQuery.data && page < transactionsQuery.data.totalPages) {
      setPage((p) => p + 1);
    }
  }, [transactionsQuery.data, page]);

  const refresh = useCallback(() => {
    setPage(1);
  }, []);

  return {
    transactions: transactionsQuery.data?.transactions || [],
    total: transactionsQuery.data?.total || 0,
    currentPage: page,
    totalPages: transactionsQuery.data?.totalPages || 1,
    isLoading: transactionsQuery.isLoading,
    isFetching: transactionsQuery.isFetching,
    error: transactionsQuery.error,
    typeFilter,
    setTypeFilter,
    loadMore,
    refresh,
    hasMore: transactionsQuery.data ? page < transactionsQuery.data.totalPages : false,
  };
}
