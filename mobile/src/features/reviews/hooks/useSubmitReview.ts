import { useMutation, useQueryClient } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { endpoints } from '@/services/api/endpoints';
import { isNetworkError } from '@/services/api/client';
import { offlineSyncService } from '@/services/offline/offlineSync';
import { reviewService } from '../services/reviewService';
import { mockReviewService } from '../services/mockReviewService';
import { reviewKeys } from './useReviews';
import type { IReview, IReviewStats, IReviewSubmission, IReviewsResponse } from '../types';

// Check if dev mode is enabled
const isDevMode = process.env.EXPO_PUBLIC_DEV_MODE === 'true';
const service = isDevMode ? mockReviewService : reviewService;

/**
 * Hook to submit a new review
 */
export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (review: IReviewSubmission) => {
      const networkState = await NetInfo.fetch();
      const isOffline =
        networkState.isConnected === false || networkState.isInternetReachable === false;

      if (isOffline) {
        offlineSyncService.queueAction({
          type: 'submit_review',
          endpoint: endpoints.reviews.create,
          method: 'POST',
          data: review,
        });

        return buildQueuedReview(review);
      }

      try {
        return await service.submitReview(review);
      } catch (error) {
        if (isNetworkError(error)) {
          offlineSyncService.queueAction({
            type: 'submit_review',
            endpoint: endpoints.reviews.create,
            method: 'POST',
            data: review,
          });
          return buildQueuedReview(review);
        }
        throw error;
      }
    },
    onMutate: async (review) => {
      await queryClient.cancelQueries({ queryKey: reviewKeys.barber(review.barberId) });

      const previousBarberQueries = queryClient.getQueriesData<IReviewsResponse>({
        queryKey: reviewKeys.barber(review.barberId),
      });
      const previousStats = queryClient.getQueryData<IReviewStats>(
        reviewKeys.stats(review.barberId)
      );
      const previousAppointmentReview = queryClient.getQueryData<IReview | null>(
        reviewKeys.appointment(review.appointmentId)
      );
      const previousCanReview = queryClient.getQueryData<boolean>(
        reviewKeys.canReview(review.appointmentId)
      );

      const optimisticReview = buildQueuedReview(review);

      queryClient.setQueriesData<IReviewsResponse>(
        { queryKey: reviewKeys.barber(review.barberId) },
        (current) => {
          if (!current) return current;
          return {
            ...current,
            reviews: [optimisticReview, ...current.reviews],
          };
        }
      );

      queryClient.setQueryData<IReviewStats | undefined>(
        reviewKeys.stats(review.barberId),
        (current) => {
          if (!current) return current;

          const roundedRating = Math.min(5, Math.max(1, Math.round(review.rating))) as
            | 1
            | 2
            | 3
            | 4
            | 5;
          const nextTotal = current.totalReviews + 1;
          const nextAverage =
            (current.averageRating * current.totalReviews + review.rating) / Math.max(1, nextTotal);

          return {
            ...current,
            totalReviews: nextTotal,
            averageRating: Number(nextAverage.toFixed(2)),
            ratingDistribution: {
              ...current.ratingDistribution,
              [roundedRating]: (current.ratingDistribution[roundedRating] ?? 0) + 1,
            },
          };
        }
      );

      queryClient.setQueryData(reviewKeys.appointment(review.appointmentId), optimisticReview);
      queryClient.setQueryData(reviewKeys.canReview(review.appointmentId), false);

      return {
        previousBarberQueries,
        previousStats,
        previousAppointmentReview,
        previousCanReview,
      };
    },
    onSuccess: (newReview: IReview) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: reviewKeys.barber(newReview.barberId),
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.stats(newReview.barberId),
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.appointment(newReview.appointmentId),
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.canReview(newReview.appointmentId),
      });

      // Optionally update cache directly for instant UI update
      queryClient.setQueryData(reviewKeys.appointment(newReview.appointmentId), newReview);
    },
    onError: (_error, review, context) => {
      if (!context) return;

      for (const [queryKey, previousData] of context.previousBarberQueries) {
        queryClient.setQueryData(queryKey, previousData);
      }

      queryClient.setQueryData(reviewKeys.stats(review.barberId), context.previousStats);
      queryClient.setQueryData(
        reviewKeys.appointment(review.appointmentId),
        context.previousAppointmentReview
      );
      queryClient.setQueryData(
        reviewKeys.canReview(review.appointmentId),
        context.previousCanReview
      );
    },
    onSettled: (_data, _error, review) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.barber(review.barberId) });
      queryClient.invalidateQueries({ queryKey: reviewKeys.stats(review.barberId) });
      queryClient.invalidateQueries({ queryKey: reviewKeys.appointment(review.appointmentId) });
      queryClient.invalidateQueries({ queryKey: reviewKeys.canReview(review.appointmentId) });
    },
  });
}

function buildQueuedReview(review: IReviewSubmission): IReview {
  const now = new Date().toISOString();
  return {
    id: `queued-review-${Date.now()}`,
    appointmentId: review.appointmentId,
    barberId: review.barberId,
    clientId: review.clientId ?? 'offline-client',
    rating: review.rating,
    comment: review.comment,
    photos: review.photos,
    createdAt: now,
  };
}

/**
 * Hook to update an existing review
 */
export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      updates,
    }: {
      reviewId: string;
      updates: Partial<Pick<IReviewSubmission, 'rating' | 'comment' | 'photos'>>;
    }) => service.updateReview(reviewId, updates),
    onSuccess: (updatedReview: IReview) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: reviewKeys.barber(updatedReview.barberId),
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.stats(updatedReview.barberId),
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.appointment(updatedReview.appointmentId),
      });

      // Update cache directly
      queryClient.setQueryData(reviewKeys.appointment(updatedReview.appointmentId), updatedReview);
    },
  });
}

/**
 * Hook to delete a review
 */
export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { reviewId: string; barberId: string; appointmentId: string }) =>
      service.deleteReview(variables.reviewId),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: reviewKeys.barber(variables.barberId),
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.stats(variables.barberId),
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.appointment(variables.appointmentId),
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.canReview(variables.appointmentId),
      });

      // Clear appointment review from cache
      queryClient.setQueryData(reviewKeys.appointment(variables.appointmentId), null);
    },
  });
}

/**
 * Hook to upload review photos
 */
export function useUploadReviewPhotos() {
  return useMutation({
    mutationFn: (photos: File[]) => service.uploadReviewPhotos(photos),
  });
}
