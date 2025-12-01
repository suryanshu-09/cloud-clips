import { Pressable, Text, ActivityIndicator, type PressableProps } from 'react-native';
import { forwardRef } from 'react';

interface IButtonProps extends PressableProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<typeof Pressable, IButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      children,
      fullWidth = false,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const baseStyles = 'rounded-lg items-center justify-center flex-row';

    const variantStyles = {
      primary: 'bg-blue-600 active:bg-blue-700',
      secondary: 'bg-gray-600 active:bg-gray-700',
      outline: 'border-2 border-blue-600 bg-transparent active:bg-blue-50',
      ghost: 'bg-transparent active:bg-gray-100',
      danger: 'bg-red-600 active:bg-red-700',
    };

    const sizeStyles = {
      sm: 'px-3 py-2',
      md: 'px-4 py-3',
      lg: 'px-6 py-4',
    };

    const textVariantStyles = {
      primary: 'text-white font-semibold',
      secondary: 'text-white font-semibold',
      outline: 'text-blue-600 font-semibold',
      ghost: 'text-gray-900 font-semibold',
      danger: 'text-white font-semibold',
    };

    const textSizeStyles = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    };

    const disabledStyles = 'opacity-50';
    const widthStyles = fullWidth ? 'w-full' : '';

    return (
      <Pressable
        {...props}
        // @ts-ignore
        ref={ref}
        disabled={isDisabled}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${
          isDisabled ? disabledStyles : ''
        } ${widthStyles}`}
      >
        {loading && (
          <ActivityIndicator
            size="small"
            color={variant === 'outline' ? '#2563eb' : '#ffffff'}
            className="mr-2"
          />
        )}
        <Text className={`${textVariantStyles[variant]} ${textSizeStyles[size]}`}>{children}</Text>
      </Pressable>
    );
  }
);

Button.displayName = 'Button';
