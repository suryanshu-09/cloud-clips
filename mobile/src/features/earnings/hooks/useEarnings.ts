/**
 * useEarnings hook - Convex integration
 * React hooks for Stripe Connect barber earnings using Convex actions
 */

import { useState, useCallback } from 'react';
import { Linking } from 'react-native';
import { useAction } from 'convex/react';
import { api } from '@convex/_generated/api';

import {
  ConnectStatus,
  EarningsPeriod,
  IConnectAccount,
  IDashboardLink,
  IEarningsHistoryResponse,
  IEarningsSummary,
} from '../types';
import {
  transformConnectAccountResponse,
  transformCreateAccountResponse,
  transformDashboardLinkResponse,
  generateMockEarningsSummary,
  generateMockEarningsHistory,
  generateMockPayoutsResponse,
} from '../services/earningsService';

// Query keys for React Query (used for caching earnings data)
export const EARNINGS_QUERY_KEYS = {
  all: ['earnings'] as const,
  summary: (period: EarningsPeriod) => [...EARNINGS_QUERY_KEYS.all, 'summary', period] as const,
  history: (page: number) => [...EARNINGS_QUERY_KEYS.all, 'history', page] as const,
  payouts: () => [...EARNINGS_QUERY_KEYS.all, 'payouts'] as const,
  connectStatus: () => [...EARNINGS_QUERY_KEYS.all, 'connect'] as const,
};

/**
 * Hook to manage Stripe Connect account using Convex actions
 */
export function useConnectAccount() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [accountData, setAccountData] = useState<IConnectAccount | null>(null);

  // Convex actions
  const createConnectAccountAction = useAction(api.payments.actions.createConnectAccount);
  const getConnectAccountDetailsAction = useAction(api.payments.actions.getConnectAccountDetails);
  const getConnectLoginLinkAction = useAction(api.payments.actions.getConnectLoginLink);

  /**
   * Create a new Stripe Connect account or get existing account onboarding link
   */
  const createAccount = useCallback(
    async (country?: string, businessType?: 'individual' | 'company') => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await createConnectAccountAction({ country, businessType });
        const transformed = transformCreateAccountResponse(result);

        // If there's an onboarding URL, open it
        if (result.onboardingUrl) {
          const canOpen = await Linking.canOpenURL(result.onboardingUrl);
          if (canOpen) {
            await Linking.openURL(result.onboardingUrl);
          } else {
            throw new Error('Cannot open onboarding URL');
          }
        }

        setAccountData(
          transformConnectAccountResponse({
            accountId: result.accountId,
            detailsSubmitted: false,
            chargesEnabled: false,
            payoutsEnabled: false,
          })
        );

        return transformed;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to create Connect account');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [createConnectAccountAction]
  );

  /**
   * Get Connect account status
   */
  const getAccountStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getConnectAccountDetailsAction({});
      const transformed = transformConnectAccountResponse({
        accountId: result.accountId,
        detailsSubmitted: result.detailsSubmitted,
        chargesEnabled: result.chargesEnabled,
        payoutsEnabled: result.payoutsEnabled,
        requirements: result.requirements,
      });

      setAccountData(transformed);
      return transformed;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get Connect account status');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [getConnectAccountDetailsAction]);

  /**
   * Get Stripe Express dashboard link and open it
   */
  const openDashboard = useCallback(async (): Promise<IDashboardLink> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getConnectLoginLinkAction({});
      const link = transformDashboardLinkResponse(result);

      const canOpen = await Linking.canOpenURL(link.url);
      if (canOpen) {
        await Linking.openURL(link.url);
      } else {
        throw new Error('Cannot open dashboard URL');
      }

      return link;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to open dashboard');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [getConnectLoginLinkAction]);

  return {
    createAccount,
    getAccountStatus,
    openDashboard,
    accountData,
    isLoading,
    error,
  };
}

/**
 * Hook to get earnings data (using mock data for now, will integrate with real earnings queries)
 */
