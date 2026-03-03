import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { barberService } from '../services/barberService';
import type { IBarberListResponse, IBarberProfile, IBarberSearchParams } from '../types';

/**
 * Hook to fetch list of barbers
 */
export function useBarbers(
  params?: IBarberSearchParams,
  options?: Omit<UseQueryOptions<IBarberListResponse, Error, IBarberProfile[]>, 'queryKey' | 'queryFn' | 'select'>
) {
  return useQuery<IBarberListResponse, Error, IBarberProfile[]>({
    queryKey: ['barbers', params],
    queryFn: () => barberService.getBarbers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    // select extracts the array so consumers only re-render when the barbers list itself changes
    select: (data) => data.barbers,
    ...options,
  });
}

/**
 * Hook to fetch nearby barbers based on location
 */
export function useNearbyBarbers(
  params: {
    latitude: number;
    longitude: number;
    radius?: number;
  },
  options?: Omit<UseQueryOptions<IBarberListResponse, Error, IBarberListResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<IBarberListResponse, Error, IBarberListResponse>({
    queryKey: ['barbers', 'nearby', params],
    queryFn: () => barberService.getNearbyBarbers(params),
    enabled: !!params.latitude && !!params.longitude,
    staleTime: 2 * 60 * 1000, // 2 minutes for nearby results
    ...options,
  });
}
