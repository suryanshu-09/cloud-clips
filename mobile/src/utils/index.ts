/**
 * Utility exports for Cloud Clips mobile app
 *
 * Centralized exports for all utility functions and constants.
 * Import from this file instead of individual utility files.
 *
 * @example
 * import { formatCurrency, constants, helpers } from '@/utils';
 * import { APPOINTMENT_STATUS } from '@/utils/constants';
 */

// Constants
export * from './constants';

// Helpers
export * from './helpers';

// Performance utilities
export * from './performance';

// Validation schemas
export * from './validation/authSchemas';

// Re-export as namespaces for organized imports
export * as constants from './constants';
export * as helpers from './helpers';
export * as performance from './performance';
export * as validation from './validation/authSchemas';
