import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

// Sentry configuration
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || Constants.expoConfig?.extra?.sentryDsn;

// Initialize Sentry
export const initSentry = (): void => {
  if (!SENTRY_DSN) {
    if (__DEV__) {
      console.warn('[Sentry] DSN not configured. Error tracking is disabled.');
    }
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      // Enable Sentry only in production
      enabled: !__DEV__,
      // Set environment
      environment: __DEV__ ? 'development' : 'production',
      // Debug mode
      debug: __DEV__,
      // Enable automatic session tracking
      enableAutoSessionTracking: true,
      // Session tracking interval (30 seconds)
      sessionTrackingIntervalMillis: 30000,
      // Attach stack traces to all messages
      attachStacktrace: true,
      // Before send callback - filter/modify events before sending
      beforeSend: (event, hint) => {
        // Don't send events in development
        if (__DEV__) {
          console.log('[Sentry] Event captured (not sent in dev):', event);
          return null;
        }
        return event;
      },
      // Integrations
      integrations: [
        // React Native specific integrations are added automatically
      ],
      // Trace sample rate (0.0 to 1.0)
      tracesSampleRate: __DEV__ ? 1.0 : 0.2,
      // Release name (use app version)
      release: Constants.expoConfig?.version,
      // Distribution (build number)
      dist:
        Constants.expoConfig?.ios?.buildNumber ||
        Constants.expoConfig?.android?.versionCode?.toString(),
    });

    if (__DEV__) {
      console.log('[Sentry] Initialized successfully (disabled in development)');
    }
  } catch (error) {
    console.error('[Sentry] Initialization error:', error);
  }
};

// Error tracking service
export const errorTrackingService = {
  // Capture exception
  captureException: (error: Error, context?: Record<string, unknown>): string => {
    if (context) {
      Sentry.setContext('additional_context', context);
    }
    return Sentry.captureException(error);
  },

  // Capture message
  captureMessage: (message: string, level: Sentry.SeverityLevel = 'info'): string => {
    return Sentry.captureMessage(message, level);
  },

  // Add breadcrumb
  addBreadcrumb: (breadcrumb: Sentry.Breadcrumb): void => {
    Sentry.addBreadcrumb(breadcrumb);
  },

  // Set user context
  setUser: (user: { id: string; email?: string; username?: string } | null): void => {
    Sentry.setUser(user);
  },

  // Set custom context
  setContext: (key: string, context: Record<string, unknown>): void => {
    Sentry.setContext(key, context);
  },

  // Set tag
  setTag: (key: string, value: string): void => {
    Sentry.setTag(key, value);
  },

  // Set tags (multiple)
  setTags: (tags: Record<string, string>): void => {
    Sentry.setTags(tags);
  },

  // Clear user context
  clearUser: (): void => {
    Sentry.setUser(null);
  },

  // Manually flush events
  flush: async (): Promise<void> => {
    await Sentry.flush();
  },

  // Close Sentry connection
  close: async (): Promise<void> => {
    await Sentry.close();
  },
};

// Export Sentry instance for advanced usage
export { Sentry };

export default errorTrackingService;
