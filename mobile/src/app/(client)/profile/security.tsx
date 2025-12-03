import { useState } from 'react';
import { ScrollView, Text, View, Pressable, Alert, Switch, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui';
import { useBiometrics } from '@/features/auth/hooks/useBiometrics';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface ISettingItemProps {
  title: string;
  description?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  danger?: boolean;
  disabled?: boolean;
}

function SettingItem({
  title,
  description,
  onPress,
  rightElement,
  showChevron = true,
  danger = false,
  disabled = false,
}: ISettingItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-between py-4 border-b border-gray-100 ${disabled ? 'opacity-50' : ''}`}
      disabled={disabled || (!onPress && !rightElement)}
    >
      <View className="flex-1 mr-4">
        <Text className={`text-base font-medium ${danger ? 'text-red-600' : 'text-gray-900'}`}>
          {title}
        </Text>
        {description && <Text className="text-sm text-gray-500 mt-1">{description}</Text>}
      </View>
      {rightElement || (showChevron && onPress && <Text className="text-gray-400">{'>'}</Text>)}
    </Pressable>
  );
}

export default function SecurityScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const {
    isAvailable,
    isEnabled,
    biometricName,
    isLoading: biometricLoading,
    enable,
    disable,
  } = useBiometrics();

  const [isEnabling, setIsEnabling] = useState(false);

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      setIsEnabling(true);
      try {
        const result = await enable();
        if (!result.success) {
          Alert.alert('Error', result.error || 'Failed to enable biometric login');
        }
      } finally {
        setIsEnabling(false);
      }
    } else {
      Alert.alert(
        'Disable Biometric Login',
        `Are you sure you want to disable ${biometricName} login?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            onPress: () => disable(),
          },
        ]
      );
    }
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'We will send a password reset link to your email address.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send Link',
        onPress: () => {
          // Navigate to forgot password or trigger reset email
          router.push('/(auth)/forgot-password');
        },
      },
    ]);
  };

  const handleTwoFactorAuth = () => {
    Alert.alert('Coming Soon', 'Two-factor authentication will be available in a future update.');
  };

  const handleLoginHistory = () => {
    Alert.alert('Coming Soon', 'Login history will be available in a future update.');
  };

  const handleActiveDevices = () => {
    Alert.alert('Coming Soon', 'Active devices management will be available in a future update.');
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-4">
            <Text className="text-blue-600 text-lg">{'<'}</Text>
          </Pressable>
          <View>
            <Text className="text-2xl font-bold text-gray-900">Security</Text>
            <Text className="text-gray-600">Manage your account security</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="p-6 space-y-4">
          {/* Biometric Authentication */}
          <Card className="p-4">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Biometric Authentication
            </Text>

            {biometricLoading ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#3b82f6" />
                <Text className="text-gray-500 mt-2">Checking biometric availability...</Text>
              </View>
            ) : isAvailable ? (
              <>
                <SettingItem
                  title={`${biometricName} Login`}
                  description={`Use ${biometricName} to quickly sign in to your account`}
                  showChevron={false}
                  disabled={isEnabling}
                  rightElement={
                    isEnabling ? (
                      <ActivityIndicator size="small" color="#3b82f6" />
                    ) : (
                      <Switch
                        value={isEnabled}
                        onValueChange={handleBiometricToggle}
                        trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                        thumbColor="#ffffff"
                      />
                    )
                  }
                />
                {isEnabled && (
                  <View className="mt-2 p-3 bg-green-50 rounded-lg">
                    <Text className="text-sm text-green-800">
                      {biometricName} login is enabled. You can use it to sign in quickly next time.
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View className="py-4">
                <Text className="text-gray-500">
                  Biometric authentication is not available on this device. Make sure you have
                  enrolled fingerprint or face recognition in your device settings.
                </Text>
              </View>
            )}
          </Card>

          {/* Password */}
          <Card className="p-4">
            <Text className="text-base font-semibold text-gray-900 mb-2">Password</Text>
            <SettingItem
              title="Change Password"
              description="Update your account password"
              onPress={handleChangePassword}
            />
            <View className="mt-2 p-3 bg-blue-50 rounded-lg">
              <Text className="text-sm text-blue-800">
                For security, password changes require email verification.
              </Text>
            </View>
          </Card>

          {/* Two-Factor Authentication */}
          <Card className="p-4">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Two-Factor Authentication
            </Text>
            <SettingItem
              title="Enable 2FA"
              description="Add an extra layer of security to your account"
              onPress={handleTwoFactorAuth}
            />
            <View className="mt-2 p-3 bg-yellow-50 rounded-lg">
              <Text className="text-sm text-yellow-800">
                Two-factor authentication is not currently enabled. We recommend enabling it for
                better security.
              </Text>
            </View>
          </Card>

          {/* Login Activity */}
          <Card className="p-4">
            <Text className="text-base font-semibold text-gray-900 mb-2">Login Activity</Text>
            <SettingItem
              title="Login History"
              description="View your recent login activity"
              onPress={handleLoginHistory}
            />
            <SettingItem
              title="Active Devices"
              description="Manage devices logged into your account"
              onPress={handleActiveDevices}
            />
          </Card>

          {/* Account Info */}
          <Card className="p-4">
            <Text className="text-base font-semibold text-gray-900 mb-2">Account Information</Text>
            <SettingItem
              title="Email"
              description={currentUser?.email || 'Not available'}
              showChevron={false}
            />
            <SettingItem
              title="Auth Provider"
              description={
                currentUser?.authProvider
                  ? currentUser.authProvider.charAt(0).toUpperCase() +
                    currentUser.authProvider.slice(1)
                  : 'Email'
              }
              showChevron={false}
            />
            <SettingItem
              title="Email Verified"
              description={currentUser?.emailVerified ? 'Yes' : 'No'}
              showChevron={false}
              rightElement={
                !currentUser?.emailVerified ? (
                  <Pressable
                    onPress={() => router.push('/(auth)/verify-email')}
                    className="bg-blue-600 px-3 py-1 rounded"
                  >
                    <Text className="text-white text-sm font-medium">Verify</Text>
                  </Pressable>
                ) : null
              }
            />
          </Card>

          {/* Security Tips */}
          <Card className="p-4 bg-gray-100">
            <Text className="text-base font-semibold text-gray-900 mb-2">Security Tips</Text>
            <View className="space-y-2">
              <Text className="text-sm text-gray-600">- Use a strong, unique password</Text>
              <Text className="text-sm text-gray-600">
                - Enable biometric authentication for quick, secure access
              </Text>
              <Text className="text-sm text-gray-600">- Review your login activity regularly</Text>
              <Text className="text-sm text-gray-600">- Keep your email address up to date</Text>
            </View>
          </Card>

          {/* Spacer for bottom padding */}
          <View className="h-6" />
        </View>
      </ScrollView>
    </View>
  );
}
