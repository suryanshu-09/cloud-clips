/**
 * useBooking Hook
 * Manages appointment booking creation and updates
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../services/bookingService';
import type { CreateAppointmentDTO, UpdateAppointmentDTO, Appointment } from '../types';

export const BOOKING_QUERY_KEYS = {
  appointments: ['appointments'] as const,
  appointment: (id: string) => ['appointments', id] as const,
  myAppointments: ['appointments', 'me'] as const,
  barberAppointments: (barberId: string) => ['appointments', 'barber', barberId] as const,
};

interface UseBookingOptions {
  onSuccess?: (appointment: Appointment) => void;
  onError?: (error: Error) => void;
}

export const useBooking = (options?: UseBookingOptions) => {
  const queryClient = useQueryClient();

  // Create appointment mutation
  const createAppointment = useMutation({
    mutationFn: (data: CreateAppointmentDTO) => bookingService.createAppointment(data),
    onSuccess: (data) => {
      // Invalidate appointments queries to refetch
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.appointments });
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.myAppointments });
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      console.error('Failed to create appointment:', error);
      options?.onError?.(error);
    },
  });

  // Update appointment mutation
  const updateAppointment = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppointmentDTO }) =>
      bookingService.updateAppointment(id, data),
    onSuccess: (data, variables) => {
      // Update the specific appointment in the cache
      queryClient.setQueryData(BOOKING_QUERY_KEYS.appointment(variables.id), data);
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.appointments });
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      console.error('Failed to update appointment:', error);
      options?.onError?.(error);
    },
  });

  // Cancel appointment mutation
  const cancelAppointment = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      bookingService.cancelAppointment(id, reason),
    onSuccess: (data, variables) => {
      // Update cache
      queryClient.setQueryData(BOOKING_QUERY_KEYS.appointment(variables.id), data);
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.appointments });
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      console.error('Failed to cancel appointment:', error);
      options?.onError?.(error);
    },
  });

  // Confirm appointment mutation (barber only)
  const confirmAppointment = useMutation({
    mutationFn: (id: string) => bookingService.confirmAppointment(id),
    onSuccess: (data, id) => {
      queryClient.setQueryData(BOOKING_QUERY_KEYS.appointment(id), data);
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.appointments });
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      console.error('Failed to confirm appointment:', error);
      options?.onError?.(error);
    },
  });

  // Complete appointment mutation (barber only)
  const completeAppointment = useMutation({
    mutationFn: (id: string) => bookingService.completeAppointment(id),
    onSuccess: (data, id) => {
      queryClient.setQueryData(BOOKING_QUERY_KEYS.appointment(id), data);
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.appointments });
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      console.error('Failed to complete appointment:', error);
      options?.onError?.(error);
    },
  });

  return {
    // Mutations
    createAppointment,
    updateAppointment,
    cancelAppointment,
    confirmAppointment,
    completeAppointment,

    // Loading states
    isCreating: createAppointment.isPending,
    isUpdating: updateAppointment.isPending,
    isCanceling: cancelAppointment.isPending,
    isConfirming: confirmAppointment.isPending,
    isCompleting: completeAppointment.isPending,

    // Error states
    createError: createAppointment.error,
    updateError: updateAppointment.error,
    cancelError: cancelAppointment.error,
    confirmError: confirmAppointment.error,
    completeError: completeAppointment.error,
  };
};
