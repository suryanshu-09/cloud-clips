export type ServiceLocation = 'in_home' | 'in_salon';

export interface IWorkingHour {
  start: string;
  end: string;
  isAvailable: boolean;
}

export interface IService {
  name: string;
  price: number;
  duration: number;
  description?: string;
}

export interface IGalleryItem {
  url: string;
  type: string;
}

export interface ILocationWithAddress {
  type: string;
  coordinates: [number, number]; // [longitude, latitude]
  address: string;
}

export interface IBarberProfile {
  id: string;
  userId: string;
  businessName?: string;
  bio: string;
  specialties: string[];
  experience: number;
  serviceLocations: ServiceLocation[];
  workingHours: Record<string, IWorkingHour>;
  services: IService[];
  gallery: IGalleryItem[];
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  location: ILocationWithAddress;
  // Additional fields from user profile
  name?: string;
  profileImage?: string;
  phone?: string;
}

export interface IBarberSearchParams {
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers
  specialties?: string[];
  serviceLocation?: ServiceLocation;
  minRating?: number;
  sortBy?: 'distance' | 'rating' | 'price' | 'experience';
  page?: number;
  limit?: number;
}

export interface IBarberListResponse {
  barbers: IBarberProfile[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface IBarberAvailability {
  barberId: string;
  date: string;
  availableSlots: string[];
}

export interface IBarberUpdateData {
  businessName?: string;
  bio?: string;
  specialties?: string[];
  experience?: number;
  serviceLocations?: ServiceLocation[];
  workingHours?: Record<string, IWorkingHour>;
  services?: IService[];
  location?: ILocationWithAddress;
}
