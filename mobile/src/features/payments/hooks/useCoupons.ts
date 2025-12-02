/**
 * useCoupons Hook
 * Fetches and manages available coupons list
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockPaymentService } from '../services/mockPaymentService';
import { paymentService } from '../services/paymentService';
import type { ICoupon } from '../types';
import { DiscountType } from '../types';

// Check if dev mode is enabled
const isDevMode = process.env.EXPO_PUBLIC_DEV_MODE === 'true';
const service = isDevMode ? mockPaymentService : paymentService;

export const COUPON_QUERY_KEYS = {
  coupons: ['coupons'] as const,
  availableCoupons: ['coupons', 'available'] as const,
  savedCoupons: ['coupons', 'saved'] as const,
};

/**
 * Extended coupon interface for the coupons list
 */
export interface ICouponWithMeta extends ICoupon {
  description?: string;
  termsAndConditions?: string;
  applicableCategories?: ('services' | 'products')[];
  isSaved?: boolean;
}

/**
 * Mock coupons data for development
 */
const MOCK_AVAILABLE_COUPONS: ICouponWithMeta[] = [
  {
    id: 'coupon_1',
    code: 'SAVE20',
    discountType: DiscountType.PERCENTAGE,
    discountValue: 20,
    usageLimit: 100,
    usageCount: 45,
    isActive: true,
    description: 'Get 20% off your next haircut or grooming service',
    termsAndConditions: 'Valid for services over $30. Cannot be combined with other offers.',
    applicableCategories: ['services'],
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
  },
  {
    id: 'coupon_2',
    code: 'FIRST10',
    discountType: DiscountType.FIXED,
    discountValue: 10,
    minAmount: 30,
    usageLimit: 50,
    usageCount: 12,
    isActive: true,
    description: 'First-time customers get $10 off',
    termsAndConditions: 'Valid for new customers only. Minimum order $30.',
    applicableCategories: ['services', 'products'],
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  },
  {
    id: 'coupon_3',
    code: 'PRODUCT15',
    discountType: DiscountType.PERCENTAGE,
    discountValue: 15,
    maxDiscount: 25,
    usageLimit: 200,
    usageCount: 87,
    isActive: true,
    description: '15% off all hair care products',
    termsAndConditions: 'Maximum discount $25. Valid on products only.',
    applicableCategories: ['products'],
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  },
  {
    id: 'coupon_4',
    code: 'WEEKEND25',
    discountType: DiscountType.PERCENTAGE,
    discountValue: 25,
    maxDiscount: 50,
    minAmount: 50,
    usageLimit: 75,
    usageCount: 23,
    isActive: true,
    description: 'Weekend special - 25% off all services',
    termsAndConditions: 'Valid Saturday and Sunday only. Minimum order $50. Max discount $50.',
    applicableCategories: ['services'],
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
  },
  {
    id: 'coupon_5',
    code: 'LOYALTY5',
    discountType: DiscountType.FIXED,
    discountValue: 5,
    usageLimit: 1000,
    usageCount: 342,
    isActive: true,
    description: 'Loyalty reward - $5 off your next visit',
    termsAndConditions: 'Available for returning customers. No minimum order.',
    applicableCategories: ['services', 'products'],
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
  },
];

const MOCK_SAVED_COUPONS: ICouponWithMeta[] = [
  { ...MOCK_AVAILABLE_COUPONS[1], isSaved: true },
  { ...MOCK_AVAILABLE_COUPONS[4], isSaved: true },
];

/**
 * Mock coupon service methods
 */
const mockCouponService = {
  async getAvailableCoupons(): Promise<ICouponWithMeta[]> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return MOCK_AVAILABLE_COUPONS.filter((c) => c.isActive);
  },

  async getSavedCoupons(): Promise<ICouponWithMeta[]> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return MOCK_SAVED_COUPONS;
  },

  async saveCoupon(couponId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const coupon = MOCK_AVAILABLE_COUPONS.find((c) => c.id === couponId);
    if (coupon && !MOCK_SAVED_COUPONS.find((c) => c.id === couponId)) {
      MOCK_SAVED_COUPONS.push({ ...coupon, isSaved: true });
    }
  },

  async removeSavedCoupon(couponId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const index = MOCK_SAVED_COUPONS.findIndex((c) => c.id === couponId);
    if (index !== -1) {
      MOCK_SAVED_COUPONS.splice(index, 1);
    }
  },
};

/**
 * Hook to get available coupons
 */
export const useAvailableCoupons = () => {
  const query = useQuery({
    queryKey: COUPON_QUERY_KEYS.availableCoupons,
    queryFn: () => mockCouponService.getAvailableCoupons(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    coupons: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
};

/**
 * Hook to get saved coupons
 */
export const useSavedCoupons = () => {
  const query = useQuery({
    queryKey: COUPON_QUERY_KEYS.savedCoupons,
    queryFn: () => mockCouponService.getSavedCoupons(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    savedCoupons: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to save/unsave coupons
 */
export const useSaveCoupon = () => {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (couponId: string) => mockCouponService.saveCoupon(couponId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COUPON_QUERY_KEYS.savedCoupons });
      queryClient.invalidateQueries({ queryKey: COUPON_QUERY_KEYS.availableCoupons });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (couponId: string) => mockCouponService.removeSavedCoupon(couponId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COUPON_QUERY_KEYS.savedCoupons });
      queryClient.invalidateQueries({ queryKey: COUPON_QUERY_KEYS.availableCoupons });
    },
  });

  return {
    saveCoupon: saveMutation.mutate,
    removeSavedCoupon: removeMutation.mutate,
    isSaving: saveMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
};

/**
 * Combined hook for all coupon operations
 */
export const useCoupons = () => {
  const { coupons, isLoading: isLoadingAvailable, refetch, isRefetching } = useAvailableCoupons();
  const { savedCoupons, isLoading: isLoadingSaved } = useSavedCoupons();
  const { saveCoupon, removeSavedCoupon, isSaving, isRemoving } = useSaveCoupon();

  return {
    availableCoupons: coupons,
    savedCoupons,
    isLoading: isLoadingAvailable || isLoadingSaved,
    isRefetching,
    refetch,
    saveCoupon,
    removeSavedCoupon,
    isSaving,
    isRemoving,
  };
};
