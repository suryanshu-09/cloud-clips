/**
 * Product feature types
 * Includes products, orders, and shopping cart
 */

export interface IProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  images: string[];
  stock: number;
  rating: number;
  totalReviews: number;
  barberId?: string;
  barberName?: string;
  specs?: Record<string, string>;
}

export interface IOrderItem {
  productId: string;
  productName?: string;
  productImage?: string;
  quantity: number;
  price: number;
}

export interface IAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
}

export interface IOrder {
  id: string;
  userId: string;
  status: OrderStatus;
  items: IOrderItem[];
  totalAmount: number;
  shippingAddress: IAddress;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateOrderRequest {
  items: IOrderItem[];
  shippingAddress: IAddress;
  couponCode?: string;
}

export interface ICreateOrderResponse {
  order: IOrder;
  paymentIntentId: string;
  clientSecret: string;
}

export interface IProductFilters {
  category?: string;
  barberId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  search?: string;
}

export interface IProductListParams extends IProductFilters {
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'rating' | 'name' | 'newest';
  sortOrder?: 'asc' | 'desc';
}

export interface IProductListResponse {
  products: IProduct[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum ProductCategory {
  HAIR_CARE = 'hair_care',
  STYLING = 'styling',
  BEARD_CARE = 'beard_care',
  SKIN_CARE = 'skin_care',
  TOOLS = 'tools',
  ACCESSORIES = 'accessories',
}

export interface IProductError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
