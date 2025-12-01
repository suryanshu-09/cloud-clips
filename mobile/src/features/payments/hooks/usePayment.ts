/**
 * usePayment Hook
 * Handles payment processing and payment intent creation
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStripe } from '@stripe/stripe-react-native';
import { Alert } from 'react-native';
import { paymentService } from '../services/paymentService';
import { mockPaymentService } from '../services/mockPaymentService';
import type {
  ICreatePaymentIntentRequest,
  IPaymentIntent,
  IPaymentMethod,
  IPaymentTransaction,
  IProcessPaymentRequest,
} from '../types';

// Check if dev mode is enabled
const isDevMode = process.env.EXPO_PUBLIC_DEV_MODE === 'true';
const service = isDevMode ? mockPaymentService : paymentService;

export const usePayment = () => {
  const queryClient = useQueryClient();
  const stripe = useStripe();

  // Create payment intent
  const createPaymentIntentMutation = useMutation({
    mutationFn: (data: ICreatePaymentIntentRequest) => service.createPaymentIntent(data),
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to create payment intent');
    },
  });

  // Process payment
  const processPaymentMutation = useMutation({
    mutationFn: async (data: IProcessPaymentRequest) => {
      return await service.processPayment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (error: Error) => {
      Alert.alert('Payment Failed', error.message || 'Payment processing failed');
    },
  });

  // Confirm payment with Stripe
  const confirmStripePayment = async (clientSecret: string, paymentMethodId: string) => {
    try {
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }

      const { error, paymentIntent } = await stripe.confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          paymentMethodId,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, paymentIntent };
    } catch (error) {
      const err = error as Error;
      Alert.alert('Payment Error', err.message);
      return { success: false, error: err };
    }
  };

  return {
    createPaymentIntent: createPaymentIntentMutation.mutate,
    isCreatingIntent: createPaymentIntentMutation.isPending,
    paymentIntent: createPaymentIntentMutation.data,
    processPayment: processPaymentMutation.mutate,
    isProcessing: processPaymentMutation.isPending,
    transaction: processPaymentMutation.data,
    confirmStripePayment,
  };
};

// Hook for fetching payment methods
export const usePaymentMethods = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<IPaymentMethod[]>({
    queryKey: ['paymentMethods'],
    queryFn: () => service.getPaymentMethods(),
  });

  // Add payment method
  const addPaymentMethodMutation = useMutation({
    mutationFn: (paymentMethodId: string) => service.addPaymentMethod(paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to add payment method');
    },
  });

  // Remove payment method
  const removePaymentMethodMutation = useMutation({
    mutationFn: (paymentMethodId: string) => service.removePaymentMethod(paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to remove payment method');
    },
  });

  // Set default payment method
  const setDefaultMutation = useMutation({
    mutationFn: (paymentMethodId: string) => service.setDefaultPaymentMethod(paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to set default payment method');
    },
  });

  return {
    paymentMethods: data || [],
    isLoading,
    error,
    addPaymentMethod: addPaymentMethodMutation.mutate,
    isAdding: addPaymentMethodMutation.isPending,
    removePaymentMethod: removePaymentMethodMutation.mutate,
    isRemoving: removePaymentMethodMutation.isPending,
    setDefaultPaymentMethod: setDefaultMutation.mutate,
    isSettingDefault: setDefaultMutation.isPending,
  };
};

// Hook for transaction history
export const useTransactionHistory = () => {
  const { data, isLoading, error } = useQuery<IPaymentTransaction[]>({
    queryKey: ['transactions'],
    queryFn: () => service.getTransactionHistory(),
  });

  return {
    transactions: data || [],
    isLoading,
    error,
  };
};

// Hook for a specific transaction
export const useTransaction = (transactionId: string) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<IPaymentTransaction>({
    queryKey: ['transaction', transactionId],
    queryFn: () => service.getTransaction(transactionId),
    enabled: !!transactionId,
  });

  // Request refund
  const requestRefundMutation = useMutation({
    mutationFn: ({ reason }: { reason?: string }) => service.requestRefund(transactionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to request refund');
    },
  });

  return {
    transaction: data,
    isLoading,
    error,
    requestRefund: requestRefundMutation.mutate,
    isRequestingRefund: requestRefundMutation.isPending,
  };
};
