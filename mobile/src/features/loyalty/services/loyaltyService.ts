/**
 * Loyalty service
 * API calls for loyalty program, rewards, and referrals
 */

import apiClient from '../../../services/api/client';
import {
  IApplyReferralRequest,
  IApplyReferralResponse,
  IEnrollResponse,
  IGetMyRewardsRequest,
  IGetTransactionsRequest,
  ILoyaltyAccountResponse,
  ILoyaltyReward,
  IMyRewardsResponse,
  IRedeemRewardResponse,
  IReferralCodeResponse,
  IReferralsResponse,
  IRewardsResponse,
  ITransactionsResponse,
  IUseRewardRequest,
  IUserReward,
} from '../types';

const LOYALTY_API = '/api/loyalty';

export const loyaltyService = {
  /**
   * Get user's loyalty account
   */
  getAccount: async (): Promise<ILoyaltyAccountResponse> => {
    const response = await apiClient.get<ILoyaltyAccountResponse>(`${LOYALTY_API}/account`);
    return response.data;
  },

  /**
   * Enroll in loyalty program
   */
  enroll: async (): Promise<IEnrollResponse> => {
    const response = await apiClient.post<IEnrollResponse>(`${LOYALTY_API}/enroll`);
    return response.data;
  },

  /**
   * Get loyalty transactions
   */
  getTransactions: async (params?: IGetTransactionsRequest): Promise<ITransactionsResponse> => {
    const response = await apiClient.get<ITransactionsResponse>(`${LOYALTY_API}/transactions`, {
      params,
    });
    return response.data;
  },

  /**
   * Get available rewards
   */
  getRewards: async (): Promise<IRewardsResponse> => {
    const response = await apiClient.get<IRewardsResponse>(`${LOYALTY_API}/rewards`);
    return response.data;
  },

  /**
   * Get reward details
   */
  getReward: async (rewardId: string): Promise<ILoyaltyReward> => {
    const response = await apiClient.get<ILoyaltyReward>(`${LOYALTY_API}/rewards/${rewardId}`);
    return response.data;
  },

  /**
   * Redeem a reward
   */
  redeemReward: async (rewardId: string): Promise<IRedeemRewardResponse> => {
    const response = await apiClient.post<IRedeemRewardResponse>(
      `${LOYALTY_API}/rewards/${rewardId}/redeem`
    );
    return response.data;
  },

  /**
   * Get user's redeemed rewards
   */
  getMyRewards: async (params?: IGetMyRewardsRequest): Promise<IMyRewardsResponse> => {
    const response = await apiClient.get<IMyRewardsResponse>(`${LOYALTY_API}/my-rewards`, {
      params,
    });
    return response.data;
  },

  /**
   * Use a redeemed reward
   */
  useReward: async (userRewardId: string, data?: IUseRewardRequest): Promise<IUserReward> => {
    const response = await apiClient.post<{ message: string; reward: IUserReward }>(
      `${LOYALTY_API}/my-rewards/${userRewardId}/use`,
      data || {}
    );
    return response.data.reward;
  },

  /**
   * Get user's referral code
   */
  getReferralCode: async (): Promise<IReferralCodeResponse> => {
    const response = await apiClient.get<IReferralCodeResponse>(`${LOYALTY_API}/referral/code`);
    return response.data;
  },

  /**
   * Apply a referral code
   */
  applyReferralCode: async (data: IApplyReferralRequest): Promise<IApplyReferralResponse> => {
    const response = await apiClient.post<IApplyReferralResponse>(
      `${LOYALTY_API}/referral/apply`,
      data
    );
    return response.data;
  },

  /**
   * Get user's referral history
   */
  getReferrals: async (): Promise<IReferralsResponse> => {
    const response = await apiClient.get<IReferralsResponse>(`${LOYALTY_API}/referrals`);
    return response.data;
  },
};

export default loyaltyService;
