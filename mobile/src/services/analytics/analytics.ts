import {
  getAnalytics,
  logEvent,
  setUserId,
  setUserProperties,
  Analytics,
} from 'firebase/analytics';
import { app } from '../firebase/config';
import Constants from 'expo-constants';

// Initialize Firebase Analytics (only for web)
let analytics: Analytics | null = null;

// Analytics is only available on web platform with Firebase
const isAnalyticsAvailable = () => {
  return typeof window !== 'undefined' && app !== null;
};

if (isAnalyticsAvailable()) {
  try {
    analytics = getAnalytics(app!);
    console.log('[Analytics] Firebase Analytics initialized');
  } catch (error) {
    console.warn('[Analytics] Could not initialize Firebase Analytics:', error);
  }
}

// Event names (following Firebase Analytics conventions)
export const AnalyticsEvents = {
  // Screen views
  SCREEN_VIEW: 'screen_view',

  // Auth events
  LOGIN: 'login',
  SIGN_UP: 'sign_up',
  LOGOUT: 'logout',

  // Booking events
  VIEW_BARBER: 'view_barber',
  START_BOOKING: 'start_booking',
  SELECT_SERVICE: 'select_service',
  SELECT_TIME: 'select_time',
  COMPLETE_BOOKING: 'complete_booking',
  CANCEL_BOOKING: 'cancel_booking',

  // Product events
  VIEW_PRODUCT: 'view_item',
  ADD_TO_CART: 'add_to_cart',
  REMOVE_FROM_CART: 'remove_from_cart',
  VIEW_CART: 'view_cart',
  BEGIN_CHECKOUT: 'begin_checkout',
  PURCHASE: 'purchase',

  // Search events
  SEARCH: 'search',

  // Engagement events
  SHARE: 'share',
  REVIEW_SUBMITTED: 'review_submitted',
  CHAT_MESSAGE_SENT: 'chat_message_sent',

  // App events
  APP_OPEN: 'app_open',
  ERROR: 'error',
} as const;

// Analytics service
export const analyticsService = {
  // Log custom event
  logEvent: (eventName: string, params?: Record<string, unknown>): void => {
    try {
      if (analytics) {
        logEvent(analytics, eventName, params);
      }

      // Log to console in development
      if (__DEV__) {
        console.log('[Analytics] Event:', eventName, params);
      }
    } catch (error) {
      console.error('[Analytics] Error logging event:', error);
    }
  },

  // Log screen view
  logScreenView: (screenName: string, screenClass?: string): void => {
    analyticsService.logEvent(AnalyticsEvents.SCREEN_VIEW, {
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
  },

  // Set user ID
  setUserId: (userId: string | null): void => {
    try {
      if (analytics && userId) {
        setUserId(analytics, userId);
      }
      if (__DEV__) {
        console.log('[Analytics] User ID set:', userId);
      }
    } catch (error) {
      console.error('[Analytics] Error setting user ID:', error);
    }
  },

  // Set user properties
  setUserProperties: (properties: Record<string, unknown>): void => {
    try {
      if (analytics) {
        setUserProperties(analytics, properties);
      }
      if (__DEV__) {
        console.log('[Analytics] User properties set:', properties);
      }
    } catch (error) {
      console.error('[Analytics] Error setting user properties:', error);
    }
  },

  // Auth events
  logLogin: (method: string): void => {
    analyticsService.logEvent(AnalyticsEvents.LOGIN, { method });
  },

  logSignUp: (method: string): void => {
    analyticsService.logEvent(AnalyticsEvents.SIGN_UP, { method });
  },

  logLogout: (): void => {
    analyticsService.logEvent(AnalyticsEvents.LOGOUT);
  },

  // Booking events
  logViewBarber: (barberId: string, barberName: string): void => {
    analyticsService.logEvent(AnalyticsEvents.VIEW_BARBER, {
      barber_id: barberId,
      barber_name: barberName,
    });
  },

  logStartBooking: (barberId: string): void => {
    analyticsService.logEvent(AnalyticsEvents.START_BOOKING, {
      barber_id: barberId,
    });
  },

  logCompleteBooking: (
    barberId: string,
    serviceType: string,
    amount: number,
    currency = 'USD'
  ): void => {
    analyticsService.logEvent(AnalyticsEvents.COMPLETE_BOOKING, {
      barber_id: barberId,
      service_type: serviceType,
      value: amount,
      currency,
    });
  },

  // Product events
  logViewProduct: (productId: string, productName: string, price: number): void => {
    analyticsService.logEvent(AnalyticsEvents.VIEW_PRODUCT, {
      items: [
        {
          item_id: productId,
          item_name: productName,
          price,
        },
      ],
    });
  },

  logAddToCart: (productId: string, productName: string, price: number, quantity: number): void => {
    analyticsService.logEvent(AnalyticsEvents.ADD_TO_CART, {
      items: [
        {
          item_id: productId,
          item_name: productName,
          price,
          quantity,
        },
      ],
      value: price * quantity,
    });
  },

  logPurchase: (
    orderId: string,
    amount: number,
    items: { id: string; name: string; price: number; quantity: number }[],
    currency = 'USD'
  ): void => {
    analyticsService.logEvent(AnalyticsEvents.PURCHASE, {
      transaction_id: orderId,
      value: amount,
      currency,
      items: items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  },

  // Search event
  logSearch: (searchTerm: string, category?: string): void => {
    analyticsService.logEvent(AnalyticsEvents.SEARCH, {
      search_term: searchTerm,
      category,
    });
  },

  // Error event
  logError: (errorMessage: string, errorCode?: string, fatal = false): void => {
    analyticsService.logEvent(AnalyticsEvents.ERROR, {
      error_message: errorMessage,
      error_code: errorCode,
      fatal,
    });
  },

  // App open
  logAppOpen: (): void => {
    analyticsService.logEvent(AnalyticsEvents.APP_OPEN, {
      app_version: Constants.expoConfig?.version,
      platform: Constants.platform?.ios ? 'ios' : 'android',
    });
  },
};

export default analyticsService;
