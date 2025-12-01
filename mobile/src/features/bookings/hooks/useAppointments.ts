/**
 * useAppointments Hook
 * Fetches and manages user appointments
 */

import { useQuery } from '@tanstack/react-query';
import { bookingService } from '../services/bookingService';
import type { AppointmentWithDetails, BookingFilters } from '../types';
import { BOOKING_QUERY_KEYS } from './useBooking';

interface UseAppointmentsOptions {
  filters?: BookingFilters;
  enabled?: boolean;
  refetchInterval?: number;
}

export const useAppointments = (options?: UseAppointmentsOptions) => {
  const { filters, enabled = true, refetchInterval } = options || {};

  const query = useQuery({
    queryKey: [...BOOKING_QUERY_KEYS.myAppointments, filters],
    queryFn: () => bookingService.getMyAppointments(filters),
    enabled,
    refetchInterval,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    appointments: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
};

interface UseAppointmentOptions {
  enabled?: boolean;
}

export const useAppointment = (id: string, options?: UseAppointmentOptions) => {
  const { enabled = true } = options || {};

  const query = useQuery({
    queryKey: BOOKING_QUERY_KEYS.appointment(id),
    queryFn: () => bookingService.getAppointmentById(id),
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    appointment: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

interface UseBarberAppointmentsOptions {
  barberId: string;
  filters?: BookingFilters;
  enabled?: boolean;
  refetchInterval?: number;
}

export const useBarberAppointments = (options: UseBarberAppointmentsOptions) => {
  const { barberId, filters, enabled = true, refetchInterval } = options;

  const query = useQuery({
    queryKey: [...BOOKING_QUERY_KEYS.barberAppointments(barberId), filters],
    queryFn: () => bookingService.getBarberAppointments(barberId, filters),
    enabled: enabled && !!barberId,
    refetchInterval,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    appointments: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
};

/**
 * Hook to get upcoming appointments
 */
export const useUpcomingAppointments = () => {
  return useAppointments({
    filters: {
      status: 'confirmed',
      startDate: new Date(),
    },
  });
};

/**
 * Hook to get past appointments
 */
export const usePastAppointments = () => {
  return useAppointments({
    filters: {
      endDate: new Date(),
    },
  });
};

/**
 * Hook to get pending appointments
 */
export const usePendingAppointments = () => {
  return useAppointments({
    filters: {
      status: 'pending',
    },
  });
};
