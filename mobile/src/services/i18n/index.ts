import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { storageHelpers } from '@/services/storage/mmkv';

// Import translations
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';

// Storage key for language preference
const LANGUAGE_STORAGE_KEY = 'app_language';

// Available languages
export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

// Resources object with all translations
const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
};

// Get stored language or detect from device
function getInitialLanguage(): LanguageCode {
  // First, try to get from storage
  const storedLanguage = storageHelpers.getString(LANGUAGE_STORAGE_KEY);
  if (storedLanguage && isValidLanguage(storedLanguage)) {
    return storedLanguage as LanguageCode;
  }

  // Fall back to device locale
  const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en';

  // Check if device locale is supported, otherwise default to English
  if (isValidLanguage(deviceLocale)) {
    return deviceLocale as LanguageCode;
  }

  return 'en';
}

// Validate if a language code is supported
function isValidLanguage(code: string): boolean {
  return LANGUAGES.some((lang) => lang.code === code);
}

// Initialize i18next
i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  compatibilityJSON: 'v4', // Required for some Android versions

  interpolation: {
    escapeValue: false, // React already does escaping
  },

  // React-specific options
  react: {
    useSuspense: false, // Disable suspense for React Native
  },
});

// Export utility functions
export const i18nService = {
  /**
   * Get the current language
   */
  getCurrentLanguage(): LanguageCode {
    return (i18n.language as LanguageCode) || 'en';
  },

  /**
   * Change the app language and persist to storage
   */
  changeLanguage(languageCode: LanguageCode): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!isValidLanguage(languageCode)) {
        reject(new Error(`Invalid language code: ${languageCode}`));
        return;
      }

      i18n.changeLanguage(languageCode, (error) => {
        if (error) {
          reject(error);
          return;
        }

        // Persist to storage
        storageHelpers.setString(LANGUAGE_STORAGE_KEY, languageCode);
        resolve();
      });
    });
  },

  /**
   * Get all available languages
   */
  getAvailableLanguages() {
    return LANGUAGES;
  },

  /**
   * Get language info by code
   */
  getLanguageInfo(code: LanguageCode) {
    return LANGUAGES.find((lang) => lang.code === code);
  },

  /**
   * Check if a language is RTL (Right-to-Left)
   * Useful for future Arabic/Hebrew support
   */
  isRTL(languageCode: LanguageCode): boolean {
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    return rtlLanguages.includes(languageCode);
  },

  /**
   * Get the device's preferred locale
   */
  getDeviceLocale(): string {
    return Localization.getLocales()[0]?.languageCode ?? 'en';
  },

  /**
   * Format a date according to the current locale
   */
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    const locale = i18n.language;
    return new Intl.DateTimeFormat(locale, options).format(date);
  },

  /**
   * Format a number according to the current locale
   */
  formatNumber(num: number, options?: Intl.NumberFormatOptions): string {
    const locale = i18n.language;
    return new Intl.NumberFormat(locale, options).format(num);
  },

  /**
   * Format currency according to the current locale
   */
  formatCurrency(amount: number, currency = 'USD'): string {
    const locale = i18n.language;
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  },
};

export default i18n;
