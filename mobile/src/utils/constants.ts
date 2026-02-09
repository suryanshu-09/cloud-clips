/**
 * Shared constants for Cloud Clips mobile app
 *
 * This file contains application-wide constants that don't change at runtime.
 * For configuration that might vary by environment, use environment variables.
 */

// ============================================================================
// App Information
// ============================================================================

export const APP_NAME = 'Cloud Clips';
export const APP_VERSION = '1.0.0';
export const SUPPORT_EMAIL = 'support@cloudclips.app';

// ============================================================================
// API Configuration
// ============================================================================

export const API_TIMEOUT = 30000; // 30 seconds
export const API_RETRY_ATTEMPTS = 3;
export const API_RETRY_DELAY = 1000; // 1 second

// ============================================================================
// Pagination Defaults
// ============================================================================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ============================================================================
// Validation Limits
// ============================================================================

export const VALIDATION = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 15,
  BIO_MAX_LENGTH: 500,
  REVIEW_MAX_LENGTH: 1000,
  CHAT_MESSAGE_MAX_LENGTH: 2000,
} as const;

// ============================================================================
// Distance & Location
// ============================================================================

export const DEFAULT_SEARCH_RADIUS = 10; // miles
export const MAX_SEARCH_RADIUS = 50; // miles
export const EARTH_RADIUS_MILES = 3959;
export const EARTH_RADIUS_KM = 6371;

// ============================================================================
// Time Constants (in milliseconds)
// ============================================================================

export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

// ============================================================================
// Cache Durations (in milliseconds)
// ============================================================================

export const CACHE_DURATION = {
  SHORT: 30 * 1000, // 30 seconds
  MEDIUM: 2 * 60 * 1000, // 2 minutes
  LONG: 5 * 60 * 1000, // 5 minutes
  VERY_LONG: 30 * 60 * 1000, // 30 minutes
} as const;

// ============================================================================
// UI Constants
// ============================================================================

export const UI = {
  // Animation durations
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },

  // Debounce delays
  DEBOUNCE: {
    SEARCH: 300,
    INPUT: 500,
    SCROLL: 100,
  },

  // Toast durations
  TOAST_DURATION: {
    SHORT: 2000,
    NORMAL: 4000,
    LONG: 6000,
  },

  // FlatList settings
  FLATLIST: {
    INITIAL_NUM_TO_RENDER: 10,
    MAX_TO_RENDER_PER_BATCH: 10,
    WINDOW_SIZE: 5,
    UPDATE_CELLS_BATCHING_PERIOD: 50,
  },
} as const;

// ============================================================================
// Feature Flags (can be overridden by remote config)
// ============================================================================

export const FEATURE_FLAGS = {
  ENABLE_BIOMETRICS: true,
  ENABLE_OFFLINE_MODE: true,
  ENABLE_ANALYTICS: true,
  ENABLE_CRASH_REPORTING: true,
  ENABLE_PUSH_NOTIFICATIONS: true,
} as const;

// ============================================================================
// Role Definitions
// ============================================================================

export const USER_ROLES = {
  CLIENT: 'client',
  BARBER: 'barber',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// ============================================================================
// Appointment Status
// ============================================================================

export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUS)[keyof typeof APPOINTMENT_STATUS];

// ============================================================================
// Order Status
// ============================================================================

export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
