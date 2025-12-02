import { View, Text, Switch } from 'react-native';
import type { INotificationSettings } from '@/features/notifications/types';

interface INotificationSettingsFormProps {
  settings: INotificationSettings;
  onSettingChange: (key: keyof INotificationSettings, value: boolean) => void;
  disabled?: boolean;
}

export function NotificationSettingsForm({
  settings,
  onSettingChange,
  disabled = false,
}: INotificationSettingsFormProps) {
  const settingsConfig = [
    {
      key: 'enabled' as keyof INotificationSettings,
      label: 'Enable Notifications',
      description: 'Receive push notifications from the app',
      icon: '🔔',
    },
    {
      key: 'appointments' as keyof INotificationSettings,
      label: 'Appointment Notifications',
      description: 'Updates about your appointments',
      icon: '📅',
    },
    {
      key: 'chat' as keyof INotificationSettings,
      label: 'Chat Notifications',
      description: 'New messages and chat updates',
      icon: '💬',
    },
    {
      key: 'promotions' as keyof INotificationSettings,
      label: 'Promotions & Offers',
      description: 'Special deals and discounts',
      icon: '🎉',
    },
    {
      key: 'system' as keyof INotificationSettings,
      label: 'System Notifications',
      description: 'App updates and important announcements',
      icon: '⚙️',
    },
  ];

  return (
    <View className="bg-white rounded-lg">
      {settingsConfig.map((config, index) => (
        <View
          key={config.key}
          className={`flex-row items-center justify-between p-4 ${
            index !== settingsConfig.length - 1 ? 'border-b border-gray-200' : ''
          }`}
        >
          <View className="flex-row items-center flex-1">
            <Text className="text-2xl mr-3">{config.icon}</Text>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">{config.label}</Text>
              <Text className="text-sm text-gray-500 mt-1">{config.description}</Text>
            </View>
          </View>
          <Switch
            value={settings[config.key]}
            onValueChange={(value) => onSettingChange(config.key, value)}
            disabled={disabled || (config.key !== 'enabled' && !settings.enabled)}
            trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
            thumbColor={settings[config.key] ? '#3b82f6' : '#f3f4f6'}
          />
        </View>
      ))}
    </View>
  );
}
