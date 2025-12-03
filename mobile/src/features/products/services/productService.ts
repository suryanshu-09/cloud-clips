/**
 * Product Service
 * Handles all product-related API calls with fallback support
 */

import apiClient from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import type {
  IProduct,
  IProductListParams,
  IProductListResponse,
  IOrder,
  ICreateOrderRequest,
  ICreateOrderResponse,
} from '../types';
import { OrderStatus } from '../types';

// Check if we should use mock data as fallback
const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

// Mock product data for development (matches IProduct interface)
const mockProducts: IProduct[] = [
  {
    id: 'prod-1',
    name: 'Premium Hair Pomade',
    description: 'Strong hold, matte finish pomade for all hair types',
    price: 24.99,
    images: ['https://via.placeholder.com/200x200?text=Pomade'],
    category: 'Styling',
    barberId: 'barber-1',
    barberName: 'Classic Cuts',
    stock: 50,
    rating: 4.5,
    totalReviews: 42,
  },
  {
    id: 'prod-2',
    name: 'Beard Oil',
    description: 'Moisturizing beard oil with natural ingredients',
    price: 19.99,
    images: ['https://via.placeholder.com/200x200?text=Beard+Oil'],
    category: 'Beard Care',
    barberId: 'barber-1',
    barberName: 'Classic Cuts',
    stock: 30,
    rating: 4.8,
    totalReviews: 28,
  },
  {
    id: 'prod-3',
    name: 'Shampoo & Conditioner Set',
    description: 'Professional grade hair care set',
    price: 34.99,
    images: ['https://via.placeholder.com/200x200?text=Shampoo'],
    category: 'Hair Care',
    barberId: 'barber-2',
    barberName: 'Modern Styles',
    stock: 25,
    rating: 4.2,
    totalReviews: 15,
  },
];

/**
 * Fetch list of products with optional filters and pagination
 */
export const fetchProducts = async (params?: IProductListParams): Promise<IProductListResponse> => {
  try {
    const response = await apiClient.get<IProductListResponse>(endpoints.products.list, {
      params,
    });
    return response.data;
  } catch (error: any) {
    if (DEV_MODE) {
      console.log('[PRODUCTS] Using mock products fallback');
      // Filter mock products based on params
      let filtered = [...mockProducts];
      if (params?.category) {
        filtered = filtered.filter((p) => p.category === params.category);
      }
      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(search) || p.description.toLowerCase().includes(search)
        );
      }
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      return {
        products: filtered,
        total: filtered.length,
        page,
        limit,
        hasMore: filtered.length > page * limit,
      };
    }
    throw new Error(error.message || 'Failed to fetch products');
  }
};

/**
 * Fetch products by a specific barber
 */
export const fetchProductsByBarber = async (barberId: string): Promise<IProduct[]> => {
  try {
    const response = await apiClient.get<IProduct[]>(endpoints.products.byBarber(barberId));
    return response.data;
  } catch (error: any) {
    if (DEV_MODE) {
      console.log('[PRODUCTS] Using mock barber products fallback');
      return mockProducts.filter((p) => p.barberId === barberId);
    }
    throw new Error(error.message || 'Failed to fetch barber products');
  }
};

/**
 * Fetch a single product by ID
 */
export const fetchProductById = async (productId: string): Promise<IProduct> => {
  try {
    const response = await apiClient.get<IProduct>(endpoints.products.detail(productId));
    return response.data;
  } catch (error: any) {
    if (DEV_MODE) {
      console.log('[PRODUCTS] Using mock product detail fallback');
      const product = mockProducts.find((p) => p.id === productId);
      if (product) return product;
    }
    throw new Error(error.message || 'Failed to fetch product');
  }
};

/**
 * Fetch product categories
 */
export const fetchCategories = async (): Promise<string[]> => {
  try {
    const response = await apiClient.get<string[]>(endpoints.products.categories);
    return response.data;
  } catch (error: any) {
    if (DEV_MODE) {
      // Return default categories in dev mode
      return ['Hair Care', 'Beard Care', 'Styling', 'Accessories', 'Skincare'];
    }
    throw new Error(error.message || 'Failed to fetch categories');
  }
};

/**
 * Create a new order
 */
