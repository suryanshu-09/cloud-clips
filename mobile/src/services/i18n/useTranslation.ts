/**
 * Custom hook for internationalization
 * Wraps react-i18next's useTranslation with additional utilities
 */
import { useCallback } from 'react';
import { useTranslation as useI18NextTranslation } from 'react-i18next';
import { i18nService, LANGUAGES, type LanguageCode } from '@/services/i18n';

export function useTranslation(namespace?: string) {
  const { t, i18n } = useI18NextTranslation(namespace);

  /**
   * Get the current language code
   */
  const currentLanguage = i18n.language as LanguageCode;

  /**
   * Get information about the current language
   */
  const currentLanguageInfo = LANGUAGES.find((lang) => lang.code === currentLanguage);

  /**
   * Change the app language
   */
  const changeLanguage = useCallback(async (languageCode: LanguageCode) => {
    await i18nService.changeLanguage(languageCode);
  }, []);

  /**
   * Get all available languages
   */
  const availableLanguages = LANGUAGES;

  /**
   * Check if current language is RTL
   */
  const isRTL = i18nService.isRTL(currentLanguage);

  /**
   * Format a date according to the current locale
   */
  const formatDate = useCallback(
    (date: Date, options?: Intl.DateTimeFormatOptions) => {
      return i18nService.formatDate(date, options);
    },
    [currentLanguage]
  );

  /**
   * Format a number according to the current locale
   */
  const formatNumber = useCallback(
    (num: number, options?: Intl.NumberFormatOptions) => {
      return i18nService.formatNumber(num, options);
    },
    [currentLanguage]
  );

  /**
   * Format currency according to the current locale
   */
  const formatCurrency = useCallback(
    (amount: number, currency?: string) => {
      return i18nService.formatCurrency(amount, currency);
    },
    [currentLanguage]
  );

  /**
   * Translate with common namespace shortcut
   */
  const tc = useCallback(
    (key: string, options?: object) => {
      return t(`common.${key}`, options);
    },
    [t]
  );

  /**
   * Get time ago string (e.g., "2 hours ago")
   */
  const formatTimeAgo = useCallback(
    (date: Date) => {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) {
        return t('time.now', 'just now');
      } else if (diffMins < 60) {
        return t('time.ago', { time: t('time.minutes', { count: diffMins }) });
      } else if (diffHours < 24) {
        return t('time.ago', { time: t('time.hours', { count: diffHours }) });
      } else if (diffDays < 7) {
        return t('time.ago', { time: t('time.days', { count: diffDays }) });
      } else {
        return formatDate(date);
      }
    },
    [t, formatDate]
  );

  return {
    // Core translation function
    t,

    // Shortcut for common namespace
    tc,

    // Language info
    currentLanguage,
    currentLanguageInfo,
    availableLanguages,
    isRTL,

    // Language control
    changeLanguage,

    // Formatting utilities
    formatDate,
    formatNumber,
    formatCurrency,
    formatTimeAgo,

    // Raw i18n instance (for advanced use)
    i18n,
  };
}

// Re-export types for convenience
export type { LanguageCode } from '@/services/i18n';
export { LANGUAGES } from '@/services/i18n';
