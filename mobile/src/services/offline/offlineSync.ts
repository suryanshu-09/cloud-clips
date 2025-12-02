import { storageHelpers } from '../storage/mmkv';

interface IPendingAction {
  id: string;
  type: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data: unknown;
  createdAt: number;
  retryCount: number;
}

const PENDING_ACTIONS_KEY = 'offline_pending_actions';
const MAX_RETRIES = 3;

/**
 * Offline sync service for managing pending actions when offline
 * Queues actions when offline and syncs them when back online
 */
export const offlineSyncService = {
  /**
   * Queue an action to be synced when back online
   */
  queueAction: (action: Omit<IPendingAction, 'id' | 'createdAt' | 'retryCount'>): string => {
    const pendingActions = storageHelpers.getObject<IPendingAction[]>(PENDING_ACTIONS_KEY) || [];

    const newAction: IPendingAction = {
      ...action,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      retryCount: 0,
    };

    pendingActions.push(newAction);
    storageHelpers.setObject(PENDING_ACTIONS_KEY, pendingActions);

    console.log('[OfflineSync] Queued action:', newAction.type, newAction.id);
    return newAction.id;
  },

  /**
   * Get all pending actions
   */
  getPendingActions: (): IPendingAction[] => {
    return storageHelpers.getObject<IPendingAction[]>(PENDING_ACTIONS_KEY) || [];
  },

  /**
   * Get count of pending actions
   */
  getPendingCount: (): number => {
    const actions = storageHelpers.getObject<IPendingAction[]>(PENDING_ACTIONS_KEY) || [];
    return actions.length;
  },

  /**
   * Remove a pending action after successful sync
   */
  removeAction: (actionId: string): void => {
    const pendingActions = storageHelpers.getObject<IPendingAction[]>(PENDING_ACTIONS_KEY) || [];
    const filtered = pendingActions.filter((a) => a.id !== actionId);
    storageHelpers.setObject(PENDING_ACTIONS_KEY, filtered);
    console.log('[OfflineSync] Removed action:', actionId);
  },

  /**
   * Increment retry count for a failed action
   */
  incrementRetry: (actionId: string): boolean => {
    const pendingActions = storageHelpers.getObject<IPendingAction[]>(PENDING_ACTIONS_KEY) || [];
    const actionIndex = pendingActions.findIndex((a) => a.id === actionId);

    if (actionIndex === -1) return false;

    pendingActions[actionIndex].retryCount += 1;

    // Remove if max retries exceeded
    if (pendingActions[actionIndex].retryCount >= MAX_RETRIES) {
      console.log('[OfflineSync] Max retries exceeded, removing action:', actionId);
      pendingActions.splice(actionIndex, 1);
      storageHelpers.setObject(PENDING_ACTIONS_KEY, pendingActions);
      return false;
    }

    storageHelpers.setObject(PENDING_ACTIONS_KEY, pendingActions);
    return true;
  },

  /**
   * Clear all pending actions
   */
  clearAll: (): void => {
    storageHelpers.delete(PENDING_ACTIONS_KEY);
    console.log('[OfflineSync] Cleared all pending actions');
  },

  /**
   * Sync all pending actions with the server
   * Returns array of results for each action
   */
  syncAll: async (
    executor: (action: IPendingAction) => Promise<boolean>
  ): Promise<{ success: number; failed: number }> => {
    const pendingActions = offlineSyncService.getPendingActions();
    let success = 0;
    let failed = 0;

    console.log('[OfflineSync] Starting sync of', pendingActions.length, 'actions');

    for (const action of pendingActions) {
      try {
        const result = await executor(action);
        if (result) {
          offlineSyncService.removeAction(action.id);
          success++;
        } else {
          const shouldRetry = offlineSyncService.incrementRetry(action.id);
          if (!shouldRetry) {
            failed++;
          }
        }
      } catch (error) {
        console.error('[OfflineSync] Error syncing action:', action.id, error);
        const shouldRetry = offlineSyncService.incrementRetry(action.id);
        if (!shouldRetry) {
          failed++;
        }
      }
    }

    console.log('[OfflineSync] Sync complete:', { success, failed });
    return { success, failed };
  },
};

/**
 * Cache service for offline data access
 */
export const offlineCacheService = {
  /**
   * Cache data for offline access
   */
  cacheData: <T>(key: string, data: T, ttlMs?: number): void => {
    const cacheEntry = {
      data,
      cachedAt: Date.now(),
      expiresAt: ttlMs ? Date.now() + ttlMs : null,
    };
    storageHelpers.setObject(`cache_${key}`, cacheEntry);
  },

  /**
   * Get cached data if available and not expired
   */
  getCachedData: <T>(key: string): T | null => {
    const cacheEntry = storageHelpers.getObject<{
      data: T;
      cachedAt: number;
      expiresAt: number | null;
    }>(`cache_${key}`);

    if (!cacheEntry) return null;

    // Check if expired
    if (cacheEntry.expiresAt && Date.now() > cacheEntry.expiresAt) {
      storageHelpers.delete(`cache_${key}`);
      return null;
    }

    return cacheEntry.data;
  },

  /**
   * Check if cache exists and is valid
   */
  hasValidCache: (key: string): boolean => {
    return offlineCacheService.getCachedData(key) !== null;
  },

  /**
   * Invalidate cache for a key
   */
  invalidate: (key: string): void => {
    storageHelpers.delete(`cache_${key}`);
  },

  /**
   * Get cache age in milliseconds
   */
  getCacheAge: (key: string): number | null => {
    const cacheEntry = storageHelpers.getObject<{
      cachedAt: number;
    }>(`cache_${key}`);

    if (!cacheEntry) return null;
    return Date.now() - cacheEntry.cachedAt;
  },
};
