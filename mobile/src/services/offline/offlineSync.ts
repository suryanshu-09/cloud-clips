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

// ---------------------------------------------------------------------------
// Convex pending mutations queue
// ---------------------------------------------------------------------------

export interface IConvexPendingMutation {
  /** Unique id generated at queue time */
  id: string;
  /** Human-readable label, e.g. 'bookAppointment' */
  type: string;
  /** Serialised Convex mutation path, e.g. 'appointments:mutations:bookAppointment' */
  mutationPath: string;
  /** Arguments to pass to the mutation when replaying */
  args: unknown;
  createdAt: number;
  retryCount: number;
}

const CONVEX_PENDING_MUTATIONS_KEY = 'offline_convex_pending_mutations';

/**
 * Offline queue specifically for Convex mutations.
 * Mutations are stored in MMKV and replayed when connectivity is restored.
 */
export const convexOfflineQueue = {
  /**
   * Enqueue a Convex mutation to be replayed when back online.
   * Returns the generated action id.
   */
  enqueue: (mutation: Omit<IConvexPendingMutation, 'id' | 'createdAt' | 'retryCount'>): string => {
    const queue =
      storageHelpers.getObject<IConvexPendingMutation[]>(CONVEX_PENDING_MUTATIONS_KEY) || [];

    const entry: IConvexPendingMutation = {
      ...mutation,
      id: `convex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      retryCount: 0,
    };

    queue.push(entry);
    storageHelpers.setObject(CONVEX_PENDING_MUTATIONS_KEY, queue);
    console.log('[ConvexOfflineQueue] Enqueued mutation:', entry.type, entry.id);
    return entry.id;
  },

  /** Return all pending Convex mutations. */
  getAll: (): IConvexPendingMutation[] => {
    return storageHelpers.getObject<IConvexPendingMutation[]>(CONVEX_PENDING_MUTATIONS_KEY) || [];
  },

  /** Number of pending Convex mutations. */
  getCount: (): number => {
    return convexOfflineQueue.getAll().length;
  },

  /** Remove a successfully replayed mutation from the queue. */
  remove: (id: string): void => {
    const queue =
      storageHelpers.getObject<IConvexPendingMutation[]>(CONVEX_PENDING_MUTATIONS_KEY) || [];
    storageHelpers.setObject(
      CONVEX_PENDING_MUTATIONS_KEY,
      queue.filter((m) => m.id !== id)
    );
    console.log('[ConvexOfflineQueue] Removed mutation:', id);
  },

  /**
   * Increment the retry count.  Returns `false` if max retries exceeded (entry is removed).
   */
  incrementRetry: (id: string): boolean => {
    const queue =
      storageHelpers.getObject<IConvexPendingMutation[]>(CONVEX_PENDING_MUTATIONS_KEY) || [];
    const idx = queue.findIndex((m) => m.id === id);
    if (idx === -1) return false;

    queue[idx].retryCount += 1;

    if (queue[idx].retryCount >= MAX_RETRIES) {
      console.log('[ConvexOfflineQueue] Max retries exceeded, discarding:', id);
      queue.splice(idx, 1);
      storageHelpers.setObject(CONVEX_PENDING_MUTATIONS_KEY, queue);
      return false;
    }

    storageHelpers.setObject(CONVEX_PENDING_MUTATIONS_KEY, queue);
    return true;
  },

  /** Clear the entire Convex mutation queue. */
  clearAll: (): void => {
    storageHelpers.delete(CONVEX_PENDING_MUTATIONS_KEY);
    console.log('[ConvexOfflineQueue] Cleared all pending Convex mutations');
  },

  /**
   * Replay all queued Convex mutations using the provided executor function.
   * The executor receives each pending mutation and should return `true` on success.
   */
  syncAll: async (
    executor: (mutation: IConvexPendingMutation) => Promise<boolean>
  ): Promise<{ success: number; failed: number }> => {
    const queue = convexOfflineQueue.getAll();
    let success = 0;
    let failed = 0;

    console.log('[ConvexOfflineQueue] Starting sync of', queue.length, 'mutations');

    for (const mutation of queue) {
      try {
        const ok = await executor(mutation);
        if (ok) {
          convexOfflineQueue.remove(mutation.id);
          success++;
        } else {
          const shouldRetry = convexOfflineQueue.incrementRetry(mutation.id);
          if (!shouldRetry) failed++;
        }
      } catch (err) {
        console.error('[ConvexOfflineQueue] Error replaying mutation:', mutation.id, err);
        const shouldRetry = convexOfflineQueue.incrementRetry(mutation.id);
        if (!shouldRetry) failed++;
      }
    }

    console.log('[ConvexOfflineQueue] Sync complete:', { success, failed });
    return { success, failed };
  },
};

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
