import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * useReducedMotion - Detects whether the user has enabled "Reduce Motion"
 * in their OS accessibility settings.
 *
 * When true, animations should be skipped or replaced with instant transitions
 * to prevent discomfort for users with vestibular disorders.
 *
 * @returns boolean - true if the user prefers reduced motion
 *
 * @example
 * ```tsx
 * const prefersReducedMotion = useReducedMotion();
 *
 * Animated.timing(value, {
 *   toValue: 1,
 *   duration: prefersReducedMotion ? 0 : 300,
 *   useNativeDriver: true,
 * }).start();
 * ```
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check the initial value
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setPrefersReducedMotion(enabled);
    });

    // Subscribe to changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled: boolean) => {
        setPrefersReducedMotion(enabled);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return prefersReducedMotion;
}
