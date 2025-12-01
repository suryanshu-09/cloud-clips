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
import { useRegister } from '@/features/auth/hooks/useRegister';
import { registerSchema, type IRegisterFormData } from '@/utils/validation/authSchemas';

export default function RegisterScreen() {
  const { register, isRegistering, registerError } = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'client' | 'barber'>('client');

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<IRegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: 'client',
    },
  });

  const onSubmit = (data: IRegisterFormData) => {
    register(data);
  };

  // Show error alert if registration fails
  if (registerError) {
    Alert.alert('Registration Failed', registerError.message);
  }

  const handleRoleSelect = (role: 'client' | 'barber') => {
    setSelectedRole(role);
    setValue('role', role);
  };

  return (
    <SafeView edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View className="bg-white px-6 pt-6 pb-8">
            {/* Header */}
            <View className="mb-4">
              <Text className="text-3xl font-bold text-gray-900 mb-1">Create Account</Text>
              <Text className="text-base text-gray-600">Join Cloud Clips today</Text>
            </View>

            {/* Role Selection */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">I am a</Text>
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => handleRoleSelect('client')}
                  className={`flex-1 p-4 rounded-lg border-2 ${
                    selectedRole === 'client'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  <Text
                    className={`text-center font-semibold ${
                      selectedRole === 'client' ? 'text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    Client
                  </Text>
                  <Text className="text-xs text-gray-500 text-center mt-1">Book services</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleRoleSelect('barber')}
                  className={`flex-1 p-4 rounded-lg border-2 ${
                    selectedRole === 'barber'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  <Text
                    className={`text-center font-semibold ${
                      selectedRole === 'barber' ? 'text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    Barber
                  </Text>
                  <Text className="text-xs text-gray-500 text-center mt-1">Offer services</Text>
                </Pressable>
              </View>
              {errors.role && (
                <Text className="text-sm text-red-500 mt-1">{errors.role.message}</Text>
              )}
            </View>

            {/* Registration Form */}
            <View className="mb-4">
              {/* Name Input */}
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.name?.message}
                    autoCapitalize="words"
                    autoComplete="name"
                    textContentType="name"
                  />
                )}
              />

              {/* Email Input */}
              <View className="mt-3">
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

              {/* Phone Input */}
              <View className="mt-3">
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Phone Number"
                      placeholder="+1234567890"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.phone?.message}
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      textContentType="telephoneNumber"
                    />
                  )}
                />
              </View>

              {/* Password Input */}
              <View className="mt-3">
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Password"
                      placeholder="Create a password"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.password?.message}
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
              </View>

              {/* Confirm Password Input */}
              <View className="mt-3">
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Confirm Password"
                      placeholder="Re-enter your password"
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

            {/* Register Button */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={isRegistering}
              onPress={handleSubmit(onSubmit)}
            >
              Create Account
            </Button>

            {/* Terms & Privacy */}
            <Text className="text-xs text-gray-500 text-center mt-4">
              By creating an account, you agree to our{' '}
              <Text className="text-blue-600">Terms of Service</Text> and{' '}
              <Text className="text-blue-600">Privacy Policy</Text>
            </Text>

            {/* Login Link */}
            <View className="mt-6 flex-row justify-center items-center">
              <Text className="text-gray-600">Already have an account? </Text>
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
