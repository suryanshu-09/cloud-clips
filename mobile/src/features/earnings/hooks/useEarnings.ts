/**
 * useEarnings hook - Convex integration
 * React hooks for Stripe Connect barber earnings using Convex queries and actions
 */

import { useState, useCallback } from 'react';
import { Linking } from 'react-native';
import { useAction, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

import {
  ConnectStatus,
  EarningsPeriod,
  IConnectAccount,
  IDashboardLink,
  IEarningItem,
  IEarningsHistoryResponse,
  IEarningsSummary,
  IPayout,
  IPayoutsResponse,
  PayoutStatus,
} from '../types';
import {
  transformConnectAccountResponse,
  transformCreateAccountResponse,
  transformDashboardLinkResponse,
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
 * Hook to get earnings summary using real Convex query
 */
export function useEarnings(period: EarningsPeriod = 'week') {
  // Real-time Convex query for earnings summary
  const earningsSummaryRaw = useQuery(api.earnings.getBarberEarningsSummary, { period });

  const isLoading = earningsSummaryRaw === undefined;

  // Combine the data into IEarningsSummary shape
  const earnings: IEarningsSummary | null =
    earningsSummaryRaw != null
      ? {
          period: earningsSummaryRaw.period as EarningsPeriod,
          totalEarnings: earningsSummaryRaw.totalEarnings,
          serviceEarnings: earningsSummaryRaw.serviceEarnings,
          productEarnings: earningsSummaryRaw.productEarnings,
          tips: earningsSummaryRaw.tips,
          platformFee: earningsSummaryRaw.platformFee,
          platformFeeRate: earningsSummaryRaw.platformFeeRate,
          netEarnings: earningsSummaryRaw.netEarnings,
          serviceCount: earningsSummaryRaw.serviceCount,
          avgPerService: earningsSummaryRaw.avgPerService,
          // Balance comes from Stripe Connect account (fetched separately in dashboard hook)
          availableBalance: 0,
          pendingBalance: 0,
          currency: earningsSummaryRaw.currency,
          payoutsEnabled: false,
          connectStatus: ConnectStatus.NONE,
        }
      : null;

  return {
    earnings,
    isLoading,
    error: null,
    // Kept for backward compat; no-op since data is reactive via Convex
    fetchEarnings: async (_connectStatus?: ConnectStatus) => {
      return earnings;
    },
  };
}

/**
 * Hook to get earnings history using real Convex query
 */
export function useEarningsHistory(page: number = 1, limit: number = 20) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allEarnings, setAllEarnings] = useState<IEarningItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isFetched, setIsFetched] = useState(false);

  // We use the Convex query reactively for the first page, then pagination manually
  const firstPageData = useQuery(api.earnings.getBarberEarningsHistory, {
    limit,
    cursor: undefined,
  });

  const fetchHistory = useCallback(async () => {
    if (firstPageData === undefined) return null;

    setIsLoading(true);
    setError(null);

    try {
      // Transform the data to IEarningItem format
      const items: IEarningItem[] = firstPageData.earnings.map((e) => ({
        id: e.id,
        type: e.type,
        amount: e.amount,
        fee: e.fee,
        net: e.net,
        description: e.description,
        customerName: e.customerName,
        status: e.status,
        date: e.date,
      }));

      setAllEarnings(items);
      setTotalCount(firstPageData.total);
      setHasMore(firstPageData.hasMore);
      if (firstPageData.nextCursor) {
        setCursor(firstPageData.nextCursor);
      }
      setIsFetched(true);

      const result: IEarningsHistoryResponse = {
        earnings: items,
        total: firstPageData.total,
        page: 1,
        limit,
        totalPages: Math.ceil(firstPageData.total / limit),
      };

      return result;
    } catch (err) {
      const fetchError =
        err instanceof Error ? err : new Error('Failed to fetch earnings history');
      setError(fetchError);
      throw fetchError;
    } finally {
      setIsLoading(false);
    }
  }, [firstPageData, limit]);

  const history: IEarningsHistoryResponse | null = isFetched
    ? {
        earnings: allEarnings,
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      }
    : firstPageData !== undefined
      ? {
          earnings: firstPageData.earnings.map((e) => ({
            id: e.id,
            type: e.type,
            amount: e.amount,
            fee: e.fee,
            net: e.net,
            description: e.description,
            customerName: e.customerName,
            status: e.status,
            date: e.date,
          })),
          total: firstPageData.total,
          page: 1,
          limit,
          totalPages: Math.ceil(firstPageData.total / limit),
        }
      : null;

  return {
    history,
    isLoading: isLoading || firstPageData === undefined,
    error,
    fetchHistory,
    hasMore,
    cursor,
  };
}

/**
 * Hook to get payouts using real Stripe payouts via Convex action
 */
export function usePayouts(limit: number = 25) {
  const [payoutsData, setPayoutsData] = useState<IPayoutsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);

  const getBarberPayoutsAction = useAction(api.payments.actions.getBarberPayouts);

  const fetchPayouts = useCallback(
    async (startingAfter?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getBarberPayoutsAction({
          limit,
          startingAfter,
        });

        const payouts: IPayout[] = result.payouts.map((p) => ({
          id: p.id,
          amount: p.amount,
          currency: p.currency,
          status: p.status as PayoutStatus,
          arrivalDate: p.arrivalDate,
          createdAt: p.createdAt,
          failureCode: p.failureCode,
          failureMessage: p.failureMessage,
        }));

        const response: IPayoutsResponse = {
          payouts,
          total: payouts.length,
        };

        setPayoutsData((prev) => {
          if (startingAfter && prev) {
            // Append for pagination
            return {
              payouts: [...prev.payouts, ...payouts],
              total: prev.total + payouts.length,
            };
          }
          return response;
        });

        setHasMore(result.hasMore);
        if (result.nextCursor) {
          setNextCursor(result.nextCursor);
        }

        return response;
      } catch (err) {
        const fetchError = err instanceof Error ? err : new Error('Failed to fetch payouts');
        setError(fetchError);
        throw fetchError;
      } finally {
        setIsLoading(false);
      }
    },
    [getBarberPayoutsAction, limit]
  );

  return {
    payouts: payoutsData,
    isLoading,
    error,
    fetchPayouts,
    hasMore,
    nextCursor,
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

  // Earnings hooks - uses reactive Convex query
  const {
    earnings: rawEarnings,
    isLoading: isEarningsLoading,
    error: earningsError,
    fetchEarnings,
  } = useEarnings(selectedPeriod);

  // Merge balance info from accountData into earnings if available
  const earnings =
    rawEarnings && accountData
      ? {
          ...rawEarnings,
          availableBalance: (accountData as any).availableBalance ?? 0,
          pendingBalance: (accountData as any).pendingBalance ?? 0,
          payoutsEnabled: accountData.payoutsEnabled,
          connectStatus: accountData.status,
        }
      : rawEarnings;

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
    try {
      const status = await getAccountStatus();
      await fetchEarnings(status.status);
    } catch {
      // Silent - reactive data will update automatically
    }
  }, [getAccountStatus, fetchEarnings]);

  // Initial load - get Connect account status
  const loadData = useCallback(async () => {
    try {
      await getAccountStatus();
    } catch {
      // If no account exists, that's fine - the reactive query handles earnings
    }
  }, [getAccountStatus]);

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
