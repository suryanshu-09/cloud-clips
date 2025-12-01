import { View, Animated, type ViewProps } from 'react-native';
import { useEffect, useRef } from 'react';

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
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
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
    />
  );
}

// Preset skeleton components for common use cases
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <View className="space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '80%' : '100%'}
          height={16}
          variant="text"
        />
      ))}
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View className="p-4 bg-white rounded-xl">
      <View className="flex-row items-center mb-4">
        <Skeleton width={48} height={48} variant="circular" />
        <View className="ml-3 flex-1">
          <Skeleton width="60%" height={16} variant="text" />
          <Skeleton width="40%" height={12} variant="text" />
        </View>
      </View>
      <SkeletonText lines={3} />
    </View>
  );
}
