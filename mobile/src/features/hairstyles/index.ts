/**
 * Hairstyles feature exports
 * AI-powered hairstyle recommendations
 */

// Hooks
export {
  useHairstyles,
  useHairstyle,
  usePopularStyles,
  useSavedStyles,
  useSaveStyle,
  useRemoveSavedStyle,
  useHairstyleAnalysis,
  useStyleBrowser,
  useHairstyleDiscovery,
  HAIRSTYLE_QUERY_KEYS,
} from './hooks/useHairstyles';

// Services
export { hairstyleService } from './services/hairstyleService';

// Types
export * from './types';
