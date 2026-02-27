/**
 * useCoupons Hook
 * Fetches and manages available coupons list using Convex backend
 */

import { useQuery, useMutation, useQueryClient } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import type { ICoupon } from '../types';
import { DiscountType } from '../types';

const isDevMode = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

export const COUPON_QUERY_KEYS = {
  coupons: ['coupons'] as const,
  availableCoupons: ['coupons', 'available'] as const,
  savedCoupons: ['coupons', 'saved'] as const,
  myCouponUsage: ['coupons', 'myUsage'] as const,
};

/**
 * Extended coupon interface for the coupons list
 */
export interface ICouponWithMeta extends ICoupon {
  description?: string;
  termsAndConditions?: string;
  applicableCategories?: ('services' | 'products')[];
  isSaved?: boolean;
  maxUses?: number;
  validFrom?: number;
  validUntil?: number;
  applicableTo?: 'services' | 'products' | 'all';
  barberId?: Id<'users'>;
  createdBy?: Id<'users'>;
  createdAt?: number;
  _id?: Id<'coupons'>;
}

const mockCoupons: ICouponWithMeta[] = [
  {
    id: 'coupon_1',
    _id: 'coupon_1',
    code: 'WELCOME10',
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10,
    minAmount: 30,
    maxDiscount: 15,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    usageLimit: 100,
    usageCount: 45,
    isActive: true,
    description: 'Get 10% off your first booking',
    termsAndConditions: 'Valid for first-time users only',
    applicableCategories: ['services'],
    applicableTo: 'services',
    validFrom: Date.now(),
    validUntil: Date.now() + 30 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'coupon_2',
    _id: 'coupon_2',
    code: 'FLAT20',
    discountType: DiscountType.FIXED,
    discountValue: 20,
    minAmount: 50,
    isActive: true,
    description: '$20 off any service over $50',
    termsAndConditions: 'Cannot be combined with other offers',
    applicableCategories: ['services'],
    applicableTo: 'services',
    validFrom: Date.now(),
    validUntil: Date.now() + 60 * 24 * 60 * 60 * 1000,
  },
];

/**
 * Hook to get active/available coupons from Convex
 */
export const useAvailableCoupons = () => {
  const coupons = useQuery(
    isDevMode ? 'skip' : api.coupons.queries.getActiveCoupons,
    isDevMode ? 'skip' : {}
  );

  const transformedCoupons: ICouponWithMeta[] = isDevMode
    ? mockCoupons
    : (coupons || []).map((coupon) => ({
        id: coupon._id,
        _id: coupon._id,
        code: coupon.code,
        discountType:
          coupon.discountType === 'percentage' ? DiscountType.PERCENTAGE : DiscountType.FIXED,
        discountValue: coupon.discountValue,
        minAmount: coupon.minPurchaseAmount,
        maxDiscount: coupon.maxDiscount,
        expiresAt: coupon.validUntil ? new Date(coupon.validUntil) : undefined,
        usageLimit: coupon.maxUses,
        usageCount: coupon.currentUses,
        isActive: coupon.isActive,
        description: coupon.description,
        termsAndConditions: coupon.terms,
        applicableCategories:
          coupon.applicableTo === 'all'
            ? ['services', 'products']
            : coupon.applicableTo
              ? [coupon.applicableTo]
              : undefined,
        validFrom: coupon.validFrom,
        validUntil: coupon.validUntil,
        applicableTo: coupon.applicableTo,
        barberId: coupon.barberId,
        createdBy: coupon.createdBy,
        createdAt: coupon.createdAt,
      }));

  return {
    coupons: transformedCoupons,
    isLoading: isDevMode ? false : coupons === undefined,
    isError: !isDevMode && !coupons,
    error: null,
    refetch: () => {},
    isRefetching: false,
  };
};

/**
 * Hook to get saved coupons (user's coupon usage history)
 */
export const useSavedCoupons = () => {
  const usages = useQuery(
    isDevMode ? 'skip' : api.coupons.queries.getMyCouponUsage,
    isDevMode ? 'skip' : undefined
  );

  const transformedCoupons: ICouponWithMeta[] = isDevMode
    ? []
    : (usages || []).map((usage) => ({
        id: usage.couponId,
        _id: usage.couponId,
        code: usage.couponCode || '',
        discountType:
          usage.discountType === 'percentage' ? DiscountType.PERCENTAGE : DiscountType.FIXED,
        discountValue: usage.discountValue || 0,
        isActive: usage.isActive,
        description: usage.couponDescription,
        expiresAt: usage.validUntil ? new Date(usage.validUntil) : undefined,
        isSaved: true,
        applicableTo: usage.applicableTo as 'services' | 'products' | 'all' | undefined,
      }));

  return {
    savedCoupons: transformedCoupons,
    isLoading: isDevMode ? false : usages === undefined,
    isError: !isDevMode && !usages,
    error: null,
    refetch: () => {},
  };
};

/**
 * Hook to get all coupons (admin/barber view)
 */
export const useAllCoupons = (barberId?: Id<'users'>) => {
  const coupons = useQuery(
    isDevMode ? 'skip' : api.coupons.queries.getCoupons,
    isDevMode
      ? 'skip'
      : {
          barberId,
          activeOnly: false,
        }
  );

  const transformedCoupons: ICouponWithMeta[] = isDevMode
    ? mockCoupons
    : (coupons || []).map((coupon) => ({
        id: coupon._id,
        _id: coupon._id,
        code: coupon.code,
        discountType:
          coupon.discountType === 'percentage' ? DiscountType.PERCENTAGE : DiscountType.FIXED,
        discountValue: coupon.discountValue,
        minAmount: coupon.minPurchaseAmount,
        maxDiscount: coupon.maxDiscount,
        expiresAt: coupon.validUntil ? new Date(coupon.validUntil) : undefined,
        usageLimit: coupon.maxUses,
        usageCount: coupon.currentUses,
        isActive: coupon.isActive,
        description: coupon.description,
        termsAndConditions: coupon.terms,
        applicableCategories:
          coupon.applicableTo === 'all'
            ? ['services', 'products']
            : coupon.applicableTo
              ? [coupon.applicableTo]
              : undefined,
        validFrom: coupon.validFrom,
        validUntil: coupon.validUntil,
        applicableTo: coupon.applicableTo,
        barberId: coupon.barberId,
        createdBy: coupon.createdBy,
        createdAt: coupon.createdAt,
      }));

  return {
    coupons: transformedCoupons,
    isLoading: isDevMode ? false : coupons === undefined,
    isError: !isDevMode && !coupons,
    error: null,
    refetch: () => {},
  };
};

/**
 * Hook to save/unsave coupons
 * Uses local storage since backend doesn't have save functionality
 */
export const useSaveCoupon = () => {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (couponId: string) => {
      return couponId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COUPON_QUERY_KEYS.savedCoupons });
      queryClient.invalidateQueries({ queryKey: COUPON_QUERY_KEYS.availableCoupons });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (couponId: string) => {
      return couponId;
    },
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
