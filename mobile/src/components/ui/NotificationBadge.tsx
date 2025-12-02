import { View, Text } from 'react-native';

interface INotificationBadgeProps {
  count: number;
  maxCount?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'danger';
}

export function NotificationBadge({
  count,
  maxCount = 99,
  size = 'md',
  variant = 'danger',
}: INotificationBadgeProps) {
  if (count <= 0) {
    return null;
  }

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  const sizeStyles = {
    sm: 'min-w-[16px] h-4 px-1',
    md: 'min-w-[20px] h-5 px-1.5',
    lg: 'min-w-[24px] h-6 px-2',
  };

  const textSizeStyles = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  const variantStyles = {
    default: 'bg-gray-500',
    primary: 'bg-blue-500',
    danger: 'bg-red-500',
  };

  return (
    <View
      className={`${sizeStyles[size]} ${variantStyles[variant]} rounded-full items-center justify-center absolute -top-1 -right-1 z-10`}
    >
      <Text className={`${textSizeStyles[size]} text-white font-bold`}>{displayCount}</Text>
    </View>
  );
}
