import '../../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as JotaiProvider } from 'jotai';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/services/api/queryClient';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function RootLayout() {
  useEffect(() => {
    console.log('[RootLayout] Mounted successfully');
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <JotaiProvider>
          <QueryClientProvider client={queryClient}>
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
          </QueryClientProvider>
        </JotaiProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
