import { useState, useCallback, useMemo } from 'react';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { barberService } from '../services/barberService';
import type { IBarberListResponse, IBarberSearchParams, ServiceLocation } from '../types';

/**
 * Hook to search barbers with filters
 */
export function useBarberSearch(
  initialParams?: IBarberSearchParams,
  options?: Omit<UseQueryOptions<IBarberListResponse>, 'queryKey' | 'queryFn'>
) {
  const [searchParams, setSearchParams] = useState<IBarberSearchParams>(initialParams || {});

  const query = useQuery<IBarberListResponse>({
    queryKey: ['barbers', 'search', searchParams],
    queryFn: () => barberService.searchBarbers(searchParams),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });

  const updateFilters = useCallback((filters: Partial<IBarberSearchParams>) => {
    setSearchParams((prev) => ({ ...prev, ...filters }));
  }, []);

  const updateLocation = useCallback((latitude: number, longitude: number, radius?: number) => {
    setSearchParams((prev) => ({ ...prev, latitude, longitude, radius }));
  }, []);

  const updateSpecialties = useCallback((specialties: string[]) => {
    setSearchParams((prev) => ({ ...prev, specialties }));
  }, []);

  const updateServiceLocation = useCallback((serviceLocation?: ServiceLocation) => {
    setSearchParams((prev) => ({ ...prev, serviceLocation }));
  }, []);

  const updateMinRating = useCallback((minRating?: number) => {
    setSearchParams((prev) => ({ ...prev, minRating }));
  }, []);

  const updateSortBy = useCallback((sortBy?: 'distance' | 'rating' | 'price' | 'experience') => {
    setSearchParams((prev) => ({ ...prev, sortBy }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchParams(initialParams || {});
  }, [initialParams]);

  const hasActiveFilters = useMemo(() => {
    return !!(
      searchParams.specialties?.length ||
      searchParams.serviceLocation ||
      searchParams.minRating ||
      searchParams.sortBy
    );
  }, [searchParams]);

  return {
    ...query,
    searchParams,
    updateFilters,
    updateLocation,
    updateSpecialties,
    updateServiceLocation,
    updateMinRating,
    updateSortBy,
    resetFilters,
    hasActiveFilters,
  };
}
