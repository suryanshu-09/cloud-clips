/**
 * useBarberDashboard
 *
 * Provides real-time dashboard stats for the barber by wiring directly to
 * the Convex getDashboardStats query and toggleAvailability mutation.
 *
 * The query is reactive: Convex re-runs it automatically whenever the
 * underlying appointments, receipts, or barberProfile data changes.
 */

import { useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';

export function useBarberDashboard() {
  const stats = useQuery(api.barbers.dashboard.getDashboardStats, {});

  const toggleAvailabilityMutation = useMutation(
    api.barbers.dashboard.toggleAvailability
  );

  const toggleAvailability = useCallback(
    async (isAvailable: boolean) => {
      await toggleAvailabilityMutation({ isAvailable });
    },
    [toggleAvailabilityMutation]
  );

  const isLoading = stats === undefined;

  return {
    // Stats
    todayAppointments: stats?.todayAppointments ?? [],
    todayCount: stats?.todayCount ?? 0,
    upcomingCount: stats?.upcomingCount ?? 0,
    pendingCount: stats?.pendingCount ?? 0,
    completedThisWeek: stats?.completedThisWeek ?? 0,
    weeklyEarningsData: stats?.weeklyEarningsData ?? [],
    weeklyEarningsTotal: stats?.weeklyEarningsTotal ?? 0,
    averageRating: stats?.averageRating ?? 0,
    totalReviews: stats?.totalReviews ?? 0,
    isAvailable: stats?.isAvailable ?? false,

    // Actions
    toggleAvailability,

    // Loading state (undefined = query still loading)
    isLoading,
  };
}
