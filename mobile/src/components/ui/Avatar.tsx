import { memo, useMemo } from 'react';
import { View, Text, type ViewProps } from 'react-native';
import { Image } from 'expo-image';

interface IAvatarProps extends ViewProps {
  source?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  showBadge?: boolean;
  badgeColor?: string;
}

// Blurhash placeholder for avatars - a neutral gray circle
const AVATAR_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

// Size configurations (in pixels)
const SIZE_MAP = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

/**
 * Avatar - Optimized avatar component with expo-image
 *
 * Performance optimizations:
 * - Uses expo-image for fast image loading and caching
 * - Wrapped with React.memo to prevent unnecessary re-renders
 * - Memoized style computations
 */
function AvatarComponent({
  source,
  size = 'md',
  fallback = 'U',
  showBadge = false,
  badgeColor = 'bg-green-500',
  ...props
}: IAvatarProps) {
  const sizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const textSizeStyles = {
    sm: 'text-xs',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-3xl',
  };

  const badgeSizeStyles = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
  };

  // Memoize the pixel size for expo-image
  const pixelSize = useMemo(() => SIZE_MAP[size], [size]);

  // Memoize the fallback text
  const fallbackChar = useMemo(() => fallback.charAt(0).toUpperCase(), [fallback]);

  const baseStyles = 'rounded-full items-center justify-center overflow-hidden';
  const badgeStyles = 'absolute bottom-0 right-0 rounded-full border-2 border-white';

  return (
    <View {...props} className="relative">
      <View className={`${baseStyles} ${sizeStyles[size]} bg-gray-300`}>
        {source ? (
          <Image
            source={{ uri: source }}
            style={{ width: pixelSize, height: pixelSize }}
            contentFit="cover"
            transition={150}
            placeholder={{ blurhash: AVATAR_BLURHASH }}
            cachePolicy="memory-disk"
            recyclingKey={source}
          />
        ) : (
          <Text className={`${textSizeStyles[size]} font-semibold text-gray-700`}>
            {fallbackChar}
          </Text>
        )}
      </View>
      {showBadge && <View className={`${badgeStyles} ${badgeColor} ${badgeSizeStyles[size]}`} />}
    </View>
  );
}

export const Avatar = memo(AvatarComponent);
