import { View, type ViewProps } from 'react-native';

interface ICardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Card({ variant = 'default', padding = 'md', children, ...props }: ICardProps) {
  const baseStyles = 'rounded-xl';

  const variantStyles = {
    default: 'bg-white',
    elevated: 'bg-white shadow-md',
    outlined: 'bg-white border border-gray-200',
  };

  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <View
      {...props}
      className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]}`}
    >
      {children}
    </View>
  );
}
