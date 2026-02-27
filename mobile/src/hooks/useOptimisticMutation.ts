import { useCallback } from 'react';
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type QueryKey,
  type MutationFunction,
} from '@tanstack/react-query';
import { useNetworkStatus } from './useNetworkStatus';
import { offlineSyncService } from '@/services/offline/offlineSync';

export type OptimisticUpdater<TData, TVariables> = (
  oldData: TData | undefined,
  variables: TVariables
) => TData;

export interface IOptimisticMutationOptions<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
> extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'> {
  /**
   * The mutation function to execute.
   */
  mutationFn: MutationFunction<TData, TVariables>;

  /**
   * Query keys whose cached data should be optimistically updated.
   * Provide an array of { queryKey, updater } pairs.
   */
  optimisticUpdates?: Array<{
    queryKey: QueryKey;
    updater: OptimisticUpdater<unknown, TVariables>;
  }>;

  /**
   * When offline, queue this action for later sync instead of failing.
   * Requires endpoint + method so it can be replayed by offlineSyncService.
   */
  offlineQueue?: {
    type: string;
    endpoint: string;
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    /** Transform variables into the request body. Defaults to variables as-is. */
    getBody?: (variables: TVariables) => unknown;
  };
}

/**
 * Wraps TanStack Query's `useMutation` with:
 * 1. Automatic optimistic cache updates (with rollback on error)
 * 2. Offline action queueing via `offlineSyncService`
 *
 * @example
 * ```tsx
 * const { mutate } = useOptimisticMutation({
 *   mutationFn: (data) => api.post('/orders', data),
 *   optimisticUpdates: [{
 *     queryKey: queryKeys.orders.all,
 *     updater: (old, variables) => [...(old ?? []), { ...variables, id: 'temp' }],
 *   }],
 *   offlineQueue: {
 *     type: 'CREATE_ORDER',
 *     endpoint: '/orders',
 *     method: 'POST',
 *   },
 * });
 * ```
 */
export function useOptimisticMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext extends { previousData?: Array<{ queryKey: QueryKey; data: unknown }> } = {
    previousData?: Array<{ queryKey: QueryKey; data: unknown }>;
  },
>({
  mutationFn,
  optimisticUpdates,
  offlineQueue,
  onMutate,
  onError,
  onSettled,
  ...rest
}: IOptimisticMutationOptions<TData, TError, TVariables, TContext>) {
  const queryClient = useQueryClient();
  const { isOffline } = useNetworkStatus();

  const handleOnMutate = useCallback(
    async (variables: TVariables): Promise<TContext> => {
      const previousData: Array<{ queryKey: QueryKey; data: unknown }> = [];

      if (optimisticUpdates && optimisticUpdates.length > 0) {
        // Cancel any in-flight refetches for the affected query keys
        await Promise.all(
          optimisticUpdates.map(({ queryKey }) => queryClient.cancelQueries({ queryKey }))
        );

        // Snapshot previous values and apply optimistic updates
        for (const { queryKey, updater } of optimisticUpdates) {
          const previousSnapshot = queryClient.getQueryData(queryKey);
          previousData.push({ queryKey, data: previousSnapshot });

          queryClient.setQueryData(queryKey, (old: unknown) => updater(old, variables));
        }
      }

      // Run consumer's onMutate if provided
      const consumerContext = onMutate ? await onMutate(variables) : undefined;

      return { ...consumerContext, previousData } as TContext;
    },
    [queryClient, optimisticUpdates, onMutate]
  );

  const handleOnError = useCallback(
    (error: TError, variables: TVariables, context: TContext | undefined) => {
      // Roll back optimistic updates
      if (context?.previousData) {
        for (const { queryKey, data } of context.previousData) {
          queryClient.setQueryData(queryKey, data);
        }
      }

      onError?.(error, variables, context);
    },
    [queryClient, onError]
  );

  const handleOnSettled = useCallback(
    (
      data: TData | undefined,
      error: TError | null,
      variables: TVariables,
      context: TContext | undefined
    ) => {
      // Invalidate all affected queries to refetch fresh data
      if (optimisticUpdates && optimisticUpdates.length > 0) {
        optimisticUpdates.forEach(({ queryKey }) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      onSettled?.(data, error, variables, context);
    },
    [queryClient, optimisticUpdates, onSettled]
  );

  // Wrap the mutation function to handle offline queuing
  const wrappedMutationFn: MutationFunction<TData, TVariables> = useCallback(
    async (variables: TVariables) => {
      if (isOffline && offlineQueue) {
        const body = offlineQueue.getBody ? offlineQueue.getBody(variables) : variables;
        offlineSyncService.queueAction({
          type: offlineQueue.type,
          endpoint: offlineQueue.endpoint,
          method: offlineQueue.method,
          data: body,
        });
        // Return a placeholder – the caller should handle this gracefully
        // by checking isOffline before relying on the return value
        return undefined as unknown as TData;
      }

      return mutationFn(variables);
    },
    [isOffline, offlineQueue, mutationFn]
  );

  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn: wrappedMutationFn,
    onMutate: handleOnMutate,
    onError: handleOnError,
    onSettled: handleOnSettled,
    ...rest,
  });
}
