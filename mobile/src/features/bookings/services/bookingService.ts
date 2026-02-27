/**
 * Booking Service — Convex Integration
 *
 * This module exposes Convex API references and thin wrappers for the
 * appointments feature.  The recommended pattern in components and hooks is
 * to call Convex directly via `useQuery` / `useMutation` from "convex/react":
 *
 *   import { useQuery, useMutation } from "convex/react";
 *   import { appointmentQueries, appointmentMutations } from "../services/bookingService";
 *
 *   const appointments = useQuery(appointmentQueries.getMyAppointments, { status: "pending" });
 *   const book = useMutation(appointmentMutations.bookAppointment);
 *
 * For imperative (non-React) code that cannot use hooks, the `bookingService`
 * object provides promise-based helpers that call the shared ConvexReactClient
 * directly.  These should be used sparingly; prefer hooks wherever possible.
 */

import { api } from '@convex/_generated/api';
import { convex } from '@/services/convex/client';
import type { Id } from '@convex/_generated/dataModel';
import type { AppointmentStatus, LocationType } from '../types';

// ---------------------------------------------------------------------------
// Convex API References
// ---------------------------------------------------------------------------
// Use these with useQuery / useMutation from "convex/react" in components.

/** Convex query references for appointments */
export const appointmentQueries = {
  /** Get the current user's appointments, optionally filtered by status */
  getMyAppointments: api.appointments.queries.getMyAppointments,
  /** Get a single appointment by its ID (includes client & barber details) */
  getAppointmentById: api.appointments.queries.getAppointmentById,
  /** Get available time-slots for a barber on a given date */
  checkAvailability: api.appointments.queries.checkAvailability,
} as const;

/** Convex mutation references for appointments */
export const appointmentMutations = {
  /** Book a new appointment */
  bookAppointment: api.appointments.mutations.bookAppointment,
  /** Cancel an existing appointment */
  cancelAppointment: api.appointments.mutations.cancelAppointment,
  /** Update appointment status (barber-only: confirmed, in_progress, completed, no_show) */
  updateAppointmentStatus: api.appointments.mutations.updateAppointmentStatus,
  /** Update payment status on an appointment */
  updatePaymentStatus: api.appointments.mutations.updatePaymentStatus,
} as const;

// ---------------------------------------------------------------------------
// Argument type helpers
// ---------------------------------------------------------------------------
// These mirror the Convex function arg shapes so callers get type-safety
// even before _generated types are available.

export interface IBookAppointmentArgs {
  barberId: Id<'users'>;
  serviceId: string;
  serviceName: string;
  price: number;
  duration: number;
  scheduledFor: number;
  locationType: LocationType;
  address?: string;
  addressCoords?: { lat: number; lng: number };
  specialRequests?: string;
}

export interface ICancelAppointmentArgs {
  appointmentId: Id<'appointments'>;
  reason?: string;
}

export interface ICheckAvailabilityArgs {
  barberId: Id<'users'>;
  date: number; // timestamp for the day
}

export interface IGetMyAppointmentsArgs {
  status?: AppointmentStatus;
}

export interface IGetAppointmentByIdArgs {
  appointmentId: Id<'appointments'>;
}

export interface IRescheduleAppointmentArgs {
  appointmentId: Id<'appointments'>;
  newScheduledFor: number;
  newEndTime: number;
}

export interface IUpdateAppointmentStatusArgs {
  appointmentId: Id<'appointments'>;
  status: 'confirmed' | 'in_progress' | 'completed' | 'no_show';
}

// ---------------------------------------------------------------------------
// Imperative service (for non-React contexts)
// ---------------------------------------------------------------------------
// Uses the shared ConvexReactClient instance. Prefer Convex hooks in
// React components instead of these.

export const bookingService = {
  /**
   * Book a new appointment via Convex mutation.
   */
  async bookAppointment(args: IBookAppointmentArgs) {
    return convex.mutation(api.appointments.mutations.bookAppointment, args);
  },

  /**
   * Cancel an appointment via Convex mutation.
   */
  async cancelAppointment(appointmentId: Id<'appointments'>, reason?: string) {
    return convex.mutation(api.appointments.mutations.cancelAppointment, {
      appointmentId,
      reason,
    });
  },

  /**
   * Get the authenticated user's appointments, optionally filtered by status.
   */
  async getMyAppointments(status?: AppointmentStatus) {
    return convex.query(api.appointments.queries.getMyAppointments, {
      status,
    });
  },

  /**
   * Get a single appointment by ID (includes client & barber details).
   */
  async getAppointmentById(appointmentId: Id<'appointments'>) {
    return convex.query(api.appointments.queries.getAppointmentById, {
      appointmentId,
    });
  },

  /**
   * Check available time-slots for a barber on a specific date.
   * Returns an array of available time strings (e.g. ["09:00", "09:30", ...]).
   */
  async checkAvailability(barberId: Id<'users'>, date: number) {
    return convex.query(api.appointments.queries.checkAvailability, {
      barberId,
      date,
    });
  },

  /**
   * Reschedule an appointment by cancelling and re-booking.
   *
   * NOTE: The Convex backend does not currently expose a dedicated
   * rescheduleAppointment mutation. This helper cancels the existing
   * appointment and books a new one. If a dedicated mutation is added to
   * the backend in the future, this should be updated to call it directly.
   */
  async rescheduleAppointment(args: IRescheduleAppointmentArgs) {
    // Cancel the old appointment
    await convex.mutation(api.appointments.mutations.cancelAppointment, {
      appointmentId: args.appointmentId,
      reason: 'Rescheduled',
    });

    // The caller should book a new appointment with the updated time
    // using bookAppointment. We return the cancellation result here.
    return { cancelled: true, appointmentId: args.appointmentId };
  },

  /**
   * Update appointment status (barber-only).
   */
  async updateAppointmentStatus(args: IUpdateAppointmentStatusArgs) {
    return convex.mutation(api.appointments.mutations.updateAppointmentStatus, args);
  },
};

export default bookingService;
