/**
 * Mock Booking Service
 * Provides dummy booking/appointment data for development without backend
 */

import type {
  Appointment,
  AppointmentWithDetails,
  CreateAppointmentDTO,
  UpdateAppointmentDTO,
  BarberAvailability,
  BookingFilters,
  TimeSlot,
  AvailabilityDay,
} from '../types';

// Mock appointments storage
const MOCK_APPOINTMENTS: AppointmentWithDetails[] = [
  {
    _id: 'appt-1',
    clientId: 'client-1',
    barberId: 'barber-1',
    status: 'confirmed',
    serviceType: 'Haircut',
    hairType: 'straight',
    specialRequests: 'Please use scissors only, no clippers',
    location: {
      type: 'in_salon',
      address: '123 Main Street, Chennai, TN 600001',
    },
    scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    duration: 45,
    price: 35,
    paymentStatus: 'completed',
    paymentId: 'pay_mock_123',
    createdAt: new Date(),
    updatedAt: new Date(),
    barberName: 'Mike Johnson',
    barberAvatar: 'https://i.pravatar.cc/150?u=barber1',
    clientName: 'John Doe',
    clientAvatar: 'https://i.pravatar.cc/150?u=client1',
    serviceName: 'Haircut',
  },
  {
    _id: 'appt-2',
    clientId: 'client-1',
    barberId: 'barber-2',
    status: 'pending',
    serviceType: 'Color Treatment',
    hairType: 'wavy',
    location: {
      type: 'in_salon',
      address: '456 Oak Avenue, Chennai, TN 600002',
    },
    scheduledFor: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    duration: 120,
    price: 80,
    paymentStatus: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    barberName: 'Sarah Williams',
    barberAvatar: 'https://i.pravatar.cc/150?u=barber2',
    clientName: 'John Doe',
    clientAvatar: 'https://i.pravatar.cc/150?u=client1',
    serviceName: 'Color Treatment',
  },
  {
    _id: 'appt-3',
    clientId: 'client-1',
    barberId: 'barber-1',
    status: 'completed',
    serviceType: 'Fade',
    hairType: 'curly',
    location: {
      type: 'in_home',
      address: '789 User Street, Chennai, TN 600010',
      coordinates: [79.1574988, 12.9739803],
    },
    scheduledFor: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    duration: 60,
    price: 40,
    appliedCouponId: 'coupon-1',
    paymentStatus: 'completed',
    paymentId: 'pay_mock_456',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    barberName: 'Mike Johnson',
    barberAvatar: 'https://i.pravatar.cc/150?u=barber1',
    clientName: 'John Doe',
    clientAvatar: 'https://i.pravatar.cc/150?u=client1',
    serviceName: 'Fade',
  },
];

