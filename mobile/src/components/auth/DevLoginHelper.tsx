import { View, Text, Pressable, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';

interface IDevAccount {
  email: string;
  password: string;
  name: string;
  role: 'client' | 'barber';
}

const DEV_ACCOUNTS: IDevAccount[] = [
  {
    email: 'client1@test.com',
    password: 'password123',
    name: 'John Doe',
    role: 'client',
  },
  {
    email: 'client2@test.com',
    password: 'password123',
    name: 'Jane Smith',
    role: 'client',
  },
  {
    email: 'barber1@test.com',
    password: 'password123',
    name: 'Mike Johnson',
    role: 'barber',
  },
  {
    email: 'barber2@test.com',
    password: 'password123',
    name: 'Sarah Williams',
    role: 'barber',
  },
];

interface IDevLoginHelperProps {
  onSelectAccount?: (email: string, password: string) => void;
}

// Check if dev mode is enabled
const isDevMode = (): boolean => {
  // Only show in development builds AND when DEV_MODE env var is true
  const envDevMode = process.env.EXPO_PUBLIC_DEV_MODE === 'true';
  return typeof __DEV__ !== 'undefined' && __DEV__ && envDevMode;
};

/**
 * Development helper component to show available test accounts
 * Only visible when:
 * 1. Running in development mode (__DEV__ is true)
 * 2. EXPO_PUBLIC_DEV_MODE environment variable is set to 'true'
 *
 * This component should be completely tree-shaken in production builds.
 */
export function DevLoginHelper({ onSelectAccount }: IDevLoginHelperProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHelper, setShowHelper] = useState(false);

  useEffect(() => {
    // Check dev mode on mount to handle SSR correctly
    setShowHelper(isDevMode());
  }, []);

  // Don't render in production or when dev mode is disabled
  if (!showHelper) {
    return null;
  }

  return (
    <View className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        className="flex-row items-center justify-between"
      >
        <View className="flex-row items-center">
          <Text className="text-lg mr-2">🔧</Text>
          <Text className="text-sm font-semibold text-yellow-800">Dev Mode: Quick Login</Text>
        </View>
        <Text className="text-yellow-800">{isExpanded ? '▼' : '▶'}</Text>
      </Pressable>

      {isExpanded && (
        <View className="mt-3">
          <Text className="text-xs text-yellow-700 mb-2">
            Tap an account to auto-fill credentials:
          </Text>

          <ScrollView style={{ maxHeight: 400 }} nestedScrollEnabled={true}>
            {DEV_ACCOUNTS.map((account) => (
              <Pressable
                key={account.email}
                onPress={() => onSelectAccount?.(account.email, account.password)}
                className="mb-2 p-3 bg-white border border-yellow-200 rounded-lg active:bg-yellow-50"
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-sm font-semibold text-gray-900">{account.name}</Text>
                  <View
                    className={`px-2 py-1 rounded ${
                      account.role === 'barber' ? 'bg-blue-100' : 'bg-green-100'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        account.role === 'barber' ? 'text-blue-700' : 'text-green-700'
                      }`}
                    >
                      {account.role.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-gray-600 mb-1">{account.email}</Text>
                <Text className="text-xs text-gray-500">Password: {account.password}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View className="mt-3 pt-3 border-t border-yellow-200">
            <Text className="text-xs text-yellow-700">
              To disable dev mode, set EXPO_PUBLIC_DEV_MODE=false in your .env file and restart the
              app.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// Export a null component for production builds to help with tree-shaking
export const DevLoginHelperProd = () => null;
