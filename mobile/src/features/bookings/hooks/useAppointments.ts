/**
 * useAppointments Hook
 * Fetches and manages user appointments via Convex queries.
 *
 * Convex queries are reactive — they automatically re-run when
 * underlying data changes, so there is no need for manual refetch
 * or stale-time configuration.
 */

import { useMemo, useState, useEffect } from 'react';

import { useQuery } from 'convex/react';

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import type { AppointmentStatus } from '../types';
import { mockBookingService } from '../services/mockBookingService';

const isDevMode = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

export { BOOKING_QUERY_KEYS } from './useBooking';

interface IUseAppointmentsOptions {
  status?: AppointmentStatus;
  enabled?: boolean;
}

export const useAppointments = (options?: IUseAppointmentsOptions) => {
  const { status, enabled = true } = options || {};

  const appointmentsData = useQuery(
    api.appointments.queries.getMyAppointments,
    isDevMode || !enabled ? 'skip' : { status }
  );

  const [mockAppointments, setMockAppointments] = useState<any[]>([]);
  const [isLoadingMock, setIsLoadingMock] = useState(isDevMode);

  useEffect(() => {
    if (isDevMode && enabled) {
      mockBookingService.getMyAppointments(status ? { status } : undefined).then((data) => {
        setMockAppointments(data);
        setIsLoadingMock(false);
      });
    }
  }, [isDevMode, enabled, status]);

  const appointments = useMemo(() => {
    if (isDevMode) return mockAppointments;
    // getMyAppointments now returns { appointments, hasMore } for pagination
    return appointmentsData?.appointments ?? [];
  }, [appointmentsData, mockAppointments]);

  return {
    appointments,
    hasMore: appointmentsData?.hasMore ?? false,
    isLoading: isDevMode ? isLoadingMock : appointmentsData === undefined,
    isError: false,
    error: null,
  };
};

interface IUseAppointmentOptions {
  enabled?: boolean;
}

export const useAppointment = (
  id: Id<'appointments'> | undefined,
  options?: IUseAppointmentOptions
) => {
  const { enabled = true } = options || {};

  const appointmentData = useQuery(
    api.appointments.queries.getAppointmentById,
    isDevMode || !enabled || !id ? 'skip' : { appointmentId: id }
  );

  const [mockAppointment, setMockAppointment] = useState<any | null>(null);
  const [isLoadingMock, setIsLoadingMock] = useState(isDevMode);

  useEffect(() => {
    if (isDevMode && enabled && id) {
      const appointmentId = typeof id === 'string' ? id : id.toString();
      mockBookingService
        .getAppointmentById(appointmentId)
        .then((data) => {
          setMockAppointment(data);
          setIsLoadingMock(false);
        })
        .catch(() => {
          setMockAppointment(null);
          setIsLoadingMock(false);
        });
    }
  }, [isDevMode, enabled, id]);

  const appointment = useMemo(() => {
    if (isDevMode) return mockAppointment;
    return appointmentData ?? null;
  }, [appointmentData, mockAppointment, isDevMode]);

  return {
    appointment,
    isLoading: isDevMode ? isLoadingMock : appointmentData === undefined,
    isError: false,
    error: null,
  };
};

/**
 * Hook that fetches all appointments and separates them into
 * upcoming (pending/confirmed/in_progress) and past (completed/cancelled/no_show).
 */
export const useSortedAppointments = () => {
  const { appointments, isLoading, isError, error } = useAppointments();

  const { upcoming, past } = useMemo(() => {
    const upcomingStatuses: AppointmentStatus[] = ['pending', 'confirmed', 'in_progress'];
    const pastStatuses: AppointmentStatus[] = ['completed', 'cancelled', 'no_show'];

    const upcomingList = appointments.filter((a) =>
      upcomingStatuses.includes(a.status as AppointmentStatus)
    );
    const pastList = appointments.filter((a) =>
      pastStatuses.includes(a.status as AppointmentStatus)
    );

    // Upcoming: soonest first (ascending scheduledFor)
    upcomingList.sort((a, b) => a.scheduledFor - b.scheduledFor);
    // Past: most recent first (descending scheduledFor)
    pastList.sort((a, b) => b.scheduledFor - a.scheduledFor);

    return { upcoming: upcomingList, past: pastList };
  }, [appointments]);

  return { upcoming, past, appointments, isLoading, isError, error };
};

/**
 * Hook to get upcoming appointments (confirmed status)
 */
export const useUpcomingAppointments = () => {
  return useAppointments({ status: 'confirmed' });
};

/**
 * Hook to get past appointments (completed status)
 */
export const usePastAppointments = () => {
  return useAppointments({ status: 'completed' });
};

/**
 * Hook to get pending appointments
 */
export const usePendingAppointments = () => {
  return useAppointments({ status: 'pending' });
};
