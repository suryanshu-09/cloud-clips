import { useState } from 'react';
import { ScrollView, Text, View, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation, LANGUAGES, type LanguageCode } from '@/services/i18n/useTranslation';
import { Card } from '@/components/ui';

interface ILanguageItemProps {
  code: LanguageCode;
  name: string;
  nativeName: string;
  isSelected: boolean;
  onSelect: (code: LanguageCode) => void;
}

function LanguageItem({ code, name, nativeName, isSelected, onSelect }: ILanguageItemProps) {
  return (
    <Pressable
      onPress={() => onSelect(code)}
      className={`flex-row items-center justify-between p-4 border-b border-gray-100 ${
        isSelected ? 'bg-blue-50' : ''
      }`}
    >
      <View>
        <Text className={`text-base font-medium ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>
          {nativeName}
        </Text>
        <Text className="text-sm text-gray-500">{name}</Text>
      </View>
      {isSelected && (
        <View className="w-6 h-6 rounded-full bg-blue-600 items-center justify-center">
          <Text className="text-white text-sm">✓</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function LanguageSettingsScreen() {
  const router = useRouter();
  const { t, currentLanguage, changeLanguage, availableLanguages } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);

  const handleLanguageSelect = async (code: LanguageCode) => {
    if (code === currentLanguage || isChanging) return;

    setIsChanging(true);
    try {
      await changeLanguage(code);

      const selectedLanguage = availableLanguages.find((lang) => lang.code === code);
      Alert.alert(
        t('common.success'),
        t('settings.language.changed', { language: selectedLanguage?.nativeName }),
        [
          {
            text: t('common.ok'),
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(t('common.error'), t('errors.generic'));
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <Text className="text-3xl font-bold text-gray-900 mb-2">
          {t('settings.language.title')}
        </Text>
        <Text className="text-gray-600">{t('settings.language.subtitle')}</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-6">
          {/* Current Language */}
          <Text className="text-sm text-gray-500 mb-2 uppercase tracking-wide">
            {t('settings.language.current', {
              language: availableLanguages.find((l) => l.code === currentLanguage)?.nativeName,
            })}
          </Text>

          {/* Language List */}
          <Card className="overflow-hidden">
            {availableLanguages.map((language) => (
              <LanguageItem
                key={language.code}
                code={language.code}
                name={language.name}
                nativeName={language.nativeName}
                isSelected={language.code === currentLanguage}
                onSelect={handleLanguageSelect}
              />
            ))}
          </Card>

          {/* Info */}
          <Text className="text-sm text-gray-500 mt-4 text-center">
            {t('settings.language.restart')}
          </Text>
        </View>
      </ScrollView>

      {/* Loading overlay */}
      {isChanging && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center">
          <Card className="p-6 items-center">
            <Text className="text-lg font-semibold text-gray-900">{t('common.loading')}</Text>
          </Card>
        </View>
      )}
    </View>
  );
}
