/**
 * Booking Feature Types
 * Type definitions for appointment booking and scheduling
 * Aligned with backend/convex/schema.ts appointments table
 */

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export type HairType = 'curly' | 'straight' | 'wavy';

export type LocationType = 'in_home' | 'in_salon';

export interface IAppointmentLocation {
  type: LocationType;
  address?: string;
  coordinates?: { lat: number; lng: number };
}

export interface IAppointment {
  _id: string;
  clientId: string;
  barberId: string;
  status: AppointmentStatus;
  serviceId: string;
  serviceName: string;
  specialRequests?: string;
  locationType: LocationType;
  address?: string;
  addressCoords?: { lat: number; lng: number };
  scheduledFor: number; // timestamp
  endTime: number; // timestamp
  duration: number; // in minutes
  price: number;
  paymentStatus: PaymentStatus;
  paymentIntentId?: string;
  hasReview?: boolean;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

export interface ICreateAppointmentDTO {
  barberId: string;
  serviceId: string;
  serviceName: string;
  specialRequests?: string;
  locationType: LocationType;
  address?: string;
  addressCoords?: { lat: number; lng: number };
  scheduledFor: number; // timestamp
  endTime: number; // timestamp
  duration: number; // in minutes
  price: number;
}

export interface IUpdateAppointmentDTO {
  status?: AppointmentStatus;
  scheduledFor?: number; // timestamp
  endTime?: number; // timestamp
  specialRequests?: string;
  locationType?: LocationType;
  address?: string;
  addressCoords?: { lat: number; lng: number };
}

export interface ITimeSlot {
  time: number; // timestamp
  available: boolean;
}

export interface IAvailabilityDay {
  date: number; // timestamp
  slots: ITimeSlot[];
}

export interface IBarberAvailability {
  barberId: string;
  availability: IAvailabilityDay[];
}

export interface IBookingFilters {
  status?: AppointmentStatus;
  startDate?: number; // timestamp
  endDate?: number; // timestamp
  barberId?: string;
  clientId?: string;
}

export interface IAppointmentWithDetails extends IAppointment {
  barberName: string;
  barberAvatar?: string;
  clientName: string;
  clientAvatar?: string;
}

/**
 * Booking form state used by Jotai atoms in the booking flow.
 * Stores user selections before creating an appointment.
 */
export interface IBookingForm {
  barberId?: string;
  serviceId?: string;
  serviceName?: string;
  locationType?: LocationType;
  address?: string;
  addressCoords?: { lat: number; lng: number };
  specialRequests?: string;
  price?: number;
  duration?: number; // in minutes
}

/**
 * Booking schedule state used by Jotai atoms in the booking flow.
 * Stores the selected date/time as timestamps.
 */
export interface IBookingSchedule {
  selectedDate?: number; // timestamp
  selectedTime?: number; // timestamp
}

// ============================================================================
// Legacy type aliases for backward compatibility
// ============================================================================

/** @deprecated Use IAppointment instead */
export type Appointment = IAppointment;

/** @deprecated Use IAppointmentWithDetails instead */
export type AppointmentWithDetails = IAppointmentWithDetails;

/** @deprecated Use ICreateAppointmentDTO instead */
export type CreateAppointmentDTO = ICreateAppointmentDTO;

/** @deprecated Use IUpdateAppointmentDTO instead */
export type UpdateAppointmentDTO = IUpdateAppointmentDTO;

/** @deprecated Use ITimeSlot instead */
export type TimeSlot = ITimeSlot;

/** @deprecated Use IAvailabilityDay instead */
export type AvailabilityDay = IAvailabilityDay;

/** @deprecated Use IBarberAvailability instead */
export type BarberAvailability = IBarberAvailability;

/** @deprecated Use IBookingFilters instead */
export type BookingFilters = IBookingFilters;

/** @deprecated Use IAppointmentLocation instead */
export type AppointmentLocation = IAppointmentLocation;
