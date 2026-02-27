import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useCart } from './useCart';
import { useCallback } from 'react';

const isDevMode = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

export interface ShippingAddress {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
}

export interface OrderItem {
  productId: Id<'products'>;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface OrderStatus {
  _id: Id<'orders'>;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  trackingNumber?: string;
  shippedAt?: number;
  deliveredAt?: number;
  createdAt: number;
  updatedAt: number;
}

const mockOrders = [
  {
    _id: 'order_1' as Id<'orders'>,
    userId: 'user_1',
    items: [
      {
        productId: 'prod_1' as Id<'products'>,
        name: 'Hair Gel',
        price: 12.99,
        quantity: 2,
        image: 'https://i.pravatar.cc/150?u=prod1',
      },
      {
        productId: 'prod_2' as Id<'products'>,
        name: 'Hair Spray',
        price: 8.99,
        quantity: 1,
        image: 'https://i.pravatar.cc/150?u=prod2',
      },
    ],
    subtotal: 34.97,
    tax: 3.5,
    shipping: 5.99,
    total: 44.46,
    status: 'delivered' as const,
    paymentStatus: 'paid' as const,
    shippingAddress: {
      name: 'John Doe',
      address: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
    },
    trackingNumber: 'TRACK123456',
    shippedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    deliveredAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
  {
    _id: 'order_2' as Id<'orders'>,
    userId: 'user_1',
    items: [
      {
        productId: 'prod_3' as Id<'products'>,
        name: 'Beard Oil',
        price: 18.99,
        quantity: 1,
        image: 'https://i.pravatar.cc/150?u=prod3',
      },
    ],
    subtotal: 18.99,
    tax: 1.9,
    shipping: 5.99,
    total: 26.88,
    status: 'shipped' as const,
    paymentStatus: 'paid' as const,
    shippingAddress: {
      name: 'John Doe',
      address: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
    },
    trackingNumber: 'TRACK789012',
    shippedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
];

export const useOrders = () => {
  const ordersData = useQuery(
    isDevMode ? 'skip' : api.orders.queries.getMyOrders,
    isDevMode ? 'skip' : undefined
  );
  const orderCountByStatusData = useQuery(
    isDevMode ? 'skip' : api.orders.queries.getOrderCountByStatus,
    isDevMode ? 'skip' : undefined
  );

  const orders = isDevMode ? mockOrders : (ordersData ?? []);
  const orderCountByStatus = isDevMode
    ? { pending: 0, confirmed: 0, shipped: 1, delivered: 1, cancelled: 0 }
    : (orderCountByStatusData ?? {});

  const isLoading = isDevMode ? false : ordersData === undefined;
  const error = !isDevMode && ordersData === null ? new Error('Failed to load orders') : null;

  return {
    orders,
    orderCountByStatus,
    isLoading,
    error,
  };
};

export const useOrder = (orderId: Id<'orders'>) => {
  const orderData = useQuery(
    isDevMode ? 'skip' : api.orders.queries.getOrderById,
    isDevMode ? 'skip' : { orderId }
  );
  const orderStatusData = useQuery(
    isDevMode ? 'skip' : api.orders.queries.getOrderStatus,
    isDevMode ? 'skip' : { orderId }
  );

  const order = isDevMode ? mockOrders.find((o) => o._id === orderId) || null : orderData;
  const orderStatus = isDevMode
    ? { status: order?.status, paymentStatus: order?.paymentStatus }
    : orderStatusData;

  const isLoading = isDevMode ? false : orderData === undefined;
  const error = !isDevMode && orderData === null ? new Error('Order not found') : null;

  return {
    order,
    orderStatus,
    isLoading,
    error,
  };
};

export const useBarberOrders = () => {
  const ordersData = useQuery(
    isDevMode ? 'skip' : api.orders.queries.getOrdersForBarber,
    isDevMode ? 'skip' : undefined
  );

  const orders = isDevMode ? mockOrders : (ordersData ?? []);
  const isLoading = isDevMode ? false : ordersData === undefined;
  const error = !isDevMode && ordersData === null ? new Error('Failed to load orders') : null;

  return {
    orders,
    isLoading,
    error,
  };
};

export const useCreateOrder = () => {
  const createOrderMutation = useMutation(api.orders.mutations.createOrder);
  const updatePaymentStatus = useMutation(api.orders.mutations.updatePaymentStatus);

  const createOrder = useCallback(
    async (args: {
      items: OrderItem[];
      subtotal: number;
      tax?: number;
      shipping?: number;
      discount?: number;
      total: number;
      shippingAddress: ShippingAddress;
      couponCode?: string;
    }) => {
      return await createOrderMutation({
        items: args.items.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal: args.subtotal,
        tax: args.tax,
        shipping: args.shipping,
        discount: args.discount,
        total: args.total,
        shippingAddress: args.shippingAddress,
        couponCode: args.couponCode,
      });
    },
    [createOrderMutation]
  );

  const markAsPaid = useCallback(
    async (orderId: Id<'orders'>, paymentIntentId: string) => {
      return await updatePaymentStatus({
        orderId,
        paymentStatus: 'paid',
        paymentIntentId,
      });
    },
    [updatePaymentStatus]
  );

  return {
    createOrder,
    markAsPaid,
    isPending: createOrderMutation.isPending,
    error: createOrderMutation.error,
  };
};

export const useCancelOrder = () => {
  const cancelOrderMutation = useMutation(api.orders.mutations.cancelOrder);

  const cancelOrder = useCallback(
    async (orderId: Id<'orders'>) => {
      return await cancelOrderMutation({ orderId });
    },
    [cancelOrderMutation]
  );

  return {
    cancelOrder,
    isPending: cancelOrderMutation.isPending,
    error: cancelOrderMutation.error,
  };
};

export const useUpdateOrderStatus = () => {
  const updateStatusMutation = useMutation(api.orders.mutations.updateOrderStatus);

  const updateStatus = useCallback(
    async (args: {
      orderId: Id<'orders'>;
      status: 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
      trackingNumber?: string;
    }) => {
      return await updateStatusMutation(args);
    },
    [updateStatusMutation]
  );

  return {
    updateStatus,
    isPending: updateStatusMutation.isPending,
    error: updateStatusMutation.error,
  };
};

export const useCheckout = () => {
  const { items, total, clearCart } = useCart();
  const { createOrder, markAsPaid, isPending, error } = useCreateOrder();

  const checkout = useCallback(
    async (shippingAddress: ShippingAddress, couponCode?: string) => {
      const subtotal = total;
      const tax = subtotal * 0.1;
      const shipping = items.length > 0 ? 5.99 : 0;
      const finalTotal = subtotal + tax + shipping;

      const orderIds = await createOrder({
        items: items.map((item) => ({
          productId: item.productId as Id<'products'>,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal,
        tax,
        shipping,
        total: finalTotal,
        shippingAddress,
        couponCode,
      });

      clearCart();

      return orderIds;
    },
    [items, total, createOrder, clearCart]
  );

  return {
    checkout,
    isPending,
    error,
  };
};
