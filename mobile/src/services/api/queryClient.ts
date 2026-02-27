import { QueryClient } from '@tanstack/react-query';

// Create a query client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep inactive query data in cache for 10 minutes before garbage-collecting.
      // This covers the longest staleTime used in the app (10 min for barber profiles)
      // so navigating back never triggers a redundant network request.
      gcTime: 1000 * 60 * 10,
      // Stale time of 1 minute — individual queries override as needed
      staleTime: 1000 * 60,
      // Retry failed requests 2 times
      retry: 2,
      // Retry delay increases exponentially
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus keeps data fresh when the user switches back
      refetchOnWindowFocus: true,
      // Refetch on reconnect — re-sync data after a network drop
      refetchOnReconnect: true,
      // Network mode
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Network mode for mutations
      networkMode: 'online',
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  // Auth
  auth: {
    me: ['auth', 'me'] as const,
    token: ['auth', 'token'] as const,
  },
  // Barbers
  barbers: {
    all: ['barbers'] as const,
    list: (filters?: Record<string, unknown>) => ['barbers', 'list', filters] as const,
    detail: (id: string) => ['barbers', 'detail', id] as const,
    nearby: (location: { lat: number; lng: number; radius: number }) =>
      ['barbers', 'nearby', location] as const,
    services: (barberId: string) => ['barbers', 'services', barberId] as const,
    availability: (barberId: string, date?: string) =>
      ['barbers', 'availability', barberId, date] as const,
  },
  // Appointments
  appointments: {
    all: ['appointments'] as const,
    list: (filters?: Record<string, unknown>) => ['appointments', 'list', filters] as const,
    detail: (id: string) => ['appointments', 'detail', id] as const,
    upcoming: ['appointments', 'upcoming'] as const,
    past: ['appointments', 'past'] as const,
  },
  // Products
  products: {
    all: ['products'] as const,
    list: (filters?: Record<string, unknown>) => ['products', 'list', filters] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
    byBarber: (barberId: string) => ['products', 'barber', barberId] as const,
  },
  // Orders
  orders: {
    all: ['orders'] as const,
    list: (filters?: Record<string, unknown>) => ['orders', 'list', filters] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
  },
  // Reviews
  reviews: {
    all: ['reviews'] as const,
    byBarber: (barberId: string) => ['reviews', 'barber', barberId] as const,
    byUser: (userId: string) => ['reviews', 'user', userId] as const,
  },
  // Chat
  chat: {
    all: ['chat'] as const,
    conversations: ['chat', 'conversations'] as const,
    messages: (appointmentId: string) => ['chat', 'messages', appointmentId] as const,
  },
  // Coupons
  coupons: {
    all: ['coupons'] as const,
    available: ['coupons', 'available'] as const,
    validate: (code: string) => ['coupons', 'validate', code] as const,
  },
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    unread: ['notifications', 'unread'] as const,
  },
};

export default queryClient;