// Generate mock availability
const generateMockAvailability = (
  barberId: string,
  startDate: Date,
  endDate: Date,
  duration: number
): BarberAvailability => {
  const availability: AvailabilityDay[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();

    // Skip Sundays (day 0)
    if (dayOfWeek !== 0) {
      const slots: TimeSlot[] = [];
      const startHour = 9;
      const endHour = 18;

      for (let hour = startHour; hour < endHour; hour++) {
        const slotTime = new Date(currentDate);
        slotTime.setHours(hour, 0, 0, 0);

        // Randomly mark some slots as unavailable
        const isAvailable = Math.random() > 0.3;

        slots.push({
          time: slotTime,
          available: isAvailable,
        });
      }

      availability.push({
        date: new Date(currentDate),
        slots,
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    barberId,
    availability,
  };
};

export const mockBookingService = {
  /**
   * Create a new appointment
   */
  async createAppointment(data: CreateAppointmentDTO): Promise<Appointment> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const newAppointment: AppointmentWithDetails = {
      _id: `appt-${Date.now()}`,
      clientId: 'client-1', // Mock current user
      barberId: data.barberId,
      status: 'pending',
      serviceType: data.serviceType,
      hairType: data.hairType,
      specialRequests: data.specialRequests,
      location: data.location,
      scheduledFor: data.scheduledFor,
      duration: 60, // Mock duration
      price: 50, // Mock price
      appliedCouponId: data.appliedCouponId,
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      barberName: 'Mock Barber',
      barberAvatar: 'https://i.pravatar.cc/150?u=barber',
      clientName: 'Current User',
      clientAvatar: 'https://i.pravatar.cc/150?u=client',
      serviceName: data.serviceType,
    };

    MOCK_APPOINTMENTS.push(newAppointment);

    return newAppointment;
  },

  /**
   * Get appointment by ID
   */
  async getAppointmentById(id: string): Promise<AppointmentWithDetails> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const appointment = MOCK_APPOINTMENTS.find((a) => a._id === id);

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    return appointment;
  },

  /**
   * Get user's appointments with optional filters
   */
  async getMyAppointments(filters?: BookingFilters): Promise<AppointmentWithDetails[]> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    let appointments = [...MOCK_APPOINTMENTS];

    // Apply filters
    if (filters?.status) {
      appointments = appointments.filter((a) => a.status === filters.status);
    }

    if (filters?.startDate) {
      appointments = appointments.filter((a) => a.scheduledFor >= filters.startDate!);
    }

    if (filters?.endDate) {
      appointments = appointments.filter((a) => a.scheduledFor <= filters.endDate!);
    }

    if (filters?.barberId) {
      appointments = appointments.filter((a) => a.barberId === filters.barberId);
    }

    // Sort by scheduled date
    appointments.sort((a, b) => b.scheduledFor.getTime() - a.scheduledFor.getTime());

    return appointments;
  },

  /**
   * Get appointments as a barber
   */
  async getBarberAppointments(barberId: string, filters?: BookingFilters): Promise<Appointment[]> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    let appointments = MOCK_APPOINTMENTS.filter((a) => a.barberId === barberId);

    // Apply filters
    if (filters?.status) {
      appointments = appointments.filter((a) => a.status === filters.status);
    }

    if (filters?.startDate) {
      appointments = appointments.filter((a) => a.scheduledFor >= filters.startDate!);
    }

    if (filters?.endDate) {
      appointments = appointments.filter((a) => a.scheduledFor <= filters.endDate!);
    }

    return appointments;
  },

  /**
   * Update appointment details
   */
  async updateAppointment(id: string, data: UpdateAppointmentDTO): Promise<Appointment> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const index = MOCK_APPOINTMENTS.findIndex((a) => a._id === id);

    if (index === -1) {
      throw new Error('Appointment not found');
    }

    MOCK_APPOINTMENTS[index] = {
      ...MOCK_APPOINTMENTS[index],
      ...data,
      updatedAt: new Date(),
    };

    return MOCK_APPOINTMENTS[index];
  },

  /**
   * Cancel appointment
   */
  async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const index = MOCK_APPOINTMENTS.findIndex((a) => a._id === id);

    if (index === -1) {
      throw new Error('Appointment not found');
    }

    MOCK_APPOINTMENTS[index] = {
      ...MOCK_APPOINTMENTS[index],
      status: 'cancelled',
      updatedAt: new Date(),
    };

    console.log(`[MOCK] Appointment cancelled. Reason: ${reason || 'No reason provided'}`);

    return MOCK_APPOINTMENTS[index];
  },

  /**
   * Confirm appointment (barber only)
   */
  async confirmAppointment(id: string): Promise<Appointment> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const index = MOCK_APPOINTMENTS.findIndex((a) => a._id === id);

    if (index === -1) {
      throw new Error('Appointment not found');
    }

    MOCK_APPOINTMENTS[index] = {
      ...MOCK_APPOINTMENTS[index],
      status: 'confirmed',
      updatedAt: new Date(),
    };

    return MOCK_APPOINTMENTS[index];
  },

  /**
   * Complete appointment (barber only)
   */
  async completeAppointment(id: string): Promise<Appointment> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const index = MOCK_APPOINTMENTS.findIndex((a) => a._id === id);

    if (index === -1) {
      throw new Error('Appointment not found');
    }

    MOCK_APPOINTMENTS[index] = {
      ...MOCK_APPOINTMENTS[index],
      status: 'completed',
      paymentStatus: 'completed',
      updatedAt: new Date(),
    };

    return MOCK_APPOINTMENTS[index];
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
    await new Promise((resolve) => setTimeout(resolve, 600));

    return generateMockAvailability(barberId, startDate, endDate, duration);
  },

  /**
   * Check if a specific time slot is available
   */
  async checkSlotAvailability(
    barberId: string,
    scheduledFor: Date,
    duration: number
  ): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Check if there's any conflicting appointment
    const hasConflict = MOCK_APPOINTMENTS.some((appt) => {
      if (appt.barberId !== barberId) return false;
      if (appt.status === 'cancelled') return false;

      const apptStart = appt.scheduledFor.getTime();
      const apptEnd = apptStart + appt.duration * 60 * 1000;
      const requestedStart = scheduledFor.getTime();
      const requestedEnd = requestedStart + duration * 60 * 1000;

      // Check for overlap
      return requestedStart < apptEnd && requestedEnd > apptStart;
    });

    return !hasConflict;
  },
};

export default mockBookingService;
