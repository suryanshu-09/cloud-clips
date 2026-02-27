/**
 * Review types for the Cloud Clips reviews and ratings system
 */

// ============================================================================
// Review Photo Types
// ============================================================================

/**
 * Photo attached to a review
 */
export interface IReviewPhoto {
  /** Unique identifier for the photo */
  id: string;
  /** URL to access the photo */
  url: string;
  /** Convex storage ID for the file */
  storageId: string;
  /** Optional caption for the photo */
  caption?: string;
  /** When the photo was uploaded */
  uploadedAt: string;
  /** Width of the image in pixels */
  width?: number;
  /** Height of the image in pixels */
  height?: number;
  /** File size in bytes */
  size?: number;
}

/**
 * Photo file before upload (local)
 */
export interface IReviewPhotoUpload {
  /** Local URI of the photo */
  uri: string;
  /** MIME type of the photo */
  type: string;
  /** File name */
  name: string;
  /** Width of the image */
  width?: number;
  /** Height of the image */
  height?: number;
  /** File size in bytes */
  size?: number;
}

// ============================================================================
// Review Types
// ============================================================================

/**
 * Review status for moderation
 */
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'reported';

/**
 * Main review interface
 */
export interface IReview {
  /** Unique identifier for the review */
  id: string;
  /** ID of the client who wrote the review */
  clientId: string;
  /** Name of the client (denormalized for display) */
  clientName: string;
  /** Profile image of the client (optional) */
  clientProfileImage?: string;
  /** ID of the barber being reviewed */
  barberId: string;
  /** ID of the appointment this review is for */
  appointmentId: string;
  /** Star rating (1-5) */
  rating: number;
  /** Review text content */
  text: string;
  /** Photos attached to the review */
  photos: IReviewPhoto[];
  /** Current status of the review */
  status: ReviewStatus;
  /** Number of times this review has been reported */
  reportCount: number;
  /** Reason for report (if status is reported) */
  reportReason?: string;
  /** When the review was created */
  createdAt: string;
  /** When the review was last updated */
  updatedAt: string;
  /** Whether the client has verified they visited the barber */
  isVerified: boolean;
}

/**
 * Review with additional details for display
 */
export interface IReviewWithDetails extends IReview {
  /** Barber's business name */
  barberBusinessName: string;
  /** Barber's profile image */
  barberProfileImage?: string;
  /** Service that was provided */
  serviceName: string;
  /** Date of the appointment */
  appointmentDate: string;
}

// ============================================================================
// Review Submission Types
// ============================================================================

/**
 * Data required to submit a new review
 */
export interface IReviewSubmission {
  /** ID of the appointment being reviewed */
  appointmentId: string;
  /** ID of the barber being reviewed */
  barberId: string;
  /** Star rating (1-5) */
  rating: number;
  /** Review text content (optional but recommended) */
  text?: string;
  /** Photos to upload with the review */
  photos: IReviewPhotoUpload[];
}

/**
 * Review submission validation errors
 */
export interface IReviewValidationErrors {
  /** Error message for rating */
  rating?: string;
  /** Error message for text */
  text?: string;
  /** Error message for photos */
  photos?: string;
  /** Error message for appointment */
  appointmentId?: string;
}

// ============================================================================
// Review Summary Types
// ============================================================================

/**
 * Rating distribution (how many of each star rating)
 */
export interface IRatingDistribution {
  /** Number of 5-star reviews */
  fiveStar: number;
  /** Number of 4-star reviews */
  fourStar: number;
  /** Number of 3-star reviews */
  threeStar: number;
  /** Number of 2-star reviews */
  twoStar: number;
  /** Number of 1-star reviews */
  oneStar: number;
}

/**
 * Review summary for a barber's profile
 */
export interface IReviewSummary {
  /** Average rating (0-5) */
  averageRating: number;
  /** Total number of reviews */
  totalReviews: number;
  /** Distribution of ratings */
  distribution: IRatingDistribution;
}

// ============================================================================
// Review Report Types
// ============================================================================

/**
 * Reasons for reporting a review
 */
export type ReportReason =
  | 'inappropriate_content'
  | 'fake_review'
  | 'spam'
  | 'off_topic'
  | 'harassment'
  | 'other';

/**
 * Data for reporting a review
 */
export interface IReviewReport {
  /** ID of the review being reported */
  reviewId: string;
  /** ID of the user reporting the review */
  reporterId: string;
  /** Reason for the report */
  reason: ReportReason;
  /** Additional details about the report */
  details?: string;
  /** When the report was created */
  createdAt: string;
}

// ============================================================================
// Review Query/Filter Types
// ============================================================================

/**
 * Filters for fetching reviews
 */
export interface IReviewFilters {
  /** Filter by minimum rating */
  minRating?: number;
  /** Filter by maximum rating */
  maxRating?: number;
  /** Filter by status */
  status?: ReviewStatus;
  /** Include reviews with photos only */
  hasPhotos?: boolean;
  /** Include verified reviews only */
  verifiedOnly?: boolean;
  /** Sort order */
  sortBy: 'newest' | 'oldest' | 'highest_rated' | 'lowest_rated';
}

/**
 * Parameters for fetching reviews with pagination
 */
export interface IReviewQueryParams extends IReviewFilters {
  /** Page number (1-based) */
  page: number;
  /** Number of reviews per page */
  limit: number;
}

/**
 * Paginated reviews response
 */
export interface IPaginatedReviews {
  /** List of reviews */
  reviews: IReview[];
  /** Total number of reviews matching the filters */
  total: number;
  /** Current page number */
  page: number;
  /** Number of reviews per page */
  limit: number;
  /** Whether there are more pages */
  hasMore: boolean;
}

// ============================================================================
// Review Response Types
// ============================================================================

/**
 * Barber's response to a review
 */
export interface IReviewResponse {
  /** ID of the response */
  id: string;
  /** ID of the review being responded to */
  reviewId: string;
  /** ID of the barber responding */
  barberId: string;
  /** Response text */
  text: string;
  /** When the response was created */
  createdAt: string;
  /** When the response was last updated */
  updatedAt: string;
}

/**
 * Review with barber response
 */
export interface IReviewWithResponse extends IReview {
  /** Barber's response to this review (if any) */
  response?: IReviewResponse;
}
