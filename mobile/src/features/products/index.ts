/**
 * Products feature exports
 * Centralizes all product-related exports
 */

// Types
export * from './types';

// Services
export * from './services/productService';

// Hooks
export * from './hooks/useProducts';
export * from './hooks/useCart';
export * from './hooks/useOrders';
export { useOrders as useOrdersConvex, useOrder as useOrderConvex } from './hooks/useOrdersConvex';
export { OrderStatus as ConvexOrderStatus } from './hooks/useOrdersConvex';
