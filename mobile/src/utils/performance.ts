import React, { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

/**
 * Performance utilities for code splitting and lazy loading
 *
 * These utilities help optimize bundle size and initial load time by:
 * 1. Lazy loading heavy components/screens
 * 2. Providing loading fallbacks
 * 3. Error boundary wrappers for lazy components
 */

interface ILazyLoadOptions {
  fallback?: ReactNode;
}

/**
 * Default loading fallback component
 */
function DefaultLoadingFallback(): React.ReactElement {
  return React.createElement(
    View,
    { className: 'flex-1 items-center justify-center p-6' },
    React.createElement(ActivityIndicator, { size: 'large', color: '#3B82F6' }),
    React.createElement(Text, { className: 'text-gray-600 mt-4' }, 'Loading...')
  );
}

/**
 * Create a lazy-loaded component with Suspense wrapper
 *
 * Usage:
 * ```tsx
 * const LazyMapView = createLazyComponent(() => import('@/components/map/MapView'));
 *
 * // In your component:
 * <LazyMapView />
 * ```
 */
export function createLazyComponent<T extends ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>,
  options: ILazyLoadOptions = {}
): (props: React.ComponentProps<T>) => React.ReactElement {
  const LazyComponent = lazy(importFn);
  const fallbackElement = options.fallback ?? React.createElement(DefaultLoadingFallback);

  return function LazyWrapper(props: React.ComponentProps<T>): React.ReactElement {
    return React.createElement(
      Suspense,
      { fallback: fallbackElement },
      React.createElement(LazyComponent, props as React.ComponentProps<T>)
    );
  };
}

/**
 * Preload a lazy component
 * Call this when you anticipate the user will navigate to a screen
 *
 * Usage:
 * ```tsx
 * // Preload map when user hovers over the map button
 * preloadComponent(() => import('@/components/map/MapView'));
 * ```
 */
export function preloadComponent(importFn: () => Promise<unknown>): void {
  importFn().catch((error) => {
    console.warn('[Performance] Preload failed:', error);
  });
}

/**
 * Utility to measure render time of a component
 * Only active in development mode
 *
 * Usage:
 * ```tsx
 * useRenderTime('MyComponent');
 * ```
 */
export function useRenderTime(componentName: string): void {
  if (__DEV__) {
    const startTime = performance.now();

    // This runs after render
    requestAnimationFrame(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (renderTime > 16.67) {
        // More than 1 frame (60fps)
        console.warn(`[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms`);
      }
    });
  }
}

/**
 * Constants for performance tuning
 */
export const PERFORMANCE_CONSTANTS = {
  // FlatList optimization settings
  FLATLIST: {
    INITIAL_NUM_TO_RENDER: 10,
    MAX_TO_RENDER_PER_BATCH: 10,
    WINDOW_SIZE: 5,
    UPDATE_CELLS_BATCHING_PERIOD: 50,
  },

  // Image optimization settings
  IMAGE: {
    DEFAULT_TRANSITION_DURATION: 200,
    CACHE_POLICY: 'memory-disk' as const,
  },

  // Query cache settings (in milliseconds)
  QUERY_CACHE: {
    SHORT: 30 * 1000, // 30 seconds
    MEDIUM: 2 * 60 * 1000, // 2 minutes
    LONG: 5 * 60 * 1000, // 5 minutes
    VERY_LONG: 30 * 60 * 1000, // 30 minutes
  },
};

export default {
  createLazyComponent,
  preloadComponent,
  useRenderTime,
  PERFORMANCE_CONSTANTS,
};
