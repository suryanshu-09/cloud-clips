import { View, Text, Pressable, ScrollView } from 'react-native';
import { Button } from './Button';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface IErrorStateProps {
  error?: Error | string | null;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  showDetails?: boolean;
  fullScreen?: boolean;
}

/**
 * Comprehensive error state component with retry functionality
 * Handles different error types and provides appropriate messaging
 */
export function ErrorState({
  error,
  title,
  message,
  onRetry,
  retryLabel = 'Try Again',
  showDetails = false,
  fullScreen = true,
}: IErrorStateProps) {
  const { isOffline } = useNetworkStatus();

  // Determine error details
  const errorMessage = error instanceof Error ? error.message : error;
  const isNetworkError =
    isOffline ||
    errorMessage?.toLowerCase().includes('network') ||
    errorMessage?.toLowerCase().includes('timeout') ||
    errorMessage?.toLowerCase().includes('connection');
  const isServerError =
    errorMessage?.toLowerCase().includes('500') ||
    errorMessage?.toLowerCase().includes('server error');
  const isNotFoundError =
    errorMessage?.toLowerCase().includes('404') ||
    errorMessage?.toLowerCase().includes('not found');

  // Determine appropriate icon and default title/message
  let icon = '⚠️';
  let defaultTitle = 'Something went wrong';
  let defaultMessage = 'An unexpected error occurred. Please try again.';

  if (isNetworkError) {
    icon = '📡';
    defaultTitle = 'Connection Error';
    defaultMessage = isOffline
      ? 'You appear to be offline. Check your internet connection and try again.'
      : 'Unable to connect to the server. Please check your connection.';
  } else if (isServerError) {
    icon = '🔧';
    defaultTitle = 'Server Error';
    defaultMessage = 'Our servers are having issues. Please try again later.';
  } else if (isNotFoundError) {
    icon = '🔍';
    defaultTitle = 'Not Found';
    defaultMessage = 'The requested content could not be found.';
  }

  const containerClass = fullScreen
    ? 'flex-1 items-center justify-center p-6 bg-white'
    : 'items-center justify-center p-6';

  return (
    <View className={containerClass}>
      <Text className="text-6xl mb-4">{icon}</Text>
      <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
        {title || defaultTitle}
      </Text>
      <Text className="text-base text-gray-600 text-center mb-6 max-w-[300px]">
        {message || defaultMessage}
      </Text>

      {onRetry && (
        <Button onPress={onRetry} variant="primary">
          {retryLabel}
        </Button>
      )}

      {showDetails && errorMessage && (
        <Pressable className="mt-4">
          <ScrollView className="max-h-32 mt-2 p-3 bg-gray-100 rounded-lg">
            <Text className="text-xs text-gray-500 font-mono">{errorMessage}</Text>
          </ScrollView>
        </Pressable>
      )}
    </View>
  );
}

/**
 * Compact inline error message
 */
export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View className="flex-row items-center bg-red-50 px-4 py-3 rounded-lg">
      <Text className="text-red-600 flex-1">{message}</Text>
      {onRetry && (
        <Pressable onPress={onRetry} className="ml-2">
          <Text className="text-red-700 font-medium">Retry</Text>
        </Pressable>
      )}
    </View>
  );
}

/**
 * Toast-style error notification
 */
export function ErrorToast({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <Pressable
      onPress={onDismiss}
      className="bg-red-500 px-4 py-3 rounded-lg flex-row items-center shadow-lg"
    >
      <Text className="text-white flex-1">{message}</Text>
      {onDismiss && <Text className="text-white/80 ml-2">✕</Text>}
    </Pressable>
  );
}
