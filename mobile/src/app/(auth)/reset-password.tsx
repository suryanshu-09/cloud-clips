import { useEffect, useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SafeView } from '@/components/ui/SafeView';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/features/auth/services/authService';

// Validation schema for reset password
const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type IResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetStatus, setResetStatus] = useState<'form' | 'success' | 'error' | 'invalid-token'>(
    'form'
  );
  const [errorMessage, setErrorMessage] = useState<string>('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<IResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Check if token is present
  useEffect(() => {
    if (!token) {
      setResetStatus('invalid-token');
      setErrorMessage('No reset token found. Please request a new password reset link.');
    }
  }, [token]);

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: (data: { token: string; newPassword: string }) => authService.resetPassword(data),
    onSuccess: () => {
      setResetStatus('success');
    },
    onError: (error: Error) => {
      setResetStatus('error');
      setErrorMessage(error.message || 'Failed to reset password');
    },
  });

  const onSubmit = (data: IResetPasswordFormData) => {
    if (!token) {
      Alert.alert('Error', 'No reset token found. Please request a new password reset link.');
      return;
    }

    resetPasswordMutation.mutate({
      token,
      newPassword: data.newPassword,
    });
  };

  const handleBackToLogin = () => {
    router.replace('/(auth)/login');
  };

  const handleRequestNewReset = () => {
    router.replace('/(auth)/forgot-password');
  };

  return (
    <SafeView>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 bg-white px-6 pt-4">
            {/* Back Button */}
            <Pressable onPress={() => router.back()} className="mb-6">
              <Text className="text-blue-600 text-base font-medium">← Back</Text>
            </Pressable>

            {/* Form State */}
            {resetStatus === 'form' && (
              <>
                {/* Header */}
                <View className="mb-8">
                  <Text className="text-4xl font-bold text-gray-900 mb-2">Reset Password</Text>
                  <Text className="text-lg text-gray-600">
                    Enter your new password below. Make sure it's strong and unique.
                  </Text>
                </View>

                {/* Password Form */}
                <View className="mb-6">
                  {/* New Password Input */}
                  <Controller
                    control={control}
                    name="newPassword"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="New Password"
                        placeholder="Enter new password"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.newPassword?.message}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoComplete="password-new"
                        textContentType="newPassword"
                        rightIcon={
                          <Pressable onPress={() => setShowPassword(!showPassword)}>
                            <Text className="text-blue-600 text-sm font-medium">
                              {showPassword ? 'Hide' : 'Show'}
                            </Text>
                          </Pressable>
                        }
                      />
                    )}
                  />

                  {/* Confirm Password Input */}
                  <View className="mt-4">
                    <Controller
                      control={control}
                      name="confirmPassword"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                          label="Confirm Password"
                          placeholder="Re-enter new password"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          error={errors.confirmPassword?.message}
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                          autoComplete="password-new"
                          textContentType="newPassword"
                          rightIcon={
                            <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                              <Text className="text-blue-600 text-sm font-medium">
                                {showConfirmPassword ? 'Hide' : 'Show'}
                              </Text>
                            </Pressable>
                          }
                        />
                      )}
                    />
                  </View>
                </View>

                {/* Password Requirements */}
                <View className="p-4 bg-gray-50 rounded-lg mb-6">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Password Requirements:
                  </Text>
                  <View className="space-y-1">
                    <Text className="text-sm text-gray-600">• At least 8 characters</Text>
                    <Text className="text-sm text-gray-600">• One uppercase letter</Text>
                    <Text className="text-sm text-gray-600">• One lowercase letter</Text>
                    <Text className="text-sm text-gray-600">• One number</Text>
                  </View>
                </View>

                {/* Reset Button */}
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={resetPasswordMutation.isPending}
                  onPress={handleSubmit(onSubmit)}
                >
                  Reset Password
                </Button>
              </>
            )}

            {/* Success State */}
            {resetStatus === 'success' && (
              <>
                <View className="items-center mb-8">
                  <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-4">
                    <Text className="text-5xl">✓</Text>
                  </View>
                  <Text className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</Text>
                  <Text className="text-base text-gray-600 text-center">
                    Your password has been successfully reset. You can now sign in with your new
                    password.
                  </Text>
                </View>

                <Button variant="primary" size="lg" fullWidth onPress={handleBackToLogin}>
                  Sign In
                </Button>
              </>
            )}

            {/* Error State */}
            {resetStatus === 'error' && (
              <>
                <View className="items-center mb-8">
                  <View className="w-24 h-24 bg-red-100 rounded-full items-center justify-center mb-4">
                    <Text className="text-5xl">✗</Text>
                  </View>
                  <Text className="text-2xl font-bold text-gray-900 mb-2">Reset Failed</Text>
                  <Text className="text-base text-gray-600 text-center mb-4">{errorMessage}</Text>
                </View>

                <Button variant="primary" size="lg" fullWidth onPress={handleRequestNewReset}>
                  Request New Reset Link
                </Button>

                <View className="mt-4">
                  <Button variant="ghost" size="lg" fullWidth onPress={handleBackToLogin}>
                    Back to Login
                  </Button>
                </View>
              </>
            )}

            {/* Invalid Token State */}
            {resetStatus === 'invalid-token' && (
              <>
                <View className="items-center mb-8">
                  <View className="w-24 h-24 bg-yellow-100 rounded-full items-center justify-center mb-4">
                    <Text className="text-5xl">⚠️</Text>
                  </View>
                  <Text className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</Text>
                  <Text className="text-base text-gray-600 text-center mb-4">
                    {errorMessage || 'This password reset link is invalid or has expired.'}
                  </Text>
                </View>

                <Button variant="primary" size="lg" fullWidth onPress={handleRequestNewReset}>
                  Request New Reset Link
                </Button>

                <View className="mt-4">
                  <Button variant="ghost" size="lg" fullWidth onPress={handleBackToLogin}>
                    Back to Login
                  </Button>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeView>
  );
}
