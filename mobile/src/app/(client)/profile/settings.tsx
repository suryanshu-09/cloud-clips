import { useState } from 'react';
import { ScrollView, Text, View, Pressable, Alert, Switch, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { Card, Button } from '@/components/ui';

interface ISettingItemProps {
  title: string;
  description?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  danger?: boolean;
}

function SettingItem({
  title,
  description,
  onPress,
  rightElement,
  showChevron = true,
  danger = false,
}: ISettingItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between py-4 border-b border-gray-100"
      disabled={!onPress && !rightElement}
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

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, isLoggingOut } = useAuth();

  // Settings state (these would typically be persisted)
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: () => authService.deleteAccount(),
    onSuccess: () => {
      Alert.alert('Account Deleted', 'Your account has been permanently deleted.', [
        {
          text: 'OK',
          onPress: () => router.replace('/(auth)/login'),
        },
      ]);
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to delete account. Please try again.');
    },
  });

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'This is your last chance. Delete your account permanently?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete',
                  style: 'destructive',
                  onPress: () => deleteAccountMutation.mutate(),
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: () => logout(),
      },
    ]);
  };

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open link');
    });
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Settings</Text>
        <Text className="text-gray-600">Manage your app preferences</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-6 space-y-4">
          {/* Notifications */}
          <Card className="p-4">
            <Text className="text-base font-semibold text-gray-900 mb-2">Notifications</Text>
            <SettingItem
              title="Push Notifications"
              description="Receive push notifications for bookings and updates"
              showChevron={false}
              rightElement={
                <Switch
                  value={pushNotifications}
                  onValueChange={setPushNotifications}
                  trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                  thumbColor="#ffffff"
                />
              }
            />
            <SettingItem
              title="Email Notifications"
              description="Receive booking confirmations via email"
              showChevron={false}
              rightElement={
                <Switch
                  value={emailNotifications}
                  onValueChange={setEmailNotifications}
                  trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                  thumbColor="#ffffff"
                />
              }
            />
            <SettingItem
              title="SMS Notifications"
              description="Receive text message reminders"
              showChevron={false}
              rightElement={
                <Switch
                  value={smsNotifications}
                  onValueChange={setSmsNotifications}
                  trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                  thumbColor="#ffffff"
                />
              }
            />
            <SettingItem
              title="Marketing Emails"
              description="Receive promotional offers and news"
              showChevron={false}
              rightElement={
                <Switch
                  value={marketingEmails}
                  onValueChange={setMarketingEmails}
                  trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                  thumbColor="#ffffff"
                />
              }
            />
          </Card>

          {/* Privacy & Security */}
          <Card className="p-4">
            <Text className="text-base font-semibold text-gray-900 mb-2">Privacy & Security</Text>
            <SettingItem
              title="Privacy Policy"
              onPress={() => openUrl('https://example.com/privacy')}
            />
            <SettingItem
              title="Terms of Service"
              onPress={() => openUrl('https://example.com/terms')}
            />
            <SettingItem
              title="Data & Privacy"
              description="Manage how your data is used"
              onPress={() =>
                Alert.alert('Coming Soon', 'Data privacy settings will be available soon.')
              }
            />
          </Card>

          {/* App Settings */}
          <Card className="p-4">
            <Text className="text-base font-semibold text-gray-900 mb-2">App Settings</Text>
            <SettingItem
              title="Language"
              description="English"
              onPress={() =>
                Alert.alert('Coming Soon', 'Language settings will be available soon.')
              }
            />
            <SettingItem
              title="App Theme"
              description="System Default"
              onPress={() => Alert.alert('Coming Soon', 'Theme settings will be available soon.')}
            />
            <SettingItem
              title="Clear Cache"
              description="Free up storage space"
              onPress={() =>
                Alert.alert('Cache Cleared', 'App cache has been cleared successfully.')
              }
            />
          </Card>

          {/* Support */}
          <Card className="p-4">
            <Text className="text-base font-semibold text-gray-900 mb-2">Support</Text>
            <SettingItem
              title="Help Center"
              onPress={() => Alert.alert('Help Center', 'Help center will be available soon.')}
            />
            <SettingItem
              title="Contact Support"
              onPress={() => Linking.openURL('mailto:support@cloudclips.com')}
            />
            <SettingItem
              title="Report a Bug"
              onPress={() => Alert.alert('Report Bug', 'Bug reporting will be available soon.')}
            />
            <SettingItem title="App Version" description="1.0.0 (Build 1)" showChevron={false} />
          </Card>

          {/* Account Actions */}
          <Card className="p-4">
            <Text className="text-base font-semibold text-gray-900 mb-2">Account</Text>
            <SettingItem title="Logout" onPress={handleLogout} />
            <SettingItem
              title="Delete Account"
              description="Permanently delete your account and data"
              onPress={handleDeleteAccount}
              danger
              showChevron={false}
            />
          </Card>

          {/* Spacer for bottom padding */}
          <View className="h-6" />
        </View>
      </ScrollView>

      {/* Loading overlay for delete */}
      {deleteAccountMutation.isPending && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center">
          <Card className="p-6 items-center">
            <Text className="text-lg font-semibold text-gray-900">Deleting Account...</Text>
            <Text className="text-gray-500 mt-2">Please wait</Text>
          </Card>
        </View>
      )}
    </View>
  );
}
