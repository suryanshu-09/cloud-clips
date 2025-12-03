/**
 * Booking Service
 * Handles API calls for appointment booking and management
 */

import apiClient from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import type {
  Appointment,
  AppointmentWithDetails,
  CreateAppointmentDTO,
  UpdateAppointmentDTO,
  BarberAvailability,
  BookingFilters,
} from '../types';

// Check if we should use mock data as fallback
const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

// Lazy load mock service only when needed
let mockBookingService: typeof import('./mockBookingService').mockBookingService | null = null;

const getMockService = async () => {
  if (!mockBookingService && DEV_MODE) {
    const module = await import('./mockBookingService');
    mockBookingService = module.mockBookingService;
  }
  return mockBookingService;
};

export const bookingService = {
  /**
   * Create a new appointment
   */
  async createAppointment(data: CreateAppointmentDTO): Promise<Appointment> {
    try {
      const response = await apiClient.post<Appointment>(endpoints.appointments.create, data);
      return response.data;
    } catch (error: any) {
      if (DEV_MODE) {
        const mock = await getMockService();
        if (mock) {
          console.log('[BOOKINGS] Using mock create appointment fallback');
          return mock.createAppointment(data);
        }
      }
      throw new Error(error.message || 'Failed to create appointment');
    }
  },

  /**
   * Get appointment by ID
   */
  async getAppointmentById(id: string): Promise<AppointmentWithDetails> {
    try {
      const response = await apiClient.get<AppointmentWithDetails>(
        endpoints.appointments.detail(id)
      );
      return response.data;
    } catch (error: any) {
      if (DEV_MODE) {
        const mock = await getMockService();
        if (mock) {
          console.log('[BOOKINGS] Using mock appointment detail fallback');
          return mock.getAppointmentById(id);
        }
      }
      throw new Error(error.message || 'Failed to fetch appointment');
    }
  },

  /**
   * Get user's appointments with optional filters
   */
  async getMyAppointments(filters?: BookingFilters): Promise<AppointmentWithDetails[]> {
    try {
      const response = await apiClient.get<AppointmentWithDetails[]>(endpoints.appointments.list, {
        params: filters,
      });
      return response.data;
    } catch (error: any) {
      if (DEV_MODE) {
        const mock = await getMockService();
        if (mock) {
          console.log('[BOOKINGS] Using mock my appointments fallback');
          return mock.getMyAppointments(filters);
        }
      }
      throw new Error(error.message || 'Failed to fetch appointments');
    }
  },

  /**
   * Get upcoming appointments
   */
  async getUpcomingAppointments(): Promise<AppointmentWithDetails[]> {
    try {
      const response = await apiClient.get<AppointmentWithDetails[]>(
        endpoints.appointments.upcoming
      );
      return response.data;
    } catch (error: any) {
      if (DEV_MODE) {
        const mock = await getMockService();
        if (mock) {
          console.log('[BOOKINGS] Using mock upcoming appointments fallback');
          return mock.getMyAppointments({ status: 'confirmed' });
        }
      }
      throw new Error(error.message || 'Failed to fetch upcoming appointments');
    }
  },

  /**
   * Get past appointments
   */
  async getPastAppointments(): Promise<AppointmentWithDetails[]> {
    try {
      const response = await apiClient.get<AppointmentWithDetails[]>(endpoints.appointments.past);
      return response.data;
    } catch (error: any) {
      if (DEV_MODE) {
        const mock = await getMockService();
        if (mock) {
          console.log('[BOOKINGS] Using mock past appointments fallback');
          return mock.getMyAppointments({ status: 'completed' });
        }
      }
      throw new Error(error.message || 'Failed to fetch past appointments');
    }
  },

  /**
   * Get appointments as a barber
   */
  async getBarberAppointments(barberId: string, filters?: BookingFilters): Promise<Appointment[]> {
    try {
      const response = await apiClient.get<Appointment[]>(endpoints.appointments.list, {
        params: { barberId, ...filters },
      });
      return response.data;
    } catch (error: any) {
      if (DEV_MODE) {
        const mock = await getMockService();
        if (mock) {
          console.log('[BOOKINGS] Using mock barber appointments fallback');
          return mock.getBarberAppointments(barberId, filters);
        }
      }
      throw new Error(error.message || 'Failed to fetch barber appointments');
    }
  },

  /**
   * Update appointment details
   */
  async updateAppointment(id: string, data: UpdateAppointmentDTO): Promise<Appointment> {
    try {
      const response = await apiClient.put<Appointment>(endpoints.appointments.update(id), data);
      return response.data;
    } catch (error: any) {
      if (DEV_MODE) {
        const mock = await getMockService();
        if (mock) {
          console.log('[BOOKINGS] Using mock update appointment fallback');
          return mock.updateAppointment(id, data);
        }
      }
      throw new Error(error.message || 'Failed to update appointment');
    }
  },

  /**
   * Cancel appointment
   */
  async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
    try {
      const response = await apiClient.post<Appointment>(endpoints.appointments.cancel(id), {
        reason,
      });
      return response.data;
    } catch (error: any) {
      if (DEV_MODE) {
        const mock = await getMockService();
        if (mock) {
          console.log('[BOOKINGS] Using mock cancel appointment fallback');
          return mock.cancelAppointment(id, reason);
        }
      }
      throw new Error(error.message || 'Failed to cancel appointment');
    }
  },

  /**
   * Confirm appointment (barber only)
   */
  async confirmAppointment(id: string): Promise<Appointment> {
    try {
      const response = await apiClient.post<Appointment>(endpoints.appointments.confirm(id));
      return response.data;
    } catch (error: any) {
      if (DEV_MODE) {
        const mock = await getMockService();
        if (mock) {
          console.log('[BOOKINGS] Using mock confirm appointment fallback');
          return mock.confirmAppointment(id);
        }
      }
      throw new Error(error.message || 'Failed to confirm appointment');
    }
  },

  /**
   * Complete appointment (barber only)
   */
  async completeAppointment(id: string): Promise<Appointment> {
    try {
      const response = await apiClient.post<Appointment>(endpoints.appointments.complete(id));
      return response.data;
    } catch (error: any) {
      if (DEV_MODE) {
        const mock = await getMockService();
        if (mock) {
          console.log('[BOOKINGS] Using mock complete appointment fallback');
          return mock.completeAppointment(id);
        }
      }
      throw new Error(error.message || 'Failed to complete appointment');
    }
  },

  /**
   * Submit review for appointment
   */
  async submitReview(
    appointmentId: string,
    review: { rating: number; comment?: string }
  ): Promise<void> {
    try {
      await apiClient.post(endpoints.appointments.review(appointmentId), review);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to submit review');
    }
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
    try {
      const response = await apiClient.get<BarberAvailability>(
        endpoints.barbers.availability(barberId),
        {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            duration,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      if (DEV_MODE) {
        const mock = await getMockService();
        if (mock) {
          console.log('[BOOKINGS] Using mock availability fallback');
          return mock.getBarberAvailability(barberId, startDate, endDate, duration);
        }
      }
      throw new Error(error.message || 'Failed to fetch availability');
    }
  },

  /**
   * Check if a specific time slot is available
   */
  async checkSlotAvailability(
    barberId: string,
    scheduledFor: Date,
    duration: number
  ): Promise<boolean> {
    try {
      const response = await apiClient.post<{ available: boolean }>(
        `${endpoints.barbers.availability(barberId)}/check`,
        {
          scheduledFor: scheduledFor.toISOString(),
          duration,
        }
      );
      return response.data.available;
    } catch (error: any) {
      if (DEV_MODE) {
        const mock = await getMockService();
        if (mock) {
          console.log('[BOOKINGS] Using mock slot check fallback');
          return mock.checkSlotAvailability(barberId, scheduledFor, duration);
        }
      }
      throw new Error(error.message || 'Failed to check availability');
    }
  },

  /**
   * Reschedule an appointment
   */
  async rescheduleAppointment(id: string, newDate: Date): Promise<Appointment> {
    try {
      const response = await apiClient.put<Appointment>(endpoints.appointments.update(id), {
        scheduledFor: newDate.toISOString(),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to reschedule appointment');
    }
  },
};

export default bookingService;
