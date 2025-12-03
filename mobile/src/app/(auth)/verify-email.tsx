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
import { SafeView } from '@/components/ui/SafeView';
import { Button } from '@/components/ui/Button';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/features/auth/services/authService';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { token, email } = useLocalSearchParams<{ token?: string; email?: string }>();
  const [verificationStatus, setVerificationStatus] = useState<
    'pending' | 'verifying' | 'success' | 'error'
  >('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Verify email mutation
  const verifyEmailMutation = useMutation({
    mutationFn: (verificationToken: string) => authService.verifyEmail(verificationToken),
    onSuccess: () => {
      setVerificationStatus('success');
    },
    onError: (error: Error) => {
      setVerificationStatus('error');
      setErrorMessage(error.message || 'Failed to verify email');
    },
  });

  // Resend verification email mutation
  const resendMutation = useMutation({
    mutationFn: (userEmail: string) => authService.resendVerificationEmail(userEmail),
    onSuccess: () => {
      Alert.alert(
        'Email Sent',
        'A new verification email has been sent. Please check your inbox.',
        [{ text: 'OK' }]
      );
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to resend verification email');
    },
  });

  // Auto-verify if token is present in URL (from deep link)
  useEffect(() => {
    if (token) {
      setVerificationStatus('verifying');
      verifyEmailMutation.mutate(token);
    }
  }, [token]);

  const handleResendVerification = () => {
    if (email) {
      resendMutation.mutate(email);
    } else {
      Alert.alert(
        'Email Required',
        'Please enter your email address to resend the verification email.',
        [{ text: 'OK', onPress: () => router.push('/(auth)/login') }]
      );
    }
  };

  const handleContinue = () => {
    router.replace('/(auth)/login');
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
          <View className="flex-1 bg-white px-6 pt-12">
            {/* Back Button */}
            <Pressable onPress={() => router.back()} className="mb-6">
              <Text className="text-blue-600 text-base font-medium">← Back</Text>
            </Pressable>

            {/* Content based on verification status */}
            {verificationStatus === 'pending' && (
              <>
                {/* Header */}
                <View className="mb-8">
                  <Text className="text-4xl font-bold text-gray-900 mb-2">Verify Your Email</Text>
                  <Text className="text-lg text-gray-600">
                    We've sent a verification link to your email address. Please check your inbox
                    and click the link to verify your account.
                  </Text>
                </View>

                {/* Email Icon */}
                <View className="items-center mb-8">
                  <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4">
                    <Text className="text-5xl">📧</Text>
                  </View>
                  {email && <Text className="text-base text-gray-700 font-medium">{email}</Text>}
                </View>

                {/* Info Box */}
                <View className="p-4 bg-blue-50 rounded-lg mb-6">
                  <Text className="text-sm text-blue-900 mb-2">
                    Didn't receive the email? Check your spam folder or click below to resend.
                  </Text>
                </View>

                {/* Resend Button */}
                <Button
                  variant="outline"
                  size="lg"
                  fullWidth
                  loading={resendMutation.isPending}
                  onPress={handleResendVerification}
                >
                  Resend Verification Email
                </Button>

                {/* Continue to Login */}
                <View className="mt-4">
                  <Button variant="ghost" size="lg" fullWidth onPress={handleContinue}>
                    Continue to Login
                  </Button>
                </View>
              </>
            )}

            {verificationStatus === 'verifying' && (
              <View className="flex-1 items-center justify-center">
                <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4">
                  <Text className="text-5xl">⏳</Text>
                </View>
                <Text className="text-xl font-bold text-gray-900 mb-2">Verifying...</Text>
                <Text className="text-base text-gray-600 text-center">
                  Please wait while we verify your email address.
                </Text>
              </View>
            )}

            {verificationStatus === 'success' && (
              <>
                <View className="items-center mb-8">
                  <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-4">
                    <Text className="text-5xl">✓</Text>
                  </View>
                  <Text className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</Text>
                  <Text className="text-base text-gray-600 text-center">
                    Your email has been successfully verified. You can now sign in to your account.
                  </Text>
                </View>

                <Button variant="primary" size="lg" fullWidth onPress={handleContinue}>
                  Continue to Login
                </Button>
              </>
            )}

            {verificationStatus === 'error' && (
              <>
                <View className="items-center mb-8">
                  <View className="w-24 h-24 bg-red-100 rounded-full items-center justify-center mb-4">
                    <Text className="text-5xl">✗</Text>
                  </View>
                  <Text className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</Text>
                  <Text className="text-base text-gray-600 text-center mb-4">
                    {errorMessage || 'The verification link may have expired or is invalid.'}
                  </Text>
                </View>

                {/* Resend Button */}
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={resendMutation.isPending}
                  onPress={handleResendVerification}
                >
                  Resend Verification Email
                </Button>

                <View className="mt-4">
                  <Button variant="ghost" size="lg" fullWidth onPress={handleContinue}>
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
