/**
 * useOrders Hook
 * Manages order creation and fetching
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createOrder, fetchOrders, fetchOrderById, cancelOrder } from '../services/productService';
import type { IOrder, ICreateOrderRequest } from '../types';

export const ORDER_QUERY_KEYS = {
  orders: ['orders'] as const,
  order: (id: string) => ['orders', id] as const,
};

interface UseOrdersOptions {
  onSuccess?: (order: IOrder) => void;
  onError?: (error: Error) => void;
}

/**
 * Fetch user's orders
 */
export const useOrders = () => {
  return useQuery({
    queryKey: ORDER_QUERY_KEYS.orders,
    queryFn: fetchOrders,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Fetch a single order by ID
 */
export const useOrder = (orderId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ORDER_QUERY_KEYS.order(orderId),
    queryFn: () => fetchOrderById(orderId),
    enabled: options?.enabled !== false && !!orderId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook for order mutations (create, cancel)
 */
export const useOrderMutations = (options?: UseOrdersOptions) => {
  const queryClient = useQueryClient();

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: (orderData: ICreateOrderRequest) => createOrder(orderData),
    onSuccess: (data) => {
      // Invalidate orders list to refetch
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.orders });
      options?.onSuccess?.(data.order);
    },
    onError: (error: Error) => {
      console.error('Failed to create order:', error);
      options?.onError?.(error);
    },
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId),
    onSuccess: (data, orderId) => {
      // Update the specific order in the cache
      queryClient.setQueryData(ORDER_QUERY_KEYS.order(orderId), data);
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.orders });
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      console.error('Failed to cancel order:', error);
      options?.onError?.(error);
    },
  });

  return {
    // Mutations
    createOrder: createOrderMutation,
    cancelOrder: cancelOrderMutation,

    // Loading states
    isCreating: createOrderMutation.isPending,
    isCanceling: cancelOrderMutation.isPending,

    // Error states
    createError: createOrderMutation.error,
    cancelError: cancelOrderMutation.error,

    // Success states
    isCreateSuccess: createOrderMutation.isSuccess,
    isCancelSuccess: cancelOrderMutation.isSuccess,
  };
};
