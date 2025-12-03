// API endpoint constants
// In production, this should point to your actual API server
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

// API version for potential versioning
export const API_VERSION = 'v1';

export const endpoints = {
  // Auth endpoints
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    forgotPassword: '/auth/forgot',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email',
    resendVerification: '/auth/resend-verification',
    me: '/auth/me',
    firebaseSync: '/auth/firebase-sync',
    googleAuth: '/auth/google',
    appleAuth: '/auth/apple',
  },
  // User endpoints
  users: {
    profile: '/users/profile',
    updateProfile: '/users/profile',
    uploadAvatar: '/users/avatar',
    detail: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
    notifications: (id: string) => `/users/${id}/notifications`,
  },
  // Barber endpoints
  barbers: {
    list: '/barbers',
    detail: (id: string) => `/barbers/${id}`,
    nearby: '/barbers/nearby',
    search: '/barbers/search',
    services: (id: string) => `/barbers/${id}/services`,
    availability: (id: string) => `/barbers/${id}/availability`,
    reviews: (id: string) => `/barbers/${id}/reviews`,
    portfolio: (id: string) => `/barbers/${id}/gallery`,
    updateProfile: '/barbers/profile',
    uploadPortfolio: '/barbers/gallery',
    schedule: (id: string) => `/barbers/${id}/schedule`,
  },
  // Appointment endpoints
  appointments: {
    list: '/appointments',
    detail: (id: string) => `/appointments/${id}`,
    create: '/appointments',
    update: (id: string) => `/appointments/${id}`,
    cancel: (id: string) => `/appointments/${id}/cancel`,
    confirm: (id: string) => `/appointments/${id}/confirm`,
    complete: (id: string) => `/appointments/${id}/complete`,
    review: (id: string) => `/appointments/${id}/review`,
    upcoming: '/appointments/upcoming',
    past: '/appointments/past',
  },
  // Product endpoints
  products: {
    list: '/products',
    detail: (id: string) => `/products/${id}`,
    byBarber: (barberId: string) => `/products/barber/${barberId}`,
    categories: '/products/categories',
    create: '/products',
    update: (id: string) => `/products/${id}`,
    delete: (id: string) => `/products/${id}`,
  },
  // Order endpoints
  orders: {
    list: '/orders',
    detail: (id: string) => `/orders/${id}`,
    create: '/orders',
    cancel: (id: string) => `/orders/${id}/cancel`,
    updateStatus: (id: string) => `/orders/${id}/status`,
  },
  // Review endpoints
  reviews: {
    create: '/reviews',
    update: (id: string) => `/reviews/${id}`,
    delete: (id: string) => `/reviews/${id}`,
    byBarber: (barberId: string) => `/reviews/barber/${barberId}`,
  },
  // Chat endpoints
  chat: {
    threads: '/chats',
    messages: (appointmentId: string) => `/chats/${appointmentId}`,
    send: (appointmentId: string) => `/chats/${appointmentId}`,
    markRead: (appointmentId: string) => `/chats/${appointmentId}/read`,
  },
  // Coupon endpoints
  coupons: {
    list: '/coupons',
    detail: (code: string) => `/coupons/${code}`,
    validate: '/coupons/validate',
    apply: '/coupons/apply',
    create: '/coupons',
    update: (id: string) => `/coupons/${id}`,
    delete: (id: string) => `/coupons/${id}`,
  },
  // Payment endpoints
  payments: {
    createIntent: '/payments/intent',
    confirm: '/payments/confirm',
    methods: '/payments/methods',
    deleteMethod: (id: string) => `/payments/methods/${id}`,
    setDefaultMethod: (id: string) => `/payments/methods/${id}/default`,
    refund: '/payments/refund',
    history: '/payments/history',
  },
  // Notification endpoints
  notifications: {
    list: '/notifications',
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: '/notifications/read-all',
    registerToken: '/notifications/token',
    delete: (id: string) => `/notifications/${id}`,
  },
} as const;

// Export type for type-safe endpoint access
export type Endpoints = typeof endpoints;
