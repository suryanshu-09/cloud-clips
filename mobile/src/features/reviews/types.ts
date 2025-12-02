export interface IReview {
  id: string;
  appointmentId: string;
  clientId: string;
  barberId: string;
  rating: number;
  comment?: string;
  photos?: string[];
  createdAt: string;
  // Extended fields from joins
  clientName?: string;
  clientAvatar?: string;
}

export interface IReviewSubmission {
  appointmentId: string;
  barberId: string;
  rating: number;
  comment?: string;
  photos?: string[];
  clientId?: string; // Optional for mock service to set dynamically
}

export interface IReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface IReviewsResponse {
  reviews: IReview[];
  stats: IReviewStats;
  hasMore: boolean;
  nextCursor?: string;
}
