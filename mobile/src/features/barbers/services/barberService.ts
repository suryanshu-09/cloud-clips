import apiClient from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import type {
  IBarberProfile,
  IBarberSearchParams,
  IBarberListResponse,
  IBarberAvailability,
  IBarberUpdateData,
} from '../types';

// Check if we should use mock data as fallback
const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

// Lazy load mock service only when needed
let mockBarberService: typeof import('./mockBarberService').mockBarberService | null = null;

const getMockService = async () => {
  if (!mockBarberService && DEV_MODE) {
    const module = await import('./mockBarberService');
    mockBarberService = module.mockBarberService;
  }
  return mockBarberService;
};

/**
 * Barber service for API calls
 * Falls back to mock data in DEV_MODE when API is unavailable
 */
export const barberService = {
  /**
   * Get list of all barbers with optional filters
   */
  getBarbers: async (params?: IBarberSearchParams): Promise<IBarberListResponse> => {
    try {
      const response = await apiClient.get<IBarberListResponse>(endpoints.barbers.list, {
        params,
      });
      return response.data;
    } catch (error: any) {
      // Fall back to mock in dev mode
      if (DEV_MODE) {
        const mock = await getMockService();
        if (mock) {
          console.log('[BARBERS] Using mock data fallback');
          return mock.getBarbers(params);
        }
      }
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
    limit?: number;
  }): Promise<IBarberListResponse> => {
    try {
      const response = await apiClient.get<IBarberListResponse>(endpoints.barbers.nearby, {
        params: {
          lat: params.latitude,
          lng: params.longitude,
          radius: params.radius || 10, // Default 10km radius
          limit: params.limit || 20,
        },
      });
      return response.data;
    } catch (error: any) {
      if (DEV_MODE) {
        const mock = await getMockService();
        if (mock) {
          console.log('[BARBERS] Using mock nearby data fallback');
          return mock.getNearbyBarbers(params);
        }
      }
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
      if (DEV_MODE) {
        const mock = await getMockService();
        if (mock) {
          console.log('[BARBERS] Using mock search fallback');
          return mock.searchBarbers(params);
        }
      }
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
      if (DEV_MODE) {
        const mock = await getMockService();
        if (mock) {
          console.log('[BARBERS] Using mock barber detail fallback');
          return mock.getBarberById(id);
        }
      }
      throw new Error(error.message || 'Failed to fetch barber profile');
    }
  },

  /**
   * Get barber services
   */
  getBarberServices: async (barberId: string) => {
    try {
      const response = await apiClient.get(endpoints.barbers.services(barberId));
      return response.data;
    } catch (error: any) {
      if (DEV_MODE) {
        const mock = await getMockService();
        if (mock) {
          const barber = await mock.getBarberById(barberId);
          return barber.services || [];
        }
      }
      throw new Error(error.message || 'Failed to fetch barber services');
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
      if (DEV_MODE) {
        const mock = await getMockService();
        if (mock) {
          console.log('[BARBERS] Using mock availability fallback');
          return mock.getBarberAvailability(barberId, date);
        }
      }
      throw new Error(error.message || 'Failed to fetch barber availability');
    }
  },

  /**
   * Get barber reviews
   */
  getBarberReviews: async (barberId: string, params?: { page?: number; limit?: number }) => {
    try {
      const response = await apiClient.get(endpoints.barbers.reviews(barberId), { params });
      return response.data;
    } catch (error: any) {
      if (DEV_MODE) {
        const mock = await getMockService();
        if (mock) {
          console.log('[BARBERS] Using mock reviews fallback');
          return mock.getBarberReviews(barberId);
        }
      }
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
      if (DEV_MODE) {
        const mock = await getMockService();
        if (mock) {
          console.log('[BARBERS] Using mock portfolio fallback');
          return mock.getBarberPortfolio(barberId);
        }
      }
      throw new Error(error.message || 'Failed to fetch barber portfolio');
    }
  },

  /**
   * Update barber profile (for barber users)
   */
  updateBarberProfile: async (data: IBarberUpdateData): Promise<IBarberProfile> => {
    try {
      const response = await apiClient.put<IBarberProfile>(endpoints.barbers.updateProfile, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update barber profile');
    }
  },

  /**
   * Update barber schedule/working hours
   */
  updateBarberSchedule: async (barberId: string, schedule: any): Promise<void> => {
    try {
      await apiClient.put(endpoints.barbers.schedule(barberId), schedule);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update barber schedule');
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

  /**
   * Delete portfolio image
   */
  deletePortfolioImage: async (barberId: string, imageId: string): Promise<void> => {
    try {
      await apiClient.delete(`${endpoints.barbers.portfolio(barberId)}/${imageId}`);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete portfolio image');
    }
  },
};

export default barberService;
