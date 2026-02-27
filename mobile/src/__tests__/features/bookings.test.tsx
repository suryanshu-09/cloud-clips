/**
 * Booking hooks test suite
 *
 * These tests verify the Convex-based booking hooks.
 * Because useBooking now calls Convex mutations directly (not TanStack
 * Query), the tests mock the Convex client and mutation functions.
 */

import { renderHook, act } from '@testing-library/react-native';

import { useBooking } from '@/features/bookings/hooks/useBooking';
import { bookingService } from '@/features/bookings/services/bookingService';
import { convex } from '@/services/convex/client';

// Mock the Convex client used by bookingService
jest.mock('@/services/convex/client', () => ({
  convex: {
    mutation: jest.fn(),
    query: jest.fn(),
  },
}));

// Mock the Convex API references
jest.mock('@convex/_generated/api', () => ({
  api: {
    appointments: {
      queries: {
        getMyAppointments: 'getMyAppointments',
        getAppointmentById: 'getAppointmentById',
        checkAvailability: 'checkAvailability',
      },
      mutations: {
        bookAppointment: 'bookAppointment',
        cancelAppointment: 'cancelAppointment',
        updateAppointmentStatus: 'updateAppointmentStatus',
        updatePaymentStatus: 'updatePaymentStatus',
      },
    },
  },
}));

// Mock convex/react hooks
const mockUseMutation = jest.fn();
const mockUseQuery = jest.fn();
jest.mock('convex/react', () => ({
  ...jest.requireActual('convex/react'),
  useMutation: (ref: string) => mockUseMutation(ref),
  useQuery: (ref: string, args: unknown) => mockUseQuery(ref, args),
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
  ConvexReactClient: jest.fn(),
}));

describe('useBooking', () => {
  const mockBookMutation = jest.fn();
  const mockCancelMutation = jest.fn();
  const mockUpdateStatusMutation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up useMutation to return the appropriate mock function
    mockUseMutation.mockImplementation((ref: string) => {
      switch (ref) {
        case 'bookAppointment':
          return mockBookMutation;
        case 'cancelAppointment':
          return mockCancelMutation;
        case 'updateAppointmentStatus':
          return mockUpdateStatusMutation;
        default:
          return jest.fn();
      }
    });
  });

  describe('createAppointment', () => {
    it('should create appointment successfully', async () => {
      const mockResult = 'appointment-id-123';
      mockBookMutation.mockResolvedValue(mockResult);

      const onSuccessMock = jest.fn();
      const { result } = renderHook(() => useBooking({ onSuccess: onSuccessMock }));

      const bookingArgs = {
        barberId: 'barber-1' as any,
        serviceId: 'svc-1',
        serviceName: 'Haircut',
        price: 50,
        duration: 60,
        scheduledFor: Date.now() + 86400000,
        locationType: 'in_salon' as const,
      };

      await act(async () => {
        await result.current.createAppointment(bookingArgs);
      });

      expect(mockBookMutation).toHaveBeenCalledWith(bookingArgs);
      expect(onSuccessMock).toHaveBeenCalled();
    });

    it('should handle create error', async () => {
      const mockError = new Error('Failed to create appointment');
      mockBookMutation.mockRejectedValue(mockError);

      const onErrorMock = jest.fn();
      const { result } = renderHook(() => useBooking({ onError: onErrorMock }));

      await expect(
        act(async () => {
          await result.current.createAppointment({
            barberId: 'barber-1' as any,
            serviceId: 'svc-1',
            serviceName: 'Haircut',
            price: 50,
            duration: 60,
            scheduledFor: Date.now(),
            locationType: 'in_salon' as const,
          });
        })
      ).rejects.toThrow('Failed to create appointment');

      expect(onErrorMock).toHaveBeenCalledWith(mockError);
    });
  });

  describe('cancelAppointment', () => {
    it('should cancel appointment successfully', async () => {
      const mockResult = { status: 'cancelled' };
      mockCancelMutation.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useBooking());

      await act(async () => {
        await result.current.cancelAppointment('appointment-1' as any, 'Personal reasons');
      });

      expect(mockCancelMutation).toHaveBeenCalledWith({
        appointmentId: 'appointment-1',
        reason: 'Personal reasons',
      });
    });
  });

  describe('confirmAppointment', () => {
    it('should confirm appointment successfully', async () => {
      const mockResult = { status: 'confirmed' };
      mockUpdateStatusMutation.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useBooking());

      await act(async () => {
        await result.current.confirmAppointment('appointment-1' as any);
      });

      expect(mockUpdateStatusMutation).toHaveBeenCalledWith({
        appointmentId: 'appointment-1',
        status: 'confirmed',
      });
    });
  });

  describe('completeAppointment', () => {
    it('should complete appointment successfully', async () => {
      const mockResult = { status: 'completed' };
      mockUpdateStatusMutation.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useBooking());

      await act(async () => {
        await result.current.completeAppointment('appointment-1' as any);
      });

      expect(mockUpdateStatusMutation).toHaveBeenCalledWith({
        appointmentId: 'appointment-1',
        status: 'completed',
      });
    });
  });
});

describe('bookingService (imperative)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call Convex mutation for bookAppointment', async () => {
    const mockResult = 'new-appointment-id';
    (convex.mutation as jest.Mock).mockResolvedValue(mockResult);

    const args = {
      barberId: 'barber-1' as any,
      serviceId: 'svc-1',
      serviceName: 'Haircut',
      price: 50,
      duration: 60,
      scheduledFor: Date.now(),
      locationType: 'in_salon' as const,
    };

    const result = await bookingService.bookAppointment(args);

    expect(convex.mutation).toHaveBeenCalled();
    expect(result).toBe(mockResult);
  });

  it('should call Convex mutation for cancelAppointment', async () => {
    const mockResult = { status: 'cancelled' };
    (convex.mutation as jest.Mock).mockResolvedValue(mockResult);

    const result = await bookingService.cancelAppointment('appt-1' as any, 'Changed plans');

    expect(convex.mutation).toHaveBeenCalled();
    expect(result).toEqual(mockResult);
  });

  it('should call Convex query for getMyAppointments', async () => {
    const mockAppointments = [{ _id: 'appt-1', status: 'pending' }];
    (convex.query as jest.Mock).mockResolvedValue(mockAppointments);

    const result = await bookingService.getMyAppointments('pending');

    expect(convex.query).toHaveBeenCalled();
    expect(result).toEqual(mockAppointments);
  });

  it('should call Convex query for checkAvailability', async () => {
    const mockSlots = ['09:00', '09:30', '10:00'];
    (convex.query as jest.Mock).mockResolvedValue(mockSlots);

    const result = await bookingService.checkAvailability('barber-1' as any, Date.now());

    expect(convex.query).toHaveBeenCalled();
    expect(result).toEqual(mockSlots);
  });
});
