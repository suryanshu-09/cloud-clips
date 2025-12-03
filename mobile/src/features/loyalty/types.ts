/**
 * Loyalty feature types
 * Types for loyalty program, rewards, and referrals
 */

// Loyalty tiers
export enum LoyaltyTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

// Transaction types
export enum LoyaltyTransactionType {
  EARN = 'earn',
  REDEEM = 'redeem',
  EXPIRE = 'expire',
  BONUS = 'bonus',
  ADJUST = 'adjust',
}

// Earn sources
export enum LoyaltyEarnSource {
  BOOKING = 'booking',
  PURCHASE = 'purchase',
  REFERRAL = 'referral',
  REVIEW = 'review',
  BONUS = 'bonus',
  SIGNUP = 'signup',
}

// Reward types
export enum RewardType {
  DISCOUNT = 'discount',
  FREE_SERVICE = 'free_service',
  FREE_PRODUCT = 'free_product',
  UPGRADE = 'upgrade',
}

// Reward status
export enum RewardStatus {
  AVAILABLE = 'available',
  REDEEMED = 'redeemed',
  EXPIRED = 'expired',
}

// Referral status
export enum ReferralStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

// Loyalty account
export interface ILoyaltyAccount {
  id: string;
  userId: string;
  currentPoints: number;
  lifetimePoints: number;
  tier: LoyaltyTier;
  tierExpiresAt?: string;
  pointsToNextTier: number;
  nextTier?: LoyaltyTier;
  totalRedemptions: number;
  totalSavings: number;
  memberSince: string;
  lastActivityAt: string;
  pointsExpiringAt?: string;
  pointsExpiringSoon: number;
  createdAt: string;
  updatedAt: string;
}

// Loyalty transaction
export interface ILoyaltyTransaction {
  id: string;
  userId: string;
  type: LoyaltyTransactionType;
  points: number;
  source?: LoyaltyEarnSource;
  description: string;
  referenceId?: string;
  referenceType?: string;
  balanceAfter: number;
  expiresAt?: string;
  createdAt: string;
}

// Loyalty reward
export interface ILoyaltyReward {
  id: string;
  name: string;
  description: string;
  type: RewardType;
  pointsCost: number;
  value: number;
  isPercentage: boolean;
  minTier: LoyaltyTier;
  imageUrl?: string;
  serviceId?: string;
  productId?: string;
  stock?: number;
  maxRedemptions?: number;
  validFrom: string;
  validUntil: string;
  terms?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// User reward (redeemed)
export interface IUserReward {
  id: string;
  userId: string;
  rewardId: string;
  reward?: ILoyaltyReward;
  status: RewardStatus;
  code: string;
  pointsSpent: number;
  redeemedAt?: string;
  usedAt?: string;
  expiresAt: string;
  orderId?: string;
  appointmentId?: string;
  createdAt: string;
}

// Referral
export interface IReferral {
  id: string;
  referrerId: string;
  refereeId?: string;
  referralCode: string;
  status: ReferralStatus;
  referrerReward: number;
  refereeReward: number;
  refereeEmail?: string;
  completedAt?: string;
  expiresAt: string;
  createdAt: string;
}

// Referral stats
export interface IReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalPointsEarned: number;
  totalSavings: number;
}

// Tier config
export interface ITierConfig {
  thresholds: Record<LoyaltyTier, number>;
  multiplier: number;
  discount: number;
}

// API Response types
export interface ILoyaltyAccountResponse {
  account: ILoyaltyAccount;
  benefits: string[];
  tierConfig: ITierConfig;
}

export interface IEnrollResponse {
  message: string;
  account: ILoyaltyAccount;
  signupBonus: number;
}

export interface ITransactionsResponse {
  transactions: ILoyaltyTransaction[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IRewardsResponse {
  rewards: ILoyaltyReward[];
  currentPoints: number;
  tier: LoyaltyTier;
}

export interface IRedeemRewardResponse {
  message: string;
  userReward: IUserReward;
  currentPoints: number;
}

export interface IMyRewardsResponse {
  rewards: IUserReward[];
  total: number;
}

export interface IReferralCodeResponse {
  code: string;
  stats: IReferralStats;
  config: IReferralConfig;
}

export interface IApplyReferralResponse {
  message: string;
  pointsEarned: number;
}

export interface IReferralsResponse {
  referrals: IReferral[];
  stats: IReferralStats;
}

// Config
export interface IReferralConfig {
  referrerRewardPoints: number;
  refereeRewardPoints: number;
  referralExpiryDays: number;
  maxReferralsPerUser?: number;
  requireFirstBooking: boolean;
}

export interface ILoyaltyProgramConfig {
  pointsPerDollar: number;
  pointsForSignup: number;
  pointsForReferral: number;
  pointsForReview: number;
  pointsExpiryMonths: number;
}

// Request types
export interface IGetTransactionsRequest {
  page?: number;
  limit?: number;
  type?: LoyaltyTransactionType;
}

export interface IGetMyRewardsRequest {
  status?: RewardStatus;
}

export interface IUseRewardRequest {
  appointmentId?: string;
  orderId?: string;
}

export interface IApplyReferralRequest {
  code: string;
}

// Earn points request (admin/system)
export interface IEarnPointsRequest {
  userId: string;
  points: number;
  source: LoyaltyEarnSource;
  description?: string;
  referenceId?: string;
}

export interface IEarnPointsResponse {
  transaction: ILoyaltyTransaction;
  basePoints: number;
  multiplier: number;
  earnedPoints: number;
  currentPoints: number;
  tier: LoyaltyTier;
}
