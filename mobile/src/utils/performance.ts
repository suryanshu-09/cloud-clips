import React, { lazy, Suspense, useEffect, useRef, type ComponentType, type ReactNode } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

/**
 * Performance utilities for code splitting and lazy loading
 *
 * These utilities help optimize bundle size and initial load time by:
 * 1. Lazy loading heavy components/screens
 * 2. Providing loading fallbacks
 * 3. Error boundary wrappers for lazy components
 * 4. Render time monitoring
 * 5. Memoization helpers
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
 * Preload multiple heavy screen modules in the background after the app mounts.
 * Call this once from the root layout after initial render.
 *
 * Usage:
 * ```ts
 * useEffect(() => { preloadHeavyScreens(); }, []);
 * ```
 */
export function preloadHeavyScreens(): void {
  // Stagger preloads to avoid competing with initial render
  const modules: Array<() => Promise<unknown>> = [
    () => import('@/components/map/MapView'),
    () => import('@/components/map/BarberMarker'),
    () => import('@/components/map/FilterBottomSheet'),
    () => import('@/components/hairstyle/ARTryOn'),
    () => import('@/components/ui/ImageZoomModal'),
  ];

  modules.forEach((mod, index) => {
    setTimeout(() => preloadComponent(mod), (index + 1) * 300);
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
 * Hook to track and warn about excessive re-renders in development.
 *
 * Usage:
 * ```tsx
 * useRenderCount('MyExpensiveComponent');
 * ```
 */
export function useRenderCount(componentName: string): void {
  if (__DEV__) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const renderCount = useRef(0);
    renderCount.current += 1;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (renderCount.current > 10) {
        console.warn(
          `[Performance] ${componentName} has rendered ${renderCount.current} times. Consider memoization.`
        );
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
    // For chat messages (inverted lists)
    CHAT_INITIAL_NUM_TO_RENDER: 15,
    CHAT_MAX_TO_RENDER_PER_BATCH: 10,
    CHAT_WINDOW_SIZE: 7,
  },

  // Image optimization settings
  IMAGE: {
    DEFAULT_TRANSITION_DURATION: 200,
    ZOOM_TRANSITION_DURATION: 150,
    CACHE_POLICY: 'memory-disk' as const,
    // Blurhash placeholder for while images load
    DEFAULT_BLURHASH: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
    // Thumbnail quality for gallery grids
    THUMBNAIL_QUALITY: 0.7,
    // Full-size quality for detail views
    FULLSIZE_QUALITY: 0.9,
  },

  // Query cache settings (in milliseconds)
  QUERY_CACHE: {
    SHORT: 30 * 1000,         // 30 seconds - volatile data (availability slots)
    MEDIUM: 2 * 60 * 1000,   // 2 minutes  - semi-volatile (barber lists)
    LONG: 5 * 60 * 1000,     // 5 minutes  - stable (barber profiles, products)
    VERY_LONG: 30 * 60 * 1000, // 30 minutes - static (categories, config)
  },

  // Debounce/throttle timings
  DEBOUNCE: {
    SEARCH: 300,         // Search input debounce
    ADDRESS: 400,        // Address autocomplete debounce
    MAP_REGION: 500,     // Map region change debounce
  },
};

export default {
  createLazyComponent,
  preloadComponent,
  preloadHeavyScreens,
  useRenderTime,
  useRenderCount,
  PERFORMANCE_CONSTANTS,
};
