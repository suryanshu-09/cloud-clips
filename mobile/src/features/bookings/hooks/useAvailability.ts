/**
 * useAvailability Hook
 * Checks barber availability for a specific date via Convex queries.
 *
 * Uses `useQuery` from "convex/react" with the Convex `api` directly.
 * The backend `checkAvailability` query takes a barberId and a date
 * timestamp, returning an array of available time-slot strings
 * (e.g. ["09:00", "09:30", ...]).
 *
 * Convex useQuery automatically subscribes to real-time updates —
 * no manual refetching is needed.
 */

import { useQuery } from 'convex/react';
import { useState, useEffect } from 'react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import type { IAvailabilityDay, IBarberAvailability, ITimeSlot } from '../types';
import { mockBookingService } from '../services/mockBookingService';

const isDevMode = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

interface IUseAvailabilityOptions {
  barberId: string | undefined;
  /** Timestamp representing the target date */
  date: number | undefined;
  enabled?: boolean;
}

export const useAvailability = (options: IUseAvailabilityOptions) => {
  const { barberId, date, enabled = true } = options;

  const slotsData = useQuery(
    api.appointments.queries.checkAvailability,
    isDevMode || !enabled || !barberId || !date
      ? 'skip'
      : { barberId: barberId as Id<'users'>, date }
  );

  const [mockSlots, setMockSlots] = useState<string[]>([]);

  useEffect(() => {
    if (isDevMode && enabled && barberId && date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      mockBookingService
        .getBarberAvailability(barberId as string, startDate, endDate, 60)
        .then((availability) => {
          const day = availability.availability.find(
            (d) => new Date(d.date).toDateString() === startDate.toDateString()
          );
          if (day) {
            const timeSlots = day.slots
              .filter((s) => s.available)
              .map((s) => {
                const d = new Date(s.time);
                return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
              });
            setMockSlots(timeSlots);
          }
        });
    }
  }, [isDevMode, enabled, barberId, date]);

  const slots = isDevMode ? mockSlots : (slotsData ?? []);

  return {
    /** Array of available time strings, e.g. ["09:00", "10:30"] */
    availableSlots: slots,
    isLoading: isDevMode ? false : slotsData === undefined,
    isError: false,
    error: null,
  };
};

/**
 * Hook to get availability for a specific date (convenience wrapper).
 */
export const useDateAvailability = (barberId: string | undefined, date: Date | undefined) => {
  return useAvailability({
    barberId,
    date: date
      ? new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
      : undefined,
  });
};

// ---------------------------------------------------------------------------
// Legacy-compatible hooks
// ---------------------------------------------------------------------------
// The old REST-based hooks returned IBarberAvailability with AvailabilityDay[]
// containing TimeSlot objects.  The Convex backend returns simple time strings
// per day, so we convert them here to maintain backward compatibility.

/**
 * Convert Convex time-slot strings for a single date into the legacy
 * IBarberAvailability format expected by components like DateTimePicker.
 */
function slotsToLegacyAvailability(
  barberId: string,
  date: number,
  timeStrings: string[]
): IBarberAvailability {
  const dayTimestamp = new Date(date);
  dayTimestamp.setHours(0, 0, 0, 0);

  const slots: ITimeSlot[] = timeStrings.map((timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const slotDate = new Date(dayTimestamp);
    slotDate.setHours(hours, minutes, 0, 0);
    return { time: slotDate.getTime(), available: true };
  });

  const day: IAvailabilityDay = {
    date: dayTimestamp.getTime(),
    slots,
  };

  return { barberId, availability: [day] };
}

interface IUseSlotAvailabilityOptions {
  barberId: string;
  scheduledFor: Date;
  duration: number;
  enabled?: boolean;
}

export const useSlotAvailability = (options: IUseSlotAvailabilityOptions) => {
  const { barberId, scheduledFor, enabled = true } = options;
  const date = new Date(
    scheduledFor.getFullYear(),
    scheduledFor.getMonth(),
    scheduledFor.getDate()
  ).getTime();

  const result = useAvailability({ barberId, date, enabled });

  // Check if the requested time appears in the available slots
  const requestedTimeStr = `${String(scheduledFor.getHours()).padStart(2, '0')}:${String(scheduledFor.getMinutes()).padStart(2, '0')}`;
  const isAvailable = result.availableSlots.includes(requestedTimeStr);

  return {
    isAvailable,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
  };
};

/**
 * Hook to get availability for the next 7 days (queries today's date).
 *
 * NOTE: The Convex backend only supports checking one day at a time.
 * This queries today's availability and wraps it in the legacy
 * IBarberAvailability shape. For full week coverage, call
 * useAvailability for each individual day.
 */
export const useWeekAvailability = (barberId: string, _duration: number) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateTs = today.getTime();

  const result = useAvailability({
    barberId: barberId || undefined,
    date: barberId ? dateTs : undefined,
  });

  const availability =
    barberId && !result.isLoading
      ? slotsToLegacyAvailability(barberId, dateTs, result.availableSlots)
      : undefined;

  return {
    availability,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: () => {}, // Convex queries auto-refresh
  };
};

/**
 * Hook to get availability for the next 30 days (queries today's date).
 *
 * Same caveats as useWeekAvailability — see above.
 */
export const useMonthAvailability = (barberId: string, _duration: number) => {
  return useWeekAvailability(barberId, _duration);
};
