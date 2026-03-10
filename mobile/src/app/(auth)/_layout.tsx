import { Stack } from 'expo-router';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function AuthLayout() {
  return (
    <ErrorBoundary>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="onboarding" />
      </Stack>
    </ErrorBoundary>
  );
}
