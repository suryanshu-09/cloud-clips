import { View, Text, Animated, Pressable } from 'react-native';
import { useEffect, useRef } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface IOfflineBannerProps {
  onRetry?: () => void;
}

/**
 * Animated banner that appears when the device is offline
 * Shows a retry button and connection status
 */
export function OfflineBanner({ onRetry }: IOfflineBannerProps) {
  const { isOffline, wasOffline, acknowledgeOnline } = useNetworkStatus();
  const isReducedMotionEnabled = useReducedMotion();
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOffline) {
      if (isReducedMotionEnabled) {
        slideAnim.setValue(0);
        opacityAnim.setValue(1);
        return;
      }

      // Slide down animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (wasOffline) {
      if (isReducedMotionEnabled) {
        slideAnim.setValue(-50);
        opacityAnim.setValue(0);
        acknowledgeOnline();
        return;
      }

      // Show "back online" briefly then hide
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -50,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          acknowledgeOnline();
        });
      }, 2000);
    } else {
      // Hide immediately if never was offline
      slideAnim.setValue(-50);
      opacityAnim.setValue(0);
    }
  }, [isOffline, wasOffline, slideAnim, opacityAnim, acknowledgeOnline, isReducedMotionEnabled]);

  // Don't render if not offline and never was offline
  if (!isOffline && !wasOffline) {
    return null;
  }

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
        opacity: opacityAnim,
      }}
      className="absolute top-0 left-0 right-0 z-50"
    >
      <View
        className={`px-4 py-3 flex-row items-center justify-between ${
          isOffline ? 'bg-red-500' : 'bg-green-500'
        }`}
      >
        <View className="flex-row items-center flex-1">
          <Text className="text-white text-lg mr-2">{isOffline ? '📡' : '✓'}</Text>
          <Text className="text-white font-medium flex-1">
            {isOffline ? 'No internet connection' : 'Back online! Syncing data...'}
          </Text>
        </View>
        {isOffline && onRetry && (
          <Pressable
            onPress={onRetry}
            className="bg-white/20 px-3 py-1 rounded-full"
            accessibilityLabel="Retry network connection"
            accessibilityRole="button"
          >
            <Text className="text-white font-medium">Retry</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

/**
 * Compact offline indicator for inline use
 */
export function OfflineIndicator() {
  const { isOffline } = useNetworkStatus();

  if (!isOffline) return null;

  return (
    <View className="flex-row items-center bg-yellow-100 px-3 py-2 rounded-lg">
      <Text className="text-yellow-800 text-sm">
        📡 Offline mode - Some features may be limited
      </Text>
    </View>
  );
}
