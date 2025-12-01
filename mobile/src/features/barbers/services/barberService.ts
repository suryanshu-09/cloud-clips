import apiClient from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import type {
  IBarberProfile,
  IBarberSearchParams,
  IBarberListResponse,
  IBarberAvailability,
  IBarberUpdateData,
} from '../types';
import { mockBarberService } from './mockBarberService';

// Check if we should use mock data
const USE_MOCK = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

/**
 * Barber service for API calls
 * Automatically uses mock data in DEV_MODE
 */
const realBarberService = {
  /**
   * Get list of all barbers
   */
  getBarbers: async (params?: IBarberSearchParams): Promise<IBarberListResponse> => {
    try {
      const response = await apiClient.get<IBarberListResponse>(endpoints.barbers.list, {
        params,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch barbers');
    }
  },

  /**
   * Get nearby barbers based on location
   */
  getNearbyBarbers: async (params: {
    latitude: number;
    longitude: number;
    radius?: number;
  }): Promise<IBarberListResponse> => {
    try {
      const response = await apiClient.get<IBarberListResponse>(endpoints.barbers.nearby, {
        params,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch nearby barbers');
    }
  },

  /**
   * Search barbers with filters
   */
  searchBarbers: async (params: IBarberSearchParams): Promise<IBarberListResponse> => {
    try {
      const response = await apiClient.get<IBarberListResponse>(endpoints.barbers.search, {
        params,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to search barbers');
    }
  },

  /**
   * Get single barber profile by ID
   */
  getBarberById: async (id: string): Promise<IBarberProfile> => {
    try {
      const response = await apiClient.get<IBarberProfile>(endpoints.barbers.detail(id));
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch barber profile');
    }
  },

  /**
   * Get barber availability for a specific date
   */
  getBarberAvailability: async (barberId: string, date: string): Promise<IBarberAvailability> => {
    try {
      const response = await apiClient.get<IBarberAvailability>(
        endpoints.barbers.availability(barberId),
        {
          params: { date },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch barber availability');
    }
  },

  /**
   * Get barber reviews
   */
  getBarberReviews: async (barberId: string) => {
    try {
      const response = await apiClient.get(endpoints.barbers.reviews(barberId));
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch barber reviews');
    }
  },

  /**
   * Get barber portfolio/gallery
   */
  getBarberPortfolio: async (barberId: string) => {
    try {
      const response = await apiClient.get(endpoints.barbers.portfolio(barberId));
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch barber portfolio');
    }
  },

  /**
   * Update barber profile (for barber users)
   */
  updateBarberProfile: async (data: IBarberUpdateData): Promise<IBarberProfile> => {
    try {
      const response = await apiClient.patch<IBarberProfile>(endpoints.barbers.updateProfile, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update barber profile');
    }
  },

  /**
   * Upload portfolio image (for barber users)
   */
  uploadPortfolioImage: async (imageUri: string): Promise<{ url: string }> => {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'portfolio.jpg',
      } as any);

      const response = await apiClient.post<{ url: string }>(
        endpoints.barbers.uploadPortfolio,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload portfolio image');
    }
  },
};

// Export either mock or real service based on DEV_MODE
export const barberService = USE_MOCK ? mockBarberService : realBarberService;

export default barberService;
