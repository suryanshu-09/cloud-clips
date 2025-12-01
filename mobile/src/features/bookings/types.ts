/**
 * Booking Feature Types
 * Type definitions for appointment booking and scheduling
 */

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'refunded';
export type HairType = 'curly' | 'straight' | 'wavy';
export type LocationType = 'in_home' | 'in_salon';

export interface ServiceType {
  name: string;
  price: number;
  duration: number;
  description?: string;
}

export interface AppointmentLocation {
  type: LocationType;
  address?: string;
  coordinates?: [number, number]; // [longitude, latitude]
}

export interface Appointment {
  _id: string;
  clientId: string;
  barberId: string;
  status: AppointmentStatus;
  serviceType: string;
  hairType: HairType;
  specialRequests?: string;
  location: AppointmentLocation;
  scheduledFor: Date;
  duration: number;
  price: number;
  appliedCouponId?: string;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAppointmentDTO {
  barberId: string;
  serviceType: string;
  hairType: HairType;
  specialRequests?: string;
  location: AppointmentLocation;
  scheduledFor: Date;
  appliedCouponId?: string;
}

export interface UpdateAppointmentDTO {
  status?: AppointmentStatus;
  scheduledFor?: Date;
  specialRequests?: string;
  location?: AppointmentLocation;
}

export interface TimeSlot {
  time: Date;
  available: boolean;
}

export interface AvailabilityDay {
  date: Date;
  slots: TimeSlot[];
}

export interface BarberAvailability {
  barberId: string;
  availability: AvailabilityDay[];
}

export interface BookingFilters {
  status?: AppointmentStatus;
  startDate?: Date;
  endDate?: Date;
  barberId?: string;
  clientId?: string;
}

export interface AppointmentWithDetails extends Appointment {
  barberName: string;
  barberAvatar?: string;
  clientName: string;
  clientAvatar?: string;
  serviceName: string;
}
