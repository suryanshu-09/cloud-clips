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
import { Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SafeView } from '@/components/ui/SafeView';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DevLoginHelper } from '@/components/auth/DevLoginHelper';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { loginSchema, type ILoginFormData } from '@/utils/validation/authSchemas';

export default function LoginScreen() {
  const { login, isLoggingIn, loginError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

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

  // Show error alert if login fails
  if (loginError) {
    Alert.alert('Login Failed', loginError.message);
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
          <View className="flex-1 bg-white px-6 pt-12">
            {/* Header */}
            <View className="mb-8">
              <Text className="text-4xl font-bold text-gray-900 mb-2">Welcome Back</Text>
              <Text className="text-lg text-gray-600">Sign in to continue to Cloud Clips</Text>
            </View>

            {/* Login Form */}
            <View className="mb-6">
              {/* Email Input */}
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

              {/* Password Input */}
              <View className="mt-4">
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Password"
                      placeholder="Enter your password"
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
                            {showPassword ? 'Hide' : 'Show'}
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
                    <Text className="text-blue-600 font-medium">Forgot Password?</Text>
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
              Sign In
            </Button>

            {/* Register Link */}
            <View className="mt-6 flex-row justify-center items-center">
              <Text className="text-gray-600">Don't have an account? </Text>
              <Link href="/(auth)/register" asChild>
                <Pressable>
                  <Text className="text-blue-600 font-semibold">Sign Up</Text>
                </Pressable>
              </Link>
            </View>

            {/* Social Login (Optional) */}
            <View className="mt-8">
              <View className="flex-row items-center mb-4">
                <View className="flex-1 h-px bg-gray-300" />
                <Text className="mx-4 text-gray-500">Or continue with</Text>
                <View className="flex-1 h-px bg-gray-300" />
              </View>

              <View className="flex-row gap-4">
                <Button variant="outline" size="lg" fullWidth disabled>
                  Google
                </Button>
                <Button variant="outline" size="lg" fullWidth disabled>
                  Apple
                </Button>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeView>
  );
}
