import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';

/**
 * Deep linking configuration for the app
 * Handles both custom scheme (cloudclips://) and universal links (https://cloudclips.app)
 */

// Define the linking configuration
export const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: [
    Linking.createURL('/'),
    'cloudclips://',
    'https://cloudclips.app',
    'https://www.cloudclips.app',
  ],
  config: {
    screens: {
      // Auth screens
      '(auth)': {
        screens: {
          login: 'login',
          register: 'register',
          'forgot-password': 'forgot-password',
          onboarding: 'onboarding',
        },
      },
      // Client screens
      '(client)': {
        screens: {
          index: 'home',
          search: 'search',
          'booking/[barberId]': 'barber/:barberId',
          'booking/form': 'booking/form',
          'booking/schedule': 'booking/schedule',
          'booking/checkout': 'booking/checkout',
          'appointments/index': 'appointments',
          'appointments/[id]': 'appointment/:id',
          'chat/index': 'chat',
          'chat/[appointmentId]': 'chat/:appointmentId',
          'store/index': 'store',
          'store/[productId]': 'product/:productId',
          'store/cart': 'cart',
          coupons: 'coupons',
          'profile/index': 'profile',
          'profile/edit': 'profile/edit',
          'profile/orders': 'orders',
          'profile/settings': 'settings',
        },
      },
      // Barber screens
      '(barber)': {
        screens: {
          index: 'barber/dashboard',
          schedule: 'barber/schedule',
          'appointments/index': 'barber/appointments',
          'appointments/[id]': 'barber/appointment/:id',
          earnings: 'barber/earnings',
          'products/index': 'barber/products',
          'products/add': 'barber/products/add',
          'products/[id]/edit': 'barber/product/:id/edit',
          offers: 'barber/offers',
          'profile/index': 'barber/profile',
          'profile/edit': 'barber/profile/edit',
          'profile/gallery': 'barber/gallery',
        },
      },
    },
  },
  // Handle notification deep links
  async getInitialURL() {
    // Check if app was opened from a deep link
    const url = await Linking.getInitialURL();
    if (url != null) {
      return url;
    }

    // Check if app was opened from a notification
    const response = await Notifications.getLastNotificationResponseAsync();
    if (response?.notification.request.content.data?.url) {
      return response.notification.request.content.data.url as string;
    }

    return null;
  },
  // Subscribe to incoming links and notifications
  subscribe(listener) {
    // Listen for deep links
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      listener(url);
    });

    // Listen for notification taps
    const notificationSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const url = response.notification.request.content.data?.url;
        if (url && typeof url === 'string') {
          listener(url);
        }
      }
    );

    return () => {
      linkingSubscription.remove();
      notificationSubscription.remove();
    };
  },
};

/**
 * Parse a deep link URL and extract route parameters
 */
export function parseDeepLink(url: string): {
  screen: string;
  params: Record<string, string>;
} | null {
  try {
    const parsed = Linking.parse(url);
    const path = parsed.path || '';
    const params = parsed.queryParams || {};

    // Extract route and params from path
    const segments = path.split('/').filter(Boolean);

    return {
      screen: path,
      params: params as Record<string, string>,
    };
  } catch (error) {
    console.error('[DeepLink] Failed to parse URL:', url, error);
    return null;
  }
}

/**
 * Generate a deep link URL for sharing
 */
export function generateDeepLink(path: string, params?: Record<string, string | number>): string {
  const queryString = params
    ? '?' +
      Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&')
    : '';

  return `https://cloudclips.app/${path}${queryString}`;
}

/**
 * Generate a shareable link for a barber profile
 */
export function getBarberShareLink(barberId: string): string {
  return generateDeepLink(`barber/${barberId}`);
}

/**
 * Generate a shareable link for an appointment
 */
export function getAppointmentShareLink(appointmentId: string): string {
  return generateDeepLink(`appointment/${appointmentId}`);
}

/**
 * Generate a shareable link for a product
 */
export function getProductShareLink(productId: string): string {
  return generateDeepLink(`product/${productId}`);
}
