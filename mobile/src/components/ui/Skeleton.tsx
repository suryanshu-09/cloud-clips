import { View, Animated, type ViewProps } from 'react-native';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ISkeletonProps extends ViewProps {
  width?: number | string;
  height?: number | string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({
  width = '100%',
  height = 20,
  variant = 'rectangular',
  ...props
}: ISkeletonProps) {
  const prefersReducedMotion = useReducedMotion();
  const animatedValue = useRef(new Animated.Value(prefersReducedMotion ? 0.5 : 0)).current;

  useEffect(() => {
    if (prefersReducedMotion) {
      // Skip animation for users who prefer reduced motion — use static opacity
      animatedValue.setValue(0.5);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue, prefersReducedMotion]);

  const opacity = prefersReducedMotion
    ? 0.5
    : animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
      });

  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const getWidth = () => {
    return typeof width === 'number' ? width : undefined;
  };

  const getHeight = () => {
    return typeof height === 'number' ? height : undefined;
  };

  return (
    <Animated.View
      {...props}
      style={{
        width: getWidth(),
        height: getHeight(),
        opacity,
      }}
      className={`bg-gray-300 ${variantStyles[variant]}`}
      accessible={true}
      accessibilityLabel="Loading"
      accessibilityRole="none"
      importantForAccessibility="yes"
    />
  );
}

// Preset skeleton components for common use cases
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <View
      className="space-y-2"
      accessible={true}
      accessibilityLabel="Loading content"
      importantForAccessibility="yes"
    >
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '80%' : '100%'}
          height={16}
          variant="text"
          importantForAccessibility="no-hide-descendants"
        />
      ))}
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View
      className="p-4 bg-white rounded-xl"
      accessible={true}
      accessibilityLabel="Loading card"
      importantForAccessibility="yes"
    >
      <View className="flex-row items-center mb-4">
        <Skeleton
          width={48}
          height={48}
          variant="circular"
          importantForAccessibility="no-hide-descendants"
        />
        <View className="ml-3 flex-1">
          <Skeleton
            width="60%"
            height={16}
            variant="text"
            importantForAccessibility="no-hide-descendants"
          />
          <Skeleton
            width="40%"
            height={12}
            variant="text"
            importantForAccessibility="no-hide-descendants"
          />
        </View>
      </View>
      <SkeletonText lines={3} />
    </View>
  );
}
