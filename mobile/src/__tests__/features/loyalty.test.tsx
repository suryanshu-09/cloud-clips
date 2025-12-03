import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert, Share } from 'react-native';
import {
  useLoyaltyAccount,
  useEnrollLoyalty,
  useLoyaltyTransactions,
  useRewards,
  useRedeemReward,
  useMyRewards,
  useReferralCode,
  useApplyReferral,
  useLoyaltyDashboard,
  useShareReferral,
  LOYALTY_QUERY_KEYS,
} from '@/features/loyalty/hooks/useLoyalty';
import { loyaltyService } from '@/features/loyalty/services/loyaltyService';
import {
  LoyaltyTier,
  RewardStatus,
  RewardType,
  LoyaltyTransactionType,
} from '@/features/loyalty/types';
import type {
  ILoyaltyAccount,
  ILoyaltyReward,
  ILoyaltyTransaction,
  IUserReward,
} from '@/features/loyalty/types';

// Mock the loyalty service
jest.mock('@/features/loyalty/services/loyaltyService');

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock Share
jest.spyOn(Share, 'share').mockImplementation(() => Promise.resolve({ action: 'sharedAction' }));

describe('Loyalty Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
    (Alert.alert as jest.Mock).mockClear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockLoyaltyAccount: ILoyaltyAccount = {
    id: 'account-1',
    userId: 'user-1',
    currentPoints: 500,
    lifetimePoints: 1500,
    tier: LoyaltyTier.SILVER,
    pointsToNextTier: 1000,
    nextTier: LoyaltyTier.GOLD,
    totalRedemptions: 3,
    totalSavings: 50.0,
    memberSince: new Date('2024-01-01'),
    lastActivityAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockReward: ILoyaltyReward = {
    id: 'reward-1',
    name: '10% Discount',
    description: 'Get 10% off your next appointment',
    type: RewardType.DISCOUNT,
    pointsCost: 100,
    value: 10,
    isPercentage: true,
    minTier: LoyaltyTier.BRONZE,
    isActive: true,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2025-12-31'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTransaction: ILoyaltyTransaction = {
    id: 'tx-1',
    userId: 'user-1',
    type: LoyaltyTransactionType.EARN,
    points: 100,
    source: 'booking',
    description: 'Points for appointment',
    balanceAfter: 500,
    createdAt: new Date(),
  };

  const mockUserReward: IUserReward = {
    id: 'user-reward-1',
    userId: 'user-1',
    rewardId: 'reward-1',
    reward: mockReward,
    status: RewardStatus.AVAILABLE,
    code: 'RWD-ABC123',
    pointsSpent: 100,
    redeemedAt: new Date(),
    expiresAt: new Date('2025-12-31'),
    createdAt: new Date(),
  };

  describe('useLoyaltyAccount', () => {
    it('should fetch loyalty account', async () => {
      const mockResponse = {
        account: mockLoyaltyAccount,
        benefits: ['Priority booking', 'Exclusive rewards'],
        tierConfig: {
          thresholds: { bronze: 0, silver: 500, gold: 1500, platinum: 5000 },
          multiplier: 1.1,
          discount: 5,
        },
      };

      (loyaltyService.getAccount as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useLoyaltyAccount(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(loyaltyService.getAccount).toHaveBeenCalled();
    });
  });

  describe('useEnrollLoyalty', () => {
    it('should enroll user in loyalty program', async () => {
      const mockResponse = {
        message: 'Successfully enrolled',
        account: mockLoyaltyAccount,
        signupBonus: 50,
      };

      (loyaltyService.enroll as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEnrollLoyalty(), { wrapper });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(loyaltyService.enroll).toHaveBeenCalled();
    });
  });

  describe('useLoyaltyTransactions', () => {
    it('should fetch transactions', async () => {
      const mockResponse = {
        transactions: [mockTransaction],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      (loyaltyService.getTransactions as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useLoyaltyTransactions({ page: 1 }), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockResponse);
    });

    it('should filter transactions by type', async () => {
      const mockResponse = {
        transactions: [mockTransaction],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      (loyaltyService.getTransactions as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(
        () => useLoyaltyTransactions({ type: LoyaltyTransactionType.EARN }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(loyaltyService.getTransactions).toHaveBeenCalledWith({
        type: LoyaltyTransactionType.EARN,
      });
    });
  });

  describe('useRewards', () => {
    it('should fetch available rewards', async () => {
      const mockResponse = {
        rewards: [mockReward],
        currentPoints: 500,
        tier: LoyaltyTier.SILVER,
      };

      (loyaltyService.getRewards as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useRewards(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockResponse);
    });
  });

  describe('useRedeemReward', () => {
    it('should redeem a reward successfully', async () => {
      const mockResponse = {
        message: 'Reward redeemed successfully',
        userReward: mockUserReward,
        currentPoints: 400,
      };

      (loyaltyService.redeemReward as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useRedeemReward(), { wrapper });

      result.current.mutate('reward-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(loyaltyService.redeemReward).toHaveBeenCalledWith('reward-1');
    });

    it('should handle redemption error', async () => {
      const mockError = new Error('Insufficient points');
      (loyaltyService.redeemReward as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useRedeemReward(), { wrapper });

      result.current.mutate('reward-1');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useMyRewards', () => {
    it('should fetch user rewards', async () => {
      const mockResponse = {
        rewards: [mockUserReward],
        total: 1,
      };

      (loyaltyService.getMyRewards as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useMyRewards(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockResponse);
    });

    it('should filter by status', async () => {
      const mockResponse = {
        rewards: [mockUserReward],
        total: 1,
      };

      (loyaltyService.getMyRewards as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useMyRewards({ status: RewardStatus.AVAILABLE }), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(loyaltyService.getMyRewards).toHaveBeenCalledWith({ status: RewardStatus.AVAILABLE });
    });
  });

  describe('useReferralCode', () => {
    it('should fetch referral code', async () => {
      const mockResponse = {
        code: 'REF-ABC123',
        stats: {
          totalReferrals: 5,
          completedReferrals: 3,
          pendingReferrals: 2,
          totalPointsEarned: 300,
        },
        config: {
          referrerRewardPoints: 100,
          refereeRewardPoints: 50,
          referralExpiryDays: 30,
          maxReferralsPerMonth: 10,
        },
      };

      (loyaltyService.getReferralCode as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useReferralCode(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockResponse);
    });
  });

  describe('useApplyReferral', () => {
    it('should apply referral code successfully', async () => {
      const mockResponse = {
        message: 'Referral code applied successfully',
        pointsEarned: 50,
      };

      (loyaltyService.applyReferralCode as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useApplyReferral(), { wrapper });

      result.current.mutate({ code: 'REF-XYZ789' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(loyaltyService.applyReferralCode).toHaveBeenCalledWith({ code: 'REF-XYZ789' });
    });

    it('should handle invalid referral code', async () => {
      const mockError = new Error('Invalid or expired referral code');
      (loyaltyService.applyReferralCode as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useApplyReferral(), { wrapper });

      result.current.mutate({ code: 'INVALID' });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useLoyaltyDashboard', () => {
    it('should return combined loyalty data', async () => {
      const accountResponse = {
        account: mockLoyaltyAccount,
        benefits: ['Priority booking'],
        tierConfig: {
          thresholds: { bronze: 0, silver: 500, gold: 1500, platinum: 5000 },
          multiplier: 1.1,
          discount: 5,
        },
      };

      const rewardsResponse = {
        rewards: [mockReward],
        currentPoints: 500,
        tier: LoyaltyTier.SILVER,
      };

      const myRewardsResponse = {
        rewards: [mockUserReward],
        total: 1,
      };

      (loyaltyService.getAccount as jest.Mock).mockResolvedValue(accountResponse);
      (loyaltyService.getRewards as jest.Mock).mockResolvedValue(rewardsResponse);
      (loyaltyService.getMyRewards as jest.Mock).mockResolvedValue(myRewardsResponse);

      const { result } = renderHook(() => useLoyaltyDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoadingAccount).toBe(false);
        expect(result.current.isLoadingRewards).toBe(false);
      });

      expect(result.current.isEnrolled).toBe(true);
      expect(result.current.account).toEqual(mockLoyaltyAccount);
      expect(result.current.rewards).toEqual([mockReward]);
      expect(result.current.tierProgress).not.toBeNull();
    });

    it('should identify affordable rewards', async () => {
      const accountResponse = {
        account: { ...mockLoyaltyAccount, currentPoints: 150 },
        benefits: [],
        tierConfig: {},
      };

      const expensiveReward = { ...mockReward, id: 'reward-2', pointsCost: 500 };
      const affordableReward = { ...mockReward, id: 'reward-1', pointsCost: 100 };

      const rewardsResponse = {
        rewards: [expensiveReward, affordableReward],
        currentPoints: 150,
        tier: LoyaltyTier.BRONZE,
      };

      (loyaltyService.getAccount as jest.Mock).mockResolvedValue(accountResponse);
      (loyaltyService.getRewards as jest.Mock).mockResolvedValue(rewardsResponse);
      (loyaltyService.getMyRewards as jest.Mock).mockResolvedValue({ rewards: [], total: 0 });

      const { result } = renderHook(() => useLoyaltyDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoadingAccount).toBe(false);
      });

      expect(result.current.affordableRewards).toHaveLength(1);
      expect(result.current.affordableRewards[0].id).toBe('reward-1');
    });
  });

  describe('useShareReferral', () => {
    it('should share referral code', async () => {
      const mockResponse = {
        code: 'REF-SHARE123',
        stats: {
          totalReferrals: 0,
          completedReferrals: 0,
          pendingReferrals: 0,
          totalPointsEarned: 0,
        },
        config: {
          referrerRewardPoints: 100,
          refereeRewardPoints: 50,
          referralExpiryDays: 30,
          maxReferralsPerMonth: 10,
        },
      };

      (loyaltyService.getReferralCode as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useShareReferral(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.referralCode).toBe('REF-SHARE123');

      // Trigger share
      await result.current.shareReferral();

      expect(Share.share).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('REF-SHARE123'),
        })
      );
    });
  });
});
