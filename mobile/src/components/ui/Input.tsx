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
  accessibilityHint?: string;
}

export const Input = forwardRef<TextInput, IInputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      disabled = false,
      fullWidth = true,
      accessibilityHint,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const containerStyles = fullWidth ? 'w-full' : '';
    const inputWrapperStyles = `flex-row items-center border rounded-lg px-3 ${
      error ? 'border-red-500' : isFocused ? 'border-blue-600' : 'border-gray-300'
    } ${disabled ? 'bg-gray-100' : 'bg-white'}`;

    // Build a descriptive accessibility label combining label + error state
    const computedAccessibilityLabel = props.accessibilityLabel ?? label;
    const computedAccessibilityHint =
      accessibilityHint ?? (error ? `Error: ${error}` : helperText ?? undefined);

    return (
      <View className={containerStyles} testID="input-container">
        {label && (
          <Text
            className="text-sm font-medium text-gray-700 mb-2"
            importantForAccessibility="no-hide-descendants"
          >
            {label}
          </Text>
        )}
        <View className={inputWrapperStyles}>
          {leftIcon && (
            <View className="mr-2" importantForAccessibility="no">
              {leftIcon}
            </View>
          )}
          <TextInput
            ref={ref}
            {...props}
            editable={!disabled}
            accessibilityLabel={computedAccessibilityLabel}
            accessibilityHint={computedAccessibilityHint}
            accessibilityState={{ disabled }}
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
          />
          {rightIcon && (
            <View className="ml-2" importantForAccessibility="no">
              {rightIcon}
            </View>
          )}
        </View>
        {error && (
          <Text
            className="text-sm text-red-500 mt-1"
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            {error}
          </Text>
        )}
        {helperText && !error && (
          <Text className="text-sm text-gray-500 mt-1">{helperText}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';
