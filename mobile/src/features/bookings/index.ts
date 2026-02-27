/**
 * Bookings Feature Exports
 * Central export point for all booking-related functionality
 */

// Hooks
export { useBooking, BOOKING_QUERY_KEYS } from './hooks/useBooking';
export {
  useAppointments,
  useAppointment,
  useSortedAppointments,
  useUpcomingAppointments,
  usePastAppointments,
  usePendingAppointments,
} from './hooks/useAppointments';
export {
  useAvailability,
  useDateAvailability,
  useSlotAvailability,
  useWeekAvailability,
  useMonthAvailability,
} from './hooks/useAvailability';

// Services — Convex API references and imperative helpers
export {
  bookingService,
  appointmentQueries,
  appointmentMutations,
} from './services/bookingService';
export type {
  IBookAppointmentArgs,
  ICancelAppointmentArgs,
  ICheckAvailabilityArgs,
  IGetMyAppointmentsArgs,
  IGetAppointmentByIdArgs,
  IRescheduleAppointmentArgs,
  IUpdateAppointmentStatusArgs,
} from './services/bookingService';

// Types
export type {
  // Primary types (I-prefixed per convention)
  IAppointment,
  IAppointmentLocation,
  ICreateAppointmentDTO,
  IUpdateAppointmentDTO,
  ITimeSlot,
  IAvailabilityDay,
  IBarberAvailability,
  IBookingFilters,
  IAppointmentWithDetails,
  IBookingForm,
  IBookingSchedule,

  // Union types
  AppointmentStatus,
  PaymentStatus,
  HairType,
  LocationType,

  // Legacy aliases (deprecated)
  Appointment,
  AppointmentLocation,
  CreateAppointmentDTO,
  UpdateAppointmentDTO,
  TimeSlot,
  AvailabilityDay,
  BarberAvailability,
  BookingFilters,
  AppointmentWithDetails,
} from './types';
