import { QueryClient } from '@tanstack/react-query';
import { PERFORMANCE_CONSTANTS } from '@/utils/performance';

const { QUERY_CACHE } = PERFORMANCE_CONSTANTS;

/**
 * TanStack Query client with performance-optimized defaults.
 *
 * Cache strategy:
 *   - gcTime (garbage collection): how long unused data stays in memory cache
 *   - staleTime: how long data is considered fresh before a background refetch
 *
 * Per-query overrides (use these staleTime values in individual hooks):
 *   - Availability slots  → QUERY_CACHE.SHORT  (30s)   — changes frequently
 *   - Nearby barbers      → QUERY_CACHE.MEDIUM (2min)  — changes on location
 *   - Barber profiles     → QUERY_CACHE.LONG   (5min)  — stable data
 *   - Products/categories → QUERY_CACHE.LONG   (5min)  — stable data
 *   - Config/categories   → QUERY_CACHE.VERY_LONG (30min) — almost static
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep unused cached data in memory for 10 minutes (reduced re-fetches on navigation)
      gcTime: QUERY_CACHE.LONG * 2,
      // Consider data stale after 2 minutes by default
      staleTime: QUERY_CACHE.MEDIUM,
      // Retry failed requests 2 times
      retry: 2,
      // Retry delay increases exponentially, capped at 30s
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch when app comes back to foreground (important for real-time data)
      refetchOnWindowFocus: true,
      // Refetch on reconnect to recover missed updates while offline
      refetchOnReconnect: true,
      // Network mode: don't fire queries while offline, queue them
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations once on transient failures
      retry: 1,
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
