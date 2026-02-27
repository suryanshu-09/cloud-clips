import { useState } from 'react';
import { ScrollView, Text, View, Pressable, Alert, Switch, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { useTranslation } from '@/services/i18n/useTranslation';
import { Card } from '@/components/ui';
import { useMapConfig } from '@/hooks/useMapConfig';
import { MapStyleSelector } from '@/components/map';

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
  const { logout } = useAuth();
  const { t, currentLanguageInfo } = useTranslation();
  const { mapConfig } = useMapConfig();

  // Settings state (these would typically be persisted)
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [showMapStyleSelector, setShowMapStyleSelector] = useState(false);

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: () => authService.deleteAccount(),
    onSuccess: () => {
      Alert.alert(t('settings.account.deleteSuccess'), t('settings.account.deleteSuccessMessage'), [
        {
          text: t('common.ok'),
          onPress: () => router.replace('/(auth)/login'),
        },
      ]);
    },
    onError: (error: Error) => {
      Alert.alert(t('common.error'), error.message || t('errors.generic'));
    },
  });

  const handleDeleteAccount = () => {
    Alert.alert(t('settings.account.deleteAccount'), t('settings.account.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          Alert.alert(t('common.confirm'), t('settings.account.deleteFinal'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('common.yes'),
              style: 'destructive',
              onPress: () => deleteAccountMutation.mutate(),
            },
          ]);
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert(t('settings.account.logout'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.account.logout'),
        onPress: () => logout(),
      },
    ]);
  };

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert(t('common.error'), t('errors.generic'));
    });
  };

  const handleClearCache = () => {
    Alert.alert(t('settings.app.cacheCleared'), t('settings.app.cacheClearedMessage'));
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <Text className="text-3xl font-bold text-gray-900 mb-2">{t('settings.title')}</Text>
        <Text className="text-gray-600">{t('settings.subtitle')}</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-6 space-y-4">
          {/* Notifications */}
          <Card className="p-4">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              {t('settings.notifications.title')}
            </Text>
            <SettingItem
              title={t('settings.notifications.push')}
              description={t('settings.notifications.pushDescription')}
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
              title={t('settings.notifications.email')}
              description={t('settings.notifications.emailDescription')}
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
              title={t('settings.notifications.sms')}
              description={t('settings.notifications.smsDescription')}
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
              title={t('settings.notifications.marketing')}
              description={t('settings.notifications.marketingDescription')}
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
            <Text className="text-base font-semibold text-gray-900 mb-2">
              {t('settings.privacy.title')}
            </Text>
            <SettingItem
              title={t('settings.privacy.security')}
              description={t('settings.privacy.securityDescription')}
              onPress={() => router.push('/(client)/profile/security')}
            />
            <SettingItem
              title={t('settings.privacy.privacyPolicy')}
              onPress={() => openUrl('https://example.com/privacy')}
            />
            <SettingItem
              title={t('settings.privacy.termsOfService')}
              onPress={() => openUrl('https://example.com/terms')}
            />
            <SettingItem
              title={t('settings.privacy.dataPrivacy')}
              description={t('settings.privacy.dataPrivacyDescription')}
              onPress={() =>
                Alert.alert(t('common.comingSoon'), t('settings.privacy.dataPrivacyDescription'))
              }
            />
          </Card>

          {/* App Settings */}
          <Card className="p-4">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              {t('settings.app.title')}
            </Text>
            <SettingItem
              title={t('settings.app.language')}
              description={currentLanguageInfo?.nativeName || 'English'}
              onPress={() => router.push('/(client)/profile/language')}
            />
            <SettingItem
              title={t('settings.app.theme')}
              description={t('settings.theme.system')}
              onPress={() =>
                Alert.alert(t('common.comingSoon'), t('settings.app.themeDescription'))
              }
            />
            <SettingItem
              title="Map Style"
              description={mapConfig.name}
              onPress={() => setShowMapStyleSelector(!showMapStyleSelector)}
              showChevron={!showMapStyleSelector}
              rightElement={
                showMapStyleSelector ? (
                  <Text className="text-blue-500 text-sm">Done</Text>
                ) : undefined
              }
            />
            {showMapStyleSelector && (
              <View className="mt-2 -mx-4">
                <MapStyleSelector
                  horizontal={false}
                  onStyleChange={() => setShowMapStyleSelector(false)}
                />
              </View>
            )}
            <SettingItem
              title={t('settings.app.clearCache')}
              description={t('settings.app.clearCacheDescription')}
              onPress={handleClearCache}
            />
          </Card>

          {/* Support */}
          <Card className="p-4">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              {t('settings.support.title')}
            </Text>
            <SettingItem
              title={t('settings.support.helpCenter')}
              onPress={() => router.push('/(client)/profile/help')}
            />
            <SettingItem
              title={t('settings.support.contactSupport')}
              onPress={() => Linking.openURL('mailto:support@cloudclips.com')}
            />
            <SettingItem
              title={t('settings.support.reportBug')}
              onPress={() => Alert.alert(t('common.comingSoon'), t('settings.support.reportBug'))}
            />
            <SettingItem
              title={t('settings.support.appVersion')}
              description="1.0.0 (Build 1)"
              showChevron={false}
            />
          </Card>

          {/* Account Actions */}
          <Card className="p-4">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              {t('settings.account.title')}
            </Text>
            <SettingItem title={t('settings.account.logout')} onPress={handleLogout} />
            <SettingItem
              title={t('settings.account.deleteAccount')}
              description={t('settings.account.deleteAccountDescription')}
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
            <Text className="text-lg font-semibold text-gray-900">{t('common.loading')}</Text>
          </Card>
        </View>
      )}
    </View>
  );
}
