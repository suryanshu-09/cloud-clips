import { useState, useEffect } from 'react';
import {
  ScrollView,
  Text,
  View,
  Pressable,
  Alert,
  Switch,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeView } from '@/components/ui/SafeView';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
  useNotificationPermissions,
  useRequestNotificationPermissions,
  type INotificationSettings,
} from '@/features/notifications';

interface ISettingToggleProps {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

function SettingToggle({
  title,
  description,
  value,
  onValueChange,
  disabled = false,
  icon,
}: ISettingToggleProps) {
  return (
    <View className="flex-row items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
      <View className="flex-row items-center flex-1 mr-4">
        {icon && (
          <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
            <Ionicons name={icon} size={20} color="#6B7280" />
          </View>
        )}
        <View className="flex-1">
          <Text className={`text-base font-medium ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
            {title}
          </Text>
          <Text className={`text-sm mt-0.5 ${disabled ? 'text-gray-300' : 'text-gray-500'}`}>
            {description}
          </Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Permission hooks
  const { data: permissions, isLoading: isLoadingPermissions } = useNotificationPermissions();
  const requestPermissions = useRequestNotificationPermissions();

  // Settings hooks
  const { data: settings, isLoading: isLoadingSettings, refetch } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();

  // Local state for settings
  const [localSettings, setLocalSettings] = useState<INotificationSettings>({
    enabled: true,
    appointments: true,
    chat: true,
    promotions: true,
    system: true,
  });

  // Sync local state with fetched settings
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleRequestPermissions = () => {
    requestPermissions.mutate(undefined, {
      onSuccess: (data) => {
        if (data.granted) {
          Alert.alert('Success', 'Notifications enabled successfully!');
        } else {
          Alert.alert(
            'Permission Denied',
            'Please enable notifications in your device settings to receive updates.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => {
                  // This would open app settings
                  Alert.alert('Info', 'Please open Settings > Notifications to enable.');
                },
              },
            ]
          );
        }
      },
      onError: (error: Error) => {
        Alert.alert('Error', error.message || 'Failed to request permissions');
      },
    });
  };

  const handleToggleSetting = (key: keyof INotificationSettings, value: boolean) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);

    updateSettings.mutate(
      { [key]: value },
      {
        onError: (error: Error) => {
          // Revert on error
          setLocalSettings(localSettings);
          Alert.alert('Error', error.message || 'Failed to update setting');
        },
      }
    );
  };

  const handleMasterToggle = (enabled: boolean) => {
    const newSettings: INotificationSettings = {
      enabled,
      appointments: enabled,
      chat: enabled,
      promotions: enabled,
      system: enabled,
    };
    setLocalSettings(newSettings);

    updateSettings.mutate(newSettings, {
      onError: (error: Error) => {
        // Revert on error
        setLocalSettings(localSettings);
        Alert.alert('Error', error.message || 'Failed to update settings');
      },
    });
  };

  const isLoading = isLoadingPermissions || isLoadingSettings;
  const hasPermission = permissions?.granted ?? false;

  if (isLoading) {
    return (
      <SafeView>
        <View className="bg-white p-6 border-b border-gray-200 flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text className="text-2xl font-bold text-gray-900">Notifications</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeView>
    );
  }

  return (
    <SafeView>
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <View className="flex-row items-center mb-2">
          <Pressable onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text className="text-2xl font-bold text-gray-900">Notifications</Text>
        </View>
        <Text className="text-gray-600 ml-10">Manage how you receive notifications</Text>
      </View>

      <ScrollView
        className="flex-1 bg-gray-50"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="p-4">
          {/* Permission Warning */}
          {!hasPermission && (
            <Card variant="outlined" padding="md" className="mb-4 border-yellow-300 bg-yellow-50">
              <View className="flex-row items-start">
                <Ionicons name="warning-outline" size={24} color="#D97706" />
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-semibold text-yellow-800 mb-1">
                    Notifications Disabled
                  </Text>
                  <Text className="text-sm text-yellow-700 mb-3">
                    Enable notifications to receive important updates about your appointments,
                    messages, and offers.
                  </Text>
                  <Button
                    variant="primary"
                    size="sm"
                    onPress={handleRequestPermissions}
                    loading={requestPermissions.isPending}
                  >
                    Enable Notifications
                  </Button>
                </View>
              </View>
            </Card>
          )}

          {/* Master Toggle */}
          <Card variant="elevated" padding="md" className="mb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
                  <Ionicons name="notifications" size={24} color="#2563EB" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900">All Notifications</Text>
                  <Text className="text-sm text-gray-500">
                    {localSettings.enabled
                      ? 'Notifications are enabled'
                      : 'All notifications are off'}
                  </Text>
                </View>
              </View>
              <Switch
                value={localSettings.enabled}
                onValueChange={handleMasterToggle}
                disabled={!hasPermission}
                trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </Card>

          {/* Notification Categories */}
          <Card variant="elevated" padding="md" className="mb-4">
            <Text className="text-base font-semibold text-gray-900 mb-2">Notification Types</Text>
            <Text className="text-sm text-gray-500 mb-4">
              Choose which notifications you want to receive
            </Text>

            <SettingToggle
              title="Appointment Reminders"
              description="Get reminded about upcoming appointments"
              icon="calendar-outline"
              value={localSettings.appointments}
              onValueChange={(value) => handleToggleSetting('appointments', value)}
              disabled={!hasPermission || !localSettings.enabled}
            />

            <SettingToggle
              title="Chat Messages"
              description="Receive notifications for new messages"
              icon="chatbubble-outline"
              value={localSettings.chat}
              onValueChange={(value) => handleToggleSetting('chat', value)}
              disabled={!hasPermission || !localSettings.enabled}
            />

            <SettingToggle
              title="Promotions & Offers"
              description="Get notified about deals and discounts"
              icon="pricetag-outline"
              value={localSettings.promotions}
              onValueChange={(value) => handleToggleSetting('promotions', value)}
              disabled={!hasPermission || !localSettings.enabled}
            />

            <SettingToggle
              title="System Notifications"
              description="Important updates about your account"
              icon="information-circle-outline"
              value={localSettings.system}
              onValueChange={(value) => handleToggleSetting('system', value)}
              disabled={!hasPermission || !localSettings.enabled}
            />
          </Card>

          {/* Email & SMS Section */}
          <Card variant="elevated" padding="md" className="mb-4">
            <Text className="text-base font-semibold text-gray-900 mb-2">Other Channels</Text>
            <Text className="text-sm text-gray-500 mb-4">Additional ways to stay informed</Text>

            <SettingToggle
              title="Email Notifications"
              description="Receive booking confirmations via email"
              icon="mail-outline"
              value={true}
              onValueChange={() => {
                Alert.alert('Coming Soon', 'Email notification settings will be available soon.');
              }}
            />

            <SettingToggle
              title="SMS Notifications"
              description="Receive text message reminders"
              icon="phone-portrait-outline"
              value={false}
              onValueChange={() => {
                Alert.alert('Coming Soon', 'SMS notification settings will be available soon.');
              }}
            />
          </Card>

          {/* Quiet Hours - Future Feature */}
          <Card variant="outlined" padding="md" className="mb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
                  <Ionicons name="moon-outline" size={20} color="#6B7280" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900">Quiet Hours</Text>
                  <Text className="text-sm text-gray-500">
                    Pause notifications during set times
                  </Text>
                </View>
              </View>
              <View className="bg-gray-100 px-2 py-1 rounded">
                <Text className="text-xs text-gray-500">Coming Soon</Text>
              </View>
            </View>
          </Card>

          {/* Info Section */}
          <Card variant="outlined" padding="md" className="mb-4">
            <View className="flex-row items-start">
              <Ionicons name="shield-checkmark-outline" size={24} color="#10B981" />
              <View className="flex-1 ml-3">
                <Text className="text-sm font-semibold text-gray-900 mb-1">
                  Your Privacy Matters
                </Text>
                <Text className="text-sm text-gray-600">
                  We only send relevant notifications based on your preferences. You can change
                  these settings at any time.
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Updating Indicator */}
      {updateSettings.isPending && (
        <View className="absolute bottom-6 left-0 right-0 items-center">
          <View className="bg-gray-900 px-4 py-2 rounded-full flex-row items-center">
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text className="text-white text-sm ml-2">Saving...</Text>
          </View>
        </View>
      )}
    </SafeView>
  );
}
