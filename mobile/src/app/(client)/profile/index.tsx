import { Text, View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeView } from '@/components/ui/SafeView';
import { Header } from '@/components/ui/Header';
import { useAuth } from '@/features/auth';

interface IMenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
  showBorder?: boolean;
}

function MenuItem({ icon, title, onPress, showBorder = true }: IMenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-between p-4 active:bg-gray-50 ${
        showBorder ? 'border-b border-gray-100' : ''
      }`}
    >
      <View className="flex-row items-center">
        <Ionicons name={icon} size={24} color="#6b7280" />
        <Text className="text-base text-gray-900 ml-3">{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { currentUser, logout, isLoggingOut } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <SafeView>
      <Header title="My Profile" />
      <ScrollView className="flex-1 bg-gray-50">
        {/* User Info Section */}
        <Pressable
          onPress={() => router.push('/(client)/profile/edit')}
          className="bg-white p-6 mb-4 active:bg-gray-50"
        >
          <View className="items-center mb-2">
            <View className="w-24 h-24 bg-indigo-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="person" size={48} color="#6366f1" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-1">
              {currentUser?.name || 'User'}
            </Text>
            <Text className="text-gray-600">{currentUser?.email || 'email@example.com'}</Text>
            <Text className="text-sm text-blue-600 mt-2">Tap to edit profile</Text>
          </View>
        </Pressable>

        {/* Account Menu Items */}
        <View className="bg-white mb-4">
          <MenuItem
            icon="person-outline"
            title="Edit Profile"
            onPress={() => router.push('/(client)/profile/edit')}
          />
          <MenuItem
            icon="receipt-outline"
            title="Order History"
            onPress={() => router.push('/(client)/profile/orders')}
          />
          <MenuItem
            icon="card-outline"
            title="Payment Methods"
            onPress={() => router.push('/(client)/profile/payment-methods' as any)}
          />
          <MenuItem
            icon="location-outline"
            title="Addresses"
            onPress={() => router.push('/(client)/profile/addresses' as any)}
          />
          <MenuItem
            icon="notifications-outline"
            title="Notifications"
            onPress={() => router.push('/(client)/profile/notifications' as any)}
          />
          <MenuItem
            icon="settings-outline"
            title="Settings"
            onPress={() => router.push('/(client)/profile/settings')}
            showBorder={false}
          />
        </View>

        {/* Support Section */}
        <View className="bg-white mb-4">
          <MenuItem
            icon="help-circle-outline"
            title="Help & Support"
            onPress={() => router.push('/(client)/profile/help' as any)}
          />
          <MenuItem
            icon="star-outline"
            title="Rate the App"
            onPress={() => {
              // Would open app store rating
              router.push('/(client)/profile/help' as any);
            }}
          />
          <MenuItem
            icon="document-text-outline"
            title="Privacy Policy"
            onPress={() => router.push('/(client)/profile/help' as any)}
          />
          <MenuItem
            icon="information-circle-outline"
            title="About"
            onPress={() => router.push('/(client)/profile/help' as any)}
            showBorder={false}
          />
        </View>

        {/* Logout Button */}
        <View className="px-6 py-4">
          <Pressable
            onPress={handleLogout}
            disabled={isLoggingOut}
            className="bg-red-600 active:bg-red-700 rounded-lg px-4 py-4 flex-row items-center justify-center"
          >
            {isLoggingOut ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-semibold ml-2">Logging out...</Text>
              </>
            ) : (
              <>
                <Ionicons name="log-out-outline" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Logout</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Version Info */}
        <View className="items-center py-6">
          <Text className="text-sm text-gray-400">Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeView>
  );
}
