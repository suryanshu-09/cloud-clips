import { TextInput, View, Text, type TextInputProps } from 'react-native';
import { forwardRef, useState } from 'react';

interface IInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
}

export const Input = forwardRef<TextInput, IInputProps>(
  (
    { label, error, helperText, leftIcon, rightIcon, disabled = false, fullWidth = true, ...props },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const containerStyles = fullWidth ? 'w-full' : '';
    const inputWrapperStyles = `flex-row items-center border rounded-lg px-3 ${
      error ? 'border-red-500' : isFocused ? 'border-blue-600' : 'border-gray-300'
    } ${disabled ? 'bg-gray-100' : 'bg-white'}`;

    return (
      <View className={containerStyles} testID="input-container">
        {label && (
          <Text allowFontScaling className="text-sm font-medium text-gray-700 mb-2">
            {label}
          </Text>
        )}
        <View className={inputWrapperStyles}>
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <TextInput
            ref={ref}
            {...props}
            editable={!disabled}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className="flex-1 py-3 text-base text-gray-900"
            placeholderTextColor="#9ca3af"
            accessibilityLabel={label ?? props.placeholder ?? 'Input field'}
            allowFontScaling
          />
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </View>
        {error && (
          <Text allowFontScaling className="text-sm text-red-500 mt-1">
            {error}
          </Text>
        )}
        {helperText && !error && (
          <Text allowFontScaling className="text-sm text-gray-600 mt-1">
            {helperText}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';
