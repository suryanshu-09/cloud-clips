import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { barberService } from '../services/barberService';
import type { IBarberListResponse, IBarberSearchParams } from '../types';
import { PERFORMANCE_CONSTANTS } from '@/utils/performance';

const { QUERY_CACHE } = PERFORMANCE_CONSTANTS;

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
    staleTime: QUERY_CACHE.LONG, // 5 minutes - barber list is stable
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
    staleTime: QUERY_CACHE.MEDIUM, // 2 minutes - nearby results change with location
    ...options,
  });
}
