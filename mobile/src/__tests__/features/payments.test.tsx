import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';
import {
  usePayment,
  usePaymentMethods,
  useTransactionHistory,
  useTransaction,
} from '@/features/payments/hooks/usePayment';
import { paymentService } from '@/features/payments/services/paymentService';
import type {
  IPaymentIntent,
  IPaymentMethod,
  IPaymentTransaction,
} from '@/features/payments/types';
import { PaymentStatus, PaymentMethodType } from '@/features/payments/types';

// Mock dependencies
jest.mock('@stripe/stripe-react-native', () => ({
  useStripe: () => ({
    confirmPayment: jest.fn(),
  }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

jest.mock('@/features/payments/services/paymentService');
jest.mock('@/features/payments/services/mockPaymentService');

describe('Payment Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
    (Alert.alert as jest.Mock).mockClear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('usePayment', () => {
    it('should create payment intent successfully', async () => {
      const mockIntent: IPaymentIntent = {
        id: 'pi_123',
        clientSecret: 'secret_123',
        amount: 5000,
        currency: 'usd',
        status: PaymentStatus.PENDING,
      };

      (paymentService.createPaymentIntent as jest.Mock).mockResolvedValue(mockIntent);

      const { result } = renderHook(() => usePayment(), { wrapper });

      result.current.createPaymentIntent({
        amount: 5000,
        currency: 'usd',
      });

      await waitFor(() => {
        expect(result.current.paymentIntent).toEqual(mockIntent);
      });
    });

    it('should handle payment intent creation error', async () => {
      const mockError = new Error('Failed to create payment intent');
      (paymentService.createPaymentIntent as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => usePayment(), { wrapper });

      result.current.createPaymentIntent({
        amount: 5000,
        currency: 'usd',
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to create payment intent');
      });
    });

    it('should process payment successfully', async () => {
      const mockTransaction: IPaymentTransaction = {
        id: 'txn_123',
        amount: 5000,
        currency: 'usd',
        status: PaymentStatus.SUCCEEDED,
        paymentMethodId: 'pm_123',
        appointmentId: 'appt-1',
        finalAmount: 5000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (paymentService.processPayment as jest.Mock).mockResolvedValue(mockTransaction);

      const { result } = renderHook(() => usePayment(), { wrapper });

      result.current.processPayment({
        paymentIntentId: 'pi_123',
        paymentMethodId: 'pm_123',
      });

      await waitFor(() => {
        expect(result.current.transaction).toEqual(mockTransaction);
      });
    });

    it('should handle payment processing error', async () => {
      const mockError = new Error('Payment declined');
      (paymentService.processPayment as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => usePayment(), { wrapper });

      result.current.processPayment({
        paymentIntentId: 'pi_123',
        paymentMethodId: 'pm_123',
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Payment Failed', 'Payment declined');
      });
    });
  });

  describe('usePaymentMethods', () => {
    const mockPaymentMethods: IPaymentMethod[] = [
      {
        id: 'pm_1',
        type: PaymentMethodType.CARD,
        card: {
          brand: 'visa',
          last4: '4242',
          expiryMonth: 12,
          expiryYear: 2025,
        },
        isDefault: true,
      },
      {
        id: 'pm_2',
        type: PaymentMethodType.CARD,
        card: {
          brand: 'mastercard',
          last4: '5555',
          expiryMonth: 6,
          expiryYear: 2026,
        },
        isDefault: false,
      },
    ];

    it('should fetch payment methods', async () => {
      (paymentService.getPaymentMethods as jest.Mock).mockResolvedValue(mockPaymentMethods);

      const { result } = renderHook(() => usePaymentMethods(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.paymentMethods).toEqual(mockPaymentMethods);
    });

    it('should add payment method', async () => {
      (paymentService.getPaymentMethods as jest.Mock).mockResolvedValue([]);
      (paymentService.addPaymentMethod as jest.Mock).mockResolvedValue(mockPaymentMethods[0]);

      const { result } = renderHook(() => usePaymentMethods(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.addPaymentMethod('pm_new');

      await waitFor(() => {
        expect(result.current.isAdding).toBe(false);
      });

      expect(paymentService.addPaymentMethod).toHaveBeenCalledWith('pm_new');
    });

    it('should remove payment method', async () => {
      (paymentService.getPaymentMethods as jest.Mock).mockResolvedValue(mockPaymentMethods);
      (paymentService.removePaymentMethod as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => usePaymentMethods(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.removePaymentMethod('pm_1');

      await waitFor(() => {
        expect(result.current.isRemoving).toBe(false);
      });

      expect(paymentService.removePaymentMethod).toHaveBeenCalledWith('pm_1');
    });

    it('should set default payment method', async () => {
      (paymentService.getPaymentMethods as jest.Mock).mockResolvedValue(mockPaymentMethods);
      (paymentService.setDefaultPaymentMethod as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => usePaymentMethods(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.setDefaultPaymentMethod('pm_2');

      await waitFor(() => {
        expect(result.current.isSettingDefault).toBe(false);
      });

      expect(paymentService.setDefaultPaymentMethod).toHaveBeenCalledWith('pm_2');
    });
  });

  describe('useTransactionHistory', () => {
    it('should fetch transaction history', async () => {
      const mockTransactions: IPaymentTransaction[] = [
        {
          id: 'txn_1',
          amount: 5000,
          currency: 'usd',
          status: PaymentStatus.SUCCEEDED,
          paymentMethodId: 'pm_1',
          appointmentId: 'appt-1',
          finalAmount: 5000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'txn_2',
          amount: 7500,
          currency: 'usd',
          status: PaymentStatus.SUCCEEDED,
          paymentMethodId: 'pm_2',
          appointmentId: 'appt-2',
          finalAmount: 7500,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (paymentService.getTransactionHistory as jest.Mock).mockResolvedValue(mockTransactions);

      const { result } = renderHook(() => useTransactionHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.transactions).toEqual(mockTransactions);
    });
  });

  describe('useTransaction', () => {
    const mockTransaction: IPaymentTransaction = {
      id: 'txn_123',
      amount: 5000,
      currency: 'usd',
      status: PaymentStatus.SUCCEEDED,
      paymentMethodId: 'pm_123',
      appointmentId: 'appt-1',
      finalAmount: 5000,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should fetch specific transaction', async () => {
      (paymentService.getTransaction as jest.Mock).mockResolvedValue(mockTransaction);

      const { result } = renderHook(() => useTransaction('txn_123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.transaction).toEqual(mockTransaction);
    });

    it('should request refund', async () => {
      (paymentService.getTransaction as jest.Mock).mockResolvedValue(mockTransaction);
      (paymentService.requestRefund as jest.Mock).mockResolvedValue({
        ...mockTransaction,
        status: PaymentStatus.REFUNDED,
      });

      const { result } = renderHook(() => useTransaction('txn_123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.requestRefund({ reason: 'Service not provided' });

      await waitFor(() => {
        expect(result.current.isRequestingRefund).toBe(false);
      });

      expect(paymentService.requestRefund).toHaveBeenCalledWith('txn_123', 'Service not provided');
    });
  });
});
