/**
 * Mock Barber Service
 * Provides dummy barber data for development without backend
 */

import type {
  IBarberProfile,
  IBarberSearchParams,
  IBarberListResponse,
  IBarberAvailability,
  IBarberUpdateData,
} from '../types';

// Mock barber profiles
const MOCK_BARBERS: IBarberProfile[] = [
  {
    id: 'barber-1',
    userId: 'barber-1',
    businessName: "Mike's Barber Shop",
    bio: 'Professional barber with 10+ years of experience. Specializing in fades, tapers, and modern cuts.',
    specialties: ['Fades', 'Tapers', 'Beard Trim', 'Hot Towel Shave'],
    experience: 10,
    serviceLocations: ['in_salon', 'in_home'],
    workingHours: {
      monday: { start: '09:00', end: '18:00', isAvailable: true },
      tuesday: { start: '09:00', end: '18:00', isAvailable: true },
      wednesday: { start: '09:00', end: '18:00', isAvailable: true },
      thursday: { start: '09:00', end: '18:00', isAvailable: true },
      friday: { start: '09:00', end: '20:00', isAvailable: true },
      saturday: { start: '10:00', end: '16:00', isAvailable: true },
      sunday: { start: '00:00', end: '00:00', isAvailable: false },
    },
    services: [
      { name: 'Haircut', price: 35, duration: 45, description: 'Classic haircut with styling' },
      { name: 'Fade', price: 40, duration: 60, description: 'Professional fade haircut' },
      { name: 'Beard Trim', price: 20, duration: 30, description: 'Beard shaping and trim' },
      {
        name: 'Hot Towel Shave',
        price: 30,
        duration: 45,
        description: 'Traditional hot towel shave',
      },
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400', type: 'after' },
      { url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400', type: 'after' },
      { url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400', type: 'space' },
    ],
    rating: 4.8,
    totalReviews: 156,
    isVerified: true,
    location: {
      type: 'Point',
      coordinates: [79.1574988, 12.9739803], // [longitude, latitude]
      address: '123 Main Street, Chennai, TN 600001',
    },
  },
  {
    id: 'barber-2',
    userId: 'barber-2',
    businessName: "Sarah's Style Studio",
    bio: 'Expert in modern cuts and color treatments. Making you look and feel your best!',
    specialties: ['Modern Cuts', 'Color', 'Highlights', 'Styling'],
    experience: 8,
    serviceLocations: ['in_salon'],
    workingHours: {
      monday: { start: '10:00', end: '19:00', isAvailable: true },
      tuesday: { start: '10:00', end: '19:00', isAvailable: true },
      wednesday: { start: '10:00', end: '19:00', isAvailable: true },
      thursday: { start: '10:00', end: '19:00', isAvailable: true },
      friday: { start: '10:00', end: '20:00', isAvailable: true },
      saturday: { start: '09:00', end: '17:00', isAvailable: true },
      sunday: { start: '00:00', end: '00:00', isAvailable: false },
    },
    services: [
      { name: 'Haircut & Style', price: 45, duration: 60, description: 'Complete cut and style' },
      { name: 'Color Treatment', price: 80, duration: 120, description: 'Full color service' },
      { name: 'Highlights', price: 95, duration: 150, description: 'Professional highlights' },
      { name: 'Blowout', price: 35, duration: 45, description: 'Professional blowout styling' },
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400', type: 'after' },
      { url: 'https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=400', type: 'space' },
    ],
    rating: 4.9,
    totalReviews: 203,
    isVerified: true,
    location: {
      type: 'Point',
      coordinates: [79.1604988, 12.9759803],
      address: '456 Oak Avenue, Chennai, TN 600002',
    },
  },
  {
    id: 'barber-3',
    userId: 'barber-3',
    businessName: 'Classic Cuts',
    bio: 'Traditional barbering with a modern twist. Walk-ins welcome!',
    specialties: ['Classic Cuts', 'Pompadour', 'Side Part', 'Crew Cut'],
    experience: 15,
    serviceLocations: ['in_salon', 'in_home'],
    workingHours: {
      monday: { start: '08:00', end: '17:00', isAvailable: true },
      tuesday: { start: '08:00', end: '17:00', isAvailable: true },
      wednesday: { start: '08:00', end: '17:00', isAvailable: true },
      thursday: { start: '08:00', end: '17:00', isAvailable: true },
      friday: { start: '08:00', end: '18:00', isAvailable: true },
      saturday: { start: '08:00', end: '14:00', isAvailable: true },
      sunday: { start: '00:00', end: '00:00', isAvailable: false },
    },
    services: [
      { name: 'Classic Cut', price: 30, duration: 40, description: 'Traditional barber cut' },
      {
        name: "Gentleman's Cut",
        price: 45,
        duration: 60,
        description: 'Premium cut with hot towel',
      },
      { name: 'Kids Cut', price: 20, duration: 30, description: 'Haircut for children' },
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400', type: 'space' },
    ],
    rating: 4.7,
    totalReviews: 89,
    isVerified: true,
    location: {
      type: 'Point',
      coordinates: [79.1554988, 12.9729803],
      address: '789 Park Road, Chennai, TN 600003',
    },
  },
  {
    id: 'barber-4',
    userId: 'barber-4',
    businessName: "The Gentleman's Room",
    bio: 'Premium grooming experience for the modern gentleman. By appointment only.',
    specialties: ['Executive Cuts', 'Beard Sculpting', 'Gray Blending', 'Scalp Treatment'],
    experience: 12,
    serviceLocations: ['in_salon'],
    workingHours: {
      monday: { start: '10:00', end: '20:00', isAvailable: true },
      tuesday: { start: '10:00', end: '20:00', isAvailable: true },
      wednesday: { start: '10:00', end: '20:00', isAvailable: true },
      thursday: { start: '10:00', end: '20:00', isAvailable: true },
      friday: { start: '10:00', end: '21:00', isAvailable: true },
      saturday: { start: '10:00', end: '18:00', isAvailable: true },
      sunday: { start: '12:00', end: '17:00', isAvailable: true },
    },
    services: [
      { name: 'Executive Cut', price: 65, duration: 75, description: 'Premium cut and grooming' },
      {
        name: 'Beard Sculpting',
        price: 35,
        duration: 45,
        description: 'Professional beard shaping',
      },
      {
        name: 'Royal Shave',
        price: 50,
        duration: 60,
        description: 'Luxury hot towel shave experience',
      },
      {
        name: 'Scalp Treatment',
        price: 40,
        duration: 45,
        description: 'Relaxing scalp massage and treatment',
      },
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400', type: 'space' },
      { url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400', type: 'after' },
    ],
    rating: 4.9,
    totalReviews: 142,
    isVerified: true,
    location: {
      type: 'Point',
      coordinates: [79.1624988, 12.9779803],
      address: '321 Elite Plaza, Chennai, TN 600004',
    },
  },
];

// Calculate distance between two coordinates (simple Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const mockBarberService = {
  /**
   * Get list of all barbers
   */
  getBarbers: async (params?: IBarberSearchParams): Promise<IBarberListResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    let barbers = [...MOCK_BARBERS];

    // Apply filters if provided
    if (params?.specialties && params.specialties.length > 0) {
      barbers = barbers.filter((b) =>
        params.specialties!.some((specialty) =>
          b.specialties.some((s) => s.toLowerCase().includes(specialty.toLowerCase()))
        )
      );
    }

    if (params?.minRating) {
      barbers = barbers.filter((b) => b.rating >= params.minRating!);
    }

    if (params?.serviceLocation) {
      barbers = barbers.filter((b) => b.serviceLocations.includes(params.serviceLocation!));
    }

    const hasMore = false; // Simple mock - no pagination

    return {
      barbers,
      total: barbers.length,
      page: params?.page || 1,
      limit: params?.limit || 10,
      hasMore,
    };
  },

  /**
   * Get nearby barbers based on location
   */
  getNearbyBarbers: async (params: {
    latitude: number;
    longitude: number;
    radius?: number;
  }): Promise<IBarberListResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const radius = params.radius || 10; // Default 10km radius

    // Calculate distances and filter
    const barbersWithDistance = MOCK_BARBERS.map((barber) => {
      const distance = calculateDistance(
        params.latitude,
        params.longitude,
        barber.location.coordinates[1],
        barber.location.coordinates[0]
      );
      return { ...barber, distance };
    })
      .filter((b) => b.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    return {
      barbers: barbersWithDistance,
      total: barbersWithDistance.length,
      page: 1,
      limit: 10,
      hasMore: false,
    };
  },

  /**
   * Search barbers with filters
   */
  searchBarbers: async (params: IBarberSearchParams): Promise<IBarberListResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    let barbers = [...MOCK_BARBERS];

    // Apply filters
    if (params.specialties && params.specialties.length > 0) {
      barbers = barbers.filter((b) =>
        params.specialties!.some((specialty) =>
          b.specialties.some((s) => s.toLowerCase().includes(specialty.toLowerCase()))
        )
      );
    }

    if (params.minRating) {
      barbers = barbers.filter((b) => b.rating >= params.minRating!);
    }

    if (params.serviceLocation) {
      barbers = barbers.filter((b) => b.serviceLocations.includes(params.serviceLocation!));
    }

    return {
      barbers,
      total: barbers.length,
      page: params?.page || 1,
      limit: params?.limit || 10,
      hasMore: false,
    };
  },

  /**
   * Get single barber profile by ID
   */
  getBarberById: async (id: string): Promise<IBarberProfile> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const barber = MOCK_BARBERS.find((b) => b.id === id);

    if (!barber) {
      throw new Error('Barber not found');
    }

    return barber;
  },

  /**
   * Get barber availability for a specific date
   */
  getBarberAvailability: async (barberId: string, date: string): Promise<IBarberAvailability> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const barber = MOCK_BARBERS.find((b) => b.id === barberId);

    if (!barber) {
      throw new Error('Barber not found');
    }

    // Generate mock availability slots
    const availableSlots = ['09:00', '10:00', '12:00', '14:00', '16:00', '17:00'];

    return {
      barberId,
      date,
      availableSlots,
    };
  },

  /**
   * Get barber reviews
   */
  getBarberReviews: async (barberId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      reviews: [
        {
          id: '1',
          clientName: 'John Doe',
          rating: 5,
          comment: "Excellent service! Best haircut I've had in years.",
          date: new Date('2024-01-15'),
        },
        {
          id: '2',
          clientName: 'Jane Smith',
          rating: 4,
          comment: 'Great experience, very professional.',
          date: new Date('2024-01-10'),
        },
      ],
      total: 2,
    };
  },

  /**
   * Get barber portfolio/gallery
   */
  getBarberPortfolio: async (barberId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const barber = MOCK_BARBERS.find((b) => b.id === barberId);

    return {
      gallery: barber?.gallery || [],
    };
  },

  /**
   * Update barber profile (for barber users)
   */
  updateBarberProfile: async (data: IBarberUpdateData): Promise<IBarberProfile> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    // For mock, just return updated data
    // In a real scenario, we'd update by userId or barber ID
    const mockBarber = MOCK_BARBERS[0];

    return {
      ...mockBarber,
      ...data,
    };
  },

  /**
   * Upload portfolio image (for barber users)
   */
  uploadPortfolioImage: async (imageUri: string): Promise<{ url: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Return mock URL
    return {
      url: `https://images.unsplash.com/photo-${Date.now()}?w=400`,
    };
  },
};

export default mockBarberService;
