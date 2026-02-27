/**
 * useBooking Hook
 * Manages appointment booking creation and status updates via Convex mutations.
 */

import { useState, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

export const BOOKING_QUERY_KEYS = {
  appointments: ['appointments'] as const,
  appointment: (id: string) => ['appointments', id] as const,
  myAppointments: ['appointments', 'me'] as const,
  barberAppointments: (barberId: string) => ['appointments', 'barber', barberId] as const,
};

interface IUseBookingOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface IBookAppointmentArgs {
  barberId: Id<'users'>;
  serviceId: string;
  serviceName: string;
  price: number;
  duration: number;
  scheduledFor: number;
  locationType: 'in_salon' | 'in_home';
  address?: string;
  addressCoords?: { lat: number; lng: number };
  specialRequests?: string;
}

export interface IRescheduleAppointmentArgs {
  appointmentId: Id<'appointments'>;
  newScheduledFor: number;
}

export interface IUpdateAppointmentStatusArgs {
  appointmentId: Id<'appointments'>;
  status: 'confirmed' | 'in_progress' | 'completed' | 'no_show';
}

export const useBooking = (options?: IUseBookingOptions) => {
  // Loading states for consumers that need them
  const [isBooking, setIsBooking] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Convex mutations — Convex automatically invalidates related queries
  const bookAppointmentMutation = useMutation(api.appointments.mutations.bookAppointment);
  const cancelAppointmentMutation = useMutation(api.appointments.mutations.cancelAppointment);
  const rescheduleAppointmentMutation = useMutation(
    api.appointments.mutations.rescheduleAppointment
  );
  const updateStatusMutation = useMutation(api.appointments.mutations.updateAppointmentStatus);

  // Wrapped helpers that handle callbacks, loading states, and error normalization

  const createAppointment = useCallback(
    async (data: IBookAppointmentArgs) => {
      setIsBooking(true);
      try {
        const result = await bookAppointmentMutation(data);
        options?.onSuccess?.();
        return result;
      } catch (error) {
        const normalized = normalizeError(error);
        console.error('Failed to create appointment:', normalized);
        options?.onError?.(normalized);
        throw normalized;
      } finally {
        setIsBooking(false);
      }
    },
    [bookAppointmentMutation, options]
  );

  const cancelAppointment = useCallback(
    async (appointmentId: Id<'appointments'>, reason?: string) => {
      setIsCanceling(true);
      try {
        const result = await cancelAppointmentMutation({ appointmentId, reason });
        options?.onSuccess?.();
        return result;
      } catch (error) {
        const normalized = normalizeError(error);
        console.error('Failed to cancel appointment:', normalized);
        options?.onError?.(normalized);
        throw normalized;
      } finally {
        setIsCanceling(false);
      }
    },
    [cancelAppointmentMutation, options]
  );

  const rescheduleAppointment = useCallback(
    async (args: IRescheduleAppointmentArgs) => {
      setIsRescheduling(true);
      try {
        const result = await rescheduleAppointmentMutation({
          appointmentId: args.appointmentId,
          newScheduledFor: args.newScheduledFor,
        });
        options?.onSuccess?.();
        return result;
      } catch (error) {
        const normalized = normalizeError(error);
        console.error('Failed to reschedule appointment:', normalized);
        options?.onError?.(normalized);
        throw normalized;
      } finally {
        setIsRescheduling(false);
      }
    },
    [rescheduleAppointmentMutation, options]
  );

  const updateStatus = useCallback(
    async (args: IUpdateAppointmentStatusArgs) => {
      setIsUpdatingStatus(true);
      try {
        const result = await updateStatusMutation(args);
        options?.onSuccess?.();
        return result;
      } catch (error) {
        const normalized = normalizeError(error);
        console.error('Failed to update appointment status:', normalized);
        options?.onError?.(normalized);
        throw normalized;
      } finally {
        setIsUpdatingStatus(false);
      }
    },
    [updateStatusMutation, options]
  );

  const confirmAppointment = useCallback(
    async (appointmentId: Id<'appointments'>) => {
      return updateStatus({ appointmentId, status: 'confirmed' });
    },
    [updateStatus]
  );

  const completeAppointment = useCallback(
    async (appointmentId: Id<'appointments'>) => {
      return updateStatus({ appointmentId, status: 'completed' });
    },
    [updateStatus]
  );

  return {
    // Mutation functions
    createAppointment,
    cancelAppointment,
    rescheduleAppointment,
    confirmAppointment,
    completeAppointment,
    updateStatus,
    // Loading states
    isBooking,
    isCanceling,
    isRescheduling,
    isUpdatingStatus,
  };
};

/** Turn Convex errors into plain Error instances */
function normalizeError(error: unknown): Error {
  if (error instanceof ConvexError) {
    return new Error(String(error.data));
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error('An unexpected error occurred');
}
