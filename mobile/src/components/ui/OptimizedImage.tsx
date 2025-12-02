import { memo, useMemo } from 'react';
import { View, Text, type ViewStyle, type StyleProp } from 'react-native';
import { Image, type ImageProps, type ImageContentFit, type ImageStyle } from 'expo-image';

interface IOptimizedImageProps extends Omit<ImageProps, 'source' | 'contentFit' | 'style'> {
  source?: string | null;
  fallbackIcon?: string;
  fallbackText?: string;
  contentFit?: ImageContentFit;
  showPlaceholder?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  width?: number | string;
  height?: number | string;
  style?: StyleProp<ImageStyle>;
}

// Blurhash placeholder for loading state - a neutral gray
const DEFAULT_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

/**
 * OptimizedImage - A performance-optimized image component
 *
 * Features:
 * - Uses expo-image for better performance and caching
 * - Built-in placeholder with blurhash
 * - Automatic memory caching
 * - Fallback support for missing images
 * - Lazy loading by default
 */
function OptimizedImageComponent({
  source,
  fallbackIcon = '📷',
  fallbackText,
  contentFit = 'cover',
  showPlaceholder = true,
  containerStyle,
  width,
  height,
  className,
  style,
  ...props
}: IOptimizedImageProps) {
  // Memoize the image source to prevent unnecessary re-renders
  const imageSource = useMemo(() => {
    if (!source) return null;
    return { uri: source };
  }, [source]);

  // Memoize the image style
  const imageStyle = useMemo((): ImageStyle => {
    const baseStyle: ImageStyle = {};
    if (width) baseStyle.width = width as number;
    if (height) baseStyle.height = height as number;
    return baseStyle;
  }, [width, height]);

  // Memoize the fallback container style
  const fallbackContainerStyle = useMemo(() => {
    const baseStyle: ViewStyle = {};
    if (width) baseStyle.width = width as number;
    if (height) baseStyle.height = height as number;
    return [containerStyle, baseStyle];
  }, [containerStyle, width, height]);

  if (!source) {
    return (
      <View
        style={fallbackContainerStyle}
        className={`bg-gray-200 items-center justify-center ${className || ''}`}
      >
        {fallbackText ? (
          <Text className="text-gray-500 font-semibold">{fallbackText}</Text>
        ) : (
          <Text className="text-2xl">{fallbackIcon}</Text>
        )}
      </View>
    );
  }

  return (
    <Image
      source={imageSource}
      contentFit={contentFit}
      transition={200}
      placeholder={showPlaceholder ? { blurhash: DEFAULT_BLURHASH } : undefined}
      cachePolicy="memory-disk"
      recyclingKey={source}
      style={[imageStyle, style]}
      className={className}
      {...props}
    />
  );
}

export const OptimizedImage = memo(OptimizedImageComponent);
