import { View, Image, Text, type ViewProps } from 'react-native';

interface IAvatarProps extends ViewProps {
  source?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  showBadge?: boolean;
  badgeColor?: string;
}

export function Avatar({
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

  const baseStyles = 'rounded-full items-center justify-center overflow-hidden';
  const badgeStyles = 'absolute bottom-0 right-0 rounded-full border-2 border-white';

  return (
    <View {...props} className="relative">
      <View className={`${baseStyles} ${sizeStyles[size]} bg-gray-300`}>
        {source ? (
          <Image source={{ uri: source }} className={`${sizeStyles[size]}`} resizeMode="cover" />
        ) : (
          <Text className={`${textSizeStyles[size]} font-semibold text-gray-700`}>
            {fallback.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      {showBadge && <View className={`${badgeStyles} ${badgeColor} ${badgeSizeStyles[size]}`} />}
    </View>
  );
}
