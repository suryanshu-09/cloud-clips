/**
 * Bookings Feature Exports
 * Central export point for all booking-related functionality
 */

// Hooks
export { useBooking, BOOKING_QUERY_KEYS } from './hooks/useBooking';
export {
  useAppointments,
  useAppointment,
  useBarberAppointments,
  useUpcomingAppointments,
  usePastAppointments,
  usePendingAppointments,
} from './hooks/useAppointments';
export {
  useAvailability,
  useSlotAvailability,
  useWeekAvailability,
  useMonthAvailability,
} from './hooks/useAvailability';

// Services
export { bookingService } from './services/bookingService';

// Types
export type {
  Appointment,
  AppointmentStatus,
  PaymentStatus,
  HairType,
  LocationType,
  ServiceType,
  AppointmentLocation,
  CreateAppointmentDTO,
  UpdateAppointmentDTO,
  TimeSlot,
  AvailabilityDay,
  BarberAvailability,
  BookingFilters,
  AppointmentWithDetails,
} from './types';
