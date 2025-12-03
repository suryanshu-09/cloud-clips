import '../../global.css';
import { useEffect, useCallback } from 'react';
import { View, I18nManager } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as JotaiProvider } from 'jotai';
import { QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { queryClient } from '@/services/api/queryClient';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { initSentry, errorTrackingService } from '@/services/errorTracking/sentry';
import { offlineSyncService } from '@/services/offline/offlineSync';
import { StripeProviderWrapper } from '@/services/stripe/provider';
import { initializeStripe } from '@/features/payments/services/stripeService';
import apiClient from '@/services/api/client';
// Initialize i18n - must be imported before using translations
import '@/services/i18n';
import { i18nService } from '@/services/i18n';

/**
 * Inner component that uses hooks requiring providers
 */
function AppContent() {
  const { isOffline, wasOffline, acknowledgeOnline } = useNetworkStatus();

  // Sync TanStack Query's online status with our network status
  useEffect(() => {
    onlineManager.setOnline(!isOffline);
  }, [isOffline]);

  // Sync pending actions when back online
  useEffect(() => {
    if (!isOffline && wasOffline) {
      const syncPendingActions = async () => {
        // eslint-disable-next-line no-console
        console.log('[App] Back online, syncing pending actions...');
        const pendingCount = offlineSyncService.getPendingCount();

        if (pendingCount > 0) {
          const result = await offlineSyncService.syncAll(async (action) => {
            try {
              await apiClient({
                method: action.method,
                url: action.endpoint,
                data: action.data,
              });
              return true;
            } catch (error) {
              console.error('[App] Failed to sync action:', action.id, error);
              return false;
            }
          });

          // eslint-disable-next-line no-console
          console.log('[App] Sync complete:', result);

          // Invalidate relevant queries to refresh data
          queryClient.invalidateQueries();
        }

        acknowledgeOnline();
      };

      syncPendingActions();
    }
  }, [isOffline, wasOffline, acknowledgeOnline]);

  const handleRetry = useCallback(() => {
    queryClient.invalidateQueries();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner onRetry={handleRetry} />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(client)" />
        <Stack.Screen name="(barber)" />
      </Stack>
      <StatusBar style="auto" />
    </View>
  );
}

/**
 * Root Layout Component
 *
 * Performance optimizations included:
 * - Sentry error tracking and performance monitoring initialized
 * - Query client with optimized cache settings
 * - Error boundary for graceful error handling
 * - Offline support with automatic sync when back online
 */
export default function RootLayout() {
  useEffect(() => {
    // Initialize Sentry for error tracking and performance monitoring
    initSentry();

    // Initialize Stripe SDK
    initializeStripe().then((success) => {
      if (success) {
        // eslint-disable-next-line no-console
        console.log('[RootLayout] Stripe initialized successfully');
      } else {
        console.warn('[RootLayout] Stripe not configured - payment features disabled');
      }
    });

    // Set initial context
    errorTrackingService.setTag('app_version', '1.0.0');
    errorTrackingService.addBreadcrumb({
      category: 'app',
      message: 'App initialized',
      level: 'info',
    });

    // Set RTL layout direction if needed
    const isRTL = i18nService.isRTL(i18nService.getCurrentLanguage());
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
    }

    // eslint-disable-next-line no-console
    console.log('[RootLayout] Mounted successfully with i18n and performance monitoring');
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <JotaiProvider>
          <QueryClientProvider client={queryClient}>
            <StripeProviderWrapper>
              <AppContent />
            </StripeProviderWrapper>
          </QueryClientProvider>
        </JotaiProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
