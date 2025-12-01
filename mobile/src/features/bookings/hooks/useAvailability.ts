/**
 * useAvailability Hook
 * Manages barber availability checking and time slot selection
 */

import { useQuery } from '@tanstack/react-query';
import { bookingService } from '../services/bookingService';
import type { BarberAvailability } from '../types';

interface UseAvailabilityOptions {
  barberId: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  enabled?: boolean;
}

export const useAvailability = (options: UseAvailabilityOptions) => {
  const { barberId, startDate, endDate, duration, enabled = true } = options;

  const query = useQuery({
    queryKey: ['availability', barberId, startDate.toISOString(), endDate.toISOString(), duration],
    queryFn: () => bookingService.getBarberAvailability(barberId, startDate, endDate, duration),
    enabled: enabled && !!barberId && !!startDate && !!endDate && duration > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes - availability changes frequently
  });

  return {
    availability: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

interface UseSlotAvailabilityOptions {
  barberId: string;
  scheduledFor: Date;
  duration: number;
  enabled?: boolean;
}

export const useSlotAvailability = (options: UseSlotAvailabilityOptions) => {
  const { barberId, scheduledFor, duration, enabled = true } = options;

  const query = useQuery({
    queryKey: ['slot-availability', barberId, scheduledFor.toISOString(), duration],
    queryFn: () => bookingService.checkSlotAvailability(barberId, scheduledFor, duration),
    enabled: enabled && !!barberId && !!scheduledFor && duration > 0,
    staleTime: 1000 * 60, // 1 minute
  });

  return {
    isAvailable: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to get availability for the next 7 days
 */
export const useWeekAvailability = (barberId: string, duration: number) => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 7);

  return useAvailability({
    barberId,
    startDate,
    endDate,
    duration,
  });
};

/**
 * Hook to get availability for the next 30 days
 */
export const useMonthAvailability = (barberId: string, duration: number) => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  return useAvailability({
    barberId,
    startDate,
    endDate,
    duration,
  });
};
