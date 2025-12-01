import { View, Text, type ViewProps } from 'react-native';

interface IBadgeProps extends ViewProps {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Badge({ variant = 'default', size = 'md', children, ...props }: IBadgeProps) {
  const baseStyles = 'rounded-full items-center justify-center';

  const variantStyles = {
    default: 'bg-gray-100',
    primary: 'bg-indigo-500',
    secondary: 'bg-gray-100',
    success: 'bg-green-100',
    warning: 'bg-yellow-100',
    danger: 'bg-red-100',
    info: 'bg-blue-100',
  };

  const textVariantStyles = {
    default: 'text-gray-700',
    primary: 'text-white',
    secondary: 'text-gray-700',
    success: 'text-green-700',
    warning: 'text-yellow-700',
    danger: 'text-red-700',
    info: 'text-blue-700',
  };

  const sizeStyles = {
    sm: 'px-3 py-2 min-h-[32px]',
    md: 'px-4 py-3 min-h-[40px]',
    lg: 'px-5 py-4 min-h-[48px]',
  };

  const textSizeStyles = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <View {...props} className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`}>
      <Text className={`${textVariantStyles[variant]} ${textSizeStyles[size]} font-medium`}>
        {children}
      </Text>
    </View>
  );
}
