/**
 * useProducts Hook
 * Manages product fetching, filtering, and search
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { fetchProducts, fetchProductById, fetchProductsByBarber } from '../services/productService';
import type { IProductListParams, IProduct } from '../types';
import { PERFORMANCE_CONSTANTS } from '@/utils/performance';

const { QUERY_CACHE } = PERFORMANCE_CONSTANTS;

export const PRODUCT_QUERY_KEYS = {
  products: ['products'] as const,
  product: (id: string) => ['products', id] as const,
  productList: (params?: IProductListParams) => ['products', 'list', params] as const,
  barberProducts: (barberId: string) => ['products', 'barber', barberId] as const,
};

interface UseProductsOptions {
  enabled?: boolean;
  params?: IProductListParams;
}

/**
 * Fetch paginated list of products
 */
export const useProducts = (options?: UseProductsOptions) => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.productList(options?.params),
    queryFn: () => fetchProducts(options?.params),
    enabled: options?.enabled !== false,
    staleTime: QUERY_CACHE.LONG, // 5 minutes - product listings are stable
  });
};

/**
 * Fetch infinite scrolling list of products
 */
export const useInfiniteProducts = (params?: IProductListParams) => {
  return useInfiniteQuery({
    queryKey: PRODUCT_QUERY_KEYS.productList(params),
    queryFn: ({ pageParam = 1 }) =>
      fetchProducts({
        ...params,
        page: pageParam,
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: QUERY_CACHE.LONG, // 5 minutes
  });
};

/**
 * Fetch a single product by ID
 */
export const useProduct = (productId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.product(productId),
    queryFn: () => fetchProductById(productId),
    enabled: options?.enabled !== false && !!productId,
    staleTime: QUERY_CACHE.LONG, // 5 minutes - product details are stable
  });
};

/**
 * Fetch products by a specific barber
 */
export const useBarberProducts = (barberId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.barberProducts(barberId),
    queryFn: () => fetchProductsByBarber(barberId),
    enabled: options?.enabled !== false && !!barberId,
    staleTime: QUERY_CACHE.LONG, // 5 minutes
  });
};

/**
 * Helper hook to get featured products
 */
export const useFeaturedProducts = () => {
  return useProducts({
    params: {
      sortBy: 'rating',
      sortOrder: 'desc',
      limit: 10,
    },
  });
};

/**
 * Helper hook to get products on sale
 */
export const useNewProducts = () => {
  return useProducts({
    params: {
      sortBy: 'newest',
      limit: 20,
    },
  });
};
