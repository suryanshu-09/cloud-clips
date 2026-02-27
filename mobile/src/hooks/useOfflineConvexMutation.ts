import { useCallback, useState } from 'react';
import { useMutation, type FunctionReference, type OptionalRestArgs } from 'convex/react';
import { useNetworkStatus } from './useNetworkStatus';
import { convexOfflineQueue } from '@/services/offline/offlineSync';

export type ConvexMutationStatus = 'idle' | 'loading' | 'success' | 'error' | 'queued';

export interface IOfflineConvexMutationOptions<TData = unknown, TArgs = unknown> {
  /**
   * Human-readable name used for logging and the offline queue type label.
   * Defaults to 'convexMutation'.
   */
  mutationName?: string;

  /** Called after a successful online mutation. */
  onSuccess?: (data: TData, args: TArgs) => void;

  /** Called when the mutation fails (online). */
  onError?: (error: Error, args: TArgs) => void;

  /**
   * Called when the device is offline and the mutation has been queued.
   * Use this to apply an optimistic UI update or show user feedback.
   */
  onQueued?: (args: TArgs, queueId: string) => void;
}

/**
 * Wraps a Convex `useMutation` hook to add offline support.
 *
 * When the device is online the mutation is executed immediately (normal Convex
 * behaviour).  When offline the mutation arguments are serialised to MMKV via
 * `convexOfflineQueue` and replayed automatically when connectivity is restored
 * (see `_layout.tsx` sync-on-reconnect logic).
 *
 * The hook also exposes an extended `status` field:
 *   - `'queued'`  — device was offline; mutation has been saved for later
 *   - `'loading'` — mutation is in flight
 *   - `'success'` — mutation completed
 *   - `'error'`   — mutation failed online
 *   - `'idle'`    — initial state
 *
 * @example
 * ```tsx
 * const { mutate, status, isQueued } = useOfflineConvexMutation(
 *   api.appointments.mutations.bookAppointment,
 *   {
 *     mutationName: 'bookAppointment',
 *     onSuccess: () => router.push('/appointments'),
 *     onQueued: () => Alert.alert('Saved offline', 'Your booking will be sent when online.'),
 *   }
 * );
 *
 * // Call like a normal Convex mutation
 * mutate({ barberId, scheduledFor, ... });
 * ```
 */
export function useOfflineConvexMutation<
  Mutation extends FunctionReference<'mutation'>,
  TArgs extends Record<string, unknown> = Record<string, unknown>,
  TData = unknown,
>(
  mutation: Mutation,
  options: IOfflineConvexMutationOptions<TData, TArgs> = {}
) {
  const { mutationName = 'convexMutation', onSuccess, onError, onQueued } = options;
  const { isOffline } = useNetworkStatus();
  const convexMutate = useMutation(mutation);

  const [status, setStatus] = useState<ConvexMutationStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | null>(null);
  const [queueId, setQueueId] = useState<string | null>(null);

  const mutate = useCallback(
    async (...args: OptionalRestArgs<Mutation>): Promise<TData | null> => {
      const mutationArgs = (args[0] ?? {}) as TArgs;

      if (isOffline) {
        // Derive a stable serialisable mutation path from the mutation reference
        const mutationPath =
          (mutation as unknown as { _name?: string })._name ?? mutationName;

        const id = convexOfflineQueue.enqueue({
          type: mutationName,
          mutationPath,
          args: mutationArgs,
        });

        setQueueId(id);
        setStatus('queued');
        onQueued?.(mutationArgs, id);
        return null;
      }

      setStatus('loading');
      setError(null);

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (convexMutate as any)(...args);
        setData(result as TData);
        setStatus('success');
        onSuccess?.(result as TData, mutationArgs);
        return result as TData;
      } catch (err) {
        const normalised = err instanceof Error ? err : new Error(String(err));
        setError(normalised);
        setStatus('error');
        onError?.(normalised, mutationArgs);
        throw normalised;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOffline, convexMutate, mutationName, onSuccess, onError, onQueued]
  );

  return {
    mutate,
    status,
    isIdle: status === 'idle',
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    /** `true` when the device was offline and the mutation is queued for later sync. */
    isQueued: status === 'queued',
    data,
    error,
    /** The queue id assigned to the pending mutation (only set when `isQueued`). */
    queueId,
    /** Reset status back to idle. */
    reset: () => {
      setStatus('idle');
      setError(null);
      setData(null);
      setQueueId(null);
    },
  };
}