export function useEarnings(period: EarningsPeriod = 'week') {
  const [earnings, setEarnings] = useState<IEarningsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEarnings = useCallback(
    async (connectStatus: ConnectStatus = ConnectStatus.NONE) => {
      setIsLoading(true);
      setError(null);

      try {
        // For now, use mock data. In production, this would be a Convex query
        await new Promise((resolve) => setTimeout(resolve, 500));
        const data = generateMockEarningsSummary(period, connectStatus);
        setEarnings(data);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch earnings');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [period]
  );

  return {
    earnings,
    isLoading,
    error,
    fetchEarnings,
  };
}

/**
 * Hook to get earnings history
 */
export function useEarningsHistory(page: number = 1, limit: number = 20) {
  const [history, setHistory] = useState<IEarningsHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // For now, use mock data
      await new Promise((resolve) => setTimeout(resolve, 500));
      const data = generateMockEarningsHistory(page, limit);
      setHistory(data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch earnings history');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

  return {
    history,
    isLoading,
    error,
    fetchHistory,
  };
}

/**
 * Hook to get payouts
 */
export function usePayouts(limit: number = 25) {
  const [payouts, setPayouts] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPayouts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // For now, use mock data
      await new Promise((resolve) => setTimeout(resolve, 500));
      const data = generateMockPayoutsResponse(limit);
      setPayouts(data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch payouts');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  return {
    payouts,
    isLoading,
    error,
    fetchPayouts,
  };
}

/**
 * Combined hook for earnings dashboard functionality
 * Integrates Connect account management with earnings data
 */
export function useEarningsDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<EarningsPeriod>('week');
  const [refreshKey, setRefreshKey] = useState(0);

  // Connect account hooks
  const {
    createAccount,
    getAccountStatus,
    openDashboard,
    accountData,
    isLoading: isConnectLoading,
    error: connectError,
  } = useConnectAccount();

  // Earnings hooks
  const {
    earnings,
    isLoading: isEarningsLoading,
    error: earningsError,
    fetchEarnings,
  } = useEarnings(selectedPeriod);

  // Derived state
  const isConnected = accountData?.status === ConnectStatus.VERIFIED && accountData?.payoutsEnabled;

  const needsOnboarding = !accountData?.hasAccount || accountData?.status === ConnectStatus.NONE;

  const hasRestrictions =
    accountData?.status === ConnectStatus.PENDING ||
    accountData?.status === ConnectStatus.RESTRICTED;

  /**
   * Setup Connect - creates account if needed and opens onboarding
   */
  const setupConnect = useCallback(async () => {
    if (needsOnboarding) {
      await createAccount();
    } else if (hasRestrictions) {
      // Re-open onboarding for accounts that need more info
      await createAccount();
    }
  }, [needsOnboarding, hasRestrictions, createAccount]);

  /**
   * Refresh all data
   */
  const refreshData = useCallback(async () => {
    setRefreshKey((prev) => prev + 1);
    const status = await getAccountStatus();
    await fetchEarnings(status.status);
  }, [getAccountStatus, fetchEarnings]);

  // Initial load
  const loadData = useCallback(async () => {
    try {
      const status = await getAccountStatus();
      await fetchEarnings(status.status);
    } catch (error) {
      // If no account exists, just fetch earnings with NONE status
      await fetchEarnings(ConnectStatus.NONE);
    }
  }, [getAccountStatus, fetchEarnings]);

  return {
    // Earnings data
    earnings,
    isLoadingEarnings: isEarningsLoading,
    earningsError,

    // Period selection
    selectedPeriod,
    setSelectedPeriod,

    // Connect status
    connectStatus: accountData,
    isLoadingConnect: isConnectLoading,
    connectError,
    isConnected,
    needsOnboarding,
    hasRestrictions,

    // Actions
    setupConnect,
    openDashboard,
    refreshData,
    loadData,

    // Loading states
    isSettingUp: isConnectLoading,
    isOpeningDashboard: isConnectLoading,

    // Refresh key for triggering updates
    refreshKey,
  };
}

// Re-export for backward compatibility
export { ConnectStatus, EarningsPeriod } from '../types';
