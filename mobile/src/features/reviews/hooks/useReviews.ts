import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '../services/reviewService';
import { mockReviewService } from '../services/mockReviewService';
import type { IReview, IReviewsResponse } from '../types';

// Check if dev mode is enabled
const isDevMode = process.env.EXPO_PUBLIC_DEV_MODE === 'true';
const service = isDevMode ? mockReviewService : reviewService;

// Query keys
export const reviewKeys = {
  all: ['reviews'] as const,
  barber: (barberId: string) => [...reviewKeys.all, 'barber', barberId] as const,
  barberWithFilters: (barberId: string, filters: { minRating?: number; limit?: number }) =>
    [...reviewKeys.barber(barberId), filters] as const,
  client: (clientId: string) => [...reviewKeys.all, 'client', clientId] as const,
  appointment: (appointmentId: string) =>
    [...reviewKeys.all, 'appointment', appointmentId] as const,
  stats: (barberId: string) => [...reviewKeys.all, 'stats', barberId] as const,
  canReview: (appointmentId: string) => [...reviewKeys.all, 'canReview', appointmentId] as const,
};

/**
 * Hook to fetch reviews for a barber
 */
export function useBarberReviews(
  barberId: string,
  options?: {
    minRating?: number;
    limit?: number;
    enabled?: boolean;
  }
) {
  return useQuery<IReviewsResponse>({
    queryKey: reviewKeys.barberWithFilters(barberId, {
      minRating: options?.minRating,
      limit: options?.limit,
    }),
    queryFn: () =>
      service.getBarberReviews(barberId, {
        minRating: options?.minRating,
        limit: options?.limit,
      }),
    enabled: options?.enabled !== false && !!barberId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch reviews by a client
 */
export function useClientReviews(clientId: string, enabled = true) {
  return useQuery<IReview[]>({
    queryKey: reviewKeys.client(clientId),
    queryFn: () => service.getClientReviews(clientId),
    enabled: enabled && !!clientId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch review for a specific appointment
 */
export function useAppointmentReview(appointmentId: string, enabled = true) {
  return useQuery<IReview | null>({
    queryKey: reviewKeys.appointment(appointmentId),
    queryFn: () => service.getAppointmentReview(appointmentId),
    enabled: enabled && !!appointmentId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get review statistics for a barber
 */
export function useBarberReviewStats(barberId: string, enabled = true) {
  return useQuery({
    queryKey: reviewKeys.stats(barberId),
    queryFn: () => service.getBarberReviewStats(barberId),
    enabled: enabled && !!barberId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to check if a client can review an appointment
 */
export function useCanReviewAppointment(appointmentId: string, enabled = true) {
  return useQuery<boolean>({
    queryKey: reviewKeys.canReview(appointmentId),
    queryFn: () => service.canReviewAppointment(appointmentId),
    enabled: enabled && !!appointmentId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
