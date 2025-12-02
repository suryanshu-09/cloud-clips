import apiClient from '@/services/api/client';
import type { IReview, IReviewSubmission, IReviewsResponse, IReviewStats } from '../types';

export const reviewService = {
  /**
   * Get reviews for a specific barber
   */
  async getBarberReviews(
    barberId: string,
    params?: {
      limit?: number;
      cursor?: string;
      minRating?: number;
    }
  ): Promise<IReviewsResponse> {
    const response = await apiClient.get<IReviewsResponse>(`/barbers/${barberId}/reviews`, {
      params,
    });
    return response.data;
  },

  /**
   * Get reviews by a specific client
   */
  async getClientReviews(
    clientId: string,
    params?: {
      limit?: number;
      cursor?: string;
    }
  ): Promise<IReview[]> {
    const response = await apiClient.get<IReview[]>(`/clients/${clientId}/reviews`, { params });
    return response.data;
  },

  /**
   * Get review for a specific appointment
   */
  async getAppointmentReview(appointmentId: string): Promise<IReview | null> {
    try {
      const response = await apiClient.get<IReview>(`/appointments/${appointmentId}/review`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Submit a new review
   */
  async submitReview(review: IReviewSubmission): Promise<IReview> {
    const response = await apiClient.post<IReview>('/reviews', review);
    return response.data;
  },

  /**
   * Update an existing review
   */
  async updateReview(
    reviewId: string,
    updates: Partial<Pick<IReviewSubmission, 'rating' | 'comment' | 'photos'>>
  ): Promise<IReview> {
    const response = await apiClient.patch<IReview>(`/reviews/${reviewId}`, updates);
    return response.data;
  },

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string): Promise<void> {
    await apiClient.delete(`/reviews/${reviewId}`);
  },

  /**
   * Get review statistics for a barber
   */
  async getBarberReviewStats(barberId: string): Promise<IReviewStats> {
    const response = await apiClient.get<IReviewStats>(`/barbers/${barberId}/reviews/stats`);
    return response.data;
  },

  /**
   * Upload review photos
   */
  async uploadReviewPhotos(photos: File[]): Promise<string[]> {
    const formData = new FormData();
    photos.forEach((photo, index) => {
      formData.append(`photo${index}`, photo);
    });

    const response = await apiClient.post<{ urls: string[] }>('/reviews/photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.urls;
  },

  /**
   * Check if a client can review an appointment
   */
  async canReviewAppointment(appointmentId: string): Promise<boolean> {
    try {
      const response = await apiClient.get<{ canReview: boolean }>(
        `/appointments/${appointmentId}/can-review`
      );
      return response.data.canReview;
    } catch (error) {
      return false;
    }
  },
};
