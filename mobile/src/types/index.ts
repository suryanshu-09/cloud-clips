/**
 * Shared TypeScript types for Cloud Clips mobile app
 *
 * This file contains global/shared types that are used across multiple features.
 * Feature-specific types should remain in their respective feature directories.
 */

// ============================================================================
// API & Network Types
// ============================================================================

export interface IApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface IApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// ============================================================================
// Common UI Types
// ============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ISelectableOption {
  label: string;
  value: string;
  disabled?: boolean;
}

// ============================================================================
// Location Types
// ============================================================================

export interface ICoordinates {
  latitude: number;
  longitude: number;
}

export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  formattedAddress?: string;
}

// ============================================================================
// Time & Scheduling Types
// ============================================================================

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface ITimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

// ============================================================================
// Media Types
// ============================================================================

export type MediaType = 'image' | 'video';

export interface IMediaFile {
  uri: string;
  type: MediaType;
  width?: number;
  height?: number;
  size?: number;
  duration?: number; // For videos
}

// ============================================================================
// Re-export commonly used types from stores for convenience
// ============================================================================

export type { ILocation, ILocationState } from '@/store/atoms/locationAtom';
export type { IUserProfile, IBarberProfile, IAvailability } from '@/store/atoms/userAtom';
export type { IAuthState, IAuthUser } from '@/store/atoms/authAtom';
export type { ICart, ICartItem } from '@/store/atoms/cartAtom';
