import {
  View,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SafeView } from '@/components/ui/SafeView';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useForgotPassword } from '@/features/auth/hooks/useRegister';
import { forgotPasswordSchema, type IForgotPasswordFormData } from '@/utils/validation/authSchemas';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { sendResetEmail, isSending, sendError, isSuccess } = useForgotPassword();
  const [emailSent, setEmailSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<IForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: IForgotPasswordFormData) => {
    try {
      await sendResetEmail(data.email);
      setEmailSent(true);
      Alert.alert(
        'Email Sent',
        'Password reset instructions have been sent to your email address.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset email. Please try again.');
    }
  };

  // Show error alert if sending fails
  if (sendError) {
    Alert.alert('Error', sendError.message);
  }

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
              <Text className="text-blue-600 text-base font-medium">← Back to Login</Text>
            </Pressable>

            {/* Header */}
            <View className="mb-8">
              <Text className="text-4xl font-bold text-gray-900 mb-2">Reset Password</Text>
              <Text className="text-lg text-gray-600">
                Enter your email address and we'll send you instructions to reset your password.
              </Text>
            </View>

            {!emailSent ? (
              <>
                {/* Email Input */}
                <View className="mb-6">
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="Email"
                        placeholder="Enter your email"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.email?.message}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        textContentType="emailAddress"
                      />
                    )}
                  />
                </View>

                {/* Send Reset Email Button */}
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isSending}
                  onPress={handleSubmit(onSubmit)}
                >
                  Send Reset Link
                </Button>

                {/* Info Text */}
                <View className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <Text className="text-sm text-blue-900">
                    💡 Check your spam folder if you don't receive the email within a few minutes.
                  </Text>
                </View>
              </>
            ) : (
              <>
                {/* Success State */}
                <View className="items-center mb-8">
                  <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
                    <Text className="text-4xl">✓</Text>
                  </View>
                  <Text className="text-xl font-bold text-gray-900 mb-2">Email Sent!</Text>
                  <Text className="text-base text-gray-600 text-center">
                    Check your email for password reset instructions.
                  </Text>
                </View>

                <Button variant="primary" size="lg" fullWidth onPress={() => router.back()}>
                  Back to Login
                </Button>
              </>
            )}

            {/* Login Link */}
            <View className="mt-6 flex-row justify-center items-center">
              <Text className="text-gray-600">Remember your password? </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text className="text-blue-600 font-semibold">Sign In</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeView>
  );
}
