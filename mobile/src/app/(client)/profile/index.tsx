import { Text, View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeView } from '@/components/ui/SafeView';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth';

export default function ProfileScreen() {
  const { currentUser, logout, isLoggingOut } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <SafeView>
      <Header title="My Profile" />
      <ScrollView className="flex-1 bg-gray-50">
        {/* User Info Section */}
        <View className="bg-white p-6 mb-4">
          <View className="items-center mb-6">
            <View className="w-24 h-24 bg-indigo-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="person" size={48} color="#6366f1" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-1">
              {currentUser?.name || 'User'}
            </Text>
            <Text className="text-gray-600">{currentUser?.email || 'email@example.com'}</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View className="bg-white mb-4">
          <Pressable className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="person-outline" size={24} color="#6b7280" />
              <Text className="text-base text-gray-900 ml-3">Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>

          <Pressable className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="card-outline" size={24} color="#6b7280" />
              <Text className="text-base text-gray-900 ml-3">Payment Methods</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>

          <Pressable className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="location-outline" size={24} color="#6b7280" />
              <Text className="text-base text-gray-900 ml-3">Addresses</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>

          <Pressable className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="notifications-outline" size={24} color="#6b7280" />
              <Text className="text-base text-gray-900 ml-3">Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>

          <Pressable className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center">
              <Ionicons name="settings-outline" size={24} color="#6b7280" />
              <Text className="text-base text-gray-900 ml-3">Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>
        </View>

        {/* Support Section */}
        <View className="bg-white mb-4">
          <Pressable className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="help-circle-outline" size={24} color="#6b7280" />
              <Text className="text-base text-gray-900 ml-3">Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>

          <Pressable className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center">
              <Ionicons name="information-circle-outline" size={24} color="#6b7280" />
              <Text className="text-base text-gray-900 ml-3">About</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>
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