export const createOrder = async (
  orderData: ICreateOrderRequest
): Promise<ICreateOrderResponse> => {
  try {
    const response = await apiClient.post<ICreateOrderResponse>(endpoints.orders.create, orderData);
    return response.data;
  } catch (error: any) {
    if (DEV_MODE) {
      console.log('[PRODUCTS] Using mock create order fallback');
      const orderId = `order-${Date.now()}`;
      const totalAmount = orderData.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      return {
        order: {
          id: orderId,
          userId: 'mock-user-id',
          items: orderData.items,
          totalAmount,
          shippingAddress: orderData.shippingAddress,
          status: OrderStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        paymentIntentId: `pi_mock_${Date.now()}`,
        clientSecret: `cs_mock_${Date.now()}`,
      };
    }
    throw new Error(error.message || 'Failed to create order');
  }
};

/**
 * Fetch user's orders
 */
export const fetchOrders = async (): Promise<IOrder[]> => {
  try {
    const response = await apiClient.get<IOrder[]>(endpoints.orders.list);
    return response.data;
  } catch (error: any) {
    if (DEV_MODE) {
      console.log('[PRODUCTS] Using mock orders fallback');
      return [];
    }
    throw new Error(error.message || 'Failed to fetch orders');
  }
};

/**
 * Fetch a single order by ID
 */
export const fetchOrderById = async (orderId: string): Promise<IOrder> => {
  try {
    const response = await apiClient.get<IOrder>(endpoints.orders.detail(orderId));
    return response.data;
  } catch (error: any) {
    if (DEV_MODE) {
      console.log('[PRODUCTS] Using mock order detail fallback');
    }
    throw new Error(error.message || 'Failed to fetch order');
  }
};

/**
 * Cancel an order
 */
export const cancelOrder = async (orderId: string): Promise<IOrder> => {
  try {
    const response = await apiClient.post<IOrder>(endpoints.orders.cancel(orderId));
    return response.data;
  } catch (error: any) {
    if (DEV_MODE) {
      console.log('[PRODUCTS] Using mock cancel order fallback');
    }
    throw new Error(error.message || 'Failed to cancel order');
  }
};

/**
 * Search products by keyword
 */
export const searchProducts = async (
  query: string,
  filters?: IProductListParams
): Promise<IProductListResponse> => {
  try {
    const response = await apiClient.get<IProductListResponse>(endpoints.products.list, {
      params: {
        search: query,
        ...filters,
      },
    });
    return response.data;
  } catch (error: any) {
    if (DEV_MODE) {
      console.log('[PRODUCTS] Using mock search fallback');
      const search = query.toLowerCase();
      const filtered = mockProducts.filter(
        (p) => p.name.toLowerCase().includes(search) || p.description.toLowerCase().includes(search)
      );
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      return {
        products: filtered,
        total: filtered.length,
        page,
        limit,
        hasMore: filtered.length > page * limit,
      };
    }
    throw new Error(error.message || 'Failed to search products');
  }
};

/**
 * Validate and apply a coupon code
 */
export const validateCoupon = async (
  code: string,
  orderTotal: number
): Promise<{ valid: boolean; discount: number; message?: string }> => {
  try {
    const response = await apiClient.post<{ valid: boolean; discount: number; message?: string }>(
      endpoints.coupons.validate,
      { code, orderTotal }
    );
    return response.data;
  } catch (error: any) {
    if (DEV_MODE) {
      // Mock coupon validation
      if (code.toUpperCase() === 'SAVE10') {
        return { valid: true, discount: orderTotal * 0.1 };
      }
      if (code.toUpperCase() === 'NEWUSER') {
        return { valid: true, discount: 5 };
      }
      return { valid: false, discount: 0, message: 'Invalid coupon code' };
    }
    throw new Error(error.message || 'Failed to validate coupon');
  }
};

/**
 * Fetch available coupons
 */
export const fetchCoupons = async () => {
  try {
    const response = await apiClient.get(endpoints.coupons.list);
    return response.data;
  } catch (error: any) {
    if (DEV_MODE) {
      // Return mock coupons
      return [
        {
          id: '1',
          code: 'SAVE10',
          description: '10% off your order',
          discountPercent: 10,
          minOrderAmount: 20,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          code: 'NEWUSER',
          description: '$5 off for new users',
          discountAmount: 5,
          minOrderAmount: 15,
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
    }
    throw new Error(error.message || 'Failed to fetch coupons');
  }
};

// Product service object for backward compatibility
export const productService = {
  fetchProducts,
  fetchProductsByBarber,
  fetchProductById,
  fetchCategories,
  createOrder,
  fetchOrders,
  fetchOrderById,
  cancelOrder,
  searchProducts,
  validateCoupon,
  fetchCoupons,
};

export default productService;
