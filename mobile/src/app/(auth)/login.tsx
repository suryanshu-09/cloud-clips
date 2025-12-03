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
import { Link, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SafeView } from '@/components/ui/SafeView';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DevLoginHelper } from '@/components/auth/DevLoginHelper';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { AppleSignInButton } from '@/components/auth/AppleSignInButton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useBiometrics } from '@/features/auth/hooks/useBiometrics';
import { setAuthToken } from '@/services/api/client';
import { loginSchema, type ILoginFormData } from '@/utils/validation/authSchemas';
import { useTranslation } from '@/services/i18n/useTranslation';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { login, isLoggingIn, loginError, currentUser } = useAuth();
  const {
    isAvailable: biometricAvailable,
    isEnabled: biometricEnabled,
    biometricName,
    loginWithBiometrics,
    isLoading: biometricLoading,
  } = useBiometrics();
  const [showPassword, setShowPassword] = useState(false);
  const [isBiometricLoggingIn, setIsBiometricLoggingIn] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ILoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Handler for dev mode quick login
  const handleDevAccountSelect = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
  };

  const onSubmit = (data: ILoginFormData) => {
    login(data);
  };

  // Handle biometric login
  const handleBiometricLogin = async () => {
    setIsBiometricLoggingIn(true);
    try {
      const credentials = await loginWithBiometrics();
      if (credentials) {
        // Set the token and redirect to home
        setAuthToken(credentials.token);
        // The auth state should be restored - redirect based on stored user role
        const storedUser = currentUser;
        if (storedUser?.role === 'barber') {
          router.replace('/(barber)');
        } else {
          router.replace('/(client)');
        }
      }
    } catch (error: any) {
      Alert.alert(t('auth.login.biometricFailed'), error.message || t('auth.login.biometricRetry'));
    } finally {
      setIsBiometricLoggingIn(false);
    }
  };

  // Show error alert if login fails
  useEffect(() => {
    if (loginError) {
      Alert.alert(t('auth.login.loginFailed'), loginError.message);
    }
  }, [loginError, t]);

  // Check if biometric login is available and prompt
  const showBiometricButton = biometricAvailable && biometricEnabled && !biometricLoading;

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
            {/* Header */}
            <View className="mb-8">
              <Text className="text-4xl font-bold text-gray-900 mb-2">{t('auth.login.title')}</Text>
              <Text className="text-lg text-gray-600">{t('auth.login.subtitle')}</Text>
            </View>

            {/* Biometric Login Button */}
            {showBiometricButton && (
              <View className="mb-6">
                <Button
                  variant="outline"
                  size="lg"
                  fullWidth
                  loading={isBiometricLoggingIn}
                  onPress={handleBiometricLogin}
                >
                  {t('auth.login.biometricPrompt', { biometricName })}
                </Button>
                <View className="flex-row items-center my-4">
                  <View className="flex-1 h-px bg-gray-300" />
                  <Text className="mx-4 text-gray-500">{t('auth.login.orUseEmail')}</Text>
                  <View className="flex-1 h-px bg-gray-300" />
                </View>
              </View>
            )}

            {/* Login Form */}
            <View className="mb-6">
              {/* Email Input */}
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label={t('auth.login.email')}
                    placeholder={t('auth.login.emailPlaceholder')}
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

              {/* Password Input */}
              <View className="mt-4">
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label={t('auth.login.password')}
                      placeholder={t('auth.login.passwordPlaceholder')}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.password?.message}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoComplete="password"
                      textContentType="password"
                      rightIcon={
                        <Pressable onPress={() => setShowPassword(!showPassword)}>
                          <Text className="text-blue-600 text-sm font-medium">
                            {showPassword
                              ? t('auth.login.hidePassword')
                              : t('auth.login.showPassword')}
                          </Text>
                        </Pressable>
                      }
                    />
                  )}
                />
              </View>

              {/* Forgot Password Link */}
              <View className="mt-2 items-end">
                <Link href="/(auth)/forgot-password" asChild>
                  <Pressable>
                    <Text className="text-blue-600 font-medium">
                      {t('auth.login.forgotPassword')}
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>

            {/* Dev Login Helper */}
            <DevLoginHelper onSelectAccount={handleDevAccountSelect} />

            {/* Login Button */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoggingIn}
              onPress={handleSubmit(onSubmit)}
            >
              {t('auth.login.signIn')}
            </Button>

            {/* Register Link */}
            <View className="mt-6 flex-row justify-center items-center">
              <Text className="text-gray-600">{t('auth.login.noAccount')} </Text>
              <Link href="/(auth)/register" asChild>
                <Pressable>
                  <Text className="text-blue-600 font-semibold">{t('auth.login.signUp')}</Text>
                </Pressable>
              </Link>
            </View>

            {/* Social Login */}
            <View className="mt-8">
              <View className="flex-row items-center mb-4">
                <View className="flex-1 h-px bg-gray-300" />
                <Text className="mx-4 text-gray-500">{t('auth.login.orContinueWith')}</Text>
                <View className="flex-1 h-px bg-gray-300" />
              </View>

              <View className="flex-row gap-4">
                <GoogleSignInButton />
                <AppleSignInButton />
                {/* Fallback for platforms where neither is available */}
                {Platform.OS === 'web' && (
                  <>
                    <Button variant="outline" size="lg" fullWidth disabled>
                      Google
                    </Button>
                    <Button variant="outline" size="lg" fullWidth disabled>
                      Apple
                    </Button>
                  </>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeView>
  );
}
