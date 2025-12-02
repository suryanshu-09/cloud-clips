import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '../services/reviewService';
import { mockReviewService } from '../services/mockReviewService';
import { reviewKeys } from './useReviews';
import type { IReview, IReviewSubmission } from '../types';

// Check if dev mode is enabled
const isDevMode = process.env.EXPO_PUBLIC_DEV_MODE === 'true';
const service = isDevMode ? mockReviewService : reviewService;

/**
 * Hook to submit a new review
 */
export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (review: IReviewSubmission) => service.submitReview(review),
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
  });
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
    mutationFn: ({
      reviewId,
      barberId,
      appointmentId,
    }: {
      reviewId: string;
      barberId: string;
      appointmentId: string;
    }) => service.deleteReview(reviewId),
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
