import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBooking, BOOKING_QUERY_KEYS } from '@/features/bookings/hooks/useBooking';
import { bookingService } from '@/features/bookings/services/bookingService';
import type { Appointment, CreateAppointmentDTO } from '@/features/bookings/types';

jest.mock('@/features/bookings/services/bookingService');

describe('useBooking', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockAppointment: Appointment = {
    _id: '1',
    clientId: 'client-1',
    barberId: 'barber-1',
    serviceType: 'haircut',
    hairType: 'curly',
    location: { type: 'in_salon' },
    scheduledFor: new Date('2025-12-15T10:00:00'),
    duration: 60,
    price: 50,
    status: 'pending',
    paymentStatus: 'pending',
    specialRequests: 'Test appointment',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('createAppointment', () => {
    it('should create appointment successfully', async () => {
      (bookingService.createAppointment as jest.Mock).mockResolvedValue(mockAppointment);

      const onSuccessMock = jest.fn();
      const { result } = renderHook(() => useBooking({ onSuccess: onSuccessMock }), { wrapper });

      const createData: CreateAppointmentDTO = {
        barberId: 'barber-1',
        serviceType: 'haircut',
        hairType: 'curly',
        location: { type: 'in_salon' },
        scheduledFor: new Date('2025-12-15T10:00:00'),
        specialRequests: 'Test appointment',
      };

      result.current.createAppointment.mutate(createData);

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      });

      expect(bookingService.createAppointment).toHaveBeenCalledWith(createData);
      expect(onSuccessMock).toHaveBeenCalledWith(mockAppointment);
    });

    it('should handle create error', async () => {
      const mockError = new Error('Failed to create appointment');
      (bookingService.createAppointment as jest.Mock).mockRejectedValue(mockError);

      const onErrorMock = jest.fn();
      const { result } = renderHook(() => useBooking({ onError: onErrorMock }), { wrapper });

      result.current.createAppointment.mutate({
        barberId: 'barber-1',
        serviceType: 'haircut',
        hairType: 'curly',
        location: { type: 'in_salon' },
        scheduledFor: new Date(),
      });

      await waitFor(() => {
        expect(result.current.createError).toEqual(mockError);
      });

      expect(onErrorMock).toHaveBeenCalledWith(mockError);
    });
  });

  describe('updateAppointment', () => {
    it('should update appointment successfully', async () => {
      const updatedAppointment = { ...mockAppointment, specialRequests: 'Updated notes' };
      (bookingService.updateAppointment as jest.Mock).mockResolvedValue(updatedAppointment);

      const { result } = renderHook(() => useBooking(), { wrapper });

      result.current.updateAppointment.mutate({
        id: '1',
        data: { specialRequests: 'Updated notes' },
      });

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });

      expect(bookingService.updateAppointment).toHaveBeenCalledWith('1', {
        specialRequests: 'Updated notes',
      });
    });
  });

  describe('cancelAppointment', () => {
    it('should cancel appointment successfully', async () => {
      const canceledAppointment = { ...mockAppointment, status: 'cancelled' as const };
      (bookingService.cancelAppointment as jest.Mock).mockResolvedValue(canceledAppointment);

      const { result } = renderHook(() => useBooking(), { wrapper });

      result.current.cancelAppointment.mutate({
        id: '1',
        reason: 'Personal reasons',
      });

      await waitFor(() => {
        expect(result.current.isCanceling).toBe(false);
      });

      expect(bookingService.cancelAppointment).toHaveBeenCalledWith('1', 'Personal reasons');
    });
  });

  describe('confirmAppointment', () => {
    it('should confirm appointment successfully', async () => {
      const confirmedAppointment = { ...mockAppointment, status: 'confirmed' as const };
      (bookingService.confirmAppointment as jest.Mock).mockResolvedValue(confirmedAppointment);

      const { result } = renderHook(() => useBooking(), { wrapper });

      result.current.confirmAppointment.mutate('1');

      await waitFor(() => {
        expect(result.current.isConfirming).toBe(false);
      });

      expect(bookingService.confirmAppointment).toHaveBeenCalledWith('1');
    });
  });

  describe('completeAppointment', () => {
    it('should complete appointment successfully', async () => {
      const completedAppointment = { ...mockAppointment, status: 'completed' as const };
      (bookingService.completeAppointment as jest.Mock).mockResolvedValue(completedAppointment);

      const { result } = renderHook(() => useBooking(), { wrapper });

      result.current.completeAppointment.mutate('1');

      await waitFor(() => {
        expect(result.current.isCompleting).toBe(false);
      });

      expect(bookingService.completeAppointment).toHaveBeenCalledWith('1');
    });
  });

  describe('query invalidation', () => {
    it('should invalidate relevant queries after creating appointment', async () => {
      (bookingService.createAppointment as jest.Mock).mockResolvedValue(mockAppointment);

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
      const { result } = renderHook(() => useBooking(), { wrapper });

      result.current.createAppointment.mutate({
        barberId: 'barber-1',
        serviceType: 'haircut',
        hairType: 'curly',
        location: { type: 'in_salon' },
        scheduledFor: new Date(),
      });

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: BOOKING_QUERY_KEYS.appointments,
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: BOOKING_QUERY_KEYS.myAppointments,
      });
    });
  });
});
