// Export hooks
export {
  useBarberReviews,
  useClientReviews,
  useAppointmentReview,
  useBarberReviewStats,
  useCanReviewAppointment,
  reviewKeys,
} from './hooks/useReviews';

export {
  useSubmitReview,
  useUpdateReview,
  useDeleteReview,
  useUploadReviewPhotos,
} from './hooks/useSubmitReview';

// Export services
export { reviewService } from './services/reviewService';
export { mockReviewService } from './services/mockReviewService';

// Export types
export type { IReview, IReviewSubmission, IReviewStats, IReviewsResponse } from './types';
