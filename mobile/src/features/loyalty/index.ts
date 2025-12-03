/**
 * Loyalty feature exports
 */

// Hooks
export {
  useLoyaltyAccount,
  useEnrollLoyalty,
  useLoyaltyTransactions,
  useRewards,
  useReward,
  useRedeemReward,
  useMyRewards,
  useUseReward,
  useReferralCode,
  useShareReferral,
  useApplyReferral,
  useReferrals,
  useLoyaltyDashboard,
  useRewardsPage,
  useTransactionsHistory,
  LOYALTY_QUERY_KEYS,
} from './hooks/useLoyalty';

// Services
export { loyaltyService } from './services/loyaltyService';

// Types
export * from './types';
