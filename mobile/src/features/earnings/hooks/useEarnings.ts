/**
 * useEarnings hook
 * React Query hooks for Stripe Connect barber earnings and payouts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { Linking } from 'react-native';

import { earningsService } from '../services/earningsService';
import { mockEarningsService } from '../services/mockEarningsService';
import {
  ConnectStatus,
  EarningsPeriod,
  IConnectAccount,
  ICreateOnboardingLinkRequest,
  IEarningsHistoryResponse,
  IEarningsSummary,
  IPayoutsResponse,
} from '../types';

// Use mock service in development
const service = __DEV__ ? mockEarningsService : earningsService;

// Query keys
export const EARNINGS_QUERY_KEYS = {
  all: ['earnings'] as const,
  summary: (barberId: string, period: EarningsPeriod) =>
    [...EARNINGS_QUERY_KEYS.all, 'summary', barberId, period] as const,
  history: (barberId: string, page: number) =>
    [...EARNINGS_QUERY_KEYS.all, 'history', barberId, page] as const,
  payouts: (barberId: string) => [...EARNINGS_QUERY_KEYS.all, 'payouts', barberId] as const,
  connectStatus: (barberId: string) => [...EARNINGS_QUERY_KEYS.all, 'connect', barberId] as const,
};

/**
 * Hook to get earnings summary for a barber
 */
export function useEarnings(barberId: string, period: EarningsPeriod = 'week') {
  return useQuery({
    queryKey: EARNINGS_QUERY_KEYS.summary(barberId, period),
    queryFn: () => service.getEarnings(barberId, { period }),
    enabled: !!barberId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to get earnings history with pagination
 */
export function useEarningsHistory(barberId: string, page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: EARNINGS_QUERY_KEYS.history(barberId, page),
    queryFn: () => service.getEarningsHistory(barberId, { page, limit }),
    enabled: !!barberId,
    staleTime: 1000 * 60 * 5,
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  });
}

/**
 * Hook to get payout history
 */
export function usePayouts(barberId: string, limit: number = 25) {
  return useQuery({
    queryKey: EARNINGS_QUERY_KEYS.payouts(barberId),
    queryFn: () => service.getPayouts(barberId, { limit }),
    enabled: !!barberId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to get Connect account status
 */
export function useConnectStatus(barberId: string) {
  return useQuery({
    queryKey: EARNINGS_QUERY_KEYS.connectStatus(barberId),
    queryFn: () => service.getConnectStatus(barberId),
    enabled: !!barberId,
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to create Connect account
 */
export function useCreateConnectAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (barberId: string) => service.createConnectAccount(barberId),
    onSuccess: (data, barberId) => {
      // Update connect status in cache
      queryClient.setQueryData(EARNINGS_QUERY_KEYS.connectStatus(barberId), {
        accountId: data.accountId,
        status: data.status,
        hasAccount: true,
        detailsSubmitted: data.detailsSubmitted,
        chargesEnabled: data.chargesEnabled,
        payoutsEnabled: data.payoutsEnabled,
      });
    },
  });
}

/**
 * Hook to get onboarding link and open it
 */
export function useOnboarding(barberId: string) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const startOnboarding = useCallback(
    async (params?: ICreateOnboardingLinkRequest) => {
      setIsLoading(true);
      setError(null);

      try {
        const link = await service.getOnboardingLink(barberId, params);

        // Open the onboarding URL in browser
        const canOpen = await Linking.canOpenURL(link.url);
        if (canOpen) {
          await Linking.openURL(link.url);
        } else {
          throw new Error('Cannot open onboarding URL');
        }

        return link;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to start onboarding'));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [barberId]
  );

  const refreshStatus = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: EARNINGS_QUERY_KEYS.connectStatus(barberId) });
  }, [barberId, queryClient]);

  return {
    startOnboarding,
    refreshStatus,
    isLoading,
    error,
  };
}

/**
 * Hook to open Stripe Express Dashboard
 */
export function useDashboardLink(barberId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const openDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const link = await service.getDashboardLink(barberId);

      // Open the dashboard URL in browser
      const canOpen = await Linking.canOpenURL(link.url);
      if (canOpen) {
        await Linking.openURL(link.url);
      } else {
        throw new Error('Cannot open dashboard URL');
      }

      return link;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to open dashboard'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [barberId]);

  return {
    openDashboard,
    isLoading,
    error,
  };
}

/**
 * Combined hook for earnings dashboard functionality
 */
export function useEarningsDashboard(barberId: string) {
  const [selectedPeriod, setSelectedPeriod] = useState<EarningsPeriod>('week');

  const earningsQuery = useEarnings(barberId, selectedPeriod);
  const connectStatusQuery = useConnectStatus(barberId);
  const createAccountMutation = useCreateConnectAccount();
  const {
    startOnboarding,
    refreshStatus: refreshConnectStatus,
    isLoading: onboardingLoading,
  } = useOnboarding(barberId);
  const { openDashboard, isLoading: dashboardLoading } = useDashboardLink(barberId);

  const isConnected =
    connectStatusQuery.data?.status === ConnectStatus.VERIFIED &&
    connectStatusQuery.data?.payoutsEnabled;

  const needsOnboarding =
    !connectStatusQuery.data?.hasAccount || connectStatusQuery.data?.status === ConnectStatus.NONE;

  const hasRestrictions =
    connectStatusQuery.data?.status === ConnectStatus.PENDING ||
    connectStatusQuery.data?.status === ConnectStatus.RESTRICTED;

  const setupConnect = useCallback(async () => {
    if (needsOnboarding) {
      // Create account first
      const result = await createAccountMutation.mutateAsync(barberId);
      if (result.accountId) {
        // Then start onboarding
        await startOnboarding();
      }
    } else if (hasRestrictions) {
      // Account exists but needs more info
      await startOnboarding();
    }
  }, [barberId, needsOnboarding, hasRestrictions, createAccountMutation, startOnboarding]);

  return {
    // Earnings data
    earnings: earningsQuery.data,
    isLoadingEarnings: earningsQuery.isLoading,
    earningsError: earningsQuery.error,
    refetchEarnings: earningsQuery.refetch,

    // Period selection
    selectedPeriod,
    setSelectedPeriod,

    // Connect status
    connectStatus: connectStatusQuery.data,
    isLoadingConnect: connectStatusQuery.isLoading,
    isConnected,
    needsOnboarding,
    hasRestrictions,

    // Actions
    setupConnect,
    openDashboard,
    refreshConnectStatus,

    // Loading states
    isSettingUp: createAccountMutation.isPending || onboardingLoading,
    isOpeningDashboard: dashboardLoading,
  };
}
