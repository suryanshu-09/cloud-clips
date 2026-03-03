import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { barberService } from '../services/barberService';
import type { IBarberProfile, IBarberAvailability, IBarberUpdateData } from '../types';

/**
 * Hook to fetch a single barber profile by ID
 */
export function useBarberProfile(
  barberId: string,
  options?: Omit<UseQueryOptions<IBarberProfile>, 'queryKey' | 'queryFn'>
) {
  return useQuery<IBarberProfile>({
    queryKey: ['barber', barberId],
    queryFn: () => barberService.getBarberById(barberId),
    enabled: !!barberId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // Keep in cache 20 minutes — profiles are stable data
    ...options,
  });
}

/**
 * Hook to fetch barber availability for a specific date
 */
export function useBarberAvailability(
  barberId: string,
  date: string,
  options?: Omit<UseQueryOptions<IBarberAvailability>, 'queryKey' | 'queryFn'>
) {
  return useQuery<IBarberAvailability>({
    queryKey: ['barber', barberId, 'availability', date],
    queryFn: () => barberService.getBarberAvailability(barberId, date),
    enabled: !!barberId && !!date,
    staleTime: 1 * 60 * 1000, // 1 minute for availability
    ...options,
  });
}

/**
 * Hook to fetch barber reviews
 */
export function useBarberReviews(
  barberId: string,
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['barber', barberId, 'reviews'],
    queryFn: () => barberService.getBarberReviews(barberId),
    enabled: !!barberId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch barber portfolio
 */
export function useBarberPortfolio(
  barberId: string,
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['barber', barberId, 'portfolio'],
    queryFn: () => barberService.getBarberPortfolio(barberId),
    enabled: !!barberId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Hook to update barber profile
 */
export function useBarberProfileUpdate(barberId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: IBarberUpdateData) => barberService.updateBarberProfile(data),
    onSuccess: (updatedProfile: IBarberProfile) => {
      // Update the cache with new data
      queryClient.setQueryData(['barber', barberId], updatedProfile);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['barber', barberId] });
      queryClient.invalidateQueries({ queryKey: ['barbers'] });
    },
    onError: (error: Error) => {
      console.error('Update barber profile error:', error.message);
    },
  });
}

/**
 * Hook to upload portfolio image
 */
export function useBarberPortfolioUpload(barberId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageUri: string) => barberService.uploadPortfolioImage(imageUri),
    onSuccess: () => {
      // Invalidate portfolio query to refetch
      queryClient.invalidateQueries({ queryKey: ['barber', barberId, 'portfolio'] });
    },
    onError: (error: Error) => {
      console.error('Upload portfolio image error:', error.message);
    },
  });
}
