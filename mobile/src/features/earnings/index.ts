/**
 * Earnings feature exports
 * Stripe Connect barber payouts and earnings tracking
 */

// Hooks
export {
  useConnectAccount,
  useEarnings,
  useEarningsHistory,
  usePayouts,
  useEarningsDashboard,
  EARNINGS_QUERY_KEYS,
} from './hooks/useEarnings';

// Services
export {
  transformConnectAccountResponse,
  transformCreateAccountResponse,
  transformDashboardLinkResponse,
  // Mock generators kept for testing/fallback
  generateMockEarningsSummary,
  generateMockEarningsHistory,
  generateMockPayoutsResponse,
} from './services/earningsService';

// Types
export * from './types';
