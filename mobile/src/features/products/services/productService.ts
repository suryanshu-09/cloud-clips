/**
 * Product Service
 * Handles all product-related API calls
 */

import { apiClient } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import type {
  IProduct,
  IProductListParams,
  IProductListResponse,
  IOrder,
  ICreateOrderRequest,
  ICreateOrderResponse,
} from '../types';

/**
 * Fetch list of products with optional filters and pagination
 */
export const fetchProducts = async (params?: IProductListParams): Promise<IProductListResponse> => {
  const response = await apiClient.get<IProductListResponse>(endpoints.products.list, {
    params,
  });
  return response.data;
};

/**
 * Fetch products by a specific barber
 */
export const fetchProductsByBarber = async (barberId: string): Promise<IProduct[]> => {
  const response = await apiClient.get<IProduct[]>(endpoints.products.byBarber(barberId));
  return response.data;
};

/**
 * Fetch a single product by ID
 */
export const fetchProductById = async (productId: string): Promise<IProduct> => {
  const response = await apiClient.get<IProduct>(endpoints.products.detail(productId));
  return response.data;
};

/**
 * Create a new order
 */
export const createOrder = async (
  orderData: ICreateOrderRequest
): Promise<ICreateOrderResponse> => {
  const response = await apiClient.post<ICreateOrderResponse>(endpoints.orders.create, orderData);
  return response.data;
};

/**
 * Fetch user's orders
 */
export const fetchOrders = async (): Promise<IOrder[]> => {
  const response = await apiClient.get<IOrder[]>(endpoints.orders.list);
  return response.data;
};

/**
 * Fetch a single order by ID
 */
export const fetchOrderById = async (orderId: string): Promise<IOrder> => {
  const response = await apiClient.get<IOrder>(endpoints.orders.detail(orderId));
  return response.data;
};

/**
 * Cancel an order
 */
export const cancelOrder = async (orderId: string): Promise<IOrder> => {
  const response = await apiClient.post<IOrder>(endpoints.orders.cancel(orderId));
  return response.data;
};

/**
 * Search products by keyword
 */
export const searchProducts = async (
  query: string,
  filters?: IProductListParams
): Promise<IProductListResponse> => {
  const response = await apiClient.get<IProductListResponse>(endpoints.products.list, {
    params: {
      search: query,
      ...filters,
    },
  });
  return response.data;
};
