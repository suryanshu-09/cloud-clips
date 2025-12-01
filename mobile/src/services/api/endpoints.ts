// API endpoint constants
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export const endpoints = {
  // Auth endpoints
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email',
    me: '/auth/me',
  },
  // User endpoints
  users: {
    profile: '/users/profile',
    updateProfile: '/users/profile',
    uploadAvatar: '/users/avatar',
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
    portfolio: (id: string) => `/barbers/${id}/portfolio`,
    updateProfile: '/barbers/profile',
    uploadPortfolio: '/barbers/portfolio',
  },
  // Appointment endpoints
  appointments: {
    list: '/appointments',
    detail: (id: string) => `/appointments/${id}`,
    create: '/appointments',
    update: (id: string) => `/appointments/${id}`,
    cancel: (id: string) => `/appointments/${id}/cancel`,
    complete: (id: string) => `/appointments/${id}/complete`,
    upcoming: '/appointments/upcoming',
    past: '/appointments/past',
  },
  // Product endpoints
  products: {
    list: '/products',
    detail: (id: string) => `/products/${id}`,
    byBarber: (barberId: string) => `/products/barber/${barberId}`,
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
    conversations: '/chat/conversations',
    messages: (appointmentId: string) => `/chat/${appointmentId}/messages`,
    send: (appointmentId: string) => `/chat/${appointmentId}/send`,
  },
  // Coupon endpoints
  coupons: {
    list: '/coupons',
    validate: '/coupons/validate',
    apply: '/coupons/apply',
  },
  // Payment endpoints
  payments: {
    createIntent: '/payments/create-intent',
    confirm: '/payments/confirm',
    webhook: '/payments/webhook',
  },
  // Notification endpoints
  notifications: {
    list: '/notifications',
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: '/notifications/read-all',
    registerToken: '/notifications/register-token',
  },
} as const;
