/**
 * Booking Service
 * Handles API calls for appointment booking and management
 */

import apiClient from '@/services/api/client';
import type {
  Appointment,
  AppointmentWithDetails,
  CreateAppointmentDTO,
  UpdateAppointmentDTO,
  BarberAvailability,
  BookingFilters,
} from '../types';
import { mockBookingService } from './mockBookingService';

// Check if we should use mock data
const USE_MOCK = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

const BOOKING_ENDPOINTS = {
  APPOINTMENTS: '/appointments',
  AVAILABILITY: '/appointments/availability',
  MY_APPOINTMENTS: '/appointments/me',
};

const realBookingService = {
  /**
   * Create a new appointment
   */
  async createAppointment(data: CreateAppointmentDTO): Promise<Appointment> {
    const response = await apiClient.post<Appointment>(BOOKING_ENDPOINTS.APPOINTMENTS, data);
    return response.data;
  },

  /**
   * Get appointment by ID
   */
  async getAppointmentById(id: string): Promise<AppointmentWithDetails> {
    const response = await apiClient.get<AppointmentWithDetails>(
      `${BOOKING_ENDPOINTS.APPOINTMENTS}/${id}`
    );
    return response.data;
  },

  /**
   * Get user's appointments with optional filters
   */
  async getMyAppointments(filters?: BookingFilters): Promise<AppointmentWithDetails[]> {
    const response = await apiClient.get<AppointmentWithDetails[]>(
      BOOKING_ENDPOINTS.MY_APPOINTMENTS,
      {
        params: filters,
      }
    );
    return response.data;
  },

  /**
   * Get appointments as a barber
   */
  async getBarberAppointments(barberId: string, filters?: BookingFilters): Promise<Appointment[]> {
    const response = await apiClient.get<Appointment[]>(
      `${BOOKING_ENDPOINTS.APPOINTMENTS}/barber/${barberId}`,
      {
        params: filters,
      }
    );
    return response.data;
  },

  /**
   * Update appointment details
   */
  async updateAppointment(id: string, data: UpdateAppointmentDTO): Promise<Appointment> {
    const response = await apiClient.patch<Appointment>(
      `${BOOKING_ENDPOINTS.APPOINTMENTS}/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Cancel appointment
   */
  async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
    const response = await apiClient.post<Appointment>(
      `${BOOKING_ENDPOINTS.APPOINTMENTS}/${id}/cancel`,
      { reason }
    );
    return response.data;
  },

  /**
   * Confirm appointment (barber only)
   */
  async confirmAppointment(id: string): Promise<Appointment> {
    const response = await apiClient.post<Appointment>(
      `${BOOKING_ENDPOINTS.APPOINTMENTS}/${id}/confirm`
    );
    return response.data;
  },

  /**
   * Complete appointment (barber only)
   */
  async completeAppointment(id: string): Promise<Appointment> {
    const response = await apiClient.post<Appointment>(
      `${BOOKING_ENDPOINTS.APPOINTMENTS}/${id}/complete`
    );
    return response.data;
  },

  /**
   * Get barber availability for a date range
   */
  async getBarberAvailability(
    barberId: string,
    startDate: Date,
    endDate: Date,
    duration: number
  ): Promise<BarberAvailability> {
    const response = await apiClient.get<BarberAvailability>(BOOKING_ENDPOINTS.AVAILABILITY, {
      params: {
        barberId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        duration,
      },
    });
    return response.data;
  },

  /**
   * Check if a specific time slot is available
   */
  async checkSlotAvailability(
    barberId: string,
    scheduledFor: Date,
    duration: number
  ): Promise<boolean> {
    const response = await apiClient.post<{ available: boolean }>(
      `${BOOKING_ENDPOINTS.AVAILABILITY}/check`,
      {
        barberId,
        scheduledFor: scheduledFor.toISOString(),
        duration,
      }
    );
    return response.data.available;
  },
};

// Export either mock or real service based on DEV_MODE
export const bookingService = USE_MOCK ? mockBookingService : realBookingService;

export default bookingService;
