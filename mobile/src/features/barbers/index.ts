// Hooks
export { useBarbers, useNearbyBarbers } from './hooks/useBarbers';
export {
  useBarberProfile,
  useBarberAvailability,
  useBarberReviews,
  useBarberPortfolio,
} from './hooks/useBarberProfile';
export { useBarberSearch } from './hooks/useBarberSearch';

// Services
export { barberService } from './services/barberService';

// Types
export type {
  IBarberProfile,
  IBarberSearchParams,
  IBarberListResponse,
  IBarberAvailability,
  IBarberUpdateData,
  IService,
  IGalleryItem,
  ILocationWithAddress,
  IWorkingHour,
  ServiceLocation,
} from './types';
